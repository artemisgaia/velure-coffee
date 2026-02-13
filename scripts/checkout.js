import { calculatePackageWeightLbs, calculateShippingCents, getDestinationConstraint, SHIPPING_ZONES } from '../shared/shipping.js';

const API_ENDPOINTS = {
  stripeConfig: '/api/stripe-config',
  createPaymentIntent: '/api/create-payment-intent',
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
};

const dom = {
  form: document.getElementById('checkout-form'),
  notice: document.getElementById('checkout-notice'),
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
const selectedDiscount = () => normalizeLower(dom.discountCode.value);

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
      headers: { 'Content-Type': 'application/json' },
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

const handlePostPaymentStatus = (paymentIntent) => {
  const status = normalize(paymentIntent?.status);

  if (status === 'succeeded') {
    setNotice('success', 'Payment confirmed. Your order is complete.');
    clearCartStorage();
    state.lineItems = [];
    renderLineItems();
    estimateClientTotals();
    setPayDisabled(true);
    return;
  }

  if (status === 'processing') {
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

    handlePostPaymentStatus(result.paymentIntent);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed unexpectedly.';
    setNotice('error', message);
  } finally {
    setSubmittingState(false);
  }
};

const handleReturnQuery = () => {
  const params = new URLSearchParams(window.location.search);
  const status = normalizeLower(params.get('redirect_status'));
  if (!status) return;

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

const bindEvents = () => {
  dom.form.addEventListener('submit', submitCheckout);

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
  handleReturnQuery();

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

  await refreshPaymentIntent();
};

initializeCheckout();
