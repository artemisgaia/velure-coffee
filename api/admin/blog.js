import {
  buildBlogPayload,
  calculateReadTimeMinutes,
  deleteRows,
  fetchAllRows,
  fetchRowsWithCount,
  getPageParams,
  getStaticBlogPosts,
  getSupabaseConfig,
  normalizeBlogPostRow,
  parseBody,
  patchRows,
  requireAdmin,
  sendJson,
  upsertRows,
} from '../_admin.js';

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');

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

  if (!requireAdmin(req, res)) return;

  try {
    const config = getSupabaseConfig();
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'POST') {
      const body = await parseBody(req, 750_000);
      if (body.action === 'import_static') {
        const staticPosts = await getStaticBlogPosts();
        const existingRows = await fetchAllRows(config, 'blog_posts', new URLSearchParams({ select: 'slug' }));
        const existingSlugs = new Set(existingRows.map((row) => normalize(row.slug)).filter(Boolean));
        const importedCount = staticPosts.reduce((count, post) => (
          existingSlugs.has(normalize(post.slug)) ? count : count + 1
        ), 0);

        await upsertRows(config, 'blog_posts', staticPosts, 'slug', {
          errorMessage: 'Unable to import blog posts.',
        });
        sendJson(res, 200, {
          ok: true,
          imported: importedCount,
          totalSourceRecords: staticPosts.length,
        });
        return;
      }

      const payload = buildBlogPayload({
        ...body,
        read_time_minutes: body.read_time_minutes || calculateReadTimeMinutes(body.body),
      });
      const [saved] = await upsertRows(config, 'blog_posts', [payload], 'slug', {
        errorMessage: 'Unable to save article.',
      });
      sendJson(res, 200, { ok: true, post: normalizeBlogPostRow(saved) });
      return;
    }

    if (req.method === 'PUT') {
      const body = await parseBody(req, 750_000);
      const slug = normalize(body.slug);
      const payload = buildBlogPayload({
        ...body,
        read_time_minutes: body.read_time_minutes || calculateReadTimeMinutes(body.body),
      });
      const updated = await patchRows(config, 'blog_posts', new URLSearchParams({
        slug: `eq.${slug}`,
        select: '*',
      }), payload, {
        errorMessage: 'Unable to update article.',
      });
      sendJson(res, 200, { ok: true, post: normalizeBlogPostRow(updated?.[0] || payload) });
      return;
    }

    if (req.method === 'DELETE') {
      const body = await parseBody(req, 100_000);
      const slug = normalize(body.slug);
      if (!slug) {
        sendJson(res, 400, { ok: false, error: 'Missing article slug.' });
        return;
      }
      await deleteRows(config, 'blog_posts', new URLSearchParams({ slug: `eq.${slug}` }), {
        errorMessage: 'Unable to delete article.',
      });
      sendJson(res, 200, { ok: true });
      return;
    }

    const { page, pageSize, from } = getPageParams(Object.fromEntries(url.searchParams.entries()));
    const query = new URLSearchParams({
      select: '*',
      order: 'published_at.desc.nullslast,created_at.desc',
      offset: String(from),
      limit: String(pageSize),
    });
    if (normalize(url.searchParams.get('status'))) query.set('status', `eq.${normalize(url.searchParams.get('status'))}`);
    if (normalize(url.searchParams.get('tag'))) query.set('tags', `cs.{${normalize(url.searchParams.get('tag'))}}`);
    const { rows, count } = await fetchRowsWithCount(config, 'blog_posts', query, {
      errorMessage: 'Unable to load blog posts.',
    });
    sendJson(res, 200, {
      ok: true,
      page,
      pageSize,
      total: count,
      posts: rows.map(normalizeBlogPostRow),
    });
  } catch (error) {
    console.error('Admin blog error:', error);
    sendJson(res, 500, { ok: false, error: 'Unable to manage blog posts.' });
  }
}
