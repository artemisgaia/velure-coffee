import { STATIC_PRODUCTS } from '../src/data/storefrontContent.js';

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeLower = (value) => normalize(value).toLowerCase();
const ensureArray = (value) => (Array.isArray(value) ? value : []);
const ensureObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
};

const getSupabaseConfig = () => {
  const supabaseUrl = normalize(
    globalThis.process?.env?.SUPABASE_URL
      || globalThis.process?.env?.VITE_SUPABASE_URL
      || '',
  ).replace(/\/+$/, '');
  const serviceRoleKey = normalize(globalThis.process?.env?.SUPABASE_SERVICE_ROLE_KEY || '');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server configuration.');
  }

  return { supabaseUrl, serviceRoleKey };
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

const fetchAllRows = async (config, table, query, errorMessage) => {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/${table}?${query.toString()}`, {
    method: 'GET',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, errorMessage));
  }

  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
};

const normalizeProductRow = (row = {}) => {
  const details = ensureObject(row.details);
  const nutritionSpecs = ensureObject(row.nutrition_specs || row.nutritionSpecs);
  const ingredients = ensureArray(row.ingredients).map((item) => normalize(typeof item === 'string' ? item : item?.name)).filter(Boolean);
  const benefits = ensureArray(row.benefits).map((item) => ({
    name: normalize(item?.name || item?.title),
    description: normalize(item?.description || item?.benefit),
  })).filter((item) => item.name || item.description);
  const images = ensureArray(row.images).map((item) => normalize(typeof item === 'string' ? item : item?.url)).filter(Boolean);
  const badges = ensureArray(row.badges).map((item) => normalize(typeof item === 'string' ? item : item?.label)).filter(Boolean);

  return {
    id: normalizeLower(row.id || row.slug || row.name),
    name: normalize(row.name || row.title),
    subtitle: normalize(row.subtitle || row.tagline),
    price: Number(row.price || 0),
    category: normalizeLower(row.category === 'bundle' ? 'bundles' : row.category) || 'functional',
    tag: normalize(row.tag || badges[0] || ''),
    subscriptionEligible: row.subscription_eligible !== false && row.subscriptionEligible !== false,
    featuredHome: Boolean(row.featured_home ?? row.featuredHome ?? row.is_featured ?? false),
    images,
    description: normalize(row.description),
    details: {
      origin: normalize(row.origin || details.origin),
      roast: normalize(row.roast || details.roast),
      ingredients: normalize(details.ingredients || ingredients.join(', ')),
      weight: normalize(details.weight || nutritionSpecs.productAmount || ''),
      format: normalize(row.format || details.format || ''),
      series: normalize(row.series || details.series || ''),
    },
    nutritionSpecs: {
      ...nutritionSpecs,
      productAmount: normalize(nutritionSpecs.productAmount || details.weight || ''),
      region: normalize(nutritionSpecs.region || row.origin || details.origin),
      ingredients: normalize(nutritionSpecs.ingredients || details.ingredients || ingredients.join(', ')),
    },
    ingredients,
    benefits,
    badges,
    origin: normalize(row.origin || details.origin),
    roast: normalize(row.roast || details.roast),
    format: normalize(row.format || details.format),
    series: normalize(row.series || details.series),
    weight_lbs: Number(row.weight_lbs || row.weightLbs || 0),
    is_active: row.is_active !== false,
    is_featured: Boolean(row.is_featured ?? row.featuredHome ?? false),
    sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 0,
  };
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

  try {
    const config = getSupabaseConfig();
    const query = new URLSearchParams({
      select: '*',
      is_active: 'eq.true',
      order: 'sort_order.asc.nullslast,name.asc',
    });
    const rows = await fetchAllRows(config, 'products', query, 'Unable to load products.');
    if (rows.length > 0) {
      sendJson(res, 200, { ok: true, products: rows.map(normalizeProductRow), source: 'supabase' });
      return;
    }
  } catch (error) {
    console.error('Public products fallback:', error);
  }

  sendJson(res, 200, {
    ok: true,
    products: STATIC_PRODUCTS.map((product, index) => normalizeProductRow({ ...product, sort_order: index })),
    source: 'static',
  });
}
