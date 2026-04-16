import { DEFAULT_SHIPPING_COUNTRY_ORDER } from '../shared/shipping.js';

const PRODUCT_CATALOG = {
  fuse: { name: 'FUSE', envKey: 'STRIPE_SUBSCRIPTION_PRICE_FUSE' },
  zen: { name: 'ZEN', envKey: 'STRIPE_SUBSCRIPTION_PRICE_ZEN' },
  onyx: { name: 'ONYX', envKey: 'STRIPE_SUBSCRIPTION_PRICE_ONYX' },
  vitality: { name: 'VITALITY', envKey: 'STRIPE_SUBSCRIPTION_PRICE_VITALITY' },
  harvest: { name: 'HARVEST', envKey: 'STRIPE_SUBSCRIPTION_PRICE_HARVEST' },
  aureo: { name: 'AUREO', envKey: 'STRIPE_SUBSCRIPTION_PRICE_AUREO' },
};

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeLower = (value) => normalize(value).toLowerCase();
const getEnv = (name) => normalize(globalThis.process?.env?.[name] || '');

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
};

const parseAllowedOrigins = () => {
  const envValue = getEnv('SUBSCRIPTIONS_ALLOWED_ORIGINS')
    || getEnv('CHECKOUT_ALLOWED_ORIGINS')
    || getEnv('FORMS_ALLOWED_ORIGINS');
  if (!envValue) return [];
  return envValue.split(',').map((value) => normalizeLower(value)).filter(Boolean);
};


/** Always trust our own production + Vercel preview domains. */
const isTrustedSiteOrigin = (origin) => {
  if (!origin) return false;
  const o = origin.toLowerCase();
  if (o === 'https://velurecoffee.com' || o === 'https://www.velurecoffee.com') return true;
  if (o.endsWith('.vercel.app')) return true;
  if (o.startsWith('http://localhost') || o.startsWith('http://127.0.0.1')) return true;
  return false;
};
const isAllowedOrigin = (req) => {
  const requestOrigin = normalizeLower(req.headers.origin || '');
  const referer = normalize(req.headers.referer);
  let effectiveOrigin = requestOrigin;
  if (!effectiveOrigin && referer) {
    try { effectiveOrigin = new URL(referer).origin.toLowerCase(); } catch { /* ignore */ }
  }
  if (isTrustedSiteOrigin(effectiveOrigin)) return true;
  const allowedOrigins = parseAllowedOrigins();
  if (!allowedOrigins.length) return true;
  if (effectiveOrigin) return allowedOrigins.includes(effectiveOrigin);
  return false;
};

const parseBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};

  const raw = await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 200_000) {
        reject(new Error('Payload too large.'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

  return raw ? JSON.parse(raw) : {};
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const parseShippingCountries = () => {
  const envValue = getEnv('CHECKOUT_SHIPPING_COUNTRIES');
  const fallback = [...DEFAULT_SHIPPING_COUNTRY_ORDER];
  if (!envValue) return fallback;

  const parsed = envValue
    .split(',')
    .map((value) => normalize(value).toUpperCase())
    .filter((value) => /^[A-Z]{2}$/.test(value));
  return parsed.length ? parsed : fallback;
};

const getSiteOrigin = (req) => {
  const requestOrigin = normalize(req.headers.origin);
  if (requestOrigin) {
    return requestOrigin;
  }

  const referer = normalize(req.headers.referer);
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // Continue with env-based fallbacks.
    }
  }

  const publicSiteUrl = getEnv('PUBLIC_SITE_URL') || getEnv('SITE_URL');
  if (publicSiteUrl) {
    return publicSiteUrl.replace(/\/+$/, '');
  }

  const vercelUrl = getEnv('VERCEL_URL');
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;
  }

  return 'http://localhost:5173';
};

const getTrialPeriodDays = () => {
  const configured = Number(getEnv('STRIPE_SUBSCRIPTION_TRIAL_DAYS'));
  if (!Number.isInteger(configured)) return 0;
  if (configured < 1 || configured > 31) return 0;
  return configured;
};

