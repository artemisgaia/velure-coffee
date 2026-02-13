const DEFAULT_SHIPPING_ZONES = {
  US: {
    label: 'United States',
    services: {
      standard: { label: 'Standard (3-5 business days)', shippingCents: 695, freeShippingThresholdCents: 5000 },
      priority: { label: 'Priority (2-3 business days)', shippingCents: 1295, freeShippingThresholdCents: 0 },
    },
  },
  CA: {
    label: 'Canada',
    services: {
      standard: { label: 'International Standard (5-9 business days)', shippingCents: 1295, freeShippingThresholdCents: 0 },
    },
  },
  GB: {
    label: 'United Kingdom',
    services: {
      standard: { label: 'International Standard (6-10 business days)', shippingCents: 1495, freeShippingThresholdCents: 0 },
    },
  },
  AU: {
    label: 'Australia',
    quoteRequired: true,
    services: {
      quote: { label: 'Freight quote required', shippingCents: 0, freeShippingThresholdCents: 0 },
    },
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

const parseShippingCountryOrder = () => {
  const envValue = getEnv('CHECKOUT_SHIPPING_COUNTRIES');
  const fallback = Object.keys(DEFAULT_SHIPPING_ZONES);

  if (!envValue) return fallback;

  const parsed = envValue
    .split(',')
    .map((value) => normalize(value).toUpperCase())
    .filter((value) => /^[A-Z]{2}$/.test(value));

  return parsed.length ? parsed : fallback;
};

const parseTaxConfig = () => {
  const result = {};
  for (const code of Object.keys(DEFAULT_SHIPPING_ZONES)) {
    const rate = Number(getEnv(`CHECKOUT_TAX_RATE_${code}`));
    if (Number.isFinite(rate) && rate >= 0 && rate <= 1) {
      result[code] = rate;
    }
  }
  return result;
};

const parseDefaultTaxRate = () => {
  const rate = Number(getEnv('CHECKOUT_TAX_RATE_DEFAULT'));
  if (Number.isFinite(rate) && rate >= 0 && rate <= 1) {
    return rate;
  }
  return 0;
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'GET, OPTIONS');
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  if (!isAllowedOrigin(req)) {
    sendJson(res, 403, { ok: false, error: 'Origin not allowed.' });
    return;
  }

  const publishableKey = getEnv('STRIPE_PUBLISHABLE_KEY');
  const shippingCountryOrder = parseShippingCountryOrder();
  const shippingZones = shippingCountryOrder.reduce((accumulator, countryCode) => {
    if (DEFAULT_SHIPPING_ZONES[countryCode]) {
      accumulator[countryCode] = DEFAULT_SHIPPING_ZONES[countryCode];
    }
    return accumulator;
  }, {});

  sendJson(res, 200, {
    ok: true,
    hasPublishableKey: Boolean(publishableKey),
    publishableKey,
    currency: 'usd',
    defaultCountry: shippingCountryOrder.includes('US') ? 'US' : shippingCountryOrder[0] || 'US',
    shippingZones,
    taxRates: parseTaxConfig(),
    defaultTaxRate: parseDefaultTaxRate(),
    quoteMessage: 'Shipping to this destination requires a custom freight quote.',
    unsupportedMessage: 'We do not currently ship coffee products to that destination.',
  });
}
