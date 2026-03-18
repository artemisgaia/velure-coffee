const STORAGE_KEY = 'velure_supabase_session_v1';
const listeners = new Set();
let pendingEvent = null;

const normalizeLower = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const getConfig = () => {
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (!url || !anonKey) {
    throw new Error('Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  return { url, anonKey };
};

const parseError = (payload, fallbackMessage) => {
  if (!payload || typeof payload !== 'object') return fallbackMessage;
  if (typeof payload.error_description === 'string' && payload.error_description.trim()) return payload.error_description;
  if (typeof payload.msg === 'string' && payload.msg.trim()) return payload.msg;
  if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
  return fallbackMessage;
};

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const isSessionShape = (value) => {
  return Boolean(
    value
      && typeof value === 'object'
      && typeof value.access_token === 'string'
      && typeof value.refresh_token === 'string'
  );
};

const emitAuthEvent = (event, session) => {
  pendingEvent = { event, session };
  listeners.forEach((listener) => {
    try {
      listener(event, session);
    } catch (error) {
      console.error('Auth listener failed', error);
    }
  });
};

const getUrlWithoutHash = () => {
  if (typeof window === 'undefined') return '';
  const query = window.location.search || '';
  return `${window.location.pathname}${query}`;
};

const normalizeSession = (sessionInput) => {
  if (!isSessionShape(sessionInput)) return null;

  const expiresAt = Number(sessionInput.expires_at);
  const expiresIn = Number(sessionInput.expires_in);

  return {
    access_token: sessionInput.access_token,
    refresh_token: sessionInput.refresh_token,
    expires_at: Number.isFinite(expiresAt)
      ? expiresAt
      : (Number.isFinite(expiresIn) ? Math.floor(Date.now() / 1000) + expiresIn : null),
    user: sessionInput.user && typeof sessionInput.user === 'object'
      ? {
          id: typeof sessionInput.user.id === 'string' ? sessionInput.user.id : '',
          email: typeof sessionInput.user.email === 'string' ? sessionInput.user.email : '',
        }
      : null,
  };
};

const readStoredSession = () => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = safeJsonParse(raw);
  return normalizeSession(parsed);
};

const writeStoredSession = (session) => {
  if (typeof window === 'undefined') return;
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

const request = async (path, options = {}) => {
  const { url, anonKey } = getConfig();
  const {
    method = 'GET',
    body,
    accessToken,
  } = options;

  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(parseError(payload, 'Unable to complete auth request.'));
  }

  return payload;
};

const requestRest = async (path, options = {}) => {
  const { url, anonKey } = getConfig();
  const {
    method = 'GET',
    body,
    prefer,
    headers = {},
    returnResponse = false,
  } = options;

  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(prefer ? { Prefer: prefer } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    throw new Error(parseError(payload, 'Unable to complete Supabase request.'));
  }

  if (returnResponse) {
    return response;
  }

  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getCountFromResponse = (response) => {
  const contentRange = response.headers.get('content-range') || '';
  const totalSegment = contentRange.split('/')[1] || '';
  const total = Number(totalSegment);
  return Number.isFinite(total) ? total : 0;
};

export const supabaseRest = {
  async select(table, query = {}, options = {}) {
    const params = query instanceof URLSearchParams ? new URLSearchParams(query) : new URLSearchParams();
    if (!(query instanceof URLSearchParams)) {
      Object.entries(query).forEach(([key, value]) => {
        if (value == null || value === '') return;
        params.set(key, String(value));
      });
    }

    const response = await requestRest(`/rest/v1/${table}?${params.toString()}`, {
      method: 'GET',
      prefer: options.count ? 'count=exact' : '',
      returnResponse: Boolean(options.count),
    });

    if (!options.count) {
      return {
        data: Array.isArray(response) ? response : [],
        count: 0,
      };
    }

    const rows = await response.json().catch(() => []);
    return {
      data: Array.isArray(rows) ? rows : [],
      count: getCountFromResponse(response),
    };
  },

  async upsert(table, rows, conflictColumn, options = {}) {
    const params = new URLSearchParams();
    if (conflictColumn) params.set('on_conflict', conflictColumn);
    params.set('select', options.select || '*');

    const data = await requestRest(`/rest/v1/${table}?${params.toString()}`, {
      method: 'POST',
      body: rows,
      prefer: 'resolution=merge-duplicates,return=representation',
    });

    return Array.isArray(data) ? data : [];
  },

  async update(table, filters, body, options = {}) {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value == null || value === '') return;
      params.set(key, String(value));
    });
    if (!params.has('select')) params.set('select', options.select || '*');

    const data = await requestRest(`/rest/v1/${table}?${params.toString()}`, {
      method: 'PATCH',
      body,
      prefer: 'return=representation',
    });

    return Array.isArray(data) ? data : [];
  },

  async delete(table, filters) {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value == null || value === '') return;
      params.set(key, String(value));
    });

    const data = await requestRest(`/rest/v1/${table}?${params.toString()}`, {
      method: 'DELETE',
      prefer: 'return=representation',
    });

    return Array.isArray(data) ? data : [];
  },
};

