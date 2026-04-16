const MAX_RESULTS = 50;

const PRODUCT_CATALOG = {
  fuse: { name: 'FUSE' },
  zen: { name: 'ZEN' },
  onyx: { name: 'ONYX' },
  vitality: { name: 'VITALITY' },
  harvest: { name: 'HARVEST' },
  aureo: { name: 'AUREO' },
  'bloom-pods': { name: 'BLOOM' },
  'hazel-pods': { name: 'HAZEL' },
  molten: { name: 'MOLTEN' },
  drift: { name: 'DRIFT' },
  nougat: { name: 'NOUGAT' },
  praline: { name: 'PRALINE' },
  citra: { name: 'CITRA' },
  zest: { name: 'ZEST' },
  ember: { name: 'EMBER' },
  forge: { name: 'FORGE' },
  forest: { name: 'FOREST' },
  grove: { name: 'GROVE' },
  sable: { name: 'SABLE' },
  cerise: { name: 'CERISE' },
  cacao: { name: 'CACAO' },
  'bundle-ritual-set': { name: 'RITUAL SET' },
  'bundle-starter': { name: 'STARTER' },
  'bundle-dark-set': { name: 'DARK SET' },
  'bundle-bright-set': { name: 'BRIGHT SET' },
};

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeLower = (value) => normalize(value).toLowerCase();

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
};

const parseAllowedOrigins = () => {
  const envValue = normalize(
    globalThis.process?.env?.REVIEWS_ALLOWED_ORIGINS
      || globalThis.process?.env?.ORDERS_ALLOWED_ORIGINS
      || globalThis.process?.env?.REWARDS_ALLOWED_ORIGINS
      || globalThis.process?.env?.CHECKOUT_ALLOWED_ORIGINS
      || globalThis.process?.env?.FORMS_ALLOWED_ORIGINS
      || '',
  );
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

const validateProductId = (value) => {
  const productId = normalizeLower(value);
  if (!PRODUCT_CATALOG[productId]) return '';
  return productId;
};

const toApiReview = (row) => {
  const source = row && typeof row === 'object' ? row : {};
  return {
    id: normalize(source.id),
    productId: normalizeLower(source.product_id),
    rating: Math.max(1, Math.min(5, Number(source.rating) || 0)),
    headline: normalize(source.headline),
    comment: normalize(source.comment),
    displayName: normalize(source.display_name) || 'Verified Customer',
    verifiedPurchase: Boolean(source.verified_purchase),
    createdAt: normalize(source.created_at),
  };
};

const buildStats = (rows) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) {
    return { count: 0, averageRating: 0 };
  }

  const sum = safeRows.reduce((acc, row) => acc + (Number(row.rating) || 0), 0);
  return {
    count: safeRows.length,
    averageRating: Number((sum / safeRows.length).toFixed(1)),
  };
};

const listPublishedReviews = async (config, productId, limit = 20) => {
  const safeLimit = Math.max(1, Math.min(MAX_RESULTS, Number(limit) || 20));
  const query = new URLSearchParams({
    product_id: `eq.${productId}`,
    status: 'eq.published',
    select: 'id,product_id,rating,headline,comment,display_name,verified_purchase,created_at',
    order: 'created_at.desc',
    limit: String(safeLimit),
  });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/product_reviews?${query.toString()}`, {
    method: 'GET',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, 'Unable to load product reviews right now.'));
  }

  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
};

const getUserReview = async (config, userId, productId) => {
  const query = new URLSearchParams({
    user_id: `eq.${userId}`,
    product_id: `eq.${productId}`,
    select: 'id,product_id,rating,headline,comment,display_name,verified_purchase,created_at,status',
    limit: '1',
  });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/product_reviews?${query.toString()}`, {
    method: 'GET',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, 'Unable to load your review.'));
  }

  const rows = await response.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
};

const listOrdersForUser = async (config, userId, limit = 120) => {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 120));
  const query = new URLSearchParams({
    user_id: `eq.${userId}`,
    select: 'payment_status,item_preview,raw_metadata',
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
    throw new Error(await parseSupabaseError(response, 'Unable to verify purchase history right now.'));
  }

  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
};

const hasVerifiedPurchase = (orders, productId) => {
  const product = PRODUCT_CATALOG[productId];
  if (!product) return false;
  const productName = normalizeLower(product.name);

  return orders.some((order) => {
    const status = normalizeLower(order?.payment_status);
    if (status !== 'succeeded') {
      return false;
    }

    const rawMetadata = order?.raw_metadata && typeof order.raw_metadata === 'object'
      ? order.raw_metadata
      : {};
    const preview = normalizeLower(order?.item_preview || rawMetadata.itemPreview);
    if (preview && preview.includes(productName)) {
      return true;
    }

    const itemIds = normalizeLower(rawMetadata.itemIds || '');
    if (itemIds) {
      return itemIds.split('|').map((value) => value.trim()).includes(productId);
    }

    return false;
  });
};

