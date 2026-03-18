import { fetchAllRows, getStaticBlogPosts, getSupabaseConfig, normalizeBlogPostRow, sendJson } from './_admin.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'GET, OPTIONS');
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  try {
    const config = getSupabaseConfig();
    const query = new URLSearchParams({
      select: '*',
      status: 'eq.published',
      order: 'published_at.desc',
    });
    const rows = await fetchAllRows(config, 'blog_posts', query, {
      errorMessage: 'Unable to load blog posts.',
    });
    if (rows.length > 0) {
      sendJson(res, 200, { ok: true, posts: rows.map(normalizeBlogPostRow), source: 'supabase' });
      return;
    }
  } catch (error) {
    console.error('Public blog fallback:', error);
  }

  try {
    const fallbackPosts = await getStaticBlogPosts();
    sendJson(res, 200, { ok: true, posts: fallbackPosts.map(normalizeBlogPostRow), source: 'static' });
  } catch (error) {
    console.error('Public blog error:', error);
    sendJson(res, 500, { ok: false, error: 'Unable to load blog posts.' });
  }
}
