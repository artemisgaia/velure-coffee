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

const buildQuery = (searchParams) => {
  const { page, pageSize, from, to } = getPageParams(searchParams);
  const query = new URLSearchParams({
    select: 'id,created_at,customer_name,customer_email,item_preview,subtotal,discount,shipping_total,tax,total,payment_status,shipping_service,shipping_zone,shipping_country,package_weight_lbs,raw_metadata',
    order: `${normalize(searchParams.sort || 'created_at')}.${normalizeLower(searchParams.direction) === 'asc' ? 'asc' : 'desc'}`,
    offset: String(from),
    limit: String(pageSize),
  });

  const search = normalize(searchParams.search);
  if (search) {
    query.set('or', `customer_name.ilike.*${search}*,customer_email.ilike.*${search}*`);
  }
  if (normalize(searchParams.paymentStatus)) {
    query.set('payment_status', `eq.${normalize(searchParams.paymentStatus)}`);
  }
  if (normalize(searchParams.dateFrom)) {
    query.set('created_at', `gte.${normalize(searchParams.dateFrom)}`);
  }
  if (normalize(searchParams.dateTo)) {
    query.append('created_at', `lte.${normalize(searchParams.dateTo)}T23:59:59.999Z`);
  }

  return { query, page };
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

  if (!requireAdmin(req, res)) return;

  try {
    const config = getSupabaseConfig();
    const url = new URL(req.url, 'http://localhost');
    const exportCsv = normalizeLower(url.searchParams.get('export')) === 'csv';
    const { query, page } = buildQuery(Object.fromEntries(url.searchParams.entries()));
    if (exportCsv) {
      query.delete('offset');
      query.delete('limit');
    }
    const { rows, count } = await fetchRowsWithCount(config, 'customer_orders', query, {
      errorMessage: 'Unable to load orders.',
    });

    if (exportCsv) {
      const csv = listToCsv(rows);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="velure-orders.csv"');
      res.end(csv);
      return;
    }

    sendJson(res, 200, {
      ok: true,
      page,
      pageSize: Number(query.get('limit') || 25),
      total: count,
      orders: rows,
    });
  } catch (error) {
    console.error('Admin orders error:', error);
    sendJson(res, 500, { ok: false, error: 'Unable to load orders.' });
  }
}
