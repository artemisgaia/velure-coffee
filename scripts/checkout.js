import { calculatePackageWeightLbs, calculateShippingCents, getDestinationConstraint, SHIPPING_ZONES } from '../shared/shipping.js';

const API_ENDPOINTS = {
  stripeConfig: '/api/stripe-config',
  createPaymentIntent: '/api/create-payment-intent',
  rewards: '/api/rewards',
  orders: '/api/orders',
};

const PRODUCT_CATALOG = {
  fuse: { name: 'FUSE', subtitle: 'Mushroom Fuse Instant Coffee', price: 38 },
  zen: { name: 'ZEN', subtitle: 'Ceremonial Matcha Powder', price: 45 },
  onyx: { name: 'ONYX', subtitle: 'Sweet Brew Instant Coffee', price: 28 },
  vitality: { name: 'VITALITY', subtitle: 'Vitality Mushroom Ground Coffee', price: 36 },
  harvest: { name: 'HARVEST', subtitle: 'Hemp Harvest Ground Coffee', price: 34 },
  aureo: { name: 'AUREO', subtitle: 'Golden Nut Toffee Coffee Beans', price: 26 },
};

const DEFAULT_ZONES = { ...SHIPPING_ZONES };

const DISCOUNT_LABELS = {
  five_off: '$5 rewards credit',
  free_shipping: 'Free shipping reward',
};

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const AUTH_STORAGE_KEY = 'velure_auth_state_v1';
const DEFAULT_AUTH_STATE = { user: null, session: null };
const DEFAULT_REWARDS_PROFILE = {
  enrolled: false,
  points: 0,
  activeRewardId: null,
};

const state = {
  stripe: null,
  elements: null,
  paymentElement: null,
  clientSecret: '',
  paymentIntentId: '',
  mountedSecret: '',
  orderDraftId: '',
  isSubmitting: false,
  refreshTimerId: null,
  requestSequence: 0,
  cartStorageKey: '',
  lineItems: [],
  checkoutConfig: {
    publishableKey: '',
    hasPublishableKey: false,
    shippingZones: { ...DEFAULT_ZONES },
    taxRates: {},
    defaultTaxRate: 0,
    defaultCountry: 'US',
  },
  totals: {
    subtotal: 0,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 0,
  },
  auth: { ...DEFAULT_AUTH_STATE },
  rewards: { ...DEFAULT_REWARDS_PROFILE },
  activeAuthTab: 'signin',
};

const dom = {
  form: document.getElementById('checkout-form'),
  notice: document.getElementById('checkout-notice'),
  authSignedIn: document.getElementById('auth-signed-in'),
  authEmailDisplay: document.getElementById('auth-email-display'),
  authSignOut: document.getElementById('auth-signout'),
  authGuest: document.getElementById('auth-guest'),
  authStatus: document.getElementById('auth-status'),
  authTabSignIn: document.getElementById('auth-tab-signin'),
  authTabSignUp: document.getElementById('auth-tab-signup'),
  authPaneSignIn: document.getElementById('auth-pane-signin'),
  authPaneSignUp: document.getElementById('auth-pane-signup'),
  authSignInEmail: document.getElementById('auth-signin-email'),
  authSignInPassword: document.getElementById('auth-signin-password'),
  authSignInSubmit: document.getElementById('auth-signin-submit'),
  authSignUpEmail: document.getElementById('auth-signup-email'),
  authSignUpPassword: document.getElementById('auth-signup-password'),
  authSignUpConfirm: document.getElementById('auth-signup-confirm'),
  authSignUpSubmit: document.getElementById('auth-signup-submit'),
  customerName: document.getElementById('customer-name'),
  customerEmail: document.getElementById('customer-email'),
  enablePhone: document.getElementById('enable-phone'),
  phoneWrap: document.getElementById('phone-wrap'),
  customerPhone: document.getElementById('customer-phone'),
  shippingCountry: document.getElementById('shipping-country'),
  shippingService: document.getElementById('shipping-service'),
  shippingAddress1: document.getElementById('shipping-address1'),
  enableAddress2: document.getElementById('enable-address2'),
  address2Wrap: document.getElementById('address2-wrap'),
  shippingAddress2: document.getElementById('shipping-address2'),
  shippingCity: document.getElementById('shipping-city'),
  shippingRegion: document.getElementById('shipping-region'),
  shippingPostal: document.getElementById('shipping-postal'),
  postalLabel: document.getElementById('postal-label'),
  discountBlock: document.getElementById('discount-block'),
  discountCode: document.getElementById('discount-code'),
  paymentElement: document.getElementById('payment-element'),
  lineItems: document.getElementById('line-items'),
  subtotalValue: document.getElementById('subtotal-value'),
  discountValue: document.getElementById('discount-value'),
  shippingValue: document.getElementById('shipping-value'),
  taxValue: document.getElementById('tax-value'),
  totalValue: document.getElementById('total-value'),
  mobileTotalValue: document.getElementById('mobile-total-value'),
  shippingEstimate: document.getElementById('shipping-estimate'),
  payDesktop: document.getElementById('pay-button-desktop'),
  payMobile: document.getElementById('pay-button-mobile'),
};

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeLower = (value) => normalize(value).toLowerCase();
const cents = (amount) => Math.round(Number(amount || 0) * 100);

