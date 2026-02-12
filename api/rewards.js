const MAX_HISTORY_ITEMS = 30;
const MAX_DESCRIPTION_LENGTH = 240;
const VALID_REWARD_IDS = new Set(['five_off', 'free_shipping']);

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeLower = (value) => normalize(value).toLowerCase();

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
};

const parseAllowedOrigins = () => {
  const envValue = normalize(
    globalThis.process?.env?.REWARDS_ALLOWED_ORIGINS
      || globalThis.process?.env?.CHECKOUT_ALLOWED_ORIGINS
      || globalThis.process?.env?.FORMS_ALLOWED_ORIGINS
      || '',
  );
  if (!envValue) return [];
  return envValue.split(',').map((value) => normalizeLower(value)).filter(Boolean);
};

const isAllowedOrigin = (req) => {
  const allowedOrigins = parseAllowedOrigins();
  if (!allowedOrigins.length) return true;

  const requestOrigin = normalizeLower(req.headers.origin);
  if (requestOrigin) return allowedOrigins.includes(requestOrigin);

  const referer = normalize(req.headers.referer);
  if (!referer) return false;

  try {
    return allowedOrigins.includes(new URL(referer).origin.toLowerCase());
  } catch {
    return false;
  }
};

const parseBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};

  const raw = await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 500_000) {
        reject(new Error('Payload too large.'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

  return raw ? JSON.parse(raw) : {};
};

const getSupabaseConfig = () => {
  const supabaseUrl = normalize(globalThis.process?.env?.SUPABASE_URL || globalThis.process?.env?.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const anonKey = normalize(globalThis.process?.env?.SUPABASE_ANON_KEY || globalThis.process?.env?.VITE_SUPABASE_ANON_KEY || '');
  const serviceRoleKey = normalize(globalThis.process?.env?.SUPABASE_SERVICE_ROLE_KEY || '');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error('Missing Supabase server configuration.');
  }

  return { supabaseUrl, anonKey, serviceRoleKey };
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

const sanitizeInteger = (value, fallback = 0, min = 0, max = 10_000_000) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
};

const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) return [];
  return history
    .slice(0, MAX_HISTORY_ITEMS)
    .map((entry) => {
      const createdAt = normalize(entry?.createdAt);
      const isoDate = createdAt && !Number.isNaN(Date.parse(createdAt))
        ? new Date(createdAt).toISOString()
        : new Date().toISOString();
      return {
        id: normalize(entry?.id).slice(0, 80) || `rw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: isoDate,
        type: normalize(entry?.type).slice(0, 40) || 'activity',
        description: normalize(entry?.description).slice(0, MAX_DESCRIPTION_LENGTH),
        pointsDelta: sanitizeInteger(entry?.pointsDelta, 0, -100_000, 100_000),
      };
    });
};

const sanitizeRewardsProfile = (value, userEmail) => {
  const profile = value && typeof value === 'object' ? value : {};
  const points = sanitizeInteger(profile.points);
  const lifetimePoints = sanitizeInteger(profile.lifetimePoints, points);
  const activeRewardId = normalizeLower(profile.activeRewardId);

  return {
    enrolled: Boolean(profile.enrolled),
    email: normalize(userEmail || profile.email || '').toLowerCase(),
    points,
    lifetimePoints: Math.max(points, lifetimePoints),
    activeRewardId: VALID_REWARD_IDS.has(activeRewardId) ? activeRewardId : null,
    history: sanitizeHistory(profile.history),
  };
};

const verifyAccessToken = async (config, accessToken) => {
  const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  if (!payload?.id) {
    return null;
  }

  return {
    id: payload.id,
    email: normalize(payload.email).toLowerCase(),
  };
};

const getRewardsProfile = async (config, userId) => {
  const query = new URLSearchParams({
    user_id: `eq.${userId}`,
    select: 'profile,updated_at',
    limit: '1',
  });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/rewards_profiles?${query.toString()}`, {
    method: 'GET',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, 'Unable to load rewards profile.'));
  }

  const rows = await response.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return rows[0];
};

const saveRewardsProfile = async (config, user, profile) => {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/rewards_profiles?on_conflict=user_id&select=profile,updated_at`,
    {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify([
        {
          user_id: user.id,
          email: user.email,
          profile,
        },
      ]),
    },
  );

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, 'Unable to save rewards profile.'));
  }

  const rows = await response.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length === 0) {
    return { profile, updated_at: new Date().toISOString() };
  }

  return rows[0];
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'GET, PUT, OPTIONS');
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT, OPTIONS');
    sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  if (!isAllowedOrigin(req)) {
    sendJson(res, 403, { ok: false, error: 'Origin not allowed.' });
    return;
  }

  const authHeader = normalize(req.headers.authorization);
  const isBearer = authHeader.toLowerCase().startsWith('bearer ');
  const accessToken = isBearer ? normalize(authHeader.slice(7)) : '';

  if (!accessToken) {
    sendJson(res, 401, { ok: false, error: 'Missing access token.' });
    return;
  }

  let config;
  try {
    config = getSupabaseConfig();
  } catch (error) {
    console.error('Rewards API config error:', error);
    sendJson(res, 500, { ok: false, error: 'Rewards service is not configured.' });
    return;
  }

  const user = await verifyAccessToken(config, accessToken);
  if (!user) {
    sendJson(res, 401, { ok: false, error: 'Invalid access token.' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const row = await getRewardsProfile(config, user.id);
      sendJson(res, 200, {
        ok: true,
        profile: row?.profile || null,
        updatedAt: row?.updated_at || null,
      });
    } catch (error) {
      console.error('Rewards profile fetch failed:', error);
      sendJson(res, 502, { ok: false, error: 'Unable to load rewards profile right now.' });
    }
    return;
  }

  let body;
  try {
    body = await parseBody(req);
  } catch {
    sendJson(res, 400, { ok: false, error: 'Invalid JSON payload.' });
    return;
  }

  if (!body || typeof body !== 'object' || !body.profile || typeof body.profile !== 'object') {
    sendJson(res, 422, { ok: false, error: 'A valid profile payload is required.' });
    return;
  }

  const sanitizedProfile = sanitizeRewardsProfile(body.profile, user.email);

  try {
    const saved = await saveRewardsProfile(config, user, sanitizedProfile);
    sendJson(res, 200, {
      ok: true,
      profile: sanitizeRewardsProfile(saved.profile, user.email),
      updatedAt: saved.updated_at || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Rewards profile save failed:', error);
    sendJson(res, 502, { ok: false, error: 'Unable to save rewards profile right now.' });
  }
}
