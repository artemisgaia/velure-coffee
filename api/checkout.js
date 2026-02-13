const PRODUCT_CATALOG = {
  fuse: { name: 'FUSE', price: 38.0 },
  zen: { name: 'ZEN', price: 45.0 },
  onyx: { name: 'ONYX', price: 28.0 },
  vitality: { name: 'VITALITY', price: 36.0 },
  harvest: { name: 'HARVEST', price: 34.0 },
  aureo: { name: 'AUREO', price: 26.0 },
};

const STANDARD_SHIPPING_FEE = 6.95;
const FREE_SHIPPING_THRESHOLD = 50;
const REWARDS_POINTS_PER_DOLLAR = 5;
const STRIPE_DEFAULT_CURRENCY = 'usd';
const DEFAULT_SHIPPING_COUNTRIES = ['US'];

const REWARD_OFFERS = {
  five_off: {
    id: 'five_off',
    name: '$5 Off Order',
    type: 'discount',
    discountValue: 5,
  },
  free_shipping: {
    id: 'free_shipping',
    name: 'Free Shipping',
    type: 'shipping',
    discountValue: STANDARD_SHIPPING_FEE,
  },
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
  const envValue = getEnv('CHECKOUT_ALLOWED_ORIGINS') || getEnv('FORMS_ALLOWED_ORIGINS');
  if (!envValue) return [];
  return envValue.split(',').map((value) => normalizeLower(value)).filter(Boolean);
};

const isAllowedOrigin = (req) => {
  const allowedOrigins = parseAllowedOrigins();
  if (!allowedOrigins.length) return true;

  const requestOrigin = normalizeLower(req.headers.origin);
  if (requestOrigin) return allowedOrigins.includes(requestOrigin);

  const referer = normalize(req.headers.referer);
  if (!referer) return false;

  try {
    return allowedOrigins.includes(new URL(referer).origin.toLowerCase());
  } catch {
    return false;
  }
};

const parseBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};

  const raw = await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 500_000) {
        reject(new Error('Payload too large.'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

  return raw ? JSON.parse(raw) : {};
};

const validateItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: 'Cart is empty.' };
  }

  const normalized = [];
  for (const item of items) {
    const productId = normalizeLower(item?.productId);
    const quantity = Number(item?.quantity || 0);

    if (!PRODUCT_CATALOG[productId]) {
      return { ok: false, error: `Invalid product: ${productId || 'unknown'}.` };
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return { ok: false, error: 'Invalid quantity in cart.' };
    }

    normalized.push({ productId, quantity });
  }

  return { ok: true, items: normalized };
};