const fetchUser = async (accessToken) => {
  if (!accessToken) return null;
  const payload = await request('/auth/v1/user', {
    method: 'GET',
    accessToken,
  });

  if (!payload || typeof payload !== 'object') return null;
  return {
    id: typeof payload.id === 'string' ? payload.id : '',
    email: typeof payload.email === 'string' ? payload.email : '',
  };
};

const parseSessionFromPayload = (payload) => {
  const source = payload?.session && typeof payload.session === 'object'
    ? payload.session
    : payload;

  if (!source || typeof source !== 'object') return null;

  const session = normalizeSession({
    access_token: source.access_token,
    refresh_token: source.refresh_token,
    expires_at: source.expires_at,
    expires_in: source.expires_in,
    user: payload?.user || source.user || null,
  });

  return session;
};

const consumeSessionFromUrl = async () => {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const accessToken = (params.get('access_token') || '').trim();
  const refreshToken = (params.get('refresh_token') || '').trim();

  if (!accessToken || !refreshToken) return null;

  const maybeSession = normalizeSession({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: params.get('expires_at'),
    expires_in: params.get('expires_in'),
    user: null,
  });

  if (!maybeSession) return null;

  const user = await fetchUser(maybeSession.access_token).catch(() => null);
  const resolvedSession = {
    ...maybeSession,
    user,
  };

  writeStoredSession(resolvedSession);

  const eventType = normalizeLower(params.get('type')) === 'recovery' ? 'PASSWORD_RECOVERY' : 'SIGNED_IN';
  emitAuthEvent(eventType, resolvedSession);

  if (typeof window.history?.replaceState === 'function') {
    window.history.replaceState(window.history.state, '', getUrlWithoutHash());
  }

  return resolvedSession;
};

const ensureSessionUser = async (session) => {
  if (!session?.access_token) return null;
  if (session.user?.id) return session;

  const user = await fetchUser(session.access_token).catch(() => null);
  const nextSession = {
    ...session,
    user,
  };

  writeStoredSession(nextSession);
  return nextSession;
};

