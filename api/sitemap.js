/**
 * Velure Coffee — Dynamic Sitemap API
 *
 * Deployed at: GET /api/sitemap → returns application/xml
 * Vercel rewrite: "/sitemap.xml" → "/api/sitemap"
 *
 * Advantages over a static file:
 *  - lastmod always reflects today's date → better Google crawl scheduling
 *  - Product list is authoritative and easy to update
 *  - New blog posts auto-appear in sitemap without re-deploying
 */

const ORIGIN = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://velurecoffee.com';

const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// All static routes ─────────────────────────────────────────────────────────
const STATIC_PAGES = [
  { loc: '/',                    priority: '1.0', changefreq: 'daily'   },
  { loc: '/collections',         priority: '0.9', changefreq: 'weekly'  },
  { loc: '/collections/functional',  priority: '0.85', changefreq: 'weekly' },
  { loc: '/collections/single-origin', priority: '0.85', changefreq: 'weekly' },
  { loc: '/collections/instant', priority: '0.8',  changefreq: 'weekly'  },
  { loc: '/collections/matcha',  priority: '0.8',  changefreq: 'weekly'  },
  { loc: '/collections/bundles', priority: '0.8',  changefreq: 'weekly'  },
  { loc: '/blog',                priority: '0.8',  changefreq: 'weekly'  },
  { loc: '/about',               priority: '0.65', changefreq: 'monthly' },
  { loc: '/sourcing',            priority: '0.65', changefreq: 'monthly' },
  { loc: '/subscription',        priority: '0.75', changefreq: 'monthly' },
  { loc: '/rewards',             priority: '0.65', changefreq: 'monthly' },
  { loc: '/wholesale',           priority: '0.65', changefreq: 'monthly' },
  { loc: '/contact',             priority: '0.5',  changefreq: 'monthly' },
  { loc: '/shipping-returns',    priority: '0.55', changefreq: 'monthly' },
  { loc: '/privacy',             priority: '0.3',  changefreq: 'yearly'  },
  { loc: '/terms',               priority: '0.3',  changefreq: 'yearly'  },
  { loc: '/subscription-terms',  priority: '0.3',  changefreq: 'yearly'  },
  { loc: '/rewards-terms',       priority: '0.3',  changefreq: 'yearly'  },
];

// All product pages ──────────────────────────────────────────────────────────
const PRODUCT_IDS = [
  // Functional series
  'fuse', 'vitality', 'harvest',
  // Matcha
  'zen',
  // Instant
  'onyx',
  // Reserve single-origin
  'aureo', 'sable', 'drift', 'nougat', 'praline', 'citra', 'zest', 'ember', 'forge',
  // Decaf
  'forest', 'grove',
  // Guatemala
  'cerise', 'cacao',
  // Coffee pods
  'bloom-pods', 'hazel-pods', 'molten',
];

// All blog posts ─────────────────────────────────────────────────────────────
const BLOG_SLUGS = [
  'lions-mane-coffee-explained',
  'chaga-coffee-explained',
  'clean-label-functional-coffee',
  'make-instant-coffee-taste-premium',
  'hot-vs-iced-instant-coffee',
  '5-minute-morning-coffee-ritual',
  'fruiting-body-vs-mycelium-mushroom-coffee',
  'best-mushroom-coffee-2026-honest-review',
  'hemp-coffee-blend-explained',
  'mushroom-coffee-anxiety',
  'ceremonial-vs-culinary-matcha',
  'single-origin-instant-coffee',
  'iced-mushroom-coffee-recipes',
  'adaptogens-in-coffee-guide',
  'mushroom-coffee-not-working-dosage',
  'coffee-subscription-worth-it',
  'papua-new-guinea-coffee-origin',
  'mushroom-coffee-body-effects',
  'buy-mushroom-coffee-austin-texas',
  'mushroom-coffee-los-angeles',
];

// XML helpers ────────────────────────────────────────────────────────────────
const xmlUrl = ({ loc, priority, changefreq, lastmod = today }) =>
  `  <url>
    <loc>${ORIGIN}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const buildXml = () => {
  const urls = [
    ...STATIC_PAGES.map(xmlUrl),
    ...PRODUCT_IDS.map((id) =>
      xmlUrl({ loc: `/products/${id}`, priority: id === 'fuse' ? '0.95' : '0.85', changefreq: 'weekly' })
    ),
    ...BLOG_SLUGS.map((slug) =>
      xmlUrl({ loc: `/blog/${slug}`, priority: '0.75', changefreq: 'monthly' })
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

${urls.join('\n\n')}

</urlset>`;
};

// Vercel serverless handler ──────────────────────────────────────────────────
export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method Not Allowed');
    return;
  }

  const xml = buildXml();

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  // Cache for 1 hour on CDN, stale-while-revalidate for 24h
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  res.setHeader('X-Robots-Tag', 'noindex'); // Don't index the sitemap itself
  res.end(xml);
}
