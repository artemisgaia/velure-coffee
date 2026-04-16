/**
 * Velure Coffee — Static HTML Prerender Script
 *
 * After `vite build`, this script reads dist/index.html as a template
 * and generates per-page HTML files with correct <title>, <meta description>,
 * <link rel=canonical>, og: tags, and JSON-LD structured data injected into
 * the <head>. Vercel serves these static files directly to crawlers before
 * React hydrates — so Google sees real metadata on first crawl.
 *
 * Usage: node scripts/prerender.js
 * (automatically called by `npm run build`)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const ORIGIN = 'https://velurecoffee.com';
const SITE_NAME = 'Velure Coffee';

// ---------------------------------------------------------------------------
// PRODUCT CATALOGUE (mirrors App.jsx — update when products change)
// ---------------------------------------------------------------------------
const PRODUCTS = [
  { id: 'fuse',       name: 'FUSE',     subtitle: 'Mushroom Fuse Instant Coffee',       price: 38.00, category: 'Functional', image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1767209595/1766845371046-generated-label-image-0_omteke.jpg', description: 'A medium roast instant blend combining freeze-dried single-origin coffee with 15% Lion\'s Mane and 15% Chaga mushroom powders. Earthy, smooth, and indulgent — clean-label functional coffee with exact ingredient percentages.' },
  { id: 'vitality',   name: 'VITALITY', subtitle: 'Mushroom Vitality Ground Coffee',    price: 36.00, category: 'Functional', image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1767212482/1767212331011-generated-label-image-0_etlsle.jpg', description: 'Ground coffee with Lion\'s Mane and Chaga. Brazilian and Mexican single-origin beans, medium roast, full-bodied and functional.' },
  { id: 'harvest',    name: 'HARVEST',  subtitle: 'Hemp Harvest Coffee',                price: 34.00, category: 'Functional', image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1767216044/1767215853330-generated-label-image-0_dp2u51.jpg', description: 'Brazilian single-origin coffee with 9% organic hemp protein powder. Plant-based, vegan-certified, and one-bag-does-it-all.' },
  { id: 'zen',        name: 'ZEN',      subtitle: 'Ceremonial Matcha Powder',           price: 45.00, category: 'Matcha',     image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1767209664/1767204402115-generated-label-image-0_j8n70v.jpg', description: '100% ceremonial grade matcha, shade-grown and stone-ground in Kagoshima, Japan. Vibrant, umami-rich, smooth sustained energy.' },
  { id: 'onyx',       name: 'ONYX',     subtitle: 'Single-Origin Instant Dark Roast',   price: 28.00, category: 'Instant',    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1767209703/1767205155638-generated-label-image-0_smjxbd.jpg', description: 'Freeze-dried single-origin Papua New Guinea dark roast. No bitterness, toffee finish — specialty instant coffee done properly.' },
  { id: 'aureo',      name: 'AUREO',    subtitle: 'Brazilian Single-Origin Whole Bean', price: 26.00, category: 'Reserve',    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1767217072/6843a1f1-d7bc-41c5-97b3-990b7dd18a18.png', description: 'Brazil Cerrado Arabica. Roasted peanut, honey sweetness, soft toffee. Light-medium roast, zero bitterness.' },
  { id: 'sable',      name: 'SABLE',    subtitle: 'Colombian Single-Origin Whole Bean',  price: 30.00, category: 'Reserve',    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1772321172/1772235308237-generated-label-image-0_w4atkr.jpg', description: 'Colombian Huila Arabica. Velvet cocoa richness, fruit brightness, clean finish. Best for pour-over and drip.' },
  { id: 'drift',      name: 'DRIFT',    subtitle: 'Multi-Origin Citrus Medium Roast',   price: 27.00, category: 'Reserve',    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1772320857/1772237170011-generated-label-image-0_zzj3ml.jpg', description: 'Brazil, Colombia, Guatemala, Ethiopia. Toffee sweetness, dark chocolate, citrus clarity. Excellent cold brew.' },
  { id: 'nougat',     name: 'NOUGAT',   subtitle: 'Smooth Praline Medium Roast',        price: 27.00, category: 'Reserve',    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1772320991/1772236038526-generated-label-image-0_mnguht.jpg', description: 'Brazil, Colombia, Guatemala blend. Smooth nutty praline, warm and balanced.' },
  { id: 'praline',    name: 'PRALINE',  subtitle: 'Hazelnut Warm Medium Roast',         price: 27.00, category: 'Reserve',    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1772321468/1772217325971-generated-label-image-0_dklujb.jpg', description: 'Hazelnut-leaning warm roast, comfort-forward. Great for drip, press, moka.' },
  { id: 'citra',      name: 'CITRA',    subtitle: 'Light Roast Citrus Coffee Beans',    price: 27.00, category: 'Reserve',    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1772321505/1772216717247-generated-label-image-0_fcluhh.jpg', description: 'Ethiopia, Mexico, Brazil light roast. Citrus clarity, tea-like finish. Best iced or pour-over.' },
  { id: 'zest',       name: 'ZEST',     subtitle: 'Bright Citrus Caramel Coffee Beans', price: 27.00, category: 'Reserve',    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1772320941/1772236528415-generated-label-image-0_mdkpbo.jpg', description: 'Ethiopia, Guatemala, Brazil. Bright citrus, soft caramel, clean tea-like finish.' },
  { id: 'ember',      name: 'EMBER',    subtitle: 'Bold Dark Roast Coffee Beans',       price: 28.00, category: 'Reserve',    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1772321542/1772215448439-generated-label-image-0_v2pyrs.jpg', description: 'Brazil, Mexico dark roast. Toasted nut, rich cocoa depth. Bold without tasting burnt.' },
  { id: 'forge',      name: 'FORGE',    subtitle: 'Dark Espresso Roast Coffee Beans',   price: 28.00, category: 'Reserve',    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1772321392/1772234477868-generated-label-image-0_imdqxl.jpg', description: 'Baker\'s chocolate and dark toffee. Holds up in espresso, moka, and French press.' },
  { id: 'forest',     name: 'FOREST',   subtitle: 'Single-Origin Decaf Medium Roast',   price: 29.00, category: 'Decaf',      image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1772321662/1771439409079-generated-label-image-0_lavvns.jpg', description: 'Single-origin Sulawesi, Indonesia. Full-flavored medium decaf, smooth evening-ready finish.' },
  { id: 'grove',      name: 'GROVE',    subtitle: 'Maple Grove Single-Origin Beans',    price: 29.00, category: 'Decaf',      image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1772321341/1772234662485-generated-label-image-0_qmlg0i.jpg', description: 'Single-origin Chiapas, Mexico. Maple-like sweetness, dark chocolate. Steady across all brew styles.' },
  { id: 'cerise',     name: 'CERISE',   subtitle: 'Guatemalan Cherry Light Roast Beans', price: 30.00, category: 'Reserve',   image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1772320709/1772237512483-generated-label-image-0_jvjx2p.jpg', description: 'Guatemalan single-origin. Black-cherry, cocoa, citrus brightness. Best as filter or pour-over.' },
  { id: 'cacao',      name: 'CACAO',    subtitle: 'Brazilian Dark Espresso Roast Beans', price: 29.00, category: 'Reserve',   image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1772321577/1771450675913-generated-label-image-0_aezqge.jpg', description: '100% Brazilian Arabica. Deep cocoa, toasted depth. Excellent for espresso, moka, bold drip.' },
  // Coffee pods
  { id: 'bloom-pods', name: 'BLOOM',    subtitle: 'Fruity Bloom Coffee Pods',           price: 18.00, category: 'Pods',       image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1772321699/1771424462505-generated-label-image-0_ehrjie.jpg', description: 'Bright, fruit-forward light roast pods. Notes of citrus zest, dried fruit, and a floral lift. 12 Keurig-compatible pods.' },
  { id: 'hazel-pods', name: 'HAZEL',    subtitle: 'Rich Hazelnut Coffee Pods',          price: 18.00, category: 'Pods',       image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1772321615/1771446944274-generated-label-image-0_nzoauh.jpg', description: 'Cozy medium roast pods. Roasted hazelnut, gentle sweetness, smooth finish. 12 Keurig-compatible pods.' },
  { id: 'molten',     name: 'MOLTEN',   subtitle: 'Molten Caramel Coffee Pods',         price: 19.00, category: 'Pods',       image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1772321748/1771115507142-generated-label-image-0_besrqh.jpg', description: 'Dark roast pods with caramelized depth. Baker\'s chocolate, dark toffee, full body. 12 Keurig-compatible pods.' },
];

// ---------------------------------------------------------------------------
// BLOG POSTS (mirrors BLOG_POSTS in App.jsx)
// ---------------------------------------------------------------------------
const BLOG_POSTS = [
  {
    slug: 'lions-mane-coffee-explained',
    title: "Lion's Mane Coffee, Explained (Without the Hype)",
    excerpt: "A calm, factual guide to Lion's Mane coffee, label literacy, and what quality looks like. No miracle claims. Just transparency.",
    datePublished: '2026-02-23',
    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1767209595/1766845371046-generated-label-image-0_omteke.jpg',
  },
  {
    slug: 'chaga-coffee-explained',
    title: "Chaga Coffee, Explained (A Clean, Grounded Guide)",
    excerpt: "A simple guide to chaga coffee: what chaga is, what it tastes like, why it is used, and how to choose clean blends without gimmicks.",
    datePublished: '2026-02-23',
    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1767209595/1766845371046-generated-label-image-0_omteke.jpg',
  },
  {
    slug: 'clean-label-functional-coffee',
    title: 'What “Clean Label” Actually Means for Coffee + Functional Blends',
    excerpt: 'Clean label explained: what to look for in coffee and functional blends, how to spot filler ingredients, and how transparency builds trust.',
    datePublished: '2026-02-23',
    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1767209595/1766845371046-generated-label-image-0_omteke.jpg',
  },
  {
    slug: 'make-instant-coffee-taste-premium',
    title: 'How to Make Instant Coffee Taste Premium (5 Clean Upgrades)',
    excerpt: 'A calm, practical guide to making instant coffee taste premium with repeatable clean upgrades: ratios, water temp, dissolve method, and iced techniques.',
    datePublished: '2026-02-23',
    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1767209595/1766845371046-generated-label-image-0_omteke.jpg',
  },
  {
    slug: 'hot-vs-iced-instant-coffee',
    title: 'Hot vs Iced Instant Coffee: Best Methods + Ratios',
    excerpt: 'Make instant coffee taste premium hot or iced. The right dissolve method, ratio guidance, and a calm routine you can repeat daily.',
    datePublished: '2026-02-23',
    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1767209595/1766845371046-generated-label-image-0_omteke.jpg',
  },
  {
    slug: '5-minute-morning-coffee-ritual',
    title: 'A 5-Minute Morning Coffee Ritual (That You\'ll Actually Keep)',
    excerpt: 'A practical five-minute ritual that keeps your mornings calm, premium, and repeatable. Designed for consistency, not performance.',
    datePublished: '2026-02-23',
    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1767209595/1766845371046-generated-label-image-0_omteke.jpg',
  },
  {
    slug: 'fruiting-body-vs-mycelium-mushroom-coffee',
    title: 'Fruiting Body vs Mycelium: Why It Matters More Than Any Brand Admits',
    excerpt: "Most mushroom coffee brands use mycelium grown on grain — not actual mushroom fruiting bodies. Here's why the difference matters for quality, and how to tell which one you're actually buying.",
    datePublished: '2026-03-01',
    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1767209595/1766845371046-generated-label-image-0_omteke.jpg',
  },
  {
    slug: 'best-mushroom-coffee-2026-honest-review',
    title: 'The Best Mushroom Coffee in 2026: What Honest People Actually Say',
    excerpt: "Everyone claims to be the best mushroom coffee. Here's what the criteria should actually look like — ingredient transparency, real mushroom content, and coffee that tastes good enough to drink every day.",
    datePublished: '2026-03-08',
    image: 'https://res.cloudinary.com/dfygdydcj/image/upload/v1767209595/1766845371046-generated-label-image-0_omteke.jpg',
  },
  {
    slug: 'hemp-coffee-blend-explained',
    title: 'Hemp Coffee: What Is It, and Should You Try It?',
    excerpt: "Hemp coffee is one of the most misunderstood functional coffee formats. It has nothing to do with CBD. Here's what hemp protein in coffee actually does — and what HARVEST is built around.",
    datePublished: '2026-03-15',
    image: '/images/blog/blog-hemp-coffee-hero.png',
  },
  {
    slug: 'mushroom-coffee-anxiety',
    title: 'Mushroom Coffee and Anxiety: Will It Make Things Better or Worse?',
    excerpt: 'If regular coffee gives you anxiety, mushroom coffee might be worth considering — but only if you know what you are actually getting. Here is the honest breakdown.',
    datePublished: '2026-03-20',
    image: '/images/blog/blog-anxiety-hero.png',
  },
  {
    slug: 'ceremonial-vs-culinary-matcha',
    title: 'Ceremonial vs Culinary Grade Matcha: What You Are Actually Buying',
    excerpt: "There is a significant difference between ceremonial and culinary matcha — in flavour, colour, and price. Here is exactly what you are getting with each.",
    datePublished: '2026-03-22',
    image: '/images/blog/blog-matcha-grade-hero.png',
  },
  {
    slug: 'single-origin-instant-coffee',
    title: 'Single-Origin Instant Coffee: Why It Tastes Nothing Like Regular Instant',
    excerpt: "Instant coffee has a reputation problem. But single-origin, freeze-dried instant coffee is a completely different product. Here is what the process actually preserves.",
    datePublished: '2026-03-25',
    image: '/images/blog/blog-single-origin-hero.png',
  },
  {
    slug: 'iced-mushroom-coffee-recipes',
    title: '5 Iced Mushroom Coffee Recipes (FUSE + ONYX)',
    excerpt: 'Iced mushroom coffee is one of the best ways to enjoy FUSE in summer. Five recipes, five minutes or less, all made with FUSE or ONYX instant.',
    datePublished: '2026-03-28',
    image: '/images/blog/blog-iced-recipes-hero.png',
  },
  {
    slug: 'adaptogens-in-coffee-guide',
    title: 'The Complete Guide to Adaptogens in Coffee',
    excerpt: "Adaptogens are everywhere in functional coffee right now. But the word gets used to mean almost anything. Here is the complete, honest guide to what adaptogens are and which ones matter.",
    datePublished: '2026-04-01',
    image: '/images/blog/blog-adaptogens-hero.png',
  },
  {
    slug: 'mushroom-coffee-not-working-dosage',
    title: "Why Your Mushroom Coffee Might Not Be Working (It's the Dosage)",
    excerpt: "You have been drinking mushroom coffee every morning for two weeks and feel nothing different. Here is the most likely reason — and it is not that mushrooms do not work.",
    datePublished: '2026-04-05',
    image: '/images/blog/blog-dosage-hero.png',
  },
  {
    slug: 'coffee-subscription-worth-it',
    title: "What Is a Coffee Subscription? (And Is Velure's Worth It?)",
    excerpt: "Coffee subscriptions are everywhere now. Some save you money. Some lock you in. Here is how Velure's works — and an honest answer to whether it is worth it.",
    datePublished: '2026-04-08',
    image: '/images/blog/blog-subscription-hero.png',
  },
  {
    slug: 'papua-new-guinea-coffee-origin',
    title: 'Papua New Guinea Coffee: The Hidden Origin Behind Specialty Instant',
    excerpt: "Papua New Guinea does not get the credit it deserves in the specialty coffee world. Here is the origin story behind ONYX.",
    datePublished: '2026-04-10',
    image: '/images/blog/blog-single-origin-hero.png',
  },
  {
    slug: 'mushroom-coffee-body-effects',
    title: '10 Things That Happen When You Switch to Mushroom Coffee',
    excerpt: "Switching to mushroom coffee will not set off dramatic transformations. But after a few weeks, most people notice patterns that were not there before. Here are 10 honest ones.",
    datePublished: '2026-04-12',
    image: '/images/blog/blog-adaptogens-hero.png',
  },
  {
    slug: 'buy-mushroom-coffee-austin-texas',
    title: 'Mushroom Coffee in Austin, Texas: Why the City Runs on Functional Coffee',
    excerpt: "Austin has quietly become one of the most health-conscious cities in the US. Velure ships clean-label mushroom coffee directly to Austin, TX.",
    datePublished: '2026-04-14',
    image: '/images/blog/blog-adaptogens-hero.png',
  },
  {
    slug: 'mushroom-coffee-los-angeles',
    title: "Mushroom Coffee in Los Angeles: The City's Functional Coffee Movement",
    excerpt: "Los Angeles is the US epicenter of functional wellness. Velure ships clean-label mushroom coffee to LA — free shipping over $50.",
    datePublished: '2026-04-15',
    image: '/images/blog/blog-best-mushroom-hero.png',
  },
];


// ---------------------------------------------------------------------------
// PAGE SEO MAP (static pages)
// ---------------------------------------------------------------------------
const PAGE_SEO = {
  '/': {
    title: `${SITE_NAME} | Mushroom Coffee & Single-Origin Blends, Small-Batch USA`,
    description: "Shop Velure's clean-label mushroom coffee (15% Lion's Mane + Chaga), ceremonial matcha, and single-origin blends. Small-batch roasted weekly in the USA. Free shipping over $50.",
    schema: {
      '@context': 'https://schema.org', '@type': 'WebPage',
      name: `${SITE_NAME} — Home`, url: ORIGIN,
    },
  },
  '/collections': {
    title: `All Coffee Collections | ${SITE_NAME}`,
    description: 'Browse all Velure coffee collections — functional mushroom blends, reserve single-origin, ceremonial matcha, instant, decaf and more. Small-batch roasted in the USA.',
    schema: {
      '@context': 'https://schema.org', '@type': 'CollectionPage',
      name: `All Collections — ${SITE_NAME}`, url: `${ORIGIN}/collections`,
    },
  },
  '/collections/functional': {
    title: `Functional Mushroom Coffee | Lion's Mane + Chaga | ${SITE_NAME}`,
    description: "Clean-label mushroom coffee blends with exactly 15% Lion's Mane and 15% Chaga. No fillers, no proprietary blends. Small-batch USA roasted.",
    schema: null,
  },
  '/collections/single-origin': {
    title: `Single-Origin Reserve Coffee | ${SITE_NAME}`,
    description: 'Specialty single-origin coffees: Colombian Huila, Brazilian Cerrado, Guatemalan SHB, Ethiopian Yirgacheffe and more. Small-batch roasted at peak freshness.',
    schema: null,
  },
  '/blog': {
    title: `Coffee & Wellness Journal | ${SITE_NAME}`,
    description: "Guides on mushroom coffee, Lion's Mane benefits, clean-label ingredient transparency, brewing rituals, and specialty coffee — from the Velure team.",
    schema: {
      '@context': 'https://schema.org', '@type': 'Blog',
      name: `Velure Coffee Journal`, url: `${ORIGIN}/blog`,
      publisher: { '@type': 'Organization', name: SITE_NAME },
    },
  },
  '/about': {
    title: `About Velure | Our Story & Mission | ${SITE_NAME}`,
    description: "We believe in clean-label, ethically sourced coffee without compromise. Learn about Velure's founding story, sourcing philosophy, and commitment to full transparency.",
    schema: null,
  },
  '/sourcing': {
    title: `Ethical Sourcing & Ingredients | ${SITE_NAME}`,
    description: 'Every Velure blend is sourced with full ingredient transparency. Exact percentages, verified farms, and no filler ingredients — ever.',
    schema: null,
  },
  '/subscription': {
    title: `Coffee Subscription — Flexible, Cancel Anytime | ${SITE_NAME}`,
    description: 'Subscribe and save on your favourite Velure blend. Flexible delivery cadence, exclusive subscriber pricing, and cancel anytime. Never run out of your ritual.',
    schema: null,
  },
  '/rewards': {
    title: `Velure Rewards — Earn Points, Unlock Coffee | ${SITE_NAME}`,
    description: 'Earn points on every order, unlock free shipping and exclusive discounts. Download the Velure Rewards app or track your points online.',
    schema: null,
  },
  '/wholesale': {
    title: `Wholesale Coffee Orders | Restaurants, Hotels, Offices | ${SITE_NAME}`,
    description: 'Bulk coffee for restaurants, hotels, offices, and multi-location chains. Sample kits, volume pricing, and a dedicated account manager.',
    schema: null,
  },
};

// ---------------------------------------------------------------------------
// HTML MUTATION HELPERS
// ---------------------------------------------------------------------------

/**
 * Given the base dist/index.html content and an SEO config,
 * returns a new HTML string with the head section updated.
 */
