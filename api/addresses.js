const MAX_RESULTS = 50;

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
    globalThis.process?.env?.ADDRESSES_ALLOWED_ORIGINS
      || globalThis.process?.env?.PROFILE_ALLOWED_ORIGINS
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
      if (data.length > 350_000) {
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

const isValidUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const sanitizeAddressPayload = (value) => {
  const source = value && typeof value === 'object' ? value : {};
  const country = normalize(source.country).toUpperCase();

  const address = {
    label: normalize(source.label).slice(0, 80),
    recipient_name: normalize(source.recipientName || source.recipient_name).slice(0, 120),
    phone: normalize(source.phone).slice(0, 40),
    address_line1: normalize(source.addressLine1 || source.address_line1).slice(0, 120),
    address_line2: normalize(source.addressLine2 || source.address_line2).slice(0, 120),
    city: normalize(source.city).slice(0, 80),
    region: normalize(source.region).slice(0, 80),
    postal_code: normalize(source.postalCode || source.postal_code).slice(0, 32),
    country,
    is_default: toBoolean(source.isDefault ?? source.is_default, false),
  };

  if (!address.address_line1 || !address.city || !address.region || !address.postal_code || !address.country) {
    return { ok: false, error: 'Address line 1, city, region, postal code, and country are required.' };
  }

  if (!/^[A-Z]{2}$/.test(address.country)) {
    return { ok: false, error: 'Country must be an ISO 2-letter code (for example US, CA, GB).' };
  }

  return { ok: true, address };
};

const toApiAddress = (row) => {
  const source = row && typeof row === 'object' ? row : {};
  return {
    id: normalize(source.id),
    label: normalize(source.label),
    recipientName: normalize(source.recipient_name),
    phone: normalize(source.phone),
    addressLine1: normalize(source.address_line1),
    addressLine2: normalize(source.address_line2),
    city: normalize(source.city),
    region: normalize(source.region),
    postalCode: normalize(source.postal_code),
    country: normalize(source.country).toUpperCase(),
    isDefault: Boolean(source.is_default),
    createdAt: normalize(source.created_at),
    updatedAt: normalize(source.updated_at),
  };
};

const getAddresses = async (config, userId, limit) => {
  const safeLimit = Math.max(1, Math.min(MAX_RESULTS, Number(limit) || 20));
  const query = new URLSearchParams({
    user_id: `eq.${userId}`,
    select: 'id,label,recipient_name,phone,address_line1,address_line2,city,region,postal_code,country,is_default,created_at,updated_at',
    order: 'is_default.desc,created_at.desc',
    limit: String(safeLimit),
  });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/customer_addresses?${query.toString()}`, {
    method: 'GET',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, 'Unable to load addresses right now.'));
  }

  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
};

const clearDefaultAddresses = async (config, userId) => {
  const query = new URLSearchParams({
    user_id: `eq.${userId}`,
    is_default: 'eq.true',
  });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/customer_addresses?${query.toString()}`, {
    method: 'PATCH',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ is_default: false }),
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, 'Unable to update default address.'));
  }
};

const createAddress = async (config, userId, address) => {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/customer_addresses?select=id,label,recipient_name,phone,address_line1,address_line2,city,region,postal_code,country,is_default,created_at,updated_at`,
    {
      method: 'POST',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify([{ user_id: userId, ...address }]),
    },
  );

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, 'Unable to save address right now.'));
  }

  const rows = await response.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
};

const updateAddress = async (config, userId, addressId, patch) => {
  const query = new URLSearchParams({
    id: `eq.${addressId}`,
    user_id: `eq.${userId}`,
    select: 'id,label,recipient_name,phone,address_line1,address_line2,city,region,postal_code,country,is_default,created_at,updated_at',
  });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/customer_addresses?${query.toString()}`, {
    method: 'PATCH',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, 'Unable to update address right now.'));
  }

  const rows = await response.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
};

