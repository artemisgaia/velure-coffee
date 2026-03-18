import {
  fetchAllRows,
  fetchRowsWithCount,
  fetchSingleRow,
  getPageParams,
  getSupabaseConfig,
  patchRows,
  parseBody,
  requireAdmin,
  sendJson,
} from '../_admin.js';

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');

const getDetail = async (config, userId) => {
  const [profile, addresses, orders, rewardsProfile] = await Promise.all([
    fetchSingleRow(config, 'customer_profiles', new URLSearchParams({
      user_id: `eq.${userId}`,
      select: 'user_id,full_name,email,phone,marketing_preferences,created_at',
      limit: '1',
    })),
    fetchAllRows(config, 'customer_addresses', new URLSearchParams({
      user_id: `eq.${userId}`,
      select: '*',
      order: 'is_default.desc,created_at.desc',
    })),
    fetchAllRows(config, 'customer_orders', new URLSearchParams({
      user_id: `eq.${userId}`,
      select: 'id,created_at,item_preview,total,payment_status',
      order: 'created_at.desc',
    })),
    fetchSingleRow(config, 'rewards_profiles', new URLSearchParams({
      user_id: `eq.${userId}`,
      select: 'profile,email,created_at,updated_at',
      limit: '1',
    })),
  ]);

  return { profile, addresses, orders, rewardsProfile };
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'GET, PUT, OPTIONS');
    res.end();
    return;
  }

  if (!['GET', 'PUT'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT, OPTIONS');
    sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  if (!requireAdmin(req, res)) return;

  try {
    const config = getSupabaseConfig();
    const url = new URL(req.url, 'http://localhost');
    const detailUserId = normalize(url.searchParams.get('userId'));

    if (req.method === 'PUT') {
      const body = await parseBody(req, 200_000);
      const userId = normalize(body.userId);
      if (!userId) {
        sendJson(res, 400, { ok: false, error: 'Missing customer id.' });
        return;
      }
      const query = new URLSearchParams({
        user_id: `eq.${userId}`,
        select: 'user_id,full_name,email,phone,marketing_preferences,created_at,updated_at',
      });
      const [updated] = await patchRows(config, 'customer_profiles', query, {
        full_name: normalize(body.full_name || body.fullName),
        phone: normalize(body.phone),
        marketing_preferences: body.marketing_preferences || body.marketingPreferences || { email: true, sms: false },
      }, {
        errorMessage: 'Unable to save customer profile.',
      });
      sendJson(res, 200, { ok: true, customer: updated });
      return;
    }

    if (detailUserId) {
      const detail = await getDetail(config, detailUserId);
      sendJson(res, 200, { ok: true, detail });
      return;
    }

    const { page, pageSize, from, to } = getPageParams(Object.fromEntries(url.searchParams.entries()));
    const query = new URLSearchParams({
      select: 'user_id,full_name,email,phone,marketing_preferences,created_at',
      order: 'created_at.desc',
      offset: String(from),
      limit: String(pageSize),
    });
    const search = normalize(url.searchParams.get('search'));
    if (search) {
      query.set('or', `full_name.ilike.*${search}*,email.ilike.*${search}*`);
    }

    const { rows, count } = await fetchRowsWithCount(config, 'customer_profiles', query, {
      errorMessage: 'Unable to load customers.',
    });

    const userIds = rows.map((row) => row.user_id).filter(Boolean);
    const [orders, addresses] = userIds.length
      ? await Promise.all([
          fetchAllRows(config, 'customer_orders', new URLSearchParams({
            user_id: `in.(${userIds.join(',')})`,
            select: 'user_id,total',
          })),
          fetchAllRows(config, 'customer_addresses', new URLSearchParams({
            user_id: `in.(${userIds.join(',')})`,
            select: 'user_id,city,country,is_default,created_at',
            order: 'created_at.desc',
          })),
        ])
      : [[], []];

    const ordersByUser = orders.reduce((accumulator, row) => {
      const entry = accumulator.get(row.user_id) || { orderCount: 0, totalSpent: 0 };
      entry.orderCount += 1;
      entry.totalSpent += Number(row.total) || 0;
      accumulator.set(row.user_id, entry);
      return accumulator;
    }, new Map());

    const addressByUser = addresses.reduce((accumulator, row) => {
      if (!row?.user_id || accumulator.has(row.user_id)) return accumulator;
      accumulator.set(row.user_id, row);
      return accumulator;
    }, new Map());

    sendJson(res, 200, {
      ok: true,
      page,
      pageSize,
      total: count,
      customers: rows.map((row) => {
        const orderStats = ordersByUser.get(row.user_id) || { orderCount: 0, totalSpent: 0 };
        const address = addressByUser.get(row.user_id) || null;
        return {
          ...row,
          total_orders_count: orderStats.orderCount,
          total_spent: Number(orderStats.totalSpent.toFixed(2)),
          default_address_city: address?.city || '',
          default_address_country: address?.country || '',
        };
      }),
    });
  } catch (error) {
    console.error('Admin customers error:', error);
    sendJson(res, 500, { ok: false, error: 'Unable to load customers.' });
  }
}