const buildMetadata = ({ customerName, customerEmail, productId, quantity }) => {
  const productName = PRODUCT_CATALOG[productId]?.name || productId.toUpperCase();
  return {
    source: 'velure_subscription',
    customerName,
    customerEmail,
    productId,
    productName,
    quantity: String(quantity),
  };
};

const appendMetadata = (params, prefix, metadata) => {
  for (const [key, value] of Object.entries(metadata)) {
    params.append(`${prefix}[${key}]`, normalize(String(value)).slice(0, 500));
  }
};

const createSubscriptionSession = async ({ stripeSecretKey, origin, customerName, customerEmail, productId, quantity }) => {
  const product = PRODUCT_CATALOG[productId];
  const priceId = getEnv(product.envKey);
  if (!priceId || !priceId.startsWith('price_')) {
    throw new Error(`Subscription is not configured for ${product.name}.`);
  }

  const metadata = buildMetadata({ customerName, customerEmail, productId, quantity });
  const params = new URLSearchParams();

  params.append('mode', 'subscription');
  params.append('success_url', `${origin}/subscription?subscription=success`);
  params.append('cancel_url', `${origin}/subscription?subscription=cancelled`);
  params.append('billing_address_collection', 'required');
  params.append('phone_number_collection[enabled]', 'true');
  params.append('allow_promotion_codes', 'true');
  params.append('customer_email', customerEmail);
  params.append('line_items[0][price]', priceId);
  params.append('line_items[0][quantity]', String(quantity));
  params.append('consent_collection[promotions]', 'auto');

  const trialDays = getTrialPeriodDays();
  if (trialDays > 0) {
    params.append('subscription_data[trial_period_days]', String(trialDays));
  }

  const shippingCountries = parseShippingCountries();
  shippingCountries.forEach((countryCode, index) => {
    params.append(`shipping_address_collection[allowed_countries][${index}]`, countryCode);
  });

  appendMetadata(params, 'metadata', metadata);
  appendMetadata(params, 'subscription_data[metadata]', metadata);

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const message = normalize(payload?.error?.message) || 'Unable to start subscription checkout.';
    throw new Error(message);
  }

  const sessionId = normalize(payload?.id);
  const checkoutUrl = normalize(payload?.url);
  if (!sessionId || !checkoutUrl) {
    throw new Error('Subscription checkout response was incomplete.');
  }

  return { sessionId, checkoutUrl };
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

  const stripeSecretKey = getEnv('STRIPE_SECRET_KEY');
  if (!stripeSecretKey) {
    sendJson(res, 503, { ok: false, error: 'Subscriptions are temporarily unavailable.' });
    return;
  }

  let body;
  try {
    body = await parseBody(req);
  } catch {
    sendJson(res, 400, { ok: false, error: 'Invalid JSON payload.' });
    return;
  }

  const productId = normalizeLower(body.productId);
  const quantity = Number(body.quantity);
  const customerName = normalize(body.customerName).slice(0, 120);
  const customerEmail = normalizeLower(body.customerEmail).slice(0, 180);

  if (!PRODUCT_CATALOG[productId]) {
    sendJson(res, 422, { ok: false, error: 'Choose a valid subscription product.', code: 'invalid_product' });
    return;
  }

  if (!customerName || customerName.length < 2) {
    sendJson(res, 422, { ok: false, error: 'Please enter your full name.', code: 'invalid_name' });
    return;
  }

  if (!customerEmail || !isValidEmail(customerEmail)) {
    sendJson(res, 422, { ok: false, error: 'Please enter a valid email address.', code: 'invalid_email' });
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 6) {
    sendJson(res, 422, { ok: false, error: 'Choose a valid quantity.', code: 'invalid_quantity' });
    return;
  }

  const origin = getSiteOrigin(req);

  try {
    const session = await createSubscriptionSession({
      stripeSecretKey,
      origin,
      customerName,
      customerEmail,
      productId,
      quantity,
    });

    sendJson(res, 200, {
      ok: true,
      sessionId: session.sessionId,
      checkoutUrl: session.checkoutUrl,
      productId,
      quantity,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create subscription session.';
    sendJson(res, 502, { ok: false, error: message });
  }
}
