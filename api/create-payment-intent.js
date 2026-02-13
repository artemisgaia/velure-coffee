import { createHash, randomUUID } from 'node:crypto';

const PRODUCT_CATALOG = {
  fuse: { name: 'FUSE', priceCents: 3800 },
  zen: { name: 'ZEN', priceCents: 4500 },
  onyx: { name: 'ONYX', priceCents: 2800 },
  vitality: { name: 'VITALITY', priceCents: 3600 },
  harvest: { name: 'HARVEST', priceCents: 3400 },
  aureo: { name: 'AUREO', priceCents: 2600 },
};

const SHIPPING_ZONES = {
  US: {
    services: {
      standard: { shippingCents: 695, freeShippingThresholdCents: 5000 },
      priority: { shippingCents: 1295, freeShippingThresholdCents: 0 },
    },
  },
  CA: {
    services: {
      standard: { shippingCents: 1295, freeShippingThresholdCents: 0 },
    },
  },
  GB: {
    services: {
      standard: { shippingCents: 1495, freeShippingThresholdCents: 0 },
    },
  },
  AU: {
    quoteRequired: true,
    services: {
      quote: { shippingCents: 0, freeShippingThresholdCents: 0 },
    },
  },
};

const DISCOUNT_OFFERS = {
  five_off: { type: 'fixed', amountCents: 500 },
  free_shipping: { type: 'shipping', amountCents: 0 },
};

