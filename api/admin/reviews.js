import {
  deleteRows,
  fetchRowsWithCount,
  getPageParams,
  getSupabaseConfig,
  parseBody,
  patchRows,
  requireAdmin,
  sendJson,
} from '../_admin.js';

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'GET, PUT, DELETE, OPTIONS');
    res.end();
    return;
  }

  if (!['GET', 'PUT', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT, DELETE, OPTIONS');
    sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  if (!requireAdmin(req, res)) return;

  try {
    const config = getSupabaseConfig();
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'GET') {
      const { page, pageSize, from } = getPageParams(Object.fromEntries(url.searchParams.entries()));
      const query = new URLSearchParams({
        select: 'id,created_at,product_id,display_name,rating,headline,comment,verified_purchase,status',
        order: 'created_at.desc',
        offset: String(from),
        limit: String(pageSize),
      });
      if (normalize(url.searchParams.get('status'))) query.set('status', `eq.${normalize(url.searchParams.get('status'))}`);
      if (normalize(url.searchParams.get('productId'))) query.set('product_id', `eq.${normalize(url.searchParams.get('productId'))}`);
      if (normalize(url.searchParams.get('rating'))) query.set('rating', `eq.${normalize(url.searchParams.get('rating'))}`);
      const { rows, count } = await fetchRowsWithCount(config, 'product_reviews', query, {
        errorMessage: 'Unable to load reviews.',
      });
      sendJson(res, 200, { ok: true, page, pageSize, total: count, reviews: rows });
      return;
    }

    if (req.method === 'DELETE') {
      const body = await parseBody(req, 100_000);
      const reviewId = normalize(body.id);
      if (!reviewId) {
        sendJson(res, 400, { ok: false, error: 'Missing review id.' });
        return;
      }
      await deleteRows(config, 'product_reviews', new URLSearchParams({ id: `eq.${reviewId}` }), {
        errorMessage: 'Unable to delete review.',
      });
      sendJson(res, 200, { ok: true });
      return;
    }

    const body = await parseBody(req, 250_000);
    const ids = Array.isArray(body.ids) ? body.ids.map((id) => normalize(id)).filter(Boolean) : [];
    const singleId = normalize(body.id);
    const targetIds = ids.length ? ids : (singleId ? [singleId] : []);
    if (!targetIds.length) {
      sendJson(res, 400, { ok: false, error: 'Missing review id.' });
      return;
    }
    const query = new URLSearchParams({
      id: `in.(${targetIds.join(',')})`,
      select: 'id,created_at,product_id,display_name,rating,headline,comment,verified_purchase,status',
    });
    const patchPayload = {};
    if (body.action === 'approve') patchPayload.status = 'published';
    if (body.action === 'reject') patchPayload.status = 'rejected';
    if ('display_name' in body || 'displayName' in body) patchPayload.display_name = normalize(body.display_name || body.displayName);
    if ('headline' in body) patchPayload.headline = normalize(body.headline);
    if ('comment' in body) patchPayload.comment = normalize(body.comment);
    const updated = await patchRows(config, 'product_reviews', query, patchPayload, {
      errorMessage: 'Unable to update review.',
    });
    sendJson(res, 200, { ok: true, reviews: updated });
  } catch (error) {
    console.error('Admin reviews error:', error);
    sendJson(res, 500, { ok: false, error: 'Unable to update reviews.' });
  }
}
