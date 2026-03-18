import { STATIC_BLOG_POSTS } from '../src/data/storefrontContent.js';

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');
const ensureArray = (value) => (Array.isArray(value) ? value : []);

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

const normalizeBlogPostRow = (row = {}) => {
  const readTimeMinutes = Number(row.read_time_minutes || row.readTimeMinutes || 5);
  return {
    title: normalize(row.title),
    slug: normalize(row.slug),
    metaTitle: normalize(row.meta_title || row.metaTitle),
    metaDescription: normalize(row.meta_description || row.metaDescription || row.subtitle),
    description: normalize(row.subtitle || row.description),
    publishedAt: normalize(row.published_at || row.publishedAt),
    readTimeMinutes,
    readTime: `${readTimeMinutes} min read`,
    tags: ensureArray(row.tags).map((tag) => normalize(tag)).filter(Boolean),
    featured: Boolean(row.featured),
    heroImage: normalize(row.featured_image || row.heroImage),
    supportingImages: ensureArray(row.supporting_images || row.supportingImages),
    content: normalize(row.body || row.content),
    relatedProducts: ensureArray(row.related_products || row.relatedProducts).map((item) => normalize(typeof item === 'string' ? item : item?.productId)).filter(Boolean),
    author: normalize(row.author || 'Joe Hart'),
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
      status: 'eq.published',
      order: 'published_at.desc',
    });
    const rows = await fetchAllRows(config, 'blog_posts', query, 'Unable to load blog posts.');
    if (rows.length > 0) {
      sendJson(res, 200, { ok: true, posts: rows.map(normalizeBlogPostRow), source: 'supabase' });
      return;
    }
  } catch (error) {
    console.error('Public blog fallback:', error);
  }

  sendJson(res, 200, {
    ok: true,
    posts: STATIC_BLOG_POSTS.map(normalizeBlogPostRow),
    source: 'static',
  });
}