const ITEM_RESTRICTIONS = {
  fuse: { unsupportedCountries: ['GB'] },
  zen: { quoteRequiredCountries: ['CA'] },
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
      if (data.length > 300_000) {
        reject(new Error('Payload too large.'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

  return raw ? JSON.parse(raw) : {};
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const sanitizeCustomer = (body) => {
  const customer = body?.customer && typeof body.customer === 'object' ? body.customer : {};
  const name = normalize(customer.name || body.customerName).slice(0, 120);
  const email = normalizeLower(customer.email || body.customerEmail).slice(0, 180);
  const phone = normalize(customer.phone || body.customerPhone).slice(0, 40);

  if (!name || name.length < 2) {
    return { ok: false, error: 'Please enter your full name.' };
  }

  if (!email || !isValidEmail(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }

  return { ok: true, customer: { name, email, phone } };
};

const sanitizeShipping = (body) => {
  const shipping = body?.shipping && typeof body.shipping === 'object' ? body.shipping : {};
  const country = normalize(shipping.country).toUpperCase();
  const service = normalizeLower(shipping.service || 'standard');
  const address1 = normalize(shipping.address1).slice(0, 120);
  const address2 = normalize(shipping.address2).slice(0, 120);
  const city = normalize(shipping.city).slice(0, 80);
  const region = normalize(shipping.region).slice(0, 80);
  const postalCode = normalize(shipping.postalCode).slice(0, 32);

  return {
    country,
    service,
    address1,
    address2,
    city,
    region,
    postalCode,
  };
};

const validateItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: 'Your cart is empty.' };
  }

  const normalized = [];
  for (const rawItem of items) {
    const productId = normalizeLower(rawItem?.productId);
    const quantity = Number(rawItem?.quantity || 0);

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

const evaluateConstraints = (items, shipping) => {
  const zone = SHIPPING_ZONES[shipping.country];
  if (!zone) {
    return {
      ok: false,
      code: 'unsupported_destination',
      severity: 'error',
      message: 'We currently do not ship to this destination.',
    };
  }

  if (zone.quoteRequired || shipping.service === 'quote') {
    return {
      ok: false,
      code: 'quote_required_lane',
      severity: 'warning',
      message: 'Shipping to this destination requires a custom freight quote.',
    };
  }

  const unsupportedItems = [];
  const quoteItems = [];
  for (const item of items) {
    const rule = ITEM_RESTRICTIONS[item.productId];
    if (!rule) continue;

    if (Array.isArray(rule.unsupportedCountries) && rule.unsupportedCountries.includes(shipping.country)) {
      unsupportedItems.push(PRODUCT_CATALOG[item.productId].name);
      continue;
    }

    if (Array.isArray(rule.quoteRequiredCountries) && rule.quoteRequiredCountries.includes(shipping.country)) {
      quoteItems.push(PRODUCT_CATALOG[item.productId].name);
    }
  }

  if (unsupportedItems.length) {
    return {
      ok: false,
      code: 'item_restricted',
      severity: 'error',
      message: `Some items cannot ship to this destination: ${unsupportedItems.join(', ')}.`,
    };
  }

  if (quoteItems.length) {
    return {
      ok: false,
      code: 'quote_required_item',
      severity: 'warning',
      message: `This destination needs a quote for: ${quoteItems.join(', ')}.`,
    };
  }

  return { ok: true, code: 'ok', severity: 'success', message: 'Destination is eligible for checkout.' };
};

const getTaxRate = (countryCode) => {
  const countryRate = Number(getEnv(`CHECKOUT_TAX_RATE_${countryCode}`));
  if (Number.isFinite(countryRate) && countryRate >= 0 && countryRate <= 1) {
    return countryRate;
  }

  const fallbackRate = Number(getEnv('CHECKOUT_TAX_RATE_DEFAULT'));
  if (Number.isFinite(fallbackRate) && fallbackRate >= 0 && fallbackRate <= 1) {
    return fallbackRate;
  }

  return 0;
};

const calculateTotals = (items, shipping, discountCode) => {
  const subtotalCents = items.reduce((sum, item) => {
    return sum + (PRODUCT_CATALOG[item.productId].priceCents * item.quantity);
  }, 0);

  const zone = SHIPPING_ZONES[shipping.country];
  const serviceConfig = zone.services[shipping.service] || zone.services.standard || Object.values(zone.services)[0];

  let shippingCents = serviceConfig.shippingCents;
  if (
    serviceConfig.freeShippingThresholdCents > 0
    && subtotalCents >= serviceConfig.freeShippingThresholdCents
  ) {
    shippingCents = 0;
  }

  const discountOffer = DISCOUNT_OFFERS[discountCode] || null;
  let discountCents = 0;
  if (discountOffer?.type === 'fixed') {
    discountCents = Math.min(discountOffer.amountCents, subtotalCents);
  }
  if (discountOffer?.type === 'shipping') {
    shippingCents = 0;
  }

  const taxRate = getTaxRate(shipping.country);
  const taxableBaseCents = Math.max(0, subtotalCents - discountCents + shippingCents);
  const taxCents = Math.max(0, Math.round(taxableBaseCents * taxRate));
  const totalCents = subtotalCents - discountCents + shippingCents + taxCents;

  return {
    subtotalCents,
    discountCents,
    shippingCents,
    taxCents,
    totalCents,
    currency: 'usd',
    taxRate,
  };
};

const toAmount = (cents) => Number((Math.max(0, cents) / 100).toFixed(2));

const getItemPreview = (items) => {
  return items
    .map((item) => `${PRODUCT_CATALOG[item.productId].name} x${item.quantity}`)
    .join(', ')
    .slice(0, 490);
};

const digestItems = (items) => {
  return createHash('sha256').update(JSON.stringify(items)).digest('hex').slice(0, 40);
};

const createMetadata = ({ orderDraftId, customer, shipping, totals, items, itemPreview }) => {
  return {
    orderDraftId,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone || '',
    shippingCountry: shipping.country,
    shippingService: shipping.service,
    subtotal: toAmount(totals.subtotalCents).toFixed(2),
    discount: toAmount(totals.discountCents).toFixed(2),
    shipping: toAmount(totals.shippingCents).toFixed(2),
    tax: toAmount(totals.taxCents).toFixed(2),
    total: toAmount(totals.totalCents).toFixed(2),
    itemDigest: digestItems(items),
    itemPreview,
  };
};

const appendMetadata = (params, metadata) => {
  for (const [key, value] of Object.entries(metadata)) {
    params.append(`metadata[${key}]`, normalize(String(value)).slice(0, 500));
  }
};

const appendShipping = (params, customer, shipping) => {
  params.append('shipping[name]', customer.name);
  if (customer.phone) {
    params.append('shipping[phone]', customer.phone);
  }
  params.append('shipping[address][line1]', shipping.address1);
  if (shipping.address2) {
    params.append('shipping[address][line2]', shipping.address2);
  }
  params.append('shipping[address][city]', shipping.city);
  params.append('shipping[address][state]', shipping.region);
  params.append('shipping[address][postal_code]', shipping.postalCode);
  params.append('shipping[address][country]', shipping.country);
};

const stripeRequest = async ({ path, stripeSecretKey, params }) => {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
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

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
};

const normalizePaymentIntentId = (value) => {
  const normalized = normalize(value);
  return /^pi_[A-Za-z0-9]+$/.test(normalized) ? normalized : '';
};

const buildOrderSummary = (items, shipping, totals) => {
  const itemPreview = getItemPreview(items);
  return `Velure draft for ${shipping.country}: ${itemPreview} | Total $${toAmount(totals.totalCents).toFixed(2)}`.slice(0, 490);
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
    sendJson(res, 503, { ok: false, error: 'Checkout is temporarily unavailable.' });
    return;
  }

  let body;
  try {
    body = await parseBody(req);
  } catch {
    sendJson(res, 400, { ok: false, error: 'Invalid JSON payload.' });
    return;
  }

  const itemValidation = validateItems(body.items);
  if (!itemValidation.ok) {
    sendJson(res, 422, { ok: false, error: itemValidation.error, code: 'invalid_cart' });
    return;
  }

  const customerValidation = sanitizeCustomer(body);
  if (!customerValidation.ok) {
    sendJson(res, 422, { ok: false, error: customerValidation.error, code: 'invalid_customer' });
    return;
  }

  const shipping = sanitizeShipping(body);
  const constraint = evaluateConstraints(itemValidation.items, shipping);
  if (!constraint.ok) {
    sendJson(res, 422, {
      ok: false,
      error: constraint.message,
      code: constraint.code,
      constraint,
    });
    return;
  }

  if (!shipping.address1 || !shipping.city || !shipping.region || !shipping.postalCode || !shipping.country) {
    sendJson(res, 422, {
      ok: false,
      code: 'incomplete_shipping',
      error: 'Shipping address is incomplete.',
    });
    return;
  }

  const discountCode = normalizeLower(body.discountCode || body.rewardId);
  const totals = calculateTotals(itemValidation.items, shipping, discountCode);
  if (totals.totalCents < 50) {
    sendJson(res, 422, {
      ok: false,
      code: 'minimum_order_total',
      error: 'Order total must be at least $0.50.',
    });
    return;
  }

  const orderDraftId = normalize(body.orderDraftId) || `velure-${randomUUID()}`;
  const itemPreview = getItemPreview(itemValidation.items);
  const metadata = createMetadata({
    orderDraftId,
    customer: customerValidation.customer,
    shipping,
    totals,
    items: itemValidation.items,
    itemPreview,
  });

  const existingPaymentIntentId = normalizePaymentIntentId(body.paymentIntentId);
  const existingClientSecret = normalize(body.clientSecret || body.existingClientSecret);
  const summary = buildOrderSummary(itemValidation.items, shipping, totals);

  const buildBaseParams = () => {
    const params = new URLSearchParams();
    params.append('amount', String(totals.totalCents));
    params.append('currency', totals.currency);
    params.append('description', summary);
    params.append('receipt_email', customerValidation.customer.email);
    appendMetadata(params, metadata);
    appendShipping(params, customerValidation.customer, shipping);
    return params;
  };

  let stripePayload = null;

  if (existingPaymentIntentId) {
    const updateParams = buildBaseParams();
    const updateResult = await stripeRequest({
      path: `/payment_intents/${existingPaymentIntentId}`,
      stripeSecretKey,
      params: updateParams,
    });

    if (updateResult.ok) {
      stripePayload = updateResult.payload;
    } else {
      const code = normalize(updateResult.payload?.error?.code);
      const shouldCreateNew = code === 'resource_missing' || code === 'payment_intent_unexpected_state';
      if (!shouldCreateNew) {
        const message = normalize(updateResult.payload?.error?.message) || 'Unable to update checkout session.';
        sendJson(res, 502, { ok: false, error: message });
        return;
      }
    }
  }

  if (!stripePayload) {
    const createParams = buildBaseParams();
    createParams.append('automatic_payment_methods[enabled]', 'true');

    const createResult = await stripeRequest({
      path: '/payment_intents',
      stripeSecretKey,
      params: createParams,
    });

    if (!createResult.ok) {
      const message = normalize(createResult.payload?.error?.message) || 'Unable to create payment session.';
      sendJson(res, 502, { ok: false, error: message });
      return;
    }

    stripePayload = createResult.payload;
  }

  const paymentIntentId = normalize(stripePayload?.id);
  const clientSecret = normalize(stripePayload?.client_secret) || existingClientSecret;

  if (!paymentIntentId || !clientSecret) {
    sendJson(res, 502, { ok: false, error: 'Payment session response was incomplete.' });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    orderDraftId,
    paymentIntentId,
    clientSecret,
    itemPreview,
    itemDigest: metadata.itemDigest,
    totals: {
      currency: 'USD',
      subtotal: toAmount(totals.subtotalCents),
      discount: toAmount(totals.discountCents),
      shipping: toAmount(totals.shippingCents),
      tax: toAmount(totals.taxCents),
      total: toAmount(totals.totalCents),
    },
    notices: [
      {
        type: 'info',
        message: 'Encrypted Stripe checkout is active. Card details are never stored on Velure servers.',
      },
    ],
  });
}