const auth = {
  async getSession() {
    try {
      const fromUrl = await consumeSessionFromUrl();
      const stored = fromUrl || readStoredSession();
      if (!stored) {
        return { data: { session: null }, error: null };
      }

      const hydrated = await ensureSessionUser(stored);
      return { data: { session: hydrated }, error: null };
    } catch (error) {
      return { data: { session: null }, error };
    }
  },

  onAuthStateChange(callback) {
    if (typeof callback !== 'function') {
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    }

    listeners.add(callback);

    Promise.resolve().then(() => {
      if (pendingEvent) {
        callback(pendingEvent.event, pendingEvent.session);
        pendingEvent = null;
        return;
      }

      callback('INITIAL_SESSION', readStoredSession());
    });

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            listeners.delete(callback);
          },
        },
      },
    };
  },

  async signInWithOtp({ email, options } = {}) {
    try {
      const normalizedEmail = normalizeLower(email);
      await request('/auth/v1/otp', {
        method: 'POST',
        body: {
          email: normalizedEmail,
          create_user: true,
          ...(options?.emailRedirectTo ? { email_redirect_to: options.emailRedirectTo } : {}),
        },
      });
      return { data: { user: null, session: null }, error: null };
    } catch (error) {
      return { data: { user: null, session: null }, error };
    }
  },

  async signInWithPassword({ email, password } = {}) {
    try {
      const normalizedEmail = normalizeLower(email);
      const payload = await request('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: {
          email: normalizedEmail,
          password,
        },
      });

      const session = parseSessionFromPayload(payload);
      if (!session) {
        throw new Error('Unable to start a session. Please try again.');
      }

      const hydratedSession = await ensureSessionUser(session);
      writeStoredSession(hydratedSession);
      emitAuthEvent('SIGNED_IN', hydratedSession);

      return {
        data: {
          user: hydratedSession?.user || null,
          session: hydratedSession,
        },
        error: null,
      };
    } catch (error) {
      return { data: { user: null, session: null }, error };
    }
  },

  async signUp({ email, password, options } = {}) {
    try {
      const normalizedEmail = normalizeLower(email);
      const payload = await request('/auth/v1/signup', {
        method: 'POST',
        body: {
          email: normalizedEmail,
          password,
          ...(options?.emailRedirectTo ? { email_redirect_to: options.emailRedirectTo } : {}),
        },
      });

      const session = parseSessionFromPayload(payload);
      if (!session) {
        return {
          data: {
            user: payload?.user || null,
            session: null,
          },
          error: null,
        };
      }

      const hydratedSession = await ensureSessionUser(session);
      writeStoredSession(hydratedSession);
      emitAuthEvent('SIGNED_IN', hydratedSession);

      return {
        data: {
          user: hydratedSession?.user || payload?.user || null,
          session: hydratedSession,
        },
        error: null,
      };
    } catch (error) {
      return { data: { user: null, session: null }, error };
    }
  },

  async resetPasswordForEmail(email, options = {}) {
    try {
      const normalizedEmail = normalizeLower(email);
      await request('/auth/v1/recover', {
        method: 'POST',
        body: {
          email: normalizedEmail,
          ...(options?.redirectTo ? { redirect_to: options.redirectTo } : {}),
        },
      });
      return { data: {}, error: null };
    } catch (error) {
      return { data: {}, error };
    }
  },

  async getUser(jwt) {
    try {
      const source = jwt || readStoredSession()?.access_token || '';
      if (!source) {
        return { data: { user: null }, error: null };
      }
      const user = await fetchUser(source);
      return { data: { user }, error: null };
    } catch (error) {
      return { data: { user: null }, error };
    }
  },

  async updateUser(attributes = {}) {
    try {
      const session = readStoredSession();
      if (!session?.access_token) {
        throw new Error('Recovery session expired. Request another reset email.');
      }

      const payload = await request('/auth/v1/user', {
        method: 'PUT',
        accessToken: session.access_token,
        body: attributes,
      });

      const nextSession = {
        ...session,
        user: payload?.user && typeof payload.user === 'object'
          ? {
              id: typeof payload.user.id === 'string' ? payload.user.id : session.user?.id || '',
              email: typeof payload.user.email === 'string' ? payload.user.email : session.user?.email || '',
            }
          : session.user,
      };
      writeStoredSession(nextSession);

      return { data: { user: nextSession.user }, error: null };
    } catch (error) {
      return { data: { user: null }, error };
    }
  },

  async signOut() {
    try {
      const currentSession = readStoredSession();
      if (currentSession?.access_token) {
        await request('/auth/v1/logout', {
          method: 'POST',
          accessToken: currentSession.access_token,
        });
      }
    } catch (error) {
      // Ignore network failures on sign out, but still clear local state.
      console.error('Sign-out request failed', error);
    }

    writeStoredSession(null);
    emitAuthEvent('SIGNED_OUT', null);

    return { error: null };
  },
};

export const supabase = { auth };
