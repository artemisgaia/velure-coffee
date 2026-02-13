const ZONE_COUNTRY_CODES = {
  domestic: ['US'],
  zone1: ['CA'],
  zone2: ['BE', 'DK', 'FI', 'FR', 'IS', 'IT', 'LI', 'LU', 'MT', 'MC', 'NL', 'NO', 'PT', 'SE', 'GB'],
  zone3: ['AU', 'BG', 'HR', 'CY', 'CZ', 'EE', 'HU', 'ID', 'LV', 'LT', 'MO', 'NZ', 'PH', 'PL', 'RO', 'SK', 'SI', 'KR', 'TH', 'VN'],
};

const COUNTRY_LABELS = {
  US: 'United States',
  CA: 'Canada',
  BE: 'Belgium',
  DK: 'Denmark',
  FI: 'Finland',
  FR: 'France',
  IS: 'Iceland',
  IT: 'Italy',
  LI: 'Liechtenstein',
  LU: 'Luxembourg',
  MT: 'Malta',
  MC: 'Monaco',
  NL: 'Netherlands',
  NO: 'Norway',
  PT: 'Portugal',
  SE: 'Sweden',
  GB: 'United Kingdom',
  AU: 'Australia',
  BG: 'Bulgaria',
  HR: 'Croatia',
  CY: 'Cyprus',
  CZ: 'Czech Republic',
  EE: 'Estonia',
  HU: 'Hungary',
  ID: 'Indonesia',
  LV: 'Latvia',
  LT: 'Lithuania',
  MO: 'Macau SAR',
  NZ: 'New Zealand',
  PH: 'Philippines',
  PL: 'Poland',
  RO: 'Romania',
  SK: 'Slovakia',
  SI: 'Slovenia',
  KR: 'South Korea',
  TH: 'Thailand',
  VN: 'Vietnam',
};

const DOMESTIC_SERVICE_LABEL = 'Standard (2-5 business days)';
const INTERNATIONAL_SERVICE_LABEL = 'International Standard (4-15 business days)';

const DOMESTIC_WEIGHT_TIERS = [
  { maxWeightLbs: 0.5, shippingCents: 450 },
  { maxWeightLbs: 0.75, shippingCents: 550 },
  { maxWeightLbs: 1, shippingCents: 650 },
  { maxWeightLbs: 2, shippingCents: 800 },
  { maxWeightLbs: 3, shippingCents: 1000 },
];

const INTERNATIONAL_WEIGHT_TIERS = {
  zone1: [
    { maxWeightLbs: 1, shippingCents: 1700 },
    { maxWeightLbs: 2, shippingCents: 1900 },
    { maxWeightLbs: 3, shippingCents: 2100 },
    { maxWeightLbs: 4, shippingCents: 2400 },
  ],
  zone2: [
    { maxWeightLbs: 1, shippingCents: 1800 },
    { maxWeightLbs: 2, shippingCents: 2000 },
    { maxWeightLbs: 3, shippingCents: 2300 },
    { maxWeightLbs: 4, shippingCents: 2600 },
  ],
  zone3: [
    { maxWeightLbs: 1, shippingCents: 2000 },
    { maxWeightLbs: 2, shippingCents: 2400 },
    { maxWeightLbs: 3, shippingCents: 2800 },
    { maxWeightLbs: 4, shippingCents: 3200 },
  ],
};

const INTERNATIONAL_OVERAGE_CENTS_PER_LB = {
  zone1: 500,
  zone2: 500,
  zone3: 600,
};

const US_BLOCKED_REGIONS = new Set(['AK', 'ALASKA', 'HI', 'HAWAII']);
const US_MILITARY_REGIONS = new Set(['AE', 'AP', 'AA']);
const US_MILITARY_ADDRESS_PATTERN = /\b(APO|FPO|DPO)\b/i;

const PRODUCT_SHIPPING_WEIGHT_LBS = {
  fuse: 0.2,
  zen: 0.16,
  onyx: 0.2,
  vitality: 0.95,
  harvest: 0.95,
  aureo: 0.95,
};

const PACKAGING_WEIGHT_LBS = 0.2;

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeUpper = (value) => normalize(value).toUpperCase();

const roundWeight = (weightLbs) => Math.round(Math.max(0, Number(weightLbs) || 0) * 100) / 100;

const findTier = (weightLbs, tiers) => tiers.find((tier) => weightLbs <= tier.maxWeightLbs);

const getServiceLabel = (zoneKey) => (zoneKey === 'domestic' ? DOMESTIC_SERVICE_LABEL : INTERNATIONAL_SERVICE_LABEL);

