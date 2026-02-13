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
    globalThis.process?.env?.PROFILE_ALLOWED_ORIGINS
      || globalThis.process?.env?.ORDERS_ALLOWED_ORIGINS
      || globalThis.process?.env?.REWARDS_ALLOWED_ORIGINS
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
      if (data.length > 300_000) {
        reject(new Error('Payload too large.'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

  return raw ? JSON.parse(raw) : {};
};

const getSupabaseConfig = () => {
  const supabaseUrl = normalize(
    globalThis.process?.env?.SUPABASE_URL
      || globalThis.process?.env?.VITE_SUPABASE_URL
      || '',
  ).replace(/\/+$/, '');
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

const verifyAccessToken = async (config, accessToken) => {
  const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  if (!payload?.id) return null;

  return {
    id: payload.id,
    email: normalizeLower(payload.email),
  };
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
};

const sanitizeProfilePayload = (value, userEmail) => {
  const source = value && typeof value === 'object' ? value : {};
  const nestedMarketing = source.marketingPreferences && typeof source.marketingPreferences === 'object'
    ? source.marketingPreferences
    : {};
  const marketingEmail = toBoolean(
    nestedMarketing.email ?? source.marketingEmail,
    true,
  );
  const marketingSms = toBoolean(
    nestedMarketing.sms ?? source.marketingSms,
    false,
  );

  return {
    full_name: normalize(source.fullName || source.full_name).slice(0, 120),
    phone: normalize(source.phone).slice(0, 40),
    marketing_preferences: {
      email: marketingEmail,
      sms: marketingSms,
    },
    email: normalizeLower(source.email || userEmail).slice(0, 180),
  };
};

const toApiProfile = (row, userEmail) => {
  const source = row && typeof row === 'object' ? row : {};
  const marketing = source.marketing_preferences && typeof source.marketing_preferences === 'object'
    ? source.marketing_preferences
    : {};

  return {
    fullName: normalize(source.full_name),
    phone: normalize(source.phone),
    email: normalizeLower(source.email || userEmail),
    marketingPreferences: {
      email: toBoolean(marketing.email, true),
      sms: toBoolean(marketing.sms, false),
    },
    updatedAt: normalize(source.updated_at),
  };
};

const getProfileRow = async (config, userId) => {
  const query = new URLSearchParams({
    user_id: `eq.${userId}`,
    select: 'user_id,full_name,phone,email,marketing_preferences,updated_at',
    limit: '1',
  });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/customer_profiles?${query.toString()}`, {
    method: 'GET',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, 'Unable to load customer profile.'));
  }

  const rows = await response.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
};

const saveProfileRow = async (config, user, profile) => {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/customer_profiles?on_conflict=user_id&select=user_id,full_name,phone,email,marketing_preferences,updated_at`,
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
          ...profile,
        },
      ]),
    },
  );

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, 'Unable to save customer profile.'));
  }

  const rows = await response.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length === 0) return null;
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
    console.error('Profile API config error:', error);
    sendJson(res, 500, { ok: false, error: 'Customer profile service is not configured.' });
    return;
  }

  const user = await verifyAccessToken(config, accessToken);
  if (!user) {
    sendJson(res, 401, { ok: false, error: 'Invalid access token.' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const row = await getProfileRow(config, user.id);
      sendJson(res, 200, {
        ok: true,
        profile: toApiProfile(row, user.email),
      });
    } catch (error) {
      console.error('Profile GET error:', error);
      sendJson(res, 502, { ok: false, error: 'Unable to load customer profile right now.' });
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

  try {
    const nextProfile = sanitizeProfilePayload(body.profile || body, user.email);
    const row = await saveProfileRow(config, user, nextProfile);
    sendJson(res, 200, {
      ok: true,
      profile: toApiProfile(row || nextProfile, user.email),
    });
  } catch (error) {
    console.error('Profile PUT error:', error);
    sendJson(res, 502, { ok: false, error: 'Unable to save customer profile right now.' });
  }
}
