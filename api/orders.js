const MAX_RESULTS = 50;

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
  const envValue = getEnv('ORDERS_ALLOWED_ORIGINS')
    || getEnv('REWARDS_ALLOWED_ORIGINS')
    || getEnv('CHECKOUT_ALLOWED_ORIGINS')
    || getEnv('FORMS_ALLOWED_ORIGINS');
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
      if (data.length > 350_000) {
        reject(new Error('Payload too large.'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

  return raw ? JSON.parse(raw) : {};
};

const getSupabaseConfig = () => {
  const supabaseUrl = normalize(
    globalThis.process?.env?.SUPABASE_URL
      || globalThis.process?.env?.VITE_SUPABASE_URL
      || '',
  ).replace(/\/+$/, '');
  const anonKey = normalize(globalThis.process?.env?.SUPABASE_ANON_KEY || globalThis.process?.env?.VITE_SUPABASE_ANON_KEY || '');
  const serviceRoleKey = normalize(globalThis.process?.env?.SUPABASE_SERVICE_ROLE_KEY || '');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error('Missing Supabase server configuration.');
  }

  return { supabaseUrl, anonKey, serviceRoleKey };
};

const parseSupabaseError = async (response, fallbackMessage) => {
  try {
    const payload = await response.json();
    if (typeof payload?.msg === 'string' && payload.msg) return payload.msg;
    if (typeof payload?.error === 'string' && payload.error) return payload.error;
    if (typeof payload?.message === 'string' && payload.message) return payload.message;
  } catch {
    // ignore
  }
  return fallbackMessage;
};

const verifyAccessToken = async (config, accessToken) => {
  const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  if (!payload?.id) return null;

  return {
    id: payload.id,
    email: normalizeLower(payload.email),
  };
};

const normalizePaymentIntentId = (value) => {
  const normalized = normalize(value);
  return /^pi_[A-Za-z0-9]+$/.test(normalized) ? normalized : '';
};

const parseMoneyString = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return Number(fallback.toFixed(2));
  return Number(parsed.toFixed(2));
};

const centsToAmount = (amount) => Number((Math.max(0, Number(amount) || 0) / 100).toFixed(2));

const getStripePaymentIntent = async (stripeSecretKey, paymentIntentId) => {
  const response = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
    },
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const message = normalize(payload?.error?.message) || 'Unable to load payment details from Stripe.';
    throw new Error(message);
  }

  return payload;
};

const buildOrderRecordFromPaymentIntent = (user, paymentIntent) => {
  const metadata = paymentIntent?.metadata && typeof paymentIntent.metadata === 'object' ? paymentIntent.metadata : {};
  const shippingAddress = paymentIntent?.shipping?.address && typeof paymentIntent.shipping.address === 'object'
    ? paymentIntent.shipping.address
    : {};

  const subtotal = parseMoneyString(metadata.subtotal, 0);
  const discount = parseMoneyString(metadata.discount, 0);
  const shippingTotal = parseMoneyString(metadata.shipping, 0);
  const tax = parseMoneyString(metadata.tax, 0);
  const totalFromMetadata = parseMoneyString(metadata.total, 0);
  const total = totalFromMetadata > 0 ? totalFromMetadata : centsToAmount(paymentIntent?.amount);

  return {
    user_id: user.id,
    payment_intent_id: normalize(paymentIntent?.id),
    order_draft_id: normalize(metadata.orderDraftId),
    payment_status: normalize(paymentIntent?.status) || 'unknown',
    currency: normalize((paymentIntent?.currency || 'usd')).toUpperCase(),
    amount_total: centsToAmount(paymentIntent?.amount),
    subtotal,
    discount,
    shipping_total: shippingTotal,
    tax,
    total,
    customer_name: normalize(metadata.customerName || paymentIntent?.shipping?.name),
    customer_email: normalizeLower(metadata.customerEmail || paymentIntent?.receipt_email || user.email),
    customer_phone: normalize(metadata.customerPhone || paymentIntent?.shipping?.phone),
    shipping_country: normalize(metadata.shippingCountry || shippingAddress.country).toUpperCase(),
    shipping_service: normalizeLower(metadata.shippingService),
    shipping_zone: normalizeLower(metadata.shippingZone),
    package_weight_lbs: parseMoneyString(metadata.packageWeightLbs, 0),
    item_preview: normalize(metadata.itemPreview).slice(0, 490),
    item_digest: normalize(metadata.itemDigest).slice(0, 64),
    raw_metadata: metadata,
  };
};