const sanitizeReviewPayload = (value) => {
  const source = value && typeof value === 'object' ? value : {};
  const productId = validateProductId(source.productId || source.product_id);
  const rating = Number(source.rating);
  const headline = normalize(source.headline).slice(0, 120);
  const comment = normalize(source.comment).slice(0, 1200);
  const displayName = normalize(source.displayName || source.display_name).slice(0, 80);

  if (!productId) {
    return { ok: false, error: 'Invalid product id.' };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: 'Rating must be between 1 and 5.' };
  }

  if (!comment || comment.length < 8) {
    return { ok: false, error: 'Please write at least 8 characters for your review.' };
  }

  return {
    ok: true,
    review: {
      product_id: productId,
      rating,
      headline,
      comment,
      display_name: displayName,
      status: 'published',
      verified_purchase: true,
    },
  };
};

const upsertReview = async (config, user, reviewPayload) => {
  const fallbackName = normalize(user.email).split('@')[0] || 'Verified Customer';
  const payload = {
    ...reviewPayload,
    user_id: user.id,
    display_name: reviewPayload.display_name || fallbackName.slice(0, 80),
  };

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/product_reviews?on_conflict=user_id,product_id&select=id,product_id,rating,headline,comment,display_name,verified_purchase,created_at,status`,
    {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify([payload]),
    },
  );

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, 'Unable to save review right now.'));
  }

  const rows = await response.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    res.end();
    return;
  }

  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  if (!isAllowedOrigin(req)) {
    sendJson(res, 403, { ok: false, error: 'Origin not allowed.' });
    return;
  }

  let config;
  try {
    config = getSupabaseConfig();
  } catch (error) {
    console.error('Reviews API config error:', error);
    sendJson(res, 500, { ok: false, error: 'Reviews service is not configured.' });
    return;
  }

  const authHeader = normalize(req.headers.authorization);
  const isBearer = authHeader.toLowerCase().startsWith('bearer ');
  const accessToken = isBearer ? normalize(authHeader.slice(7)) : '';
  const user = accessToken ? await verifyAccessToken(config, accessToken) : null;

  if (req.method === 'GET') {
    const productId = validateProductId(req.query?.productId || new URL(req.url || '', 'http://localhost').searchParams.get('productId'));
    if (!productId) {
      sendJson(res, 422, { ok: false, error: 'Invalid product id.' });
      return;
    }

    try {
      const rows = await listPublishedReviews(config, productId, req.query?.limit);
      const stats = buildStats(rows);
      let canReview = false;
      let reason = 'Sign in and complete a purchase to leave a review.';
      let userReview = null;

      if (user) {
        const existing = await getUserReview(config, user.id, productId);
        if (existing) {
          canReview = true;
          reason = '';
          userReview = toApiReview(existing);
        } else {
          const orders = await listOrdersForUser(config, user.id, 120);
          const purchased = hasVerifiedPurchase(orders, productId);
          canReview = purchased;
          reason = purchased ? '' : 'Only customers who purchased this product can leave a review.';
        }
      }

      sendJson(res, 200, {
        ok: true,
        reviews: rows.map(toApiReview),
        stats,
        canReview,
        reason,
        userReview,
      });
    } catch (error) {
      console.error('Reviews GET error:', error);
      sendJson(res, 502, { ok: false, error: 'Unable to load reviews right now.' });
    }
    return;
  }

  // POST
  if (!user) {
    sendJson(res, 401, { ok: false, error: 'Sign in to leave a review.' });
    return;
  }

  let body;
  try {
    body = await parseBody(req);
  } catch {
    sendJson(res, 400, { ok: false, error: 'Invalid JSON payload.' });
    return;
  }

  const validation = sanitizeReviewPayload(body.review || body);
  if (!validation.ok) {
    sendJson(res, 422, { ok: false, error: validation.error });
    return;
  }

  try {
    const orders = await listOrdersForUser(config, user.id, 120);
    const purchased = hasVerifiedPurchase(orders, validation.review.product_id);
    if (!purchased) {
      sendJson(res, 403, { ok: false, error: 'Only customers who purchased this product can leave a review.' });
      return;
    }

    const saved = await upsertReview(config, user, validation.review);
    const rows = await listPublishedReviews(config, validation.review.product_id, 20);
    sendJson(res, 200, {
      ok: true,
      review: saved ? toApiReview(saved) : null,
      reviews: rows.map(toApiReview),
      stats: buildStats(rows),
    });
  } catch (error) {
    console.error('Reviews POST error:', error);
    sendJson(res, 502, { ok: false, error: 'Unable to save review right now.' });
  }
}
