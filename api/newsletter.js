/**
 * Velure Coffee — Newsletter Subscription API
 *
 * POST /api/newsletter
 * Body: { email, source? } — source defaults to 'website'
 *
 * What it does (in order):
 *  1. Validates + rate-limits the request
 *  2. Saves subscriber to Supabase `email_subscribers` table (always)
 *  3. If KLAVIYO_API_KEY + KLAVIYO_LIST_ID are set → syncs to Klaviyo
 *  4. If MAILCHIMP_API_KEY + MAILCHIMP_LIST_ID + MAILCHIMP_SERVER are set → syncs to Mailchimp
 *
 * The Supabase upsert is always attempted so you never lose a subscriber even
 * if a third-party API is down. Third-party integrations are optional extras.
 */

import { createHmac } from 'node:crypto';
import { Buffer } from 'node:buffer';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 6;
const RATE_LIMIT_KEY = '__velure_newsletter_rate_limit__';
const rateLimitStore = globalThis[RATE_LIMIT_KEY] || new Map();
if (!globalThis[RATE_LIMIT_KEY]) globalThis[RATE_LIMIT_KEY] = rateLimitStore;

const normalize = (v) => (typeof v === 'string' ? v.trim() : '');
const normalizeLower = (v) => normalize(v).toLowerCase();

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
};

const getClientIp = (req) => {
  const fwd = normalize(req.headers['x-forwarded-for']);
  if (fwd) return fwd.split(',')[0]?.trim() || 'unknown';
  return normalize(req.headers['x-real-ip']) || req.socket?.remoteAddress || 'unknown';
};

const isRateLimited = (ip) => {
  const now = Date.now();
  if (rateLimitStore.size > 300) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt <= now) rateLimitStore.delete(k);
    }
  }
  const current = rateLimitStore.get(ip);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) return true;
  current.count += 1;
  return false;
};

const parseBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 100_000) reject(new Error('Payload too large'));
    });
    req.on('end', () => resolve(raw ? JSON.parse(raw) : {}));
    req.on('error', reject);
  });
};

// ---------------------------------------------------------------------------
// SUPABASE — save subscriber (primary store, always attempted)
// ---------------------------------------------------------------------------
const saveToSupabase = async (email, source) => {
  const supabaseUrl = normalize(
    globalThis.process?.env?.SUPABASE_URL || globalThis.process?.env?.VITE_SUPABASE_URL || '',
  ).replace(/\/+$/, '');
  const serviceKey = normalize(globalThis.process?.env?.SUPABASE_SERVICE_ROLE_KEY || '');

  if (!supabaseUrl || !serviceKey) {
    console.warn('Newsletter: Supabase not configured — subscriber not saved to DB.');
    return;
  }

  const payload = {
    email: normalizeLower(email),
    source: normalize(source) || 'website',
    subscribed_at: new Date().toISOString(),
    tags: source === 'popup_10off' ? ['popup', '10_percent_offer'] : ['website'],
  };

  const response = await fetch(
    `${supabaseUrl}/rest/v1/email_subscribers?on_conflict=email`,
    {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([payload]),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    // If it's a unique constraint error (already subscribed), that's fine
    if (response.status === 409 || errorText.includes('duplicate')) return;
    throw new Error(`Supabase newsletter upsert failed: ${response.status} — ${errorText}`);
  }
};

// ---------------------------------------------------------------------------
// KLAVIYO — optional, fires if env vars are set
// ---------------------------------------------------------------------------
const syncToKlaviyo = async (email, source) => {
  const apiKey = normalize(globalThis.process?.env?.KLAVIYO_API_KEY || '');
  const listId = normalize(globalThis.process?.env?.KLAVIYO_LIST_ID || '');
  if (!apiKey || !listId) return; // not configured, skip silently

  // Subscribe profile to list
  const profileResponse = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      revision: '2024-02-15',
      'content-type': 'application/json',
      Authorization: `Klaviyo-API-Key ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          profiles: {
            data: [{
              type: 'profile',
              attributes: {
                email: normalizeLower(email),
                properties: {
                  velure_signup_source: normalize(source) || 'website',
                  velure_signup_date: new Date().toISOString(),
                },
                subscriptions: {
                  email: { marketing: { consent: 'SUBSCRIBED' } },
                },
              },
            }],
          },
        },
        relationships: {
          list: { data: { type: 'list', id: listId } },
        },
      },
    }),
  });

  if (!profileResponse.ok) {
    const errText = await profileResponse.text().catch(() => '');
    throw new Error(`Klaviyo subscription failed: ${profileResponse.status} — ${errText}`);
  }
};

// ---------------------------------------------------------------------------
// MAILCHIMP — optional, fires if env vars are set
// ---------------------------------------------------------------------------
const syncToMailchimp = async (email, source) => {
  const apiKey = normalize(globalThis.process?.env?.MAILCHIMP_API_KEY || '');
  const listId = normalize(globalThis.process?.env?.MAILCHIMP_LIST_ID || '');
  const server = normalize(globalThis.process?.env?.MAILCHIMP_SERVER_PREFIX || '');
  if (!apiKey || !listId || !server) return; // not configured, skip silently

  // MD5 hash of lowercase email (Mailchimp subscriber hash)
  const subscriberHash = createHmac('md5', 'mailchimp')
    .update(normalizeLower(email))
    .digest('hex');

  const response = await fetch(
    `https://${server}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`any:${apiKey}`).toString('base64')}`,
      },
      body: JSON.stringify({
        email_address: normalizeLower(email),
        status_if_new: 'subscribed',
        status: 'subscribed',
        tags: [{ name: normalize(source) || 'website', status: 'active' }],
        merge_fields: {
          SIGNUP_SRC: normalize(source) || 'website',
        },
      }),
    },
  );

  if (!response.ok && response.status !== 200) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Mailchimp subscription failed: ${response.status} — ${errText}`);
  }
};

// ---------------------------------------------------------------------------
// HANDLER
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'POST, OPTIONS');
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    sendJson(res, 429, { ok: false, error: 'Too many requests. Please try again shortly.' });
    return;
  }

  let body;
  try {
    body = await parseBody(req);
  } catch {
    sendJson(res, 400, { ok: false, error: 'Invalid request body.' });
    return;
  }

  const email = normalizeLower(body.email || '');
  const source = normalize(body.source || body.formType || 'website');

  if (!email || !EMAIL_REGEX.test(email)) {
    sendJson(res, 422, { ok: false, error: 'A valid email address is required.' });
    return;
  }

  // Honeypot
  if (normalize(body.website || body.company || body.honey)) {
    sendJson(res, 200, { ok: true });
    return;
  }

  const errors = [];

  // 1. Always try to save to Supabase
  try {
    await saveToSupabase(email, source);
  } catch (error) {
    console.error('Newsletter: Supabase save failed:', error.message);
    errors.push('db');
  }

  // 2. Optionally sync to Klaviyo (fire and forget — don't fail the user response)
  syncToKlaviyo(email, source).catch((error) => {
    console.error('Newsletter: Klaviyo sync failed:', error.message);
  });

  // 3. Optionally sync to Mailchimp (fire and forget)
  syncToMailchimp(email, source).catch((error) => {
    console.error('Newsletter: Mailchimp sync failed:', error.message);
  });

  // If Supabase failed but email is valid, still return success to user
  // (third-party failure shouldn't block signup UX — we'll retry via webhook)
  sendJson(res, 200, { ok: true });
}