const deleteAddress = async (config, userId, addressId) => {
  const query = new URLSearchParams({
    id: `eq.${addressId}`,
    user_id: `eq.${userId}`,
    select: 'id,is_default',
  });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/customer_addresses?${query.toString()}`, {
    method: 'DELETE',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Prefer: 'return=representation',
    },
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, 'Unable to delete address right now.'));
  }

  const rows = await response.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
};

const setDefaultById = async (config, userId, addressId) => {
  const updated = await updateAddress(config, userId, addressId, { is_default: true });
  return updated;
};

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
    console.error('Addresses API config error:', error);
    sendJson(res, 500, { ok: false, error: 'Address service is not configured.' });
    return;
  }

  const user = await verifyAccessToken(config, accessToken);
  if (!user) {
    sendJson(res, 401, { ok: false, error: 'Invalid access token.' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const urlLimit = new URL(req.url || '', 'http://localhost').searchParams.get('limit');
      const limit = Number(req.query?.limit || urlLimit || 20);
      const rows = await getAddresses(config, user.id, limit);
      sendJson(res, 200, { ok: true, addresses: rows.map(toApiAddress) });
    } catch (error) {
      console.error('Addresses GET error:', error);
      sendJson(res, 502, { ok: false, error: 'Unable to load addresses right now.' });
    }
    return;
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      sendJson(res, 400, { ok: false, error: 'Invalid JSON payload.' });
      return;
    }

    const validation = sanitizeAddressPayload(body.address || body);
    if (!validation.ok) {
      sendJson(res, 422, { ok: false, error: validation.error });
      return;
    }

    try {
      const existingRows = await getAddresses(config, user.id, 1);
      const shouldBeDefault = validation.address.is_default || existingRows.length === 0;
      if (shouldBeDefault) {
        await clearDefaultAddresses(config, user.id);
      }

      const row = await createAddress(config, user.id, {
        ...validation.address,
        is_default: shouldBeDefault,
      });

      sendJson(res, 200, { ok: true, address: toApiAddress(row) });
    } catch (error) {
      console.error('Addresses POST error:', error);
      sendJson(res, 502, { ok: false, error: 'Unable to save address right now.' });
    }
    return;
  }

  if (req.method === 'PUT') {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      sendJson(res, 400, { ok: false, error: 'Invalid JSON payload.' });
      return;
    }

    const addressId = normalize(body.addressId || body.id);
    if (!isValidUuid(addressId)) {
      sendJson(res, 422, { ok: false, error: 'Invalid address id.' });
      return;
    }

    const validation = sanitizeAddressPayload(body.address || body);
    if (!validation.ok) {
      sendJson(res, 422, { ok: false, error: validation.error });
      return;
    }

    try {
      if (validation.address.is_default) {
        await clearDefaultAddresses(config, user.id);
      }
      const row = await updateAddress(config, user.id, addressId, validation.address);
      if (!row) {
        sendJson(res, 404, { ok: false, error: 'Address not found.' });
        return;
      }
      sendJson(res, 200, { ok: true, address: toApiAddress(row) });
    } catch (error) {
      console.error('Addresses PUT error:', error);
      sendJson(res, 502, { ok: false, error: 'Unable to update address right now.' });
    }
    return;
  }

  // DELETE
  const addressId = normalize(req.query?.addressId || req.query?.id || new URL(req.url || '', 'http://localhost').searchParams.get('addressId'));
  if (!isValidUuid(addressId)) {
    sendJson(res, 422, { ok: false, error: 'Invalid address id.' });
    return;
  }

  try {
    const deleted = await deleteAddress(config, user.id, addressId);
    if (!deleted) {
      sendJson(res, 404, { ok: false, error: 'Address not found.' });
      return;
    }

    if (deleted.is_default) {
      const remaining = await getAddresses(config, user.id, 1);
      if (remaining.length > 0) {
        await clearDefaultAddresses(config, user.id);
        await setDefaultById(config, user.id, normalize(remaining[0].id));
      }
    }

    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('Addresses DELETE error:', error);
    sendJson(res, 502, { ok: false, error: 'Unable to delete address right now.' });
  }
}