const money = (amount) => currencyFormatter.format(Number(amount || 0));
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const normalizeAuthState = (value) => {
  if (!value || typeof value !== 'object') return { ...DEFAULT_AUTH_STATE };

  const session = value.session && typeof value.session === 'object'
    ? {
        accessToken: normalize(value.session.accessToken),
        refreshToken: normalize(value.session.refreshToken),
        expiresAt: Number.isFinite(Number(value.session.expiresAt)) ? Number(value.session.expiresAt) : 0,
      }
    : null;

  const user = value.user && typeof value.user === 'object'
    ? {
        id: normalize(value.user.id),
        email: normalizeLower(value.user.email),
      }
    : null;

  if (!session?.accessToken || !user?.id) {
    return { ...DEFAULT_AUTH_STATE };
  }

  return { session, user };
};

const saveAuthState = () => {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state.auth));
  } catch {
    // ignore
  }
};

const loadAuthState = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    state.auth = normalizeAuthState(raw ? JSON.parse(raw) : DEFAULT_AUTH_STATE);
  } catch {
    state.auth = { ...DEFAULT_AUTH_STATE };
  }
};

const getSupabaseConfig = () => {
  const url = normalize(import.meta.env.VITE_SUPABASE_URL).replace(/\/+$/, '');
  const anonKey = normalize(import.meta.env.VITE_SUPABASE_ANON_KEY);
  if (!url || !anonKey) return null;
  return { url, anonKey };
};

const parseSupabaseError = (payload, fallbackMessage) => {
  if (!payload || typeof payload !== 'object') return fallbackMessage;
  if (typeof payload.error_description === 'string' && payload.error_description.trim()) return payload.error_description;
  if (typeof payload.msg === 'string' && payload.msg.trim()) return payload.msg;
  if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
  return fallbackMessage;
};

const supabaseRequest = async (path, options = {}) => {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error('Account auth is not configured yet.');
  }

  const response = await fetch(`${config.url}${path}`, {
    method: options.method || 'GET',
    headers: {
      apikey: config.anonKey,
      'Content-Type': 'application/json',
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(parseSupabaseError(payload, 'Unable to complete auth request.'));
  }
  return payload;
};

const createSessionFromSupabasePayload = (payload) => {
  const source = payload?.session && typeof payload.session === 'object'
    ? payload.session
    : payload;
  const accessToken = normalize(source?.access_token);
  const refreshToken = normalize(source?.refresh_token);
  const expiresAtSeconds = Number(source?.expires_at);
  const expiresInSeconds = Number(source?.expires_in);
  const expiresAt = Number.isFinite(expiresAtSeconds)
    ? expiresAtSeconds * 1000
    : (Number.isFinite(expiresInSeconds) ? Date.now() + (expiresInSeconds * 1000) : 0);

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken, expiresAt };
};

const supabaseSignIn = async (email, password) => {
  const payload = await supabaseRequest('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
  return {
    session: createSessionFromSupabasePayload(payload),
    user: payload?.user || null,
  };
};

const supabaseSignUp = async (email, password) => {
  const payload = await supabaseRequest('/auth/v1/signup', {
    method: 'POST',
    body: { email, password },
  });
  return {
    session: createSessionFromSupabasePayload(payload),
    user: payload?.user || payload?.session?.user || null,
  };
};

const supabaseRefreshSession = async (refreshToken) => {
  const payload = await supabaseRequest('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: { refresh_token: refreshToken },
  });
  return {
    session: createSessionFromSupabasePayload(payload),
    user: payload?.user || null,
  };
};

const supabaseGetUser = async (accessToken) => {
  const payload = await supabaseRequest('/auth/v1/user', { method: 'GET', accessToken });
  return payload && typeof payload === 'object' ? payload : null;
};

const supabaseSignOut = async (accessToken) => {
  await supabaseRequest('/auth/v1/logout', { method: 'POST', accessToken });
};

const setAuthStatus = (message, type = 'info') => {
  if (!dom.authStatus) return;
  dom.authStatus.textContent = message || '';
  dom.authStatus.style.color = type === 'error'
    ? '#ffd7d5'
    : (type === 'success' ? '#d2f3e2' : '#c8bfac');
};

const isSignedIn = () => Boolean(state.auth.user?.id && state.auth.session?.accessToken);

const getAppliedDiscountCode = () => {
  if (!isSignedIn()) return '';
  return normalizeLower(dom.discountCode.value);
};

