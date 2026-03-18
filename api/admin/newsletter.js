import {
  deleteRows,
  fetchRowsWithCount,
  getPageParams,
  getSupabaseConfig,
  listToCsv,
  parseBody,
  requireAdmin,
  sendJson,
} from '../_admin.js';

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeLower = (value) => normalize(value).toLowerCase();

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'GET, DELETE, OPTIONS');
    res.end();
    return;
  }

  if (!['GET', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, DELETE, OPTIONS');
    sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  if (!requireAdmin(req, res)) return;

  try {
    const config = getSupabaseConfig();
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'DELETE') {
      const body = await parseBody(req, 50_000);
      const email = normalizeLower(body.email);
      if (!email) {
        sendJson(res, 400, { ok: false, error: 'Missing subscriber email.' });
        return;
      }
      await deleteRows(config, 'newsletter_subscribers', new URLSearchParams({ email: `eq.${email}` }), {
        errorMessage: 'Unable to delete subscriber.',
      });
      sendJson(res, 200, { ok: true });
      return;
    }

    const exportCsv = normalizeLower(url.searchParams.get('export')) === 'csv';
    const { page, pageSize, from } = getPageParams(Object.fromEntries(url.searchParams.entries()));
    const query = new URLSearchParams({
      select: 'email,source,created_at',
      order: 'created_at.desc',
    });
    const search = normalizeLower(url.searchParams.get('search'));
    if (search) query.set('email', `ilike.*${search}*`);
    if (!exportCsv) {
      query.set('offset', String(from));
      query.set('limit', String(pageSize));
    }
    const { rows, count } = await fetchRowsWithCount(config, 'newsletter_subscribers', query, {
      errorMessage: 'Unable to load subscribers.',
    });
    if (exportCsv) {
      const csv = listToCsv(rows);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="velure-newsletter.csv"');
      res.end(csv);
      return;
    }
    sendJson(res, 200, {
      ok: true,
      metrics: { totalSubscribers: count },
      page,
      pageSize,
      total: count,
      subscribers: rows,
    });
  } catch (error) {
    console.error('Admin newsletter error:', error);
    sendJson(res, 500, { ok: false, error: 'Unable to load newsletter subscribers.' });
  }
}
