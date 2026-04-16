/**
 * Velure Coffee — Unified Utility API
 *
 * Routes handled:
 *   GET  /api/utils?action=sitemap    → XML sitemap
 *   GET  /api/utils?action=og-image   → SVG OG image card
 *   POST /api/utils?action=newsletter → Email signup
 *
 * Vercel rewrites in vercel.json point:
 *   /sitemap.xml         → /api/utils?action=sitemap
 *   /api/sitemap         → /api/utils?action=sitemap
 *   /api/og-image        → /api/utils?action=og-image
 *   /api/newsletter      → /api/utils?action=newsletter
 */

import { createHmac } from 'node:crypto';
import { Buffer } from 'node:buffer';

// ─── Shared helpers ──────────────────────────────────────────────────────────

const normalize = (v) => (typeof v === 'string' ? v.trim() : '');
const normalizeLower = (v) => normalize(v).toLowerCase();

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
};

// ─── SITEMAP ─────────────────────────────────────────────────────────────────

const ORIGIN = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://velurecoffee.com';
const today = new Date().toISOString().slice(0, 10);

const STATIC_PAGES = [
  { loc: '/',                       priority: '1.0',  changefreq: 'daily'   },
  { loc: '/collections',            priority: '0.9',  changefreq: 'weekly'  },
  { loc: '/collections/functional', priority: '0.85', changefreq: 'weekly'  },
  { loc: '/collections/single-origin', priority: '0.85', changefreq: 'weekly' },
  { loc: '/collections/instant',    priority: '0.8',  changefreq: 'weekly'  },
  { loc: '/collections/matcha',     priority: '0.8',  changefreq: 'weekly'  },
  { loc: '/collections/bundles',    priority: '0.8',  changefreq: 'weekly'  },
  { loc: '/blog',                   priority: '0.8',  changefreq: 'weekly'  },
  { loc: '/about',                  priority: '0.65', changefreq: 'monthly' },
  { loc: '/sourcing',               priority: '0.65', changefreq: 'monthly' },
  { loc: '/subscription',           priority: '0.75', changefreq: 'monthly' },
  { loc: '/rewards',                priority: '0.65', changefreq: 'monthly' },
  { loc: '/wholesale',              priority: '0.65', changefreq: 'monthly' },
  { loc: '/contact',                priority: '0.5',  changefreq: 'monthly' },
  { loc: '/shipping-returns',       priority: '0.55', changefreq: 'monthly' },
  { loc: '/privacy',                priority: '0.3',  changefreq: 'yearly'  },
  { loc: '/terms',                  priority: '0.3',  changefreq: 'yearly'  },
  { loc: '/subscription-terms',     priority: '0.3',  changefreq: 'yearly'  },
  { loc: '/rewards-terms',          priority: '0.3',  changefreq: 'yearly'  },
];

const PRODUCT_IDS = [
  'fuse', 'vitality', 'harvest', 'zen', 'onyx',
  'aureo', 'sable', 'drift', 'nougat', 'praline', 'citra', 'zest', 'ember', 'forge',
  'forest', 'grove', 'cerise', 'cacao', 'bloom-pods', 'hazel-pods', 'molten',
];

const BLOG_SLUGS = [
  'lions-mane-coffee-explained',
  'chaga-coffee-explained',
  'clean-label-functional-coffee',
  'make-instant-coffee-taste-premium',
  'hot-vs-iced-instant-coffee',
  '5-minute-morning-coffee-ritual',
  'fruiting-body-vs-mycelium-mushroom-coffee',
  'best-mushroom-coffee-2026-honest-review',
  'hemp-coffee-blend-explained',
  'mushroom-coffee-anxiety',
  'ceremonial-vs-culinary-matcha',
  'single-origin-instant-coffee',
  'iced-mushroom-coffee-recipes',
  'adaptogens-in-coffee-guide',
  'mushroom-coffee-not-working-dosage',
  'coffee-subscription-worth-it',
  'papua-new-guinea-coffee-origin',
  'mushroom-coffee-body-effects',
  'buy-mushroom-coffee-austin-texas',
  'mushroom-coffee-los-angeles',
];

