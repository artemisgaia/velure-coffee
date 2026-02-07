import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 120;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_KEY = '__velure_forms_rate_limit__';
const rateLimitStore = globalThis[RATE_LIMIT_KEY] || new Map();

if (!globalThis[RATE_LIMIT_KEY]) {
  globalThis[RATE_LIMIT_KEY] = rateLimitStore;
}

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeLower = (value) => normalize(value).toLowerCase();

const parseAllowedOrigins = () => {
  const envValue = normalize(globalThis.process?.env?.FORMS_ALLOWED_ORIGINS || '');
  if (!envValue) {
    return [];
  }

  return envValue
    .split(',')
    .map((origin) => normalizeLower(origin))
    .filter(Boolean);
};

const safeTokenCompare = (left, right) => {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
};

const pruneRateLimitStore = (now) => {
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
};

const isRateLimited = (ipAddress) => {
  const now = Date.now();
  if (rateLimitStore.size > 500) {
    pruneRateLimitStore(now);
  }

  const current = rateLimitStore.get(ipAddress);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(ipAddress, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  current.count += 1;
  return false;
};

const getClientIp = (req) => {
  const forwardedFor = normalize(req.headers['x-forwarded-for']);
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  const realIp = normalize(req.headers['x-real-ip']);
  if (realIp) {
    return realIp;
  }

  return req.socket?.remoteAddress || 'unknown';
};

const isAllowedOrigin = (req) => {
  const allowedOrigins = parseAllowedOrigins();
  if (!allowedOrigins.length) {
    return true;
  }

  const requestOrigin = normalizeLower(req.headers.origin);
  const referer = normalize(req.headers.referer);

  if (requestOrigin) {
    return allowedOrigins.includes(requestOrigin);
  }

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin.toLowerCase();
      return allowedOrigins.includes(refererOrigin);
    } catch {
      return false;
    }
  }

  return false;
};

const parseBody = async (req) => {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return req.body ? JSON.parse(req.body) : {};
  }

  const rawBody = await new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Payload too large.'));
      }
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });

  return rawBody ? JSON.parse(rawBody) : {};
};

const validatePayload = (formType, body) => {
  const email = normalize(body.email).toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, message: 'A valid email address is required.' };
  }

  if (formType === 'contact') {
    const name = normalize(body.name);
    const message = normalize(body.message);

    if (!name || !message) {
      return { ok: false, message: 'Name and message are required.' };
    }

    if (name.length > MAX_NAME_LENGTH) {
      return { ok: false, message: 'Name is too long.' };
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return { ok: false, message: 'Message is too long.' };
    }

    return {
      ok: true,
      data: {
        formType,
        name,
        email,
        message,
      },
    };
  }

  return {
    ok: true,
    data: {
      formType,
      email,
    },
  };
};

const forwardToWebhook = async (submission) => {
  const webhookUrl = normalize(globalThis.process?.env?.FORMS_WEBHOOK_URL || '');
  if (!webhookUrl) {
    return;
  }

  const signatureSecret = normalize(globalThis.process?.env?.FORMS_WEBHOOK_SECRET || '');
  const timestamp = new Date().toISOString();
  const payload = JSON.stringify({
    source: 'velure-coffee',
    submission,
    timestamp,
  });
  const signature = signatureSecret
    ? createHmac('sha256', signatureSecret).update(payload).digest('hex')
    : '';

  const webhookResponse = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'velure-forms-handler',
      'X-Velure-Signature': signature,
      'X-Velure-Timestamp': timestamp,
    },
    body: payload,
  });

  if (!webhookResponse.ok) {
    throw new Error(`Webhook failed with status ${webhookResponse.status}`);
  }
};

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

  if (!isAllowedOrigin(req)) {
    sendJson(res, 403, { ok: false, error: 'Origin not allowed.' });
    return;
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    sendJson(res, 429, { ok: false, error: 'Too many requests. Please try again shortly.' });
    return;
  }

  let parsedBody;
  try {
    parsedBody = await parseBody(req);
  } catch {
    sendJson(res, 400, { ok: false, error: 'Invalid JSON payload.' });
    return;
  }

  const formType = normalize(parsedBody.formType).toLowerCase();
  if (formType !== 'contact' && formType !== 'newsletter') {
    sendJson(res, 400, { ok: false, error: 'Invalid form type.' });
    return;
  }

  const honeypotValue = normalize(parsedBody.website || parsedBody.company || parsedBody.honey);
  if (honeypotValue) {
    sendJson(res, 200, { ok: true });
    return;
  }

  const challengeToken = normalize(globalThis.process?.env?.FORMS_CHALLENGE_TOKEN || '');
  if (challengeToken) {
    const requestToken = normalize(parsedBody.challengeToken);
    if (!requestToken || !safeTokenCompare(requestToken, challengeToken)) {
      sendJson(res, 403, { ok: false, error: 'Invalid challenge token.' });
      return;
    }
  }

  const validationResult = validatePayload(formType, parsedBody);
  if (!validationResult.ok) {
    sendJson(res, 422, { ok: false, error: validationResult.message });
    return;
  }

  const submission = {
    ...validationResult.data,
    submittedAt: new Date().toISOString(),
    ipAddress: clientIp,
    userAgent: normalize(req.headers['user-agent']),
  };

  try {
    await forwardToWebhook(submission);
  } catch (error) {
    console.error('Forms webhook forwarding failed:', error);
    sendJson(res, 502, { ok: false, error: 'Unable to process submission right now.' });
    return;
  }

  sendJson(res, 200, { ok: true });
}