function injectHead(baseHtml, { title, description, canonical, ogTitle, ogDesc, ogImage, ogUrl, schemaData }) {
  let html = baseHtml;

  // Title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);

  // Meta description
  html = html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${escapeHtml(description)}$2`,
  );

  // Canonical
  html = html.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    `$1${escapeHtml(canonical)}$2`,
  );

  // OG title
  html = html.replace(
    /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
    `$1${escapeHtml(ogTitle || title)}$2`,
  );

  // OG description
  html = html.replace(
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    `$1${escapeHtml(ogDesc || description)}$2`,
  );

  // OG url
  html = html.replace(
    /(<meta\s+property="og:url"\s+content=")[^"]*(")/,
    `$1${escapeHtml(ogUrl || canonical)}$2`,
  );

  // OG image (if provided)
  if (ogImage) {
    html = html.replace(
      /(<meta\s+property="og:image"\s+content=")[^"]*(")/,
      `$1${escapeHtml(ogImage)}$2`,
    );
  }

  // Twitter
  html = html.replace(
    /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/,
    `$1${escapeHtml(ogTitle || title)}$2`,
  );
  html = html.replace(
    /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/,
    `$1${escapeHtml(ogDesc || description)}$2`,
  );

  // Remove old page-level JSON-LD if any injected by a previous run
  html = html.replace(/<script id="ld-page" type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');

  // Inject structured data before </head>
  if (schemaData) {
    const schemaTag = `<script id="ld-page" type="application/ld+json">\n${JSON.stringify(schemaData, null, 2)}\n</script>\n`;
    html = html.replace('</head>', `${schemaTag}</head>`);
  }

  return html;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function writePageFile(relPath, html) {
  // relPath is like '/products/fuse' — write to dist/products/fuse/index.html
  const dir = join(DIST, relPath.replace(/^\//, ''));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(join(dir, 'index.html'), html, 'utf-8');
  console.log(`  ✓ ${relPath}`);
}

// ---------------------------------------------------------------------------
// BUILD STATIC PAGES LIST
// ---------------------------------------------------------------------------
function buildPageList() {
  const pages = [];

  // Static pages
  for (const [path, seo] of Object.entries(PAGE_SEO)) {
    pages.push({ path, seo });
  }

  // Product pages
  for (const product of PRODUCTS) {
    const path = `/products/${product.id}`;
    const title = `Buy ${product.name} — ${product.subtitle} | ${SITE_NAME}`;
    const description = `${product.subtitle}. ${product.description.slice(0, 135).trim()}… Free shipping over $50. Small-batch roasted in the USA.`;
    pages.push({
      path,
      seo: {
        title,
        description,
        ogImage: product.image || undefined,
        schema: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: `${product.name} — ${product.subtitle}`,
          description: product.description,
          brand: { '@type': 'Brand', name: SITE_NAME },
          url: `${ORIGIN}${path}`,
          image: product.image || '',
          offers: {
            '@type': 'Offer',
            price: product.price.toFixed(2),
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: `${ORIGIN}${path}`,
            seller: { '@type': 'Organization', name: SITE_NAME },
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            reviewCount: '3',
            bestRating: '5',
            worstRating: '1',
          },
        },
      },
    });
  }

  // Blog post pages
  for (const post of BLOG_POSTS) {
    const path = `/blog/${post.slug}`;
    const title = `${post.title} | ${SITE_NAME}`;
    const description = post.excerpt;
    pages.push({
      path,
      seo: {
        title,
        description,
        ogImage: post.image || undefined,
        schema: {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          url: `${ORIGIN}${path}`,
          datePublished: post.datePublished,
          author: { '@type': 'Organization', name: SITE_NAME },
          publisher: { '@type': 'Organization', name: SITE_NAME },
          image: post.image || '',
        },
      },
    });
  }

  return pages;
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
function main() {
  const templatePath = join(DIST, 'index.html');
  if (!existsSync(templatePath)) {
    console.error('❌  dist/index.html not found — run `vite build` first.');
    process.exit(1);
  }

  const baseHtml = readFileSync(templatePath, 'utf-8');
  const pages = buildPageList();

  console.log(`\n🔨 Prerendering ${pages.length} pages...\n`);

  for (const { path, seo } of pages) {
    const canonical = `${ORIGIN}${path}`;
    const html = injectHead(baseHtml, {
      title: seo.title,
      description: seo.description,
      canonical,
      ogTitle: seo.title,
      ogDesc: seo.description,
      ogImage: seo.ogImage,
      ogUrl: canonical,
      schemaData: seo.schema,
    });

    // Root path writes to dist/index.html (already exists, update in place)
    if (path === '/') {
      writeFileSync(templatePath, html, 'utf-8');
      console.log(`  ✓ / (homepage updated in dist/index.html)`);
    } else {
      writePageFile(path, html);
    }
  }

  console.log(`\n✅  Prerender complete — ${pages.length} pages generated.\n`);
}

main();
