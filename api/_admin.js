import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ADMIN_COOKIE_NAME = 'velure_admin_session';
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const DEFAULT_PAGE_SIZE = 25;

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeLower = (value) => normalize(value).toLowerCase();
const escapeLike = (value) => normalize(value).replace(/[,%]/g, '');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appFilePath = path.join(__dirname, '..', 'src', 'App.jsx');

let staticSourcePromise = null;

export const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
};

export const parseBody = async (req, maxBytes = 1_000_000) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};

  const raw = await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > maxBytes) {
        reject(new Error('Payload too large.'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

  return raw ? JSON.parse(raw) : {};
};

export const getSupabaseConfig = () => {
  const supabaseUrl = normalize(
    globalThis.process?.env?.SUPABASE_URL
      || globalThis.process?.env?.VITE_SUPABASE_URL
      || '',
  ).replace(/\/+$/, '');
  const anonKey = normalize(
    globalThis.process?.env?.SUPABASE_ANON_KEY
      || globalThis.process?.env?.VITE_SUPABASE_ANON_KEY
      || '',
  );
  const serviceRoleKey = normalize(globalThis.process?.env?.SUPABASE_SERVICE_ROLE_KEY || '');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error('Missing Supabase server configuration.');
  }

  return { supabaseUrl, anonKey, serviceRoleKey };
};

export const parseSupabaseError = async (response, fallbackMessage) => {
  try {
    const payload = await response.json();
    if (typeof payload?.msg === 'string' && payload.msg) return payload.msg;
    if (typeof payload?.error === 'string' && payload.error) return payload.error;
    if (typeof payload?.message === 'string' && payload.message) return payload.message;
    if (Array.isArray(payload) && payload[0]?.message) return payload[0].message;
  } catch {
    // ignore
  }
  return fallbackMessage;
};

export const getAdminConfig = () => {
  const username = normalize(globalThis.process?.env?.ADMIN_USERNAME || '');
  const password = normalize(globalThis.process?.env?.ADMIN_PASSWORD || '');
  if (!username || !password) {
    throw new Error('Missing admin credentials.');
  }
  return { username, password };
};

const createSignature = (payload, secret) => createHmac('sha256', secret).update(payload).digest('hex');

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
};