const xmlUrl = ({ loc, priority, changefreq, lastmod = today }) =>
  `  <url>
    <loc>${ORIGIN}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const buildSitemapXml = () => {
  const urls = [
    ...STATIC_PAGES.map(xmlUrl),
    ...PRODUCT_IDS.map((id) =>
      xmlUrl({ loc: `/products/${id}`, priority: id === 'fuse' ? '0.95' : '0.85', changefreq: 'weekly' })
    ),
    ...BLOG_SLUGS.map((slug) =>
      xmlUrl({ loc: `/blog/${slug}`, priority: '0.75', changefreq: 'monthly' })
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

${urls.join('\n\n')}

</urlset>`;
};

const handleSitemap = (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method Not Allowed');
    return;
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.end(buildSitemapXml());
};

// ─── OG IMAGE ────────────────────────────────────────────────────────────────

const BRAND_GOLD = '#D4AF37';
const BRAND_BLACK = '#0B0C0C';
const BRAND_CREAM = '#F9F6F0';

const escapeXml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const truncate = (str, max) => (str.length > max ? str.slice(0, max - 1) + '…' : str);

const buildOgSvg = ({ title, subtitle, type }) => {
  const safeTitle = truncate(escapeXml(normalize(title) || 'Velure Coffee'), 48);
  const safeSubtitle = truncate(escapeXml(normalize(subtitle) || 'Small-Batch · Clean-Label · USA Roasted'), 72);
  const label = type === 'product' ? 'PRODUCT' : type === 'blog' ? 'JOURNAL' : 'VELURE';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BRAND_BLACK}"/>
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${BRAND_GOLD};stop-opacity:0.12"/>
      <stop offset="100%" style="stop-color:${BRAND_GOLD};stop-opacity:0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g1)"/>
  <rect x="60" y="60" width="120" height="2" fill="${BRAND_GOLD}"/>
  <text x="60" y="120" font-family="Georgia, serif" font-size="16" fill="${BRAND_GOLD}" letter-spacing="6" text-anchor="start">${label}</text>
  <text x="60" y="240" font-family="Georgia, serif" font-size="72" font-weight="400" fill="${BRAND_CREAM}" text-anchor="start">${safeTitle}</text>
  <text x="60" y="310" font-family="Georgia, serif" font-size="28" fill="#9CA3AF" text-anchor="start">${safeSubtitle}</text>
  <rect x="0" y="580" width="1200" height="50" fill="${BRAND_GOLD}" opacity="0.08"/>
  <text x="60" y="615" font-family="Georgia, serif" font-size="22" fill="${BRAND_GOLD}" letter-spacing="4" text-anchor="start">velure.</text>
  <text x="1140" y="615" font-family="Georgia, serif" font-size="14" fill="#6B7280" text-anchor="end">Small-Batch · USA Roasted</text>
  <rect x="1080" y="60" width="60" height="1" fill="${BRAND_GOLD}" opacity="0.4"/>
  <rect x="1139" y="60" width="1" height="60" fill="${BRAND_GOLD}" opacity="0.4"/>
