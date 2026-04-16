/**
 * Velure Coffee — Open Graph Image Generator
 *
 * GET /api/og-image?title=FUSE+Mushroom+Coffee&subtitle=15%25+Lion%27s+Mane&type=product
 *
 * Returns a 1200×630 PNG with the Velure brand aesthetic.
 * Uses only built-in Node.js APIs — no canvas package required.
 *
 * Designed to be used as the og:image URL so every product and blog post
 * generates a unique, branded preview card when shared on social media.
 *
 * The image is an SVG rendered as PNG via a simple SVG → PNG approach.
 * For production: replace with @vercel/og (Satori) for richer typography.
 */

const DEFAULT_TITLE = 'Velure Coffee';
const DEFAULT_SUBTITLE = 'Small-Batch · Clean-Label · USA Roasted';
const BRAND_GOLD = '#D4AF37';
const BRAND_BLACK = '#0B0C0C';
const BRAND_CREAM = '#F9F6F0';

const normalize = (v) => (typeof v === 'string' ? v.trim() : '');
const truncate = (str, max) => (str.length > max ? str.slice(0, max - 1) + '…' : str);

/**
 * Build a 1200×630 SVG string that looks like the Velure brand.
 * This SVG is returned directly — browsers and most social platforms
 * can display SVG og:images. For richer PNG output, upgrade to @vercel/og.
 */
const buildSvg = ({ title, subtitle, type }) => {
  const safeTitle = truncate(escapeXml(normalize(title) || DEFAULT_TITLE), 48);
  const safeSubtitle = truncate(escapeXml(normalize(subtitle) || DEFAULT_SUBTITLE), 72);
  const label = type === 'product' ? 'PRODUCT' : type === 'blog' ? 'JOURNAL' : 'VELURE';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <!-- Background -->
  <rect width="1200" height="630" fill="${BRAND_BLACK}"/>

  <!-- Gold gradient overlay -->
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${BRAND_GOLD};stop-opacity:0.12"/>
      <stop offset="100%" style="stop-color:${BRAND_GOLD};stop-opacity:0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g1)"/>

  <!-- Top border line -->
  <rect x="60" y="60" width="120" height="2" fill="${BRAND_GOLD}"/>

  <!-- Category label -->
  <text x="60" y="120" font-family="Georgia, serif" font-size="16" fill="${BRAND_GOLD}" letter-spacing="6" text-anchor="start">${label}</text>

  <!-- Main title -->
  <text x="60" y="240" font-family="Georgia, serif" font-size="72" font-weight="400" fill="${BRAND_CREAM}" text-anchor="start">${safeTitle}</text>

  <!-- Subtitle -->
  <text x="60" y="310" font-family="Georgia, serif" font-size="28" fill="#9CA3AF" text-anchor="start">${safeSubtitle}</text>

  <!-- Bottom bar -->
  <rect x="0" y="580" width="1200" height="50" fill="${BRAND_GOLD}" opacity="0.08"/>

  <!-- Brand name -->
  <text x="60" y="615" font-family="Georgia, serif" font-size="22" fill="${BRAND_GOLD}" letter-spacing="4" text-anchor="start">velure.</text>

  <!-- Right tagline -->
  <text x="1140" y="615" font-family="Georgia, serif" font-size="14" fill="#6B7280" text-anchor="end">Small-Batch · USA Roasted</text>

  <!-- Decorative corner element -->
  <rect x="1080" y="60" width="60" height="1" fill="${BRAND_GOLD}" opacity="0.4"/>
  <rect x="1139" y="60" width="1" height="60" fill="${BRAND_GOLD}" opacity="0.4"/>
</svg>`;
};

const escapeXml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method Not Allowed');
    return;
  }

  const params = req.query || Object.fromEntries(
    new URL(req.url || '', 'http://localhost').searchParams.entries(),
  );

  const title = normalize(params.title || params.t || '');
  const subtitle = normalize(params.subtitle || params.s || '');
  const type = normalize(params.type || '');

  const svg = buildSvg({ title, subtitle, type });

  res.statusCode = 200;
  // Return as SVG — supported by all major social platforms for og:image
  res.setHeader('Content-Type', 'image/svg+xml');
  // Cache aggressively — og images are static per URL
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('Vary', 'Accept');
  res.end(svg);
}