const encodeCookieValue = (payload, secret) => {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = createSignature(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
};

const decodeCookieValue = (cookieValue, secret) => {
  const [encodedPayload, signature] = normalize(cookieValue).split('.');
  if (!encodedPayload || !signature) return null;
  const expected = createSignature(encodedPayload, secret);
  if (!safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!payload || typeof payload !== 'object') return null;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

const parseCookies = (headerValue) => {
  const header = normalize(headerValue);
  if (!header) return {};

  return header.split(';').reduce((accumulator, part) => {
    const [rawName, ...rest] = part.split('=');
    const name = normalize(rawName);
    if (!name) return accumulator;
    accumulator[name] = rest.join('=').trim();
    return accumulator;
  }, {});
};

export const setAdminSessionCookie = (res, username) => {
  const { password } = getAdminConfig();
  const expires = Date.now() + ADMIN_SESSION_TTL_MS;
  const value = encodeCookieValue({ username, exp: expires }, password);
  const isProduction = normalizeLower(globalThis.process?.env?.NODE_ENV) === 'production';
  const cookieParts = [
    `${ADMIN_COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(ADMIN_SESSION_TTL_MS / 1000)}`,
  ];

  if (isProduction) {
    cookieParts.push('Secure');
  }

  res.setHeader('Set-Cookie', cookieParts.join('; '));
};

export const clearAdminSessionCookie = (res) => {
  const isProduction = normalizeLower(globalThis.process?.env?.NODE_ENV) === 'production';
  const cookieParts = [
    `${ADMIN_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (isProduction) {
    cookieParts.push('Secure');
  }
  res.setHeader('Set-Cookie', cookieParts.join('; '));
};

export const getAdminSession = (req) => {
  const cookies = parseCookies(req.headers.cookie);
  const cookieValue = cookies[ADMIN_COOKIE_NAME];
  if (!cookieValue) return null;
  const { password } = getAdminConfig();
  return decodeCookieValue(cookieValue, password);
};

export const requireAdmin = (req, res) => {
  try {
    const session = getAdminSession(req);
    if (!session?.username) {
      sendJson(res, 401, { ok: false, error: 'Unauthorized.' });
      return null;
    }
    return session;
  } catch (error) {
    console.error('Admin auth error:', error);
    sendJson(res, 500, { ok: false, error: 'Admin auth is not configured.' });
    return null;
  }
};

export const readStaticSource = async () => {
  if (!staticSourcePromise) {
    staticSourcePromise = readFile(appFilePath, 'utf8')
      .then((source) => {
        const productsMatch = source.match(/const PRODUCTS = (\[[\s\S]*?\n\]);\n\nconst SUBSCRIPTION_PRODUCTS =/);
        const blogPostsMatch = source.match(/const BLOG_POSTS = (\[[\s\S]*?\n\]);\n\nconst BLOG_RELATED_PRODUCTS_BY_SLUG =/);
        if (!productsMatch || !blogPostsMatch) {
          throw new Error('Unable to locate static products or blog posts.');
        }
        const products = Function(`return (${productsMatch[1]});`)();
        const blogPosts = Function(`return (${blogPostsMatch[1]});`)();
        return {
          products: Array.isArray(products) ? products : [],
          blogPosts: Array.isArray(blogPosts) ? blogPosts : [],
        };
      });
  }
  return staticSourcePromise;
};

export const createSlug = (value) => normalizeLower(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const ensureArray = (value) => (Array.isArray(value) ? value : []);
const ensureObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});

export const normalizeProductRow = (row = {}) => {
  const normalizedCategory = normalizeLower(row.category) === 'bundle' ? 'bundles' : normalizeLower(row.category);
  const details = ensureObject(row.details);
  const nutritionSpecs = ensureObject(row.nutrition_specs || row.nutritionSpecs);
  const benefits = ensureArray(row.benefits).map((item) => {
    if (typeof item === 'string') return { name: item, description: '' };
    return {
      name: normalize(item?.name || item?.title),
      description: normalize(item?.description || item?.benefit),
    };
  }).filter((item) => item.name || item.description);
  const ingredients = ensureArray(row.ingredients).map((item) => normalize(typeof item === 'string' ? item : item?.name)).filter(Boolean);
  const images = ensureArray(row.images).map((item) => normalize(typeof item === 'string' ? item : item?.url)).filter(Boolean);
  const badges = ensureArray(row.badges).map((item) => normalize(typeof item === 'string' ? item : item?.label)).filter(Boolean);

  return {
    id: createSlug(row.id || row.slug || row.name),
    name: normalize(row.name || row.title),
    subtitle: normalize(row.subtitle || row.tagline),
    price: Number(row.price || 0),
    category: normalizedCategory || 'functional',
    tag: normalize(row.tag || badges[0] || ''),
    subscriptionEligible: row.subscription_eligible !== false,
    featuredHome: Boolean(row.featured_home ?? row.is_featured ?? false),
    images,
    description: normalize(row.description),
    details: {
      origin: normalize(row.origin || details.origin),
      roast: normalize(row.roast || details.roast),
      ingredients: normalize(details.ingredients || ingredients.join(', ')),
      weight: normalize(details.weight || row.weight || nutritionSpecs.productAmount || ''),
      format: normalize(row.format || details.format || ''),
      series: normalize(row.series || details.series || ''),
    },
    nutritionSpecs: {
      ...nutritionSpecs,
      productAmount: normalize(nutritionSpecs.productAmount || row.format || details.weight || ''),
      region: normalize(nutritionSpecs.region || row.origin || details.origin),
      ingredients: normalize(nutritionSpecs.ingredients || details.ingredients || ingredients.join(', ')),
    },
    origin: normalize(row.origin || details.origin),
    roast: normalize(row.roast || details.roast),
    format: normalize(row.format || details.format),
    series: normalize(row.series || details.series),
    ingredients,
    benefits,
    badges,
    weight_lbs: Number(row.weight_lbs || row.weightLbs || 0),
    is_active: row.is_active !== false,
    is_featured: Boolean(row.is_featured ?? row.featuredHome ?? false),
    sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 0,
  };
};

export const normalizeBlogPostRow = (row = {}) => {
  const tags = ensureArray(row.tags).map((tag) => normalize(tag)).filter(Boolean);
  const body = normalize(row.body || row.content);
  const publishedAt = normalize(row.published_at || row.publishedAt) || new Date().toISOString();
  const readTimeMinutes = Number(row.read_time_minutes || row.readTimeMinutes || 0);

  return {
    id: normalize(row.id || row.slug),
    slug: createSlug(row.slug || row.title),
    title: normalize(row.title),
    subtitle: normalize(row.subtitle),
    description: normalize(row.subtitle || row.description),
    content: body,
    heroImage: normalize(row.featured_image || row.heroImage),
    featuredImage: normalize(row.featured_image || row.heroImage),
    tags,
    status: normalizeLower(row.status) || 'draft',
    publishedAt,
    readTimeMinutes,
    readTime: readTimeMinutes > 0 ? `${readTimeMinutes} min read` : '5 min read',
    author: normalize(row.author) || 'Joe Hart',
    featured: Boolean(row.featured),
    metaTitle: normalize(row.meta_title || row.metaTitle),
    metaDescription: normalize(row.meta_description || row.metaDescription || row.subtitle),
    supportingImages: ensureArray(row.supporting_images || row.supportingImages),
    relatedProducts: ensureArray(row.related_products || row.relatedProducts).map((item) => normalize(typeof item === 'string' ? item : item?.id)).filter(Boolean),
  };
};

export const buildProductPayload = (input = {}) => {
  const row = normalizeProductRow(input);
  return {
    id: row.id,
    name: row.name,
    tagline: normalize(input.tagline || row.subtitle),
    subtitle: row.subtitle,
    description: row.description,
    price: Number(row.price.toFixed(2)),
    category: row.category === 'bundles' ? 'bundles' : row.category,
    series: row.series,
    origin: row.origin,
    roast: row.roast,
    format: row.format,
    ingredients: row.ingredients,
    benefits: row.benefits,
    images: row.images,
    badges: row.badges,
    details: row.details,
    nutrition_specs: row.nutritionSpecs,
    weight_lbs: row.weight_lbs,
    is_active: Boolean(input.is_active ?? row.is_active),
    is_featured: Boolean(input.is_featured ?? row.is_featured),
    sort_order: Number.isFinite(Number(input.sort_order ?? row.sort_order)) ? Number(input.sort_order ?? row.sort_order) : 0,
    featured_home: Boolean(input.featured_home ?? row.featuredHome),
    subscription_eligible: Boolean(input.subscription_eligible ?? row.subscriptionEligible),
  };
};

export const buildBlogPayload = (input = {}) => {
  const row = normalizeBlogPostRow(input);
  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    body: row.content,
    featured_image: row.heroImage,
    tags: row.tags,
    status: row.status,
    published_at: row.publishedAt,
    read_time_minutes: Number.isFinite(Number(input.read_time_minutes ?? row.readTimeMinutes))
      ? Number(input.read_time_minutes ?? row.readTimeMinutes)
      : 5,
    author: normalize(input.author || row.author || 'Joe Hart'),
  };
};

export const supabaseRequest = async (config, pathValue, options = {}) => {
  const response = await fetch(`${config.supabaseUrl}${pathValue}`, {
    method: options.method || 'GET',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, options.errorMessage || 'Supabase request failed.'));
  }

  if (options.returnText) {
    return response.text();
  }

  return response.json().catch(() => null);
};

export const adminTableHeaders = {
  prefer: 'count=exact',
};

export const getPageParams = (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.max(1, Math.min(100, Number(query.pageSize) || DEFAULT_PAGE_SIZE));
  return {
    page,
    pageSize,
    from: (page - 1) * pageSize,
    to: (page - 1) * pageSize + pageSize - 1,
  };
};

export const parseCountHeader = (response) => {
  const range = normalize(response.headers.get('content-range'));
  const totalSegment = range.split('/')[1] || '';
  const total = Number(totalSegment);
  return Number.isFinite(total) ? total : 0;
};

export const fetchRowsWithCount = async (config, table, query, options = {}) => {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/${table}?${query.toString()}`, {
    method: 'GET',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: 'application/json',
      Prefer: 'count=exact',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, options.errorMessage || `Unable to load ${table}.`));
  }

  const rows = await response.json().catch(() => []);
  return {
    rows: Array.isArray(rows) ? rows : [],
    count: parseCountHeader(response),
  };
};

export const fetchAllRows = async (config, table, query, options = {}) => {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/${table}?${query.toString()}`, {
    method: 'GET',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, options.errorMessage || `Unable to load ${table}.`));
  }

  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
};

export const fetchSingleRow = async (config, table, query, options = {}) => {
  const rows = await fetchAllRows(config, table, query, options);
  return rows[0] || null;
};

export const upsertRows = async (config, table, rows, conflictColumn, options = {}) => {
  const query = new URLSearchParams();
  if (conflictColumn) query.set('on_conflict', conflictColumn);
  query.set('select', options.select || '*');

  return supabaseRequest(
    config,
    `/rest/v1/${table}?${query.toString()}`,
    {
      method: 'POST',
      body: rows,
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      errorMessage: options.errorMessage || `Unable to save ${table}.`,
    },
  );
};

export const patchRows = async (config, table, query, body, options = {}) => {
  return supabaseRequest(
    config,
    `/rest/v1/${table}?${query.toString()}`,
    {
      method: 'PATCH',
      body,
      headers: {
        Prefer: 'return=representation',
      },
      errorMessage: options.errorMessage || `Unable to update ${table}.`,
    },
  );
};

export const deleteRows = async (config, table, query, options = {}) => {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/${table}?${query.toString()}`, {
    method: 'DELETE',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Prefer: 'return=representation',
    },
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, options.errorMessage || `Unable to delete from ${table}.`));
  }

  return response.json().catch(() => []);
};