const applyAuthUi = () => {
  const signedIn = isSignedIn();
  if (dom.authSignedIn) dom.authSignedIn.classList.toggle('hidden', !signedIn);
  if (dom.authGuest) dom.authGuest.classList.toggle('hidden', signedIn);
  if (dom.discountBlock) dom.discountBlock.classList.toggle('hidden', !signedIn);

  if (dom.authEmailDisplay) {
    dom.authEmailDisplay.textContent = state.auth.user?.email || '';
  }

  if (signedIn && !normalize(dom.customerEmail.value) && state.auth.user?.email) {
    dom.customerEmail.value = state.auth.user.email;
  }

  dom.discountCode.innerHTML = '';
  const noneOption = document.createElement('option');
  noneOption.value = '';
  noneOption.textContent = 'No discount';
  dom.discountCode.appendChild(noneOption);

  if (!signedIn) {
    dom.discountCode.value = '';
    return;
  }

  const enrolled = Boolean(state.rewards.enrolled);
  const activeRewardId = normalizeLower(state.rewards.activeRewardId || '');
  if (enrolled && activeRewardId && DISCOUNT_LABELS[activeRewardId]) {
    const option = document.createElement('option');
    option.value = activeRewardId;
    option.textContent = DISCOUNT_LABELS[activeRewardId];
    dom.discountCode.appendChild(option);
    dom.discountCode.value = activeRewardId;
  } else {
    dom.discountCode.value = '';
  }
};

const switchAuthTab = (tab) => {
  state.activeAuthTab = tab === 'signup' ? 'signup' : 'signin';
  const isSignIn = state.activeAuthTab === 'signin';
  dom.authPaneSignIn.classList.toggle('hidden', !isSignIn);
  dom.authPaneSignUp.classList.toggle('hidden', isSignIn);
  dom.authTabSignIn.classList.toggle('auth-tab--active', isSignIn);
  dom.authTabSignUp.classList.toggle('auth-tab--active', !isSignIn);
  dom.authTabSignIn.setAttribute('aria-selected', isSignIn ? 'true' : 'false');
  dom.authTabSignUp.setAttribute('aria-selected', isSignIn ? 'false' : 'true');
  setAuthStatus('');
};

const loadRewardsProfile = async () => {
  if (!isSignedIn()) {
    state.rewards = { ...DEFAULT_REWARDS_PROFILE };
    applyAuthUi();
    return;
  }

  try {
    const response = await fetch(API_ENDPOINTS.rewards, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${state.auth.session.accessToken}`,
      },
      credentials: 'same-origin',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.ok) {
      state.rewards = { ...DEFAULT_REWARDS_PROFILE };
      applyAuthUi();
      return;
    }

    const profile = payload.profile && typeof payload.profile === 'object' ? payload.profile : {};
    state.rewards = {
      enrolled: Boolean(profile.enrolled),
      points: Number.isFinite(Number(profile.points)) ? Math.max(0, Math.floor(Number(profile.points))) : 0,
      activeRewardId: typeof profile.activeRewardId === 'string' ? normalizeLower(profile.activeRewardId) : null,
    };
  } catch {
    state.rewards = { ...DEFAULT_REWARDS_PROFILE };
  }

  if (!state.rewards.enrolled) {
    setAuthStatus('Signed in. Join rewards in your account to unlock redemption.', 'info');
  } else if (!state.rewards.activeRewardId) {
    setAuthStatus('Signed in. Redeem a reward in your account to apply it at checkout.', 'info');
  }

  applyAuthUi();
};

const hydrateAuthSession = async () => {
  loadAuthState();
  if (!isSignedIn()) {
    applyAuthUi();
    return;
  }

  try {
    let { session, user } = state.auth;
    const shouldRefresh = session.expiresAt && session.expiresAt <= Date.now() + 60_000;
    if (shouldRefresh && session.refreshToken) {
      const refreshed = await supabaseRefreshSession(session.refreshToken);
      if (refreshed.session) {
        session = refreshed.session;
        user = refreshed.user || user;
      }
    }

    if (!user?.id) {
      const fetchedUser = await supabaseGetUser(session.accessToken);
      user = fetchedUser ? { id: fetchedUser.id, email: fetchedUser.email || '' } : null;
    }

    if (!user?.id || !session?.accessToken) {
      state.auth = { ...DEFAULT_AUTH_STATE };
      saveAuthState();
      applyAuthUi();
      return;
    }

    state.auth = {
      session,
      user: {
        id: normalize(user.id),
        email: normalizeLower(user.email),
      },
    };
    saveAuthState();
    applyAuthUi();
  } catch {
    state.auth = { ...DEFAULT_AUTH_STATE };
    saveAuthState();
    applyAuthUi();
  }
};

const saveOrderToAccount = async (paymentIntentId) => {
  if (!paymentIntentId || !isSignedIn()) return;
  try {
    await fetch(API_ENDPOINTS.orders, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.auth.session.accessToken}`,
      },
      credentials: 'same-origin',
      body: JSON.stringify({ paymentIntentId }),
    });
  } catch {
    // Do not block checkout success UI if order sync fails.
  }
};