</svg>`;
};

const handleOgImage = (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method Not Allowed');
    return;
  }
  const params = req.query || Object.fromEntries(
    new URL(req.url || '', 'http://localhost').searchParams.entries(),
  );
  const svg = buildOgSvg({
    title: normalize(params.title || params.t || ''),
    subtitle: normalize(params.subtitle || params.s || ''),
    type: normalize(params.type || ''),
  });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  res.end(svg);
};

// ─── NEWSLETTER ───────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 6;
const RATE_LIMIT_KEY = '__velure_newsletter_rate_limit__';
const rateLimitStore = globalThis[RATE_LIMIT_KEY] || new Map();
if (!globalThis[RATE_LIMIT_KEY]) globalThis[RATE_LIMIT_KEY] = rateLimitStore;

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

const saveToSupabase = async (email, source) => {
  const supabaseUrl = normalize(
    globalThis.process?.env?.SUPABASE_URL || globalThis.process?.env?.VITE_SUPABASE_URL || '',
  ).replace(/\/+$/, '');
  const serviceKey = normalize(globalThis.process?.env?.SUPABASE_SERVICE_ROLE_KEY || '');
  if (!supabaseUrl || !serviceKey) {
    console.warn('Newsletter: Supabase not configured.');
    return;
  }
  const payload = {
    email: normalizeLower(email),
    source: normalize(source) || 'website',
    subscribed_at: new Date().toISOString(),
    tags: source === 'popup_10off' ? ['popup', '10_percent_offer'] : ['website'],
  };
  const response = await fetch(`${supabaseUrl}/rest/v1/email_subscribers?on_conflict=email`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify([payload]),
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    if (response.status === 409 || errorText.includes('duplicate')) return;
    throw new Error(`Supabase upsert failed: ${response.status} — ${errorText}`);
  }
};

const syncToKlaviyo = async (email, source) => {
  const apiKey = normalize(globalThis.process?.env?.KLAVIYO_API_KEY || '');
  const listId = normalize(globalThis.process?.env?.KLAVIYO_LIST_ID || '');
  if (!apiKey || !listId) return;
  const r = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
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
                properties: { velure_signup_source: normalize(source) || 'website' },
                subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } },
              },
            }],
          },
        },
        relationships: { list: { data: { type: 'list', id: listId } } },
      },
    }),
  });
  if (!r.ok) throw new Error(`Klaviyo failed: ${r.status}`);
};

const syncToMailchimp = async (email, source) => {
  const apiKey = normalize(globalThis.process?.env?.MAILCHIMP_API_KEY || '');
  const listId = normalize(globalThis.process?.env?.MAILCHIMP_LIST_ID || '');
  const server = normalize(globalThis.process?.env?.MAILCHIMP_SERVER_PREFIX || '');
  if (!apiKey || !listId || !server) return;
  const hash = createHmac('md5', 'mailchimp').update(normalizeLower(email)).digest('hex');
  const r = await fetch(`https://${server}.api.mailchimp.com/3.0/lists/${listId}/members/${hash}`, {
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
    }),
  });
  if (!r.ok && r.status !== 200) throw new Error(`Mailchimp failed: ${r.status}`);
};

const handleNewsletter = async (req, res) => {
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
  if (normalize(body.website || body.company || body.honey)) {
    sendJson(res, 200, { ok: true });
    return;
  }
  try {
    await saveToSupabase(email, source);
  } catch (error) {
    console.error('Newsletter: Supabase save failed:', error.message);
  }
  syncToKlaviyo(email, source).catch((e) => console.error('Klaviyo failed:', e.message));
  syncToMailchimp(email, source).catch((e) => console.error('Mailchimp failed:', e.message));
  sendJson(res, 200, { ok: true });
};

// ─── Router ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Allow CORS for browser fetch calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Determine action from query param or URL path
  const url = new URL(req.url || '/', 'http://localhost');
  const action = normalize(url.searchParams.get('action'))
    || normalize(req.query?.action)
    // Fallback: infer from the rewritten path the request originated from
    || (req.headers['x-velure-action'] ? normalize(req.headers['x-velure-action']) : '');

  if (action === 'sitemap') return handleSitemap(req, res);
  if (action === 'og-image') return handleOgImage(req, res);
  if (action === 'newsletter') return handleNewsletter(req, res);

  // Legacy direct paths still work via rewrites in vercel.json
  const path = url.pathname;
  if (path.includes('sitemap')) return handleSitemap(req, res);
  if (path.includes('og-image')) return handleOgImage(req, res);
  if (path.includes('newsletter')) return handleNewsletter(req, res);

  res.statusCode = 404;
  res.end('Not found');
}
