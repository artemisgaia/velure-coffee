import {
  fetchRowsWithCount,
  fetchSingleRow,
  getPageParams,
  getSupabaseConfig,
  maybeJsonParse,
  parseBody,
  patchRows,
  requireAdmin,
  sendJson,
} from '../_admin.js';

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeLower = (value) => normalize(value).toLowerCase();

const getTier = (points) => {
  if (points >= 500) return 'Gold';
  if (points >= 250) return 'Silver';
  return 'Bronze';
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

    if (req.method === 'PUT') {
      const body = await parseBody(req, 100_000);
      const userId = normalize(body.userId);
      const pointsDelta = Number(body.pointsDelta) || 0;
      if (!userId || !pointsDelta) {
        sendJson(res, 400, { ok: false, error: 'Missing reward adjustment.' });
        return;
      }
      const existing = await fetchSingleRow(config, 'rewards_profiles', new URLSearchParams({
        user_id: `eq.${userId}`,
        select: 'user_id,email,profile',
        limit: '1',
      }));
      if (!existing) {
        sendJson(res, 404, { ok: false, error: 'Rewards profile not found.' });
        return;
      }
      const profile = maybeJsonParse(existing.profile) || {};
      const points = Math.max(0, (Number(profile.points) || 0) + pointsDelta);
      const lifetimePoints = Math.max(Number(profile.lifetimePoints) || 0, points);
      const nextProfile = {
        ...profile,
        points,
        lifetimePoints,
        tier: getTier(points),
      };
      const updated = await patchRows(config, 'rewards_profiles', new URLSearchParams({
        user_id: `eq.${userId}`,
        select: 'user_id,email,profile,created_at,updated_at',
      }), {
        profile: nextProfile,
      }, {
        errorMessage: 'Unable to update rewards profile.',
      });
      sendJson(res, 200, { ok: true, profile: updated?.[0] || null });
      return;
    }

    const detailUserId = normalize(url.searchParams.get('userId'));
    if (detailUserId) {
      const detail = await fetchSingleRow(config, 'rewards_profiles', new URLSearchParams({
        user_id: `eq.${detailUserId}`,
        select: 'user_id,email,profile,created_at,updated_at',
        limit: '1',
      }), {
        errorMessage: 'Unable to load rewards profile.',
      });
      sendJson(res, 200, { ok: true, profile: detail });
      return;
    }

    const { page, pageSize, from } = getPageParams(Object.fromEntries(url.searchParams.entries()));
    const query = new URLSearchParams({
      select: 'user_id,email,profile,created_at,updated_at',
      order: 'created_at.desc',
      offset: String(from),
      limit: String(pageSize),
    });
    const search = normalizeLower(url.searchParams.get('search'));
    if (search) query.set('email', `ilike.*${search}*`);
    const { rows, count } = await fetchRowsWithCount(config, 'rewards_profiles', query, {
      errorMessage: 'Unable to load rewards profiles.',
    });

    sendJson(res, 200, {
      ok: true,
      page,
      pageSize,
      total: count,
      rewardsProfiles: rows.map((row) => {
        const profile = maybeJsonParse(row.profile) || {};
        const points = Number(profile.points) || 0;
        return {
          ...row,
          points_balance: points,
          tier: normalize(profile.tier) || getTier(points),
        };
      }),
    });
  } catch (error) {
    console.error('Admin rewards error:', error);
    sendJson(res, 500, { ok: false, error: 'Unable to load rewards.' });
  }
}
