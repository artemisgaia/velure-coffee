import {
  buildProductPayload,
  deleteRows,
  fetchAllRows,
  fetchRowsWithCount,
  getPageParams,
  getStaticProducts,
  getSupabaseConfig,
  normalizeProductRow,
  parseBody,
  patchRows,
  requireAdmin,
  sendJson,
  upsertRows,
} from '../_admin.js';

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
    res.end();
    return;
  }

  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
    sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  if (!requireAdmin(req, res)) return;

  try {
    const config = getSupabaseConfig();
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'POST') {
      const body = await parseBody(req, 500_000);
      if (body.action === 'import_static') {
        const staticProducts = await getStaticProducts();
        const existingRows = await fetchAllRows(config, 'products', new URLSearchParams({ select: 'id' }));
        const existingIds = new Set(existingRows.map((row) => normalize(row.id)).filter(Boolean));
        const importedCount = staticProducts.reduce((count, product) => (
          existingIds.has(normalize(product.id)) ? count : count + 1
        ), 0);

        await upsertRows(config, 'products', staticProducts, 'id', {
          errorMessage: 'Unable to import products.',
        });
        sendJson(res, 200, {
          ok: true,
          imported: importedCount,
          totalSourceRecords: staticProducts.length,
        });
        return;
      }

      const [saved] = await upsertRows(config, 'products', [buildProductPayload(body)], 'id', {
        errorMessage: 'Unable to save product.',
      });
      sendJson(res, 200, { ok: true, product: normalizeProductRow(saved) });
      return;
    }

    if (req.method === 'PUT') {
      const body = await parseBody(req, 500_000);
      if (body.action === 'reorder' && Array.isArray(body.items)) {
        const updates = await Promise.all(
          body.items.map((item) => patchRows(
            config,
            'products',
            new URLSearchParams({ id: `eq.${normalize(item.id)}`, select: '*' }),
            { sort_order: Number(item.sort_order) || 0 },
          )),
        );
        sendJson(res, 200, { ok: true, products: updates.flat().map(normalizeProductRow) });
        return;
      }

      const productId = normalize(body.id);
      const updated = await patchRows(config, 'products', new URLSearchParams({
        id: `eq.${productId}`,
        select: '*',
      }), buildProductPayload(body), {
        errorMessage: 'Unable to update product.',
      });
      sendJson(res, 200, { ok: true, product: normalizeProductRow(updated?.[0] || body) });
      return;
    }

    if (req.method === 'DELETE') {
      const body = await parseBody(req, 50_000);
      const productId = normalize(body.id);
      if (!productId) {
        sendJson(res, 400, { ok: false, error: 'Missing product id.' });
        return;
      }
      await deleteRows(config, 'products', new URLSearchParams({ id: `eq.${productId}` }), {
        errorMessage: 'Unable to delete product.',
      });
      sendJson(res, 200, { ok: true });
      return;
    }

    const { page, pageSize, from } = getPageParams(Object.fromEntries(url.searchParams.entries()));
    const query = new URLSearchParams({
      select: '*',
      order: 'sort_order.asc.nullslast,name.asc',
      offset: String(from),
      limit: String(pageSize),
    });
    if (normalize(url.searchParams.get('category'))) query.set('category', `eq.${normalize(url.searchParams.get('category'))}`);
    if (normalize(url.searchParams.get('isActive'))) query.set('is_active', `eq.${normalize(url.searchParams.get('isActive'))}`);
    const { rows, count } = await fetchRowsWithCount(config, 'products', query, {
      errorMessage: 'Unable to load products.',
    });
    sendJson(res, 200, {
      ok: true,
      page,
      pageSize,
      total: count,
      products: rows.map(normalizeProductRow),
    });
  } catch (error) {
    console.error('Admin products error:', error);
    sendJson(res, 500, { ok: false, error: 'Unable to manage products.' });
  }
}