const validateReward = (rewardId) => {
  const normalizedRewardId = normalizeLower(rewardId);
  if (!normalizedRewardId) {
    return { ok: true, reward: null };
  }

  const reward = REWARD_OFFERS[normalizedRewardId];
  if (!reward) {
    return { ok: false, error: 'Invalid reward selection.' };
  }

  return { ok: true, reward };
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const parseCustomer = (name, email) => {
  const normalizedName = normalize(name).slice(0, 120);
  const normalizedEmail = normalizeLower(email).slice(0, 180);

  if (normalizedName && normalizedName.length < 2) {
    return { ok: false, error: 'Please enter your full name.' };
  }

  if (normalizedEmail && !isValidEmail(normalizedEmail)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }

  return {
    ok: true,
    customer: {
      name: normalizedName,
      email: normalizedEmail,
    },
  };
};

const normalizeUiMode = (value) => (normalizeLower(value) === 'embedded' ? 'embedded' : 'hosted');

const parseShippingCountries = () => {
  const envValue = getEnv('CHECKOUT_SHIPPING_COUNTRIES');
  if (!envValue) {
    return DEFAULT_SHIPPING_COUNTRIES;
  }

  const countries = envValue
    .split(',')
    .map((country) => normalize(country).toUpperCase())
    .filter((country) => /^[A-Z]{2}$/.test(country));

  return countries.length ? countries : DEFAULT_SHIPPING_COUNTRIES;
};

const calculatePricing = (subtotal, reward) => {
  const roundedSubtotal = Number(subtotal.toFixed(2));
  const baseShipping = roundedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  let shipping = baseShipping;
  let rewardDiscount = 0;

  if (reward?.type === 'discount') {
    rewardDiscount = Math.min(reward.discountValue, roundedSubtotal);
  }

  if (reward?.type === 'shipping') {
    shipping = 0;
  }

  return {
    subtotal: roundedSubtotal,
    shipping: Number(shipping.toFixed(2)),
    rewardDiscount: Number(rewardDiscount.toFixed(2)),
    total: Number((roundedSubtotal + shipping - rewardDiscount).toFixed(2)),
  };
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
      // continue to env fallback
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

const buildOrderSummary = (items, reward) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemSummary = items
    .map((item) => `${PRODUCT_CATALOG[item.productId].name} x${item.quantity}`)
    .join(', ')
    .slice(0, 200);

  const rewardSummary = reward ? ` | Reward: ${reward.name}` : '';
  return `Velure Order (${totalItems} items): ${itemSummary}${rewardSummary}`.slice(0, 480);
};

const createStripeCoupon = async ({ stripeSecretKey, pricing, reward }) => {
  if (pricing.rewardDiscount <= 0) {
    return null;
  }

  const amountOff = Math.round(pricing.rewardDiscount * 100);
  if (!Number.isFinite(amountOff) || amountOff <= 0) {
    return null;
  }

  const couponParams = new URLSearchParams();
  couponParams.append('amount_off', String(amountOff));
  couponParams.append('currency', STRIPE_DEFAULT_CURRENCY);
  couponParams.append('duration', 'once');
  couponParams.append('name', reward?.name ? `Velure Reward - ${reward.name}` : 'Velure Reward');

  const response = await fetch('https://api.stripe.com/v1/coupons', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: couponParams.toString(),
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok || !normalize(payload?.id)) {
    const stripeMessage = normalize(payload?.error?.message);
    throw new Error(stripeMessage || 'Unable to apply reward discount.');
  }

  return normalize(payload.id);
};

const createStripeCheckoutSession = async ({ items, pricing, reward, customer, uiMode, req }) => {
  const stripeSecretKey = getEnv('STRIPE_SECRET_KEY');
  if (!stripeSecretKey) {
    throw new Error('Stripe checkout is not configured. Add STRIPE_SECRET_KEY to server environment variables.');
  }

  const amountCents = Math.round(pricing.total * 100);
  if (!Number.isFinite(amountCents) || amountCents < 50) {
    throw new Error('Order total is below the Stripe minimum charge.');
  }

  const origin = getSiteOrigin(req);
  const summary = buildOrderSummary(items, reward);
  const params = new URLSearchParams();
  let lineItemIndex = 0;

  params.append('mode', 'payment');
  if (uiMode === 'embedded') {
    params.append('ui_mode', 'embedded');
    params.append('return_url', `${origin}/checkout?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  } else {
    params.append('success_url', `${origin}/checkout?checkout=success`);
    params.append('cancel_url', `${origin}/checkout?checkout=cancelled`);
  }
  params.append('customer_creation', 'always');
  if (customer.email) {
    params.append('customer_email', customer.email);
    params.append('payment_intent_data[receipt_email]', customer.email);
  }
  params.append('payment_intent_data[description]', summary.slice(0, 500));
  if (customer.name) {
    params.append('payment_intent_data[metadata][customer_name]', customer.name);
  }
  if (customer.email) {
    params.append('payment_intent_data[metadata][customer_email]', customer.email);
  }
  params.append('payment_intent_data[metadata][item_summary]', summary.slice(0, 450));
  params.append('billing_address_collection', 'required');
  params.append('phone_number_collection[enabled]', 'true');

  const shippingCountries = parseShippingCountries();
  shippingCountries.forEach((countryCode, index) => {
    params.append(`shipping_address_collection[allowed_countries][${index}]`, countryCode);
  });

  for (const item of items) {
    const product = PRODUCT_CATALOG[item.productId];
    const unitAmount = Math.round(product.price * 100);
    params.append(`line_items[${lineItemIndex}][quantity]`, String(item.quantity));
    params.append(`line_items[${lineItemIndex}][price_data][currency]`, STRIPE_DEFAULT_CURRENCY);
    params.append(`line_items[${lineItemIndex}][price_data][unit_amount]`, String(unitAmount));
    params.append(`line_items[${lineItemIndex}][price_data][product_data][name]`, `Velure ${product.name}`);
    params.append(`line_items[${lineItemIndex}][price_data][product_data][description]`, 'Premium coffee product');
    lineItemIndex += 1;
  }

  if (pricing.shipping > 0) {
    params.append(`line_items[${lineItemIndex}][quantity]`, '1');
    params.append(`line_items[${lineItemIndex}][price_data][currency]`, STRIPE_DEFAULT_CURRENCY);
    params.append(`line_items[${lineItemIndex}][price_data][unit_amount]`, String(Math.round(pricing.shipping * 100)));
    params.append(`line_items[${lineItemIndex}][price_data][product_data][name]`, 'Velure Standard Shipping');
    params.append(`line_items[${lineItemIndex}][price_data][product_data][description]`, 'Shipping and handling');
  }

  const couponId = await createStripeCoupon({ stripeSecretKey, pricing, reward });
  if (couponId) {
    params.append('discounts[0][coupon]', couponId);
  }

  params.append('metadata[item_summary]', summary.slice(0, 450));
  params.append('metadata[reward_id]', reward?.id || 'none');
  if (customer.name) {
    params.append('metadata[customer_name]', customer.name);
  }
  if (customer.email) {
    params.append('metadata[customer_email]', customer.email);
  }
  params.append('metadata[expected_total_usd]', pricing.total.toFixed(2));
  params.append('metadata[expected_total_cents]', String(amountCents));

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
    const stripeMessage = normalize(payload?.error?.message);
    throw new Error(stripeMessage || 'Unable to create Stripe checkout session.');
  }

  const checkoutSessionId = normalize(payload.id);
  const checkoutUrl = normalize(payload.url);
  const clientSecret = normalize(payload.client_secret);

  if (!checkoutSessionId) {
    throw new Error('Stripe did not return a checkout session id.');
  }

  if (uiMode === 'embedded') {
    if (!clientSecret) {
      throw new Error('Stripe did not return an embedded checkout client secret.');
    }
    return {
      checkoutSessionId,
      clientSecret,
      checkoutUrl: '',
      uiMode: 'embedded',
    };
  }

  if (!checkoutUrl) {
    throw new Error('Stripe did not return a checkout URL.');
  }

  return {
    checkoutSessionId,
    clientSecret: '',
    checkoutUrl,
    uiMode: 'hosted',
  };
};

const buildCheckoutPayload = async (items, reward, customer, uiMode, req) => {
  const subtotal = items.reduce((sum, item) => {
    const product = PRODUCT_CATALOG[item.productId];
    return sum + (product.price * item.quantity);
  }, 0);

  const pricing = calculatePricing(subtotal, reward);
  const pointsBase = Math.max(0, pricing.subtotal - pricing.rewardDiscount);
  const earnablePoints = Math.floor(pointsBase * REWARDS_POINTS_PER_DOLLAR);
  const stripeSession = await createStripeCheckoutSession({ items, pricing, reward, customer, uiMode, req });

  return {
    provider: 'stripe',
    ...pricing,
    reward: reward ? { id: reward.id, name: reward.name } : null,
    earnablePoints,
    uiMode: stripeSession.uiMode,
    checkoutUrl: stripeSession.checkoutUrl,
    checkoutSessionId: stripeSession.checkoutSessionId,
    clientSecret: stripeSession.clientSecret,
  };
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

  let body;
  try {
    body = await parseBody(req);
  } catch {
    sendJson(res, 400, { ok: false, error: 'Invalid JSON payload.' });
    return;
  }

  const validation = validateItems(body.items);
  if (!validation.ok) {
    sendJson(res, 422, { ok: false, error: validation.error });
    return;
  }

  const rewardValidation = validateReward(body.rewardId);
  if (!rewardValidation.ok) {
    sendJson(res, 422, { ok: false, error: rewardValidation.error });
    return;
  }

  const customerValidation = parseCustomer(body.customerName, body.customerEmail);
  if (!customerValidation.ok) {
    sendJson(res, 422, { ok: false, error: customerValidation.error });
    return;
  }

  const uiMode = normalizeUiMode(body.uiMode);

  try {
    const checkoutPayload = await buildCheckoutPayload(
      validation.items,
      rewardValidation.reward,
      customerValidation.customer,
      uiMode,
      req,
    );
    sendJson(res, 200, {
      ok: true,
      currency: 'USD',
      ...checkoutPayload,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start checkout right now.';
    sendJson(res, 502, { ok: false, error: message });
  }
}
