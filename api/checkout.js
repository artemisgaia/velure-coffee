const PRODUCT_CATALOG = {
  fuse: { name: 'FUSE', price: 38.0 },
  zen: { name: 'ZEN', price: 45.0 },
  onyx: { name: 'ONYX', price: 28.0 },
  vitality: { name: 'VITALITY', price: 36.0 },
  harvest: { name: 'HARVEST', price: 34.0 },
  aureo: { name: 'AUREO', price: 26.0 },
};

const DEFAULT_PAYPAL_EMAIL = 'sales@artemisgaia.co';

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

const buildCheckoutUrl = (items, paypalEmail) => {
  const subtotal = items.reduce((sum, item) => {
    const product = PRODUCT_CATALOG[item.productId];
    return sum + (product.price * item.quantity);
  }, 0);
  const total = Number(subtotal.toFixed(2));
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemSummary = items
    .map((item) => `${PRODUCT_CATALOG[item.productId].name} x${item.quantity}`)
    .join(', ')
    .slice(0, 110);
  const itemName = `Velure Order (${totalItems} items): ${itemSummary}`;

  const query = new URLSearchParams({
    cmd: '_xclick',
    business: paypalEmail,
    currency_code: 'USD',
    amount: total.toFixed(2),
    item_name: itemName,
  });

  return {
    total,
    checkoutUrl: `https://www.paypal.com/cgi-bin/webscr?${query.toString()}`,
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

  const paypalEmail = getEnv('PAYPAL_CHECKOUT_EMAIL') || getEnv('PAYPAL_EMAIL') || DEFAULT_PAYPAL_EMAIL;
  const { total, checkoutUrl } = buildCheckoutUrl(validation.items, paypalEmail);

  sendJson(res, 200, {
    ok: true,
    currency: 'USD',
    total,
    checkoutUrl,
  });
}