const buildShippingZones = () => {
  const zones = {};
  for (const [zoneKey, countryCodes] of Object.entries(ZONE_COUNTRY_CODES)) {
    for (const countryCode of countryCodes) {
      zones[countryCode] = {
        label: COUNTRY_LABELS[countryCode] || countryCode,
        zoneKey,
        services: {
          standard: {
            label: getServiceLabel(zoneKey),
            shippingCents: 0,
          },
        },
      };
    }
  }
  return zones;
};

export const SHIPPING_ZONES = buildShippingZones();
export const DEFAULT_SHIPPING_COUNTRY_ORDER = Object.values(ZONE_COUNTRY_CODES).flat();
export const SUPPORTED_COUNTRY_CODES = [...DEFAULT_SHIPPING_COUNTRY_ORDER];

export const getDestinationConstraint = ({ countryCode, region, address1 }) => {
  const normalizedCountry = normalizeUpper(countryCode);

  if (normalizedCountry === 'ES') {
    return {
      ok: false,
      code: 'unsupported_destination',
      severity: 'error',
      message: 'Shipping to Spain is temporarily unavailable while customs lanes are being updated.',
    };
  }

  if (!SHIPPING_ZONES[normalizedCountry]) {
    return {
      ok: false,
      code: 'unsupported_destination',
      severity: 'error',
      message: 'This destination is not currently available for shipping.',
    };
  }

  if (normalizedCountry === 'US') {
    const normalizedRegion = normalizeUpper(region).replace(/\./g, '');
    const normalizedAddress1 = normalize(address1);

    if (US_BLOCKED_REGIONS.has(normalizedRegion)) {
      return {
        ok: false,
        code: 'unsupported_destination',
        severity: 'error',
        message: 'We currently ship U.S. orders to the contiguous 48 states only.',
      };
    }

    if (US_MILITARY_REGIONS.has(normalizedRegion) || US_MILITARY_ADDRESS_PATTERN.test(normalizedAddress1)) {
      return {
        ok: false,
        code: 'unsupported_destination',
        severity: 'error',
        message: 'We currently do not ship to APO, FPO, or DPO military addresses.',
      };
    }
  }

  return { ok: true, code: 'ok', severity: 'success', message: 'Destination is eligible for checkout.' };
};

export const calculatePackageWeightLbs = (items) => {
  const itemsWeight = (Array.isArray(items) ? items : []).reduce((sum, item) => {
    const productId = normalize(item?.productId).toLowerCase();
    const quantity = Number(item?.quantity || 0);
    if (!productId || !Number.isFinite(quantity) || quantity <= 0) return sum;
    const perItemWeight = PRODUCT_SHIPPING_WEIGHT_LBS[productId] || 0.5;
    return sum + (perItemWeight * quantity);
  }, 0);

  return roundWeight(Math.max(0.1, itemsWeight + PACKAGING_WEIGHT_LBS));
};

export const calculateShippingCents = ({ countryCode, packageWeightLbs, service = 'standard' }) => {
  const normalizedCountry = normalizeUpper(countryCode);
  const zoneConfig = SHIPPING_ZONES[normalizedCountry];
  if (!zoneConfig) {
    return { ok: false, code: 'unsupported_destination', shippingCents: 0 };
  }

  const normalizedService = normalize(service).toLowerCase() || 'standard';
  if (!zoneConfig.services[normalizedService]) {
    return { ok: false, code: 'invalid_shipping_service', shippingCents: 0 };
  }

  const safeWeight = Math.max(0.1, Number(packageWeightLbs) || 0.1);
  const roundedWeight = roundWeight(safeWeight);

  if (zoneConfig.zoneKey === 'domestic') {
    const tier = findTier(roundedWeight, DOMESTIC_WEIGHT_TIERS);
    if (tier) {
      return { ok: true, shippingCents: tier.shippingCents, roundedWeightLbs: roundedWeight };
    }

    const baseCents = 1000;
    const extraLbs = Math.ceil(roundedWeight - 3);
    return {
      ok: true,
      shippingCents: baseCents + (Math.max(0, extraLbs) * 100),
      roundedWeightLbs: roundedWeight,
    };
  }

  const tiers = INTERNATIONAL_WEIGHT_TIERS[zoneConfig.zoneKey] || INTERNATIONAL_WEIGHT_TIERS.zone3;
  const tier = findTier(roundedWeight, tiers);
  if (tier) {
    return { ok: true, shippingCents: tier.shippingCents, roundedWeightLbs: roundedWeight };
  }

  const baseTier = tiers[tiers.length - 1];
  const extraLbs = Math.ceil(roundedWeight - baseTier.maxWeightLbs);
  const overageCents = INTERNATIONAL_OVERAGE_CENTS_PER_LB[zoneConfig.zoneKey] || 600;

  return {
    ok: true,
    shippingCents: baseTier.shippingCents + (Math.max(0, extraLbs) * overageCents),
    roundedWeightLbs: roundedWeight,
  };
};