const setNotice = (type, message) => {
  dom.notice.className = `notice notice--${type}`;
  dom.notice.textContent = message;
  dom.notice.setAttribute('role', type === 'error' ? 'alert' : 'status');
};

const setPostalLabel = (countryCode) => {
  dom.postalLabel.textContent = countryCode === 'US' ? 'ZIP code' : 'Postal code';
};

const setPayDisabled = (disabled) => {
  dom.payDesktop.disabled = disabled;
  dom.payMobile.disabled = disabled;
};

const setSubmittingState = (isSubmitting) => {
  state.isSubmitting = isSubmitting;
  setPayDisabled(isSubmitting || state.lineItems.length === 0);
  dom.payDesktop.textContent = isSubmitting ? 'Processing...' : 'Pay Securely';
  dom.payMobile.textContent = isSubmitting ? 'Processing...' : 'Pay Securely';
};

const parseCartStorage = () => {
  const keys = Object.keys(localStorage).filter((key) => key.startsWith('velure_cart_'));
  const candidates = [];

  for (const key of keys) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        candidates.push({ key, items: parsed });
      }
    } catch {
      // Ignore malformed storage entries.
    }
  }

  candidates.sort((a, b) => b.items.length - a.items.length);
  return candidates[0] || { key: '', items: [] };
};

const aggregateLineItems = (rawItems) => {
  const quantities = new Map();
  for (const item of rawItems) {
    const productId = normalizeLower(item?.id);
    if (!PRODUCT_CATALOG[productId]) continue;
    quantities.set(productId, (quantities.get(productId) || 0) + 1);
  }

  return Array.from(quantities.entries()).map(([productId, quantity]) => ({ productId, quantity }));
};

const renderLineItems = () => {
  dom.lineItems.innerHTML = '';

  if (!state.lineItems.length) {
    const emptyItem = document.createElement('li');
    emptyItem.innerHTML = '<div><strong>Cart is empty</strong><div class="item-meta">Add coffee products before checkout.</div></div><div>$0.00</div>';
    dom.lineItems.appendChild(emptyItem);
    return;
  }

  for (const item of state.lineItems) {
    const product = PRODUCT_CATALOG[item.productId];
    const line = document.createElement('li');
    const lineTotal = product.price * item.quantity;

    line.innerHTML = `
      <div>
        <strong>${product.name}</strong>
        <div class="item-meta">${product.subtitle}</div>
        <div class="item-meta">Qty ${item.quantity}</div>
      </div>
      <div>${money(lineTotal)}</div>
    `;
    dom.lineItems.appendChild(line);
  }
};

const renderTotals = () => {
  dom.subtotalValue.textContent = money(state.totals.subtotal);
  dom.discountValue.textContent = money(-Math.abs(state.totals.discount));
  dom.shippingValue.textContent = money(state.totals.shipping);
  dom.taxValue.textContent = money(state.totals.tax);
  dom.totalValue.textContent = money(state.totals.total);
  dom.mobileTotalValue.textContent = money(state.totals.total);
};

const selectedCountry = () => normalize(dom.shippingCountry.value).toUpperCase();
const selectedService = () => normalizeLower(dom.shippingService.value || 'standard');
const selectedDiscount = () => getAppliedDiscountCode();

const getTaxRate = (countryCode) => {
  const rate = Number(state.checkoutConfig.taxRates?.[countryCode]);
  if (Number.isFinite(rate) && rate >= 0 && rate <= 1) return rate;
  const fallback = Number(state.checkoutConfig.defaultTaxRate);
  if (Number.isFinite(fallback) && fallback >= 0 && fallback <= 1) return fallback;
  return 0;
};

const estimateClientTotals = () => {
  const subtotalCents = state.lineItems.reduce((sum, item) => {
    return sum + (cents(PRODUCT_CATALOG[item.productId].price) * item.quantity);
  }, 0);

  const country = selectedCountry();
  const packageWeightLbs = calculatePackageWeightLbs(state.lineItems);
  const shippingQuote = calculateShippingCents({
    countryCode: country,
    packageWeightLbs,
    service: selectedService(),
  });
  let shippingCents = shippingQuote.ok ? shippingQuote.shippingCents : 0;

  let discountCents = 0;
  if (selectedDiscount() === 'five_off') {
    discountCents = Math.min(500, subtotalCents);
  }
  if (selectedDiscount() === 'free_shipping') {
    shippingCents = 0;
  }

  const taxRate = getTaxRate(country);
  const taxableBase = Math.max(0, subtotalCents - discountCents + shippingCents);
  const taxCents = Math.round(taxableBase * taxRate);
  const totalCents = subtotalCents - discountCents + shippingCents + taxCents;

  state.totals = {
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    shipping: shippingCents / 100,
    tax: taxCents / 100,
    total: totalCents / 100,
  };
  renderTotals();
};