export const listToCsv = (rows) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) return '';
  const headers = Array.from(
    safeRows.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set()),
  );
  const escapeCell = (value) => {
    const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  return [
    headers.join(','),
    ...safeRows.map((row) => headers.map((header) => escapeCell(row?.[header])).join(',')),
  ].join('\n');
};

export const calculateReadTimeMinutes = (body) => {
  const words = normalize(body).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

export const maybeJsonParse = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const getStaticProducts = async () => {
  const source = await readStaticSource();
  return source.products.map((product, index) => ({
    ...buildProductPayload({
      ...product,
      sort_order: index,
      is_active: true,
      is_featured: Boolean(product.featuredHome),
      featured_home: Boolean(product.featuredHome),
      subscription_eligible: product.subscriptionEligible !== false,
    }),
  }));
};

export const getStaticBlogPosts = async () => {
  const source = await readStaticSource();
  return source.blogPosts.map((post, index) => ({
    ...buildBlogPayload({
      ...post,
      status: 'published',
      published_at: post.publishedAt,
      read_time_minutes: Number(post.readTime?.match(/\d+/)?.[0] || calculateReadTimeMinutes(post.content)),
      author: post.author || 'Joe Hart',
      sort_order: index,
    }),
  }));
};

export const buildSearchOr = (columns, rawTerm) => {
  const term = escapeLike(rawTerm);
  if (!term) return '';
  return columns.map((column) => `${column}.ilike.*${term}*`).join(',');
};
