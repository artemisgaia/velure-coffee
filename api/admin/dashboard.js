import {
  fetchAllRows,
  getSupabaseConfig,
  requireAdmin,
  sendJson,
} from '../_admin.js';

const monthBounds = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  return { startIso: start.toISOString() };
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
    const { startIso } = monthBounds();

    const [
      allOrders,
      monthOrders,
      customers,
      pendingReviews,
      rewardsMembers,
      newsletterSubscribers,
      activeProducts,
    ] = await Promise.all([
      fetchAllRows(config, 'customer_orders', new URLSearchParams({
        select: 'id,customer_name,item_preview,total,payment_status,shipping_country,created_at',
        order: 'created_at.desc',
        limit: '10',
      })),
      fetchAllRows(config, 'customer_orders', new URLSearchParams({
        select: 'id,total,payment_status,created_at',
        created_at: `gte.${startIso}`,
      })),
      fetchAllRows(config, 'customer_profiles', new URLSearchParams({ select: 'user_id' })),
      fetchAllRows(config, 'product_reviews', new URLSearchParams({ select: 'id', status: 'eq.pending' })),
      fetchAllRows(config, 'rewards_profiles', new URLSearchParams({ select: 'user_id' })),
      fetchAllRows(config, 'newsletter_subscribers', new URLSearchParams({ select: 'email' })),
      fetchAllRows(config, 'products', new URLSearchParams({ select: 'id', is_active: 'eq.true' })),
    ]);

    const monthSucceededRevenue = monthOrders.reduce((sum, order) => {
      if ((order?.payment_status || '').toLowerCase() !== 'succeeded') return sum;
      return sum + (Number(order?.total) || 0);
    }, 0);

    sendJson(res, 200, {
      ok: true,
      metrics: {
        totalOrders: allOrders.length,
        revenueThisMonth: Number(monthSucceededRevenue.toFixed(2)),
        ordersThisMonth: monthOrders.length,
        totalCustomers: customers.length,
        pendingReviews: pendingReviews.length,
        activeRewardsMembers: rewardsMembers.length,
        newsletterSubscribers: newsletterSubscribers.length,
        activeProducts: activeProducts.length,
      },
      recentOrders: allOrders,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    sendJson(res, 500, { ok: false, error: 'Unable to load dashboard.' });
  }
}