const getClientConstraint = () => {
  if (!state.lineItems.length) {
    return {
      blocked: true,
      type: 'warning',
      code: 'empty_cart',
      message: 'Your cart is empty. Add coffee products to continue.',
    };
  }

  const country = selectedCountry();
  const zone = state.checkoutConfig.shippingZones[country];
  if (!zone) {
    return {
      blocked: true,
      type: 'error',
      code: 'unsupported_destination',
      message: 'This destination is not currently supported for shipping.',
    };
  }

  if (!zone.services?.[selectedService()]) {
    return {
      blocked: true,
      type: 'error',
      code: 'invalid_shipping_service',
      message: 'Selected shipping service is unavailable for this destination.',
    };
  }

  const destinationConstraint = getDestinationConstraint({
    countryCode: country,
    region: normalize(dom.shippingRegion.value),
    address1: normalize(dom.shippingAddress1.value),
  });
  if (!destinationConstraint.ok) {
    return {
      blocked: true,
      type: destinationConstraint.severity === 'warning' ? 'warning' : 'error',
      code: destinationConstraint.code,
      message: destinationConstraint.message,
    };
  }

  return { blocked: false, type: 'success', code: 'ok', message: 'Destination and cart are eligible for checkout.' };
};

const updateShippingEstimate = () => {
  const country = selectedCountry();
  const zone = state.checkoutConfig.shippingZones[country];
  const service = zone?.services?.[selectedService()];
  const packageWeightLbs = calculatePackageWeightLbs(state.lineItems);
  const shippingQuote = calculateShippingCents({
    countryCode: country,
    packageWeightLbs,
    service: selectedService(),
  });

  if (!zone) {
    dom.shippingEstimate.textContent = state.checkoutConfig.unsupportedMessage || 'Shipping is unavailable to this country.';
    return;
  }

  const destinationConstraint = getDestinationConstraint({
    countryCode: country,
    region: normalize(dom.shippingRegion.value),
    address1: normalize(dom.shippingAddress1.value),
  });
  if (!destinationConstraint.ok) {
    dom.shippingEstimate.textContent = destinationConstraint.message;
    return;
  }

  if (service && shippingQuote.ok) {
    dom.shippingEstimate.textContent = `${service.label} • ${money(shippingQuote.shippingCents / 100)} estimated shipping at ${packageWeightLbs.toFixed(2)} lb package weight.`;
    return;
  }

  dom.shippingEstimate.textContent = 'Shipping estimate updates with your destination.';
};

const populateCountryOptions = () => {
  const zones = state.checkoutConfig.shippingZones;
  const allCodes = Object.keys(zones);

  dom.shippingCountry.innerHTML = '';
  for (const countryCode of allCodes) {
    const option = document.createElement('option');
    option.value = countryCode;
    option.textContent = zones[countryCode]?.label || countryCode;
    dom.shippingCountry.appendChild(option);
  }

  const preferred = state.checkoutConfig.defaultCountry || 'US';
  dom.shippingCountry.value = allCodes.includes(preferred) ? preferred : allCodes[0] || 'US';
  setPostalLabel(dom.shippingCountry.value);
};

const populateServiceOptions = () => {
  const country = selectedCountry();
  const zone = state.checkoutConfig.shippingZones[country];
  dom.shippingService.innerHTML = '';

  if (!zone) {
    const option = document.createElement('option');
    option.value = 'standard';
    option.textContent = 'Unavailable';
    dom.shippingService.appendChild(option);
    dom.shippingService.disabled = true;
    return;
  }

  const services = Object.entries(zone.services || {});
  for (const [serviceKey, serviceConfig] of services) {
    const option = document.createElement('option');
    option.value = serviceKey;
    option.textContent = serviceConfig.label || serviceKey;
    dom.shippingService.appendChild(option);
  }

  dom.shippingService.disabled = false;
  dom.shippingService.value = services[0]?.[0] || 'standard';
};

const collectCheckoutPayload = () => {
  return {
    paymentIntentId: state.paymentIntentId || undefined,
    existingClientSecret: state.clientSecret || undefined,
    orderDraftId: state.orderDraftId || undefined,
    items: state.lineItems,
    discountCode: selectedDiscount() || undefined,
    customer: {
      userId: state.auth.user?.id || '',
      name: normalize(dom.customerName.value),
      email: normalize(dom.customerEmail.value).toLowerCase(),
      phone: dom.enablePhone.checked ? normalize(dom.customerPhone.value) : '',
    },
    shipping: {
      country: selectedCountry(),
      service: selectedService(),
      address1: normalize(dom.shippingAddress1.value),
      address2: normalize(dom.shippingAddress2.value),
      city: normalize(dom.shippingCity.value),
      region: normalize(dom.shippingRegion.value),
      postalCode: normalize(dom.shippingPostal.value),
    },
  };
};