const upsertOrderRecord = async (config, orderRecord) => {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/customer_orders?on_conflict=payment_intent_id&select=*`,
    {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify([orderRecord]),
    },
  );

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, 'Unable to save order right now.'));
  }

  const rows = await response.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  return rows[0];
};

const listOrdersForUser = async (config, userId, limit) => {
  const safeLimit = Math.max(1, Math.min(MAX_RESULTS, Number(limit) || 20));
  const query = new URLSearchParams({
    user_id: `eq.${userId}`,
    select: [
      'id',
      'payment_intent_id',
      'order_draft_id',
      'payment_status',
      'currency',
      'amount_total',
      'subtotal',
      'discount',
      'shipping_total',
      'tax',
      'total',
      'customer_name',
      'customer_email',
      'customer_phone',
      'shipping_country',
      'shipping_service',
      'shipping_zone',
      'package_weight_lbs',
      'item_preview',
      'created_at',
      'updated_at',
    ].join(','),
    order: 'created_at.desc',
    limit: String(safeLimit),
  });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/customer_orders?${query.toString()}`, {
    method: 'GET',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, 'Unable to load orders right now.'));
  }

  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  if (!isAllowedOrigin(req)) {
    sendJson(res, 403, { ok: false, error: 'Origin not allowed.' });
    return;
  }

  const authHeader = normalize(req.headers.authorization);
  const isBearer = authHeader.toLowerCase().startsWith('bearer ');
  const accessToken = isBearer ? normalize(authHeader.slice(7)) : '';

  if (!accessToken) {
    sendJson(res, 401, { ok: false, error: 'Missing access token.' });
    return;
  }

  let config;
  try {
    config = getSupabaseConfig();
  } catch (error) {
    console.error('Orders API config error:', error);
    sendJson(res, 500, { ok: false, error: 'Orders service is not configured.' });
    return;
  }

  const user = await verifyAccessToken(config, accessToken);
  if (!user) {
    sendJson(res, 401, { ok: false, error: 'Invalid access token.' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const limitFromUrl = new URL(req.url || '', 'http://localhost').searchParams.get('limit');
      const limit = Number(req.query?.limit || limitFromUrl || 20);
      const orders = await listOrdersForUser(config, user.id, limit);
      sendJson(res, 200, { ok: true, orders });
    } catch (error) {
      console.error('Orders load error:', error);
      sendJson(res, 502, { ok: false, error: 'Unable to load orders right now.' });
    }
    return;
  }

  let body;
  try {
    body = await parseBody(req);
  } catch {
    sendJson(res, 400, { ok: false, error: 'Invalid JSON payload.' });
    return;
  }

  const paymentIntentId = normalizePaymentIntentId(body.paymentIntentId);
  if (!paymentIntentId) {
    sendJson(res, 422, { ok: false, error: 'Invalid payment intent id.' });
    return;
  }

  const stripeSecretKey = getEnv('STRIPE_SECRET_KEY');
  if (!stripeSecretKey) {
    sendJson(res, 503, { ok: false, error: 'Orders are temporarily unavailable.' });
    return;
  }

  try {
    const paymentIntent = await getStripePaymentIntent(stripeSecretKey, paymentIntentId);
    const orderRecord = buildOrderRecordFromPaymentIntent(user, paymentIntent);
    if (!orderRecord.payment_intent_id) {
      sendJson(res, 422, { ok: false, error: 'Payment details are incomplete.' });
      return;
    }

    const savedOrder = await upsertOrderRecord(config, orderRecord);
    sendJson(res, 200, { ok: true, order: savedOrder || orderRecord });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save order right now.';
    console.error('Order save error:', error);
    sendJson(res, 502, { ok: false, error: message });
  }
}
