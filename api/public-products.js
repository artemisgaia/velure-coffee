import { fetchAllRows, getStaticProducts, getSupabaseConfig, normalizeProductRow, sendJson } from './_admin.js';

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
    const rows = await fetchAllRows(config, 'products', query, {
      errorMessage: 'Unable to load products.',
    });
    if (rows.length > 0) {
      sendJson(res, 200, { ok: true, products: rows.map(normalizeProductRow), source: 'supabase' });
      return;
    }
  } catch (error) {
    console.error('Public products fallback:', error);
  }

  try {
    const fallbackProducts = await getStaticProducts();
    sendJson(res, 200, { ok: true, products: fallbackProducts.map(normalizeProductRow), source: 'static' });
  } catch (error) {
    console.error('Public products error:', error);
    sendJson(res, 500, { ok: false, error: 'Unable to load products.' });
  }
}