const ensurePaymentElement = async (clientSecret) => {
  if (!state.checkoutConfig.hasPublishableKey || !clientSecret) return;
  if (!window.Stripe || typeof window.Stripe !== 'function') {
    throw new Error('Stripe SDK did not load.');
  }

  if (!state.stripe) {
    state.stripe = window.Stripe(state.checkoutConfig.publishableKey);
  }

  if (!state.stripe) {
    throw new Error('Stripe initialization failed.');
  }

  if (state.mountedSecret === clientSecret && state.paymentElement && state.elements) {
    return;
  }

  if (state.paymentElement) {
    state.paymentElement.unmount();
    state.paymentElement = null;
  }

  state.elements = state.stripe.elements({
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#d4af37',
        colorText: '#0b0c0c',
        borderRadius: '8px',
      },
      rules: {
        '.Input': {
          borderColor: '#c9c2b5',
          boxShadow: 'none',
        },
      },
    },
  });

  state.paymentElement = state.elements.create('payment', {
    layout: {
      type: 'tabs',
      defaultCollapsed: false,
      radios: true,
      spacedAccordionItems: true,
    },
  });
  state.paymentElement.mount(dom.paymentElement);
  state.mountedSecret = clientSecret;
};

const refreshPaymentIntent = async () => {
  const constraint = getClientConstraint();
  if (constraint.blocked) {
    setPayDisabled(true);
    setNotice(constraint.type, constraint.message);
    return false;
  }

  const payload = collectCheckoutPayload();
  const currentSequence = ++state.requestSequence;
  setSubmittingState(true);

  try {
    const response = await fetch(API_ENDPOINTS.createPaymentIntent, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(isSignedIn() ? { Authorization: `Bearer ${state.auth.session.accessToken}` } : {}),
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (currentSequence !== state.requestSequence) return false;

    if (!response.ok) {
      const message = normalize(data?.error) || 'Could not refresh secure payment right now.';
      const noticeType = data?.constraint?.severity === 'warning' ? 'warning' : 'error';
      setNotice(noticeType, message);
      setPayDisabled(true);
      return false;
    }

    state.paymentIntentId = normalize(data.paymentIntentId);
    state.clientSecret = normalize(data.clientSecret);
    state.orderDraftId = normalize(data.orderDraftId);
    state.totals = {
      subtotal: Number(data?.totals?.subtotal || 0),
      discount: Number(data?.totals?.discount || 0),
      shipping: Number(data?.totals?.shipping || 0),
      tax: Number(data?.totals?.tax || 0),
      total: Number(data?.totals?.total || 0),
    };
    renderTotals();
    await ensurePaymentElement(state.clientSecret);

    const discountCopy = selectedDiscount() ? ` (${DISCOUNT_LABELS[selectedDiscount()] || 'discount applied'})` : '';
    setNotice('success', `Secure payment is ready${discountCopy}.`);
    setPayDisabled(false);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout setup failed.';
    setNotice('error', message);
    setPayDisabled(true);
    return false;
  } finally {
    setSubmittingState(false);
  }
};

const scheduleRefresh = (delayMs = 320) => {
  if (state.refreshTimerId) {
    window.clearTimeout(state.refreshTimerId);
  }
  state.refreshTimerId = window.setTimeout(() => {
    state.refreshTimerId = null;
    refreshPaymentIntent();
  }, delayMs);
};

const clearCartStorage = () => {
  if (!state.cartStorageKey) return;
  try {
    localStorage.setItem(state.cartStorageKey, JSON.stringify([]));
  } catch {
    // Ignore storage failures.
  }
};

const handlePostPaymentStatus = async (paymentIntent) => {
  const status = normalize(paymentIntent?.status);

  if (status === 'succeeded') {
    await saveOrderToAccount(normalize(paymentIntent?.id));
    setNotice('success', 'Payment confirmed. Your order is complete.');
    clearCartStorage();
    state.lineItems = [];
    renderLineItems();
    estimateClientTotals();
    setPayDisabled(true);
    return;
  }

  if (status === 'processing') {
    await saveOrderToAccount(normalize(paymentIntent?.id));
    setNotice('info', 'Payment is processing. We will email your receipt shortly.');
    return;
  }

  if (status === 'requires_payment_method') {
    setNotice('error', 'Payment was not completed. Try another method.');
    return;
  }

  setNotice('info', 'Payment update received. Please check your email for confirmation.');
};

const submitCheckout = async (event) => {
  event.preventDefault();

  if (state.isSubmitting) return;

  const constraint = getClientConstraint();
  if (constraint.blocked) {
    setNotice(constraint.type, constraint.message);
    setPayDisabled(true);
    return;
  }

  if (!dom.form.reportValidity()) {
    setNotice('warning', 'Please complete all required checkout fields.');
    return;
  }

  if (!state.clientSecret || !state.paymentElement || !state.elements) {
    const ready = await refreshPaymentIntent();
    if (!ready) return;
  }

  if (!state.stripe || !state.elements) {
    setNotice('error', 'Secure payment failed to initialize.');
    return;
  }

  setSubmittingState(true);
  setNotice('info', 'Confirming payment...');

  try {
    const result = await state.stripe.confirmPayment({
      elements: state.elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/checkout.html`,
      },
    });

    if (result.error) {
      setNotice('error', normalize(result.error.message) || 'Payment failed. Please try again.');
      return;
    }

    await handlePostPaymentStatus(result.paymentIntent);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed unexpectedly.';
    setNotice('error', message);
  } finally {
    setSubmittingState(false);
  }
};

const handleReturnQuery = async () => {
  const params = new URLSearchParams(window.location.search);
  const status = normalizeLower(params.get('redirect_status'));
  const paymentIntentId = normalize(params.get('payment_intent'));
  if (!status) return;

  if ((status === 'succeeded' || status === 'processing') && paymentIntentId) {
    await saveOrderToAccount(paymentIntentId);
  }

  if (status === 'succeeded') {
    setNotice('success', 'Payment confirmed. Thank you for your Velure order.');
  } else if (status === 'failed') {
    setNotice('error', 'Payment failed. Please try another payment method.');
  } else if (status === 'processing') {
    setNotice('info', 'Payment is processing. Confirmation email will follow.');
  }
};

const applyConstraintNotice = () => {
  const constraint = getClientConstraint();
  if (constraint.blocked) {
    setNotice(constraint.type, constraint.message);
    setPayDisabled(true);
    return false;
  }

  setNotice('info', 'Checkout details updated.');
  return true;
};

const loadStripeConfig = async () => {
  const response = await fetch(API_ENDPOINTS.stripeConfig, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(normalize(data?.error) || 'Unable to load Stripe configuration.');
  }

  state.checkoutConfig = {
    publishableKey: normalize(data.publishableKey),
    hasPublishableKey: Boolean(data.hasPublishableKey && data.publishableKey),
    shippingZones: data.shippingZones && typeof data.shippingZones === 'object'
      ? data.shippingZones
      : { ...DEFAULT_ZONES },
    taxRates: data.taxRates && typeof data.taxRates === 'object' ? data.taxRates : {},
    defaultTaxRate: Number(data.defaultTaxRate) || 0,
    defaultCountry: normalize(data.defaultCountry).toUpperCase() || 'US',
    quoteMessage: normalize(data.quoteMessage),
    unsupportedMessage: normalize(data.unsupportedMessage),
  };
};

const setAuthSubmitting = (isSubmitting) => {
  dom.authSignInSubmit.disabled = isSubmitting;
  dom.authSignUpSubmit.disabled = isSubmitting;
  dom.authSignOut.disabled = isSubmitting;
};

const handleAuthSignIn = async () => {
  const email = normalizeLower(dom.authSignInEmail.value);
  const password = normalize(dom.authSignInPassword.value);

  if (!isValidEmail(email) || password.length < 8) {
    setAuthStatus('Enter a valid email and password (8+ characters).', 'error');
    return;
  }

  setAuthSubmitting(true);
  setAuthStatus('Signing in...', 'info');
  try {
    const result = await supabaseSignIn(email, password);
    if (!result.session?.accessToken) {
      throw new Error('Could not start account session.');
    }

    let user = result.user;
    if (!user?.id) {
      user = await supabaseGetUser(result.session.accessToken);
    }
    if (!user?.id) {
      throw new Error('Unable to load account profile.');
    }

    state.auth = {
      session: result.session,
      user: {
        id: normalize(user.id),
        email: normalizeLower(user.email || email),
      },
    };
    saveAuthState();
    await loadRewardsProfile();
    applyAuthUi();
    setAuthStatus('Signed in. Account rewards are now available.', 'success');
    estimateClientTotals();
    scheduleRefresh(120);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to sign in right now.';
    setAuthStatus(message, 'error');
  } finally {
    setAuthSubmitting(false);
  }
};

const handleAuthSignUp = async () => {
  const email = normalizeLower(dom.authSignUpEmail.value);
  const password = normalize(dom.authSignUpPassword.value);
  const confirmPassword = normalize(dom.authSignUpConfirm.value);

  if (!isValidEmail(email)) {
    setAuthStatus('Enter a valid email address.', 'error');
    return;
  }
  if (password.length < 8) {
    setAuthStatus('Password must be at least 8 characters.', 'error');
    return;
  }
  if (password !== confirmPassword) {
    setAuthStatus('Password confirmation does not match.', 'error');
    return;
  }

  setAuthSubmitting(true);
  setAuthStatus('Creating account...', 'info');
  try {
    const result = await supabaseSignUp(email, password);
    if (result.session?.accessToken) {
      let user = result.user;
      if (!user?.id) {
        user = await supabaseGetUser(result.session.accessToken);
      }
      if (!user?.id) {
        throw new Error('Account created, but profile loading failed.');
      }

      state.auth = {
        session: result.session,
        user: {
          id: normalize(user.id),
          email: normalizeLower(user.email || email),
        },
      };
      saveAuthState();
      await loadRewardsProfile();
      applyAuthUi();
      setAuthStatus('Account created and signed in.', 'success');
      estimateClientTotals();
      scheduleRefresh(120);
      return;
    }

    setAuthStatus('Account created. Confirm your email, then sign in.', 'success');
    switchAuthTab('signin');
    dom.authSignInEmail.value = email;
    dom.authSignInPassword.value = '';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create account right now.';
    setAuthStatus(message, 'error');
  } finally {
    setAuthSubmitting(false);
  }
};

const handleAuthSignOut = async () => {
  setAuthSubmitting(true);
  setAuthStatus('Signing out...', 'info');

  try {
    const token = normalize(state.auth.session?.accessToken);
    if (token) {
      await supabaseSignOut(token);
    }
  } catch {
    // Ignore signout transport errors.
  } finally {
    state.auth = { ...DEFAULT_AUTH_STATE };
    state.rewards = { ...DEFAULT_REWARDS_PROFILE };
    saveAuthState();
    applyAuthUi();
    setAuthStatus('Signed out. Guest checkout is still available.', 'success');
    estimateClientTotals();
    scheduleRefresh(120);
    setAuthSubmitting(false);
  }
};

const bindEvents = () => {
  dom.form.addEventListener('submit', submitCheckout);
  dom.authTabSignIn.addEventListener('click', () => switchAuthTab('signin'));
  dom.authTabSignUp.addEventListener('click', () => switchAuthTab('signup'));
  dom.authSignInSubmit.addEventListener('click', handleAuthSignIn);
  dom.authSignUpSubmit.addEventListener('click', handleAuthSignUp);
  dom.authSignOut.addEventListener('click', handleAuthSignOut);

  dom.authSignInPassword.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAuthSignIn();
    }
  });
  dom.authSignUpConfirm.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAuthSignUp();
    }
  });

  dom.enablePhone.addEventListener('change', () => {
    if (dom.enablePhone.checked) {
      dom.phoneWrap.classList.remove('hidden');
      dom.customerPhone.focus();
    } else {
      dom.phoneWrap.classList.add('hidden');
      dom.customerPhone.value = '';
    }
    scheduleRefresh(120);
  });

  dom.enableAddress2.addEventListener('change', () => {
    if (dom.enableAddress2.checked) {
      dom.address2Wrap.classList.remove('hidden');
      dom.shippingAddress2.focus();
    } else {
      dom.address2Wrap.classList.add('hidden');
      dom.shippingAddress2.value = '';
    }
    scheduleRefresh(120);
  });

  dom.shippingCountry.addEventListener('change', () => {
    setPostalLabel(selectedCountry());
    populateServiceOptions();
    updateShippingEstimate();
    estimateClientTotals();
    applyConstraintNotice();
    scheduleRefresh(120);
  });

  dom.shippingService.addEventListener('change', () => {
    updateShippingEstimate();
    estimateClientTotals();
    applyConstraintNotice();
    scheduleRefresh(120);
  });

  dom.discountCode.addEventListener('change', () => {
    if (!isSignedIn()) {
      dom.discountCode.value = '';
      return;
    }
    estimateClientTotals();
    scheduleRefresh(120);
  });

  const refreshInputs = [
    dom.customerName,
    dom.customerEmail,
    dom.customerPhone,
    dom.shippingAddress1,
    dom.shippingAddress2,
    dom.shippingCity,
    dom.shippingRegion,
    dom.shippingPostal,
  ];

  for (const input of refreshInputs) {
    input.addEventListener('input', () => {
      if (input === dom.customerEmail || input === dom.shippingPostal) {
        scheduleRefresh(420);
      }
    });
    input.addEventListener('blur', () => scheduleRefresh(120));
  }
};

const initializeCheckout = async () => {
  switchAuthTab('signin');
  applyAuthUi();
  await hydrateAuthSession();
  await loadRewardsProfile();

  try {
    setNotice('info', 'Loading checkout configuration...');
    await loadStripeConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not initialize checkout.';
    setNotice('error', message);
    setPayDisabled(true);
    return;
  }

  const cart = parseCartStorage();
  state.cartStorageKey = cart.key;
  state.lineItems = aggregateLineItems(cart.items);
  renderLineItems();

  populateCountryOptions();
  populateServiceOptions();
  updateShippingEstimate();
  setPostalLabel(selectedCountry());
  bindEvents();
  await handleReturnQuery();

  if (!state.checkoutConfig.hasPublishableKey) {
    setNotice('error', 'Checkout is unavailable. Stripe publishable key is missing.');
    setPayDisabled(true);
    estimateClientTotals();
    return;
  }

  estimateClientTotals();
  if (!applyConstraintNotice()) {
    return;
  }

  if (!state.lineItems.length) {
    setPayDisabled(true);
    setNotice('warning', 'Your cart is empty. Add products to continue.');
    return;
  }

  if (!normalize(dom.customerEmail.value) && state.auth.user?.email) {
    dom.customerEmail.value = state.auth.user.email;
  }

  await refreshPaymentIntent();
};

initializeCheckout();
