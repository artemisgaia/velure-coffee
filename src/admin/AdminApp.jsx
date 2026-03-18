import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { supabaseRest } from '../lib/supabaseClient';
import { STATIC_BLOG_POSTS, STATIC_PRODUCTS } from '../data/storefrontContent';

const ADMIN_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', path: '/admin' },
  { id: 'orders', label: 'Orders', path: '/admin/orders' },
  { id: 'customers', label: 'Customers', path: '/admin/customers' },
  { id: 'reviews', label: 'Reviews', path: '/admin/reviews' },
  { id: 'products', label: 'Products', path: '/admin/products' },
  { id: 'blog', label: 'Blog', path: '/admin/blog' },
  { id: 'newsletter', label: 'Newsletter', path: '/admin/newsletter' },
  { id: 'rewards', label: 'Rewards', path: '/admin/rewards' },
];

const BLOG_TAG_OPTIONS = [
  'clean label',
  'functional coffee',
  'ingredients',
  'ritual',
  'brew guide',
  'instant coffee',
  'morning routine',
  'coffee',
];

const PRODUCT_CATEGORIES = [
  'functional',
  'signature',
  'single_origin',
  'bundles',
  'matcha',
];

const EMPTY_PRODUCT_FORM = {
  id: '',
  name: '',
  tagline: '',
  description: '',
  price: '0',
  category: 'functional',
  series: '',
  origin: '',
  roast: '',
  format: '',
  ingredients: [''],
  benefits: [{ name: '', description: '' }],
  images: [''],
  badges: [''],
  weight_lbs: '0',
  is_active: true,
  is_featured: false,
  sort_order: 0,
};

const EMPTY_BLOG_FORM = {
  title: '',
  slug: '',
  subtitle: '',
  body: '<p></p>',
  featured_image: '',
  tags: [],
  status: 'draft',
  published_at: '',
  read_time_minutes: 1,
  author: 'Joe Hart',
};

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeLower = (value) => normalize(value).toLowerCase();
const ADMIN_AUTH_STORAGE_KEY = 'velure_admin_auth';
const ADMIN_USERNAME_STORAGE_KEY = 'velure_admin_username';
const CLIENT_ADMIN_USERNAME = normalize(import.meta.env.VITE_ADMIN_USERNAME || '');
const CLIENT_ADMIN_PASSWORD = normalize(import.meta.env.VITE_ADMIN_PASSWORD || '');

const toCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
const toDateLabel = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const toDateTimeLabel = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const slugify = (value) => normalizeLower(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const stripHtml = (value) => normalize(value).replace(/<[^>]+>/g, ' ');
const getReadTime = (body) => Math.max(1, Math.ceil(stripHtml(body).split(/\s+/).filter(Boolean).length / 200));
const ensureArray = (value) => (Array.isArray(value) ? value : []);
const ensureObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});

const downloadCsv = (filename, rows) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length || typeof window === 'undefined') return;
  const headers = Array.from(
    safeRows.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set()),
  );
  const escapeCell = (value) => {
    const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.join(','),
    ...safeRows.map((row) => headers.map((header) => escapeCell(row?.[header])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const buildProductRow = (product, index = 0) => {
  const details = ensureObject(product.details);
  const nutritionSpecs = ensureObject(product.nutritionSpecs);
  return {
    id: normalize(product.id),
    name: normalize(product.name),
    tagline: normalize(product.subtitle),
    subtitle: normalize(product.subtitle),
    description: normalize(product.description),
    price: Number(product.price || 0),
    category: normalize(product.category === 'bundle' ? 'bundles' : product.category),
    series: normalize(product.series || details.series),
    origin: normalize(details.origin),
    roast: normalize(details.roast),
    format: normalize(details.format || nutritionSpecs.productAmount),
    ingredients: typeof product.ingredients === 'string'
      ? product.ingredients.split(',').map((item) => normalize(item)).filter(Boolean)
      : ensureArray(product.ingredients).map((item) => normalize(typeof item === 'string' ? item : item?.name)).filter(Boolean),
    benefits: ensureArray(product.benefits).map((item) => ({
      name: normalize(item?.name || item?.title),
      description: normalize(item?.description || item?.benefit),
    })).filter((item) => item.name || item.description),
    images: ensureArray(product.images).map((item) => normalize(item)).filter(Boolean),
    badges: ensureArray(product.badges).length
      ? ensureArray(product.badges).map((item) => normalize(typeof item === 'string' ? item : item?.label)).filter(Boolean)
      : (product.tag ? [normalize(product.tag)] : []),
    details,
    nutrition_specs: nutritionSpecs,
    weight_lbs: Number(product.weight_lbs || product.weightLbs || 0),
    is_active: product.is_active !== false,
    is_featured: Boolean(product.is_featured ?? product.featuredHome ?? false),
    featured_home: Boolean(product.featuredHome ?? product.is_featured ?? false),
    subscription_eligible: product.subscriptionEligible !== false,
    sort_order: Number.isFinite(Number(product.sort_order)) ? Number(product.sort_order) : index,
  };
};

const normalizeAdminProduct = (row = {}) => ({
  id: normalize(row.id),
  name: normalize(row.name),
  subtitle: normalize(row.subtitle || row.tagline),
  description: normalize(row.description),
  price: Number(row.price || 0),
  category: normalize(row.category),
  series: normalize(row.series),
  origin: normalize(row.origin || row.details?.origin),
  roast: normalize(row.roast || row.details?.roast),
  format: normalize(row.format),
  ingredients: ensureArray(row.ingredients),
  benefits: ensureArray(row.benefits),
  images: ensureArray(row.images),
  badges: ensureArray(row.badges),
  details: ensureObject(row.details),
  nutritionSpecs: ensureObject(row.nutrition_specs || row.nutritionSpecs),
  weight_lbs: Number(row.weight_lbs || 0),
  is_active: Boolean(row.is_active),
  is_featured: Boolean(row.is_featured),
  sort_order: Number(row.sort_order || 0),
});

const buildBlogRow = (post) => ({
  slug: slugify(post.slug || post.title),
  title: normalize(post.title),
  subtitle: normalize(post.subtitle || post.description),
  body: normalize(post.content || post.body),
  featured_image: normalize(post.heroImage || post.featured_image),
  tags: ensureArray(post.tags).map((tag) => normalize(tag)).filter(Boolean),
  status: normalize(post.status || 'published'),
  published_at: normalize(post.publishedAt || post.published_at || new Date().toISOString()),
  read_time_minutes: Number(post.readTimeMinutes || post.read_time_minutes || Number((post.readTime || '').match(/\d+/)?.[0]) || getReadTime(post.content || post.body || '')),
  author: normalize(post.author || 'Joe Hart'),
});

const normalizeAdminBlogPost = (row = {}) => ({
  slug: normalize(row.slug),
  title: normalize(row.title),
  subtitle: normalize(row.subtitle),
  content: normalize(row.body || row.content),
  heroImage: normalize(row.featured_image || row.heroImage),
  tags: ensureArray(row.tags),
  status: normalize(row.status || 'draft'),
  publishedAt: normalize(row.published_at || row.publishedAt),
  readTimeMinutes: Number(row.read_time_minutes || row.readTimeMinutes || 1),
  readTime: `${Number(row.read_time_minutes || row.readTimeMinutes || 1)} min read`,
  author: normalize(row.author || 'Joe Hart'),
});

const getRewardsTier = (points) => {
  if ((Number(points) || 0) >= 500) return 'Gold';
  if ((Number(points) || 0) >= 250) return 'Silver';
  return 'Bronze';
};

const parseProfileJson = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const getAdminRoute = (pathname) => {
  const normalized = pathname !== '/admin' ? pathname.replace(/\/+$/, '') : pathname;
  const match = ADMIN_SECTIONS.find((section) => section.path === normalized);
  if (match) return match.id;
  if (normalized === '/admin/login') return 'login';
  return 'dashboard';
};

const readAdminAuth = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'true';
};

const readAdminUsername = () => {
  if (typeof window === 'undefined') return '';
  return normalize(window.localStorage.getItem(ADMIN_USERNAME_STORAGE_KEY) || CLIENT_ADMIN_USERNAME);
};

const writeAdminAuth = (username) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'true');
  window.localStorage.setItem(ADMIN_USERNAME_STORAGE_KEY, normalize(username || CLIENT_ADMIN_USERNAME));
};

const clearAdminAuth = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  window.localStorage.removeItem(ADMIN_USERNAME_STORAGE_KEY);
};

const useToastQueue = () => {
  const [toasts, setToasts] = useState([]);

  const pushToast = (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((previous) => [...previous, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 3200);
  };

  return {
    toasts,
    pushToast,
  };
};

const ToastStack = ({ toasts }) => (
  <div className="fixed top-4 right-4 z-[120] space-y-2">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`min-w-[240px] max-w-sm rounded-2xl border px-4 py-3 shadow-lg ${
          toast.type === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}
      >
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
    ))}
  </div>
);

const LoadingState = ({ label = 'Loading...' }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">{label}</div>
);

const EmptyState = ({ title, body }) => (
  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
    <p className="text-base font-semibold text-slate-900">{title}</p>
    <p className="mt-2 text-sm text-slate-500">{body}</p>
  </div>
);

const StatusBadge = ({ value, positiveValues = [] }) => {
  const normalized = normalizeLower(value);
  const isPositive = positiveValues.includes(normalized) || ['succeeded', 'published', 'active', 'true'].includes(normalized);
  const isNegative = ['failed', 'rejected', 'false', 'archived'].includes(normalized);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
        isPositive
          ? 'bg-emerald-100 text-emerald-700'
          : isNegative
            ? 'bg-rose-100 text-rose-700'
            : 'bg-slate-100 text-slate-600'
      }`}
    >
      {value || '—'}
    </span>
  );
};

const Pagination = ({ page, pageSize, total, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / (Number(pageSize) || 25)));
  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, helper }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
    <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
    {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
  </div>
);

const SectionCard = ({ title, actions, children }) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
    {children}
  </section>
);

const ConfirmActionButton = ({ label, onConfirm, className }) => (
  <button
    type="button"
    onClick={() => {
      if (window.confirm(`Confirm ${label.toLowerCase()}?`)) {
        onConfirm();
      }
    }}
    className={className}
  >
    {label}
  </button>
);

const RichTextEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '<p></p>', false);
    }
  }, [editor, value]);

  return (
    <div className="rounded-2xl border border-slate-200">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-3">
        {[
          { label: 'Body', action: () => editor?.chain().focus().toggleBold().run() },
          { label: 'Italic', action: () => editor?.chain().focus().toggleItalic().run() },
          { label: 'H2', action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
          { label: 'Bullet', action: () => editor?.chain().focus().toggleBulletList().run() },
          { label: 'Number', action: () => editor?.chain().focus().toggleOrderedList().run() },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
          >
            {item.label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} className="min-h-[260px] px-4 py-3 text-sm text-slate-800 [&_.ProseMirror]:min-h-[220px] [&_.ProseMirror]:outline-none [&_.ProseMirror_h2]:mt-5 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5" />
    </div>
  );
};

const FileToDataUrlButton = ({ label = 'Upload image', onLoaded, multiple = false }) => (
  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
    <Upload size={16} />
    {label}
    <input
      type="file"
      accept="image/*"
      multiple={multiple}
      className="hidden"
      onChange={async (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;
        const readFile = (file) => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Unable to read file.'));
          reader.readAsDataURL(file);
        });
        try {
          const urls = await Promise.all(files.map((file) => readFile(file)));
          onLoaded(multiple ? urls : urls[0]);
          event.target.value = '';
        } catch (error) {
          console.error(error);
        }
      }}
    />
  </label>
);

const AdminLogin = ({ onLogin, isSubmitting, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-12">
      <div className="mx-auto max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Velure Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Private dashboard access for Velure Coffee.</p>
        <form
          className="mt-8 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onLogin({ username, password });
          }}
        >
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              autoComplete="username"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

const DashboardSection = ({ pushToast }) => {
  const [state, setState] = useState({ isLoading: true, error: '', data: null });

  const load = async () => {
    setState((previous) => ({ ...previous, isLoading: true, error: '' }));
    try {
      const now = new Date();
      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      const [
        totalOrdersResponse,
        recentOrdersResponse,
        monthOrdersResponse,
        customersResponse,
        pendingReviewsResponse,
        rewardsResponse,
        newsletterResponse,
        activeProductsResponse,
      ] = await Promise.all([
        supabaseRest.select('customer_orders', { select: 'id' }, { count: true }),
        supabaseRest.select('customer_orders', {
          select: 'id,customer_name,item_preview,total,payment_status,shipping_country,created_at',
          order: 'created_at.desc',
          limit: 10,
        }),
        supabaseRest.select('customer_orders', new URLSearchParams({
          select: 'id,total,payment_status,created_at',
          created_at: `gte.${startOfMonth}`,
        })),
        supabaseRest.select('customer_profiles', { select: 'user_id' }),
        supabaseRest.select('product_reviews', { select: 'id', status: 'eq.pending' }),
        supabaseRest.select('rewards_profiles', { select: 'user_id' }),
        supabaseRest.select('newsletter_subscribers', { select: 'email' }),
        supabaseRest.select('products', { select: 'id', is_active: 'eq.true' }),
      ]);

      const monthOrders = monthOrdersResponse.data || [];
      const revenueThisMonth = monthOrders.reduce((sum, order) => (
        normalizeLower(order?.payment_status) === 'succeeded' ? sum + (Number(order?.total) || 0) : sum
      ), 0);

      setState({
        isLoading: false,
        error: '',
        data: {
          metrics: {
            totalOrders: totalOrdersResponse.count || 0,
            revenueThisMonth: Number(revenueThisMonth.toFixed(2)),
            ordersThisMonth: monthOrders.length,
            totalCustomers: (customersResponse.data || []).length,
            pendingReviews: (pendingReviewsResponse.data || []).length,
            activeRewardsMembers: (rewardsResponse.data || []).length,
            newsletterSubscribers: (newsletterResponse.data || []).length,
            activeProducts: (activeProductsResponse.data || []).length,
          },
          recentOrders: recentOrdersResponse.data || [],
        },
      });
    } catch (error) {
      setState({ isLoading: false, error: error.message, data: null });
      pushToast('error', error.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (state.isLoading) return <LoadingState label="Loading dashboard..." />;
  if (state.error) return <EmptyState title="Dashboard unavailable" body={state.error} />;

  const metrics = state.data?.metrics || {};
  const recentOrders = state.data?.recentOrders || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Orders" value={metrics.totalOrders || 0} />
        <MetricCard label="Revenue This Month" value={toCurrency(metrics.revenueThisMonth)} />
        <MetricCard label="Orders This Month" value={metrics.ordersThisMonth || 0} />
        <MetricCard label="Total Customers" value={metrics.totalCustomers || 0} />
        <MetricCard label="Pending Reviews" value={metrics.pendingReviews || 0} />
        <MetricCard label="Rewards Members" value={metrics.activeRewardsMembers || 0} />
        <MetricCard label="Newsletter Subscribers" value={metrics.newsletterSubscribers || 0} />
        <MetricCard label="Active Products" value={metrics.activeProducts || 0} />
      </div>
      <SectionCard
        title="Recent orders"
        actions={(
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <RefreshCw size={16} />
            Refresh
          </button>
        )}
      >
        {recentOrders.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Item preview</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Country</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-3 font-medium text-slate-900">{order.customer_name || '—'}</td>
                    <td className="py-3 text-slate-600">{order.item_preview || '—'}</td>
                    <td className="py-3 text-slate-600">{toCurrency(order.total)}</td>
                    <td className="py-3"><StatusBadge value={order.payment_status} /></td>
                    <td className="py-3 text-slate-600">{order.shipping_country || '—'}</td>
                    <td className="py-3 text-slate-600">{toDateTimeLabel(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No orders yet" body="Recent orders will appear here once checkout activity starts." />}
      </SectionCard>
    </div>
  );
};

const OrdersSection = ({ pushToast }) => {
  const [filters, setFilters] = useState({ search: '', paymentStatus: '', dateFrom: '', dateTo: '', sort: 'created_at', direction: 'desc', page: 1 });
  const [state, setState] = useState({ isLoading: true, error: '', rows: [], total: 0 });
  const [selectedOrder, setSelectedOrder] = useState(null);

  const load = async (nextFilters = filters) => {
    setState((previous) => ({ ...previous, isLoading: true, error: '' }));
    try {
      const params = new URLSearchParams({
        select: 'id,created_at,customer_name,customer_email,item_preview,subtotal,discount,shipping_total,tax,total,payment_status,shipping_service,shipping_zone,shipping_country,package_weight_lbs,raw_metadata',
        order: `${nextFilters.sort}.${nextFilters.direction}`,
        offset: String((nextFilters.page - 1) * 25),
        limit: '25',
      });
      if (nextFilters.search) {
        params.set('or', `customer_name.ilike.*${nextFilters.search}*,customer_email.ilike.*${nextFilters.search}*`);
      }
      if (nextFilters.paymentStatus) params.set('payment_status', `eq.${nextFilters.paymentStatus}`);
      if (nextFilters.dateFrom) params.append('created_at', `gte.${nextFilters.dateFrom}`);
      if (nextFilters.dateTo) params.append('created_at', `lte.${nextFilters.dateTo}T23:59:59.999Z`);
      const payload = await supabaseRest.select('customer_orders', params, { count: true });
      setState({ isLoading: false, error: '', rows: payload.data || [], total: payload.count || 0 });
    } catch (error) {
      setState({ isLoading: false, error: error.message, rows: [], total: 0 });
      pushToast('error', error.message);
    }
  };

  useEffect(() => {
    load();
  }, [filters.page, filters.sort, filters.direction]);

  const applyFilters = () => {
    const next = { ...filters, page: 1 };
    setFilters(next);
    load(next);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <SectionCard
        title="Orders"
        actions={(
          <>
            <button
              type="button"
              onClick={async () => {
                try {
                  const params = new URLSearchParams({
                    select: 'created_at,customer_name,customer_email,item_preview,subtotal,discount,shipping_total,tax,total,payment_status,shipping_service,shipping_zone,shipping_country,package_weight_lbs',
                    order: `${filters.sort}.${filters.direction}`,
                  });
                  if (filters.search) params.set('or', `customer_name.ilike.*${filters.search}*,customer_email.ilike.*${filters.search}*`);
                  if (filters.paymentStatus) params.set('payment_status', `eq.${filters.paymentStatus}`);
                  if (filters.dateFrom) params.append('created_at', `gte.${filters.dateFrom}`);
                  if (filters.dateTo) params.append('created_at', `lte.${filters.dateTo}T23:59:59.999Z`);
                  const payload = await supabaseRest.select('customer_orders', params);
                  downloadCsv('velure-orders.csv', payload.data || []);
                  pushToast('success', 'Orders exported.');
                } catch (error) {
                  pushToast('error', error.message);
                }
              }}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            >
              Export CSV
            </button>
            <button type="button" onClick={() => load()} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">Refresh</button>
          </>
        )}
      >
        <div className="mb-4 grid gap-3 md:grid-cols-5">
          <label className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Search</span>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={filters.search} onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value }))} className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm" placeholder="Name or email" />
            </div>
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
            <select value={filters.paymentStatus} onChange={(event) => setFilters((previous) => ({ ...previous, paymentStatus: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">All</option>
              <option value="succeeded">Succeeded</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">From</span>
            <input type="date" value={filters.dateFrom} onChange={(event) => setFilters((previous) => ({ ...previous, dateFrom: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">To</span>
            <input type="date" value={filters.dateTo} onChange={(event) => setFilters((previous) => ({ ...previous, dateTo: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
          </label>
        </div>
        <div className="mb-4 flex gap-2">
          <button type="button" onClick={applyFilters} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Apply filters</button>
          <button type="button" onClick={() => { const reset = { search: '', paymentStatus: '', dateFrom: '', dateTo: '', sort: 'created_at', direction: 'desc', page: 1 }; setFilters(reset); load(reset); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700">Reset</button>
        </div>
        {state.isLoading ? <LoadingState label="Loading orders..." /> : state.error ? <EmptyState title="Orders unavailable" body={state.error} /> : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    {[
                      ['created_at', 'Created'],
                      ['customer_name', 'Customer'],
                      ['customer_email', 'Email'],
                      ['item_preview', 'Item'],
                      ['subtotal', 'Subtotal'],
                      ['discount', 'Discount'],
                      ['shipping_total', 'Shipping'],
                      ['tax', 'Tax'],
                      ['total', 'Total'],
                      ['payment_status', 'Status'],
                      ['shipping_service', 'Service'],
                      ['shipping_zone', 'Zone'],
                      ['shipping_country', 'Country'],
                      ['package_weight_lbs', 'Weight'],
                    ].map(([key, label]) => (
                      <th key={key} className="pb-3 pr-4 font-medium">
                        <button type="button" onClick={() => setFilters((previous) => ({ ...previous, sort: key, direction: previous.sort === key && previous.direction === 'asc' ? 'desc' : 'asc' }))}>
                          {label}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.rows.map((order) => (
                    <tr key={order.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedOrder(order)}>
                      <td className="py-3 pr-4 text-slate-600">{toDateTimeLabel(order.created_at)}</td>
                      <td className="py-3 pr-4 font-medium text-slate-900">{order.customer_name || '—'}</td>
                      <td className="py-3 pr-4 text-slate-600">{order.customer_email || '—'}</td>
                      <td className="py-3 pr-4 text-slate-600">{order.item_preview || '—'}</td>
                      <td className="py-3 pr-4 text-slate-600">{toCurrency(order.subtotal)}</td>
                      <td className="py-3 pr-4 text-slate-600">{toCurrency(order.discount)}</td>
                      <td className="py-3 pr-4 text-slate-600">{toCurrency(order.shipping_total)}</td>
                      <td className="py-3 pr-4 text-slate-600">{toCurrency(order.tax)}</td>
                      <td className="py-3 pr-4 text-slate-600">{toCurrency(order.total)}</td>
                      <td className="py-3 pr-4"><StatusBadge value={order.payment_status} /></td>
                      <td className="py-3 pr-4 text-slate-600">{order.shipping_service || '—'}</td>
                      <td className="py-3 pr-4 text-slate-600">{order.shipping_zone || '—'}</td>
                      <td className="py-3 pr-4 text-slate-600">{order.shipping_country || '—'}</td>
                      <td className="py-3 pr-4 text-slate-600">{order.package_weight_lbs || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={filters.page} pageSize={25} total={state.total} onPageChange={(nextPage) => setFilters((previous) => ({ ...previous, page: nextPage }))} />
          </>
        )}
      </SectionCard>
      <SectionCard title="Order detail">
        {selectedOrder ? (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</p>
              <p className="mt-1 text-slate-900">{selectedOrder.customer_name || '—'}</p>
              <p className="text-slate-500">{selectedOrder.customer_email || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-slate-400">Subtotal</p><p className="text-slate-900">{toCurrency(selectedOrder.subtotal)}</p></div>
              <div><p className="text-xs text-slate-400">Total</p><p className="text-slate-900">{toCurrency(selectedOrder.total)}</p></div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Raw metadata</p>
              <pre className="mt-2 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(selectedOrder.raw_metadata || {}, null, 2)}</pre>
            </div>
          </div>
        ) : <EmptyState title="Select an order" body="Click any order row to inspect its full details." />}
      </SectionCard>
    </div>
  );
};

const CustomersSection = ({ pushToast }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ isLoading: true, error: '', rows: [], total: 0 });
  const [detailState, setDetailState] = useState({ isLoading: false, error: '', data: null, form: null });

  const load = async (nextPage = page, nextSearch = search) => {
    setState((previous) => ({ ...previous, isLoading: true, error: '' }));
    try {
      const params = new URLSearchParams({
        select: 'user_id,full_name,email,phone,marketing_preferences,created_at',
        order: 'created_at.desc',
        offset: String((nextPage - 1) * 25),
        limit: '25',
      });
      if (nextSearch) params.set('or', `full_name.ilike.*${nextSearch}*,email.ilike.*${nextSearch}*`);
      const payload = await supabaseRest.select('customer_profiles', params, { count: true });
      const rows = payload.data || [];
      const userIds = rows.map((row) => row.user_id).filter(Boolean);
      const [ordersResponse, addressesResponse] = userIds.length ? await Promise.all([
        supabaseRest.select('customer_orders', new URLSearchParams({
          select: 'user_id,total',
          user_id: `in.(${userIds.join(',')})`,
        })),
        supabaseRest.select('customer_addresses', new URLSearchParams({
          select: 'user_id,city,country,is_default,created_at',
          user_id: `in.(${userIds.join(',')})`,
          order: 'is_default.desc,created_at.desc',
        })),
      ]) : [{ data: [] }, { data: [] }];

      const ordersByUser = new Map();
      (ordersResponse.data || []).forEach((order) => {
        const current = ordersByUser.get(order.user_id) || { count: 0, total: 0 };
        current.count += 1;
        current.total += Number(order.total) || 0;
        ordersByUser.set(order.user_id, current);
      });
      const addressByUser = new Map();
      (addressesResponse.data || []).forEach((address) => {
        if (!address?.user_id || addressByUser.has(address.user_id)) return;
        addressByUser.set(address.user_id, address);
      });

      setState({
        isLoading: false,
        error: '',
        rows: rows.map((row) => ({
          ...row,
          total_orders_count: ordersByUser.get(row.user_id)?.count || 0,
          total_spent: Number((ordersByUser.get(row.user_id)?.total || 0).toFixed(2)),
          default_address_city: addressByUser.get(row.user_id)?.city || '',
          default_address_country: addressByUser.get(row.user_id)?.country || '',
        })),
        total: payload.count || 0,
      });
    } catch (error) {
      setState({ isLoading: false, error: error.message, rows: [], total: 0 });
      pushToast('error', error.message);
    }
  };

  const loadDetail = async (userId) => {
    setDetailState({ isLoading: true, error: '', data: null, form: null });
    try {
      const [profileResponse, addressesResponse, ordersResponse, rewardsResponse] = await Promise.all([
        supabaseRest.select('customer_profiles', { user_id: `eq.${userId}`, select: 'user_id,full_name,email,phone,marketing_preferences,created_at', limit: 1 }),
        supabaseRest.select('customer_addresses', { user_id: `eq.${userId}`, select: '*', order: 'is_default.desc,created_at.desc' }),
        supabaseRest.select('customer_orders', { user_id: `eq.${userId}`, select: 'id,created_at,item_preview,total,payment_status', order: 'created_at.desc' }),
        supabaseRest.select('rewards_profiles', { user_id: `eq.${userId}`, select: 'profile,email,created_at,updated_at', limit: 1 }),
      ]);
      const profile = profileResponse.data?.[0] || {};
      setDetailState({
        isLoading: false,
        error: '',
        data: {
          profile,
          addresses: addressesResponse.data || [],
          orders: ordersResponse.data || [],
          rewardsProfile: rewardsResponse.data?.[0] || null,
        },
        form: {
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          marketing_preferences: profile.marketing_preferences || { email: true, sms: false },
        },
      });
    } catch (error) {
      setDetailState({ isLoading: false, error: error.message, data: null, form: null });
      pushToast('error', error.message);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <SectionCard title="Customers">
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-[260px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm" placeholder="Search name or email" />
          </div>
          <button type="button" onClick={() => { setPage(1); load(1, search); }} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Search</button>
        </div>
        {state.isLoading ? <LoadingState label="Loading customers..." /> : state.error ? <EmptyState title="Customers unavailable" body={state.error} /> : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium">Marketing</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium">Orders</th>
                    <th className="pb-3 font-medium">Spent</th>
                    <th className="pb-3 font-medium">Default city</th>
                    <th className="pb-3 font-medium">Country</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.rows.map((customer) => (
                    <tr key={customer.user_id} className="cursor-pointer hover:bg-slate-50" onClick={() => loadDetail(customer.user_id)}>
                      <td className="py-3 font-medium text-slate-900">{customer.full_name || '—'}</td>
                      <td className="py-3 text-slate-600">{customer.email || '—'}</td>
                      <td className="py-3 text-slate-600">{customer.phone || '—'}</td>
                      <td className="py-3 text-slate-600">{customer.marketing_preferences?.email ? 'Email' : 'None'}</td>
                      <td className="py-3 text-slate-600">{toDateLabel(customer.created_at)}</td>
                      <td className="py-3 text-slate-600">{customer.total_orders_count || 0}</td>
                      <td className="py-3 text-slate-600">{toCurrency(customer.total_spent)}</td>
                      <td className="py-3 text-slate-600">{customer.default_address_city || '—'}</td>
                      <td className="py-3 text-slate-600">{customer.default_address_country || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={25} total={state.total} onPageChange={setPage} />
          </>
        )}
      </SectionCard>
      <SectionCard title="Customer detail">
        {detailState.isLoading ? <LoadingState label="Loading customer..." /> : detailState.error ? <EmptyState title="Unable to load customer" body={detailState.error} /> : detailState.data ? (
          <div className="space-y-4 text-sm">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Full name</span>
                <input value={detailState.form.full_name} onChange={(event) => setDetailState((previous) => ({ ...previous, form: { ...previous.form, full_name: event.target.value } }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</span>
              <input value={detailState.form.phone} onChange={(event) => setDetailState((previous) => ({ ...previous, form: { ...previous.form, phone: event.target.value } }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="inline-flex items-center gap-2 text-slate-700">
                <input type="checkbox" checked={Boolean(detailState.form.marketing_preferences?.email)} onChange={(event) => setDetailState((previous) => ({ ...previous, form: { ...previous.form, marketing_preferences: { ...previous.form.marketing_preferences, email: event.target.checked } } }))} />
                Email marketing
              </label>
              <label className="inline-flex items-center gap-2 text-slate-700">
                <input type="checkbox" checked={Boolean(detailState.form.marketing_preferences?.sms)} onChange={(event) => setDetailState((previous) => ({ ...previous, form: { ...previous.form, marketing_preferences: { ...previous.form.marketing_preferences, sms: event.target.checked } } }))} />
                SMS marketing
              </label>
            </div>
            <ConfirmActionButton
              label="Save customer"
              onConfirm={async () => {
                try {
                  const payload = await supabaseRest.update('customer_profiles', {
                    user_id: `eq.${detailState.data.profile.user_id}`,
                    select: 'user_id,full_name,email,phone,marketing_preferences,created_at,updated_at',
                  }, {
                    full_name: detailState.form.full_name,
                    phone: detailState.form.phone,
                    marketing_preferences: detailState.form.marketing_preferences,
                  });
                  pushToast('success', 'Customer saved.');
                  setDetailState((previous) => ({ ...previous, data: { ...previous.data, profile: payload?.[0] || previous.data.profile } }));
                  load(page, search);
                } catch (error) {
                  pushToast('error', error.message);
                }
              }}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Addresses</p>
              <div className="mt-2 space-y-2">
                {(detailState.data.addresses || []).map((address) => (
                  <div key={address.id} className="rounded-2xl border border-slate-200 p-3 text-slate-600">
                    {address.line1 || ''} {address.city || ''} {address.country || ''}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Order history</p>
              <div className="mt-2 space-y-2">
                {(detailState.data.orders || []).map((order) => (
                  <div key={order.id} className="rounded-2xl border border-slate-200 p-3">
                    <p className="font-medium text-slate-900">{order.item_preview || 'Order'}</p>
                    <p className="text-slate-500">{toDateTimeLabel(order.created_at)} • {toCurrency(order.total)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rewards profile</p>
              <pre className="mt-2 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(detailState.data.rewardsProfile?.profile || null, null, 2)}</pre>
            </div>
          </div>
        ) : <EmptyState title="Select a customer" body="Click a customer row to edit their profile and inspect account history." />}
      </SectionCard>
    </div>
  );
};

const StarsRow = ({ rating }) => (
  <div className="flex items-center gap-1 text-amber-500">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star key={index} size={14} fill={index < rating ? 'currentColor' : 'none'} />
    ))}
  </div>
);

const ReviewsSection = ({ pushToast }) => {
  const [filters, setFilters] = useState({ status: '', productId: '', rating: '', page: 1 });
  const [state, setState] = useState({ isLoading: true, error: '', rows: [], total: 0 });
  const [selectedIds, setSelectedIds] = useState([]);

  const load = async (nextFilters = filters) => {
    setState((previous) => ({ ...previous, isLoading: true, error: '' }));
    try {
      const params = new URLSearchParams({
        select: 'id,created_at,product_id,display_name,rating,headline,comment,verified_purchase,status',
        order: 'created_at.desc',
        offset: String((nextFilters.page - 1) * 25),
        limit: '25',
      });
      if (nextFilters.status) params.set('status', `eq.${nextFilters.status}`);
      if (nextFilters.productId) params.set('product_id', `eq.${nextFilters.productId}`);
      if (nextFilters.rating) params.set('rating', `eq.${nextFilters.rating}`);
      const payload = await supabaseRest.select('product_reviews', params, { count: true });
      setState({ isLoading: false, error: '', rows: payload.data || [], total: payload.count || 0 });
      setSelectedIds([]);
    } catch (error) {
      setState({ isLoading: false, error: error.message, rows: [], total: 0 });
      pushToast('error', error.message);
    }
  };

  useEffect(() => {
    load();
  }, [filters.page]);

  const mutateReviews = async (body, successMessage) => {
    try {
      const ids = Array.isArray(body.ids) ? body.ids : [body.id];
      const targetIds = ids.filter(Boolean);
      const updateBody = {};
      if (body.action === 'approve') updateBody.status = 'published';
      if (body.action === 'reject') updateBody.status = 'rejected';
      if ('display_name' in body) updateBody.display_name = body.display_name;
      if ('headline' in body) updateBody.headline = body.headline;
      if ('comment' in body) updateBody.comment = body.comment;
      await supabaseRest.update('product_reviews', {
        id: `in.(${targetIds.join(',')})`,
        select: 'id',
      }, updateBody);
      pushToast('success', successMessage);
      load();
    } catch (error) {
      pushToast('error', error.message);
    }
  };

  return (
    <SectionCard title="Reviews">
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
          <select value={filters.status} onChange={(event) => setFilters((previous) => ({ ...previous, status: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Product ID</span>
          <input value={filters.productId} onChange={(event) => setFilters((previous) => ({ ...previous, productId: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Rating</span>
          <select value={filters.rating} onChange={(event) => setFilters((previous) => ({ ...previous, rating: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
            <option value="">All</option>
            {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button type="button" onClick={() => { const next = { ...filters, page: 1 }; setFilters(next); load(next); }} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Apply</button>
          <button type="button" onClick={() => load()} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700">Refresh</button>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <ConfirmActionButton label="Bulk approve" onConfirm={() => mutateReviews({ ids: selectedIds, action: 'approve' }, 'Reviews approved.')} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700" />
        <ConfirmActionButton label="Bulk reject" onConfirm={() => mutateReviews({ ids: selectedIds, action: 'reject' }, 'Reviews rejected.')} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700" />
      </div>
      {state.isLoading ? <LoadingState label="Loading reviews..." /> : state.error ? <EmptyState title="Reviews unavailable" body={state.error} /> : state.rows.length ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3"><input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === state.rows.length} onChange={(event) => setSelectedIds(event.target.checked ? state.rows.map((row) => row.id) : [])} /></th>
                  <th className="pb-3 font-medium">Created</th>
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Display name</th>
                  <th className="pb-3 font-medium">Rating</th>
                  <th className="pb-3 font-medium">Headline</th>
                  <th className="pb-3 font-medium">Comment</th>
                  <th className="pb-3 font-medium">Verified</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.rows.map((review) => (
                  <tr key={review.id}>
                    <td className="py-3 align-top"><input type="checkbox" checked={selectedIds.includes(review.id)} onChange={(event) => setSelectedIds((previous) => event.target.checked ? [...previous, review.id] : previous.filter((id) => id !== review.id))} /></td>
                    <td className="py-3 align-top text-slate-600">{toDateLabel(review.created_at)}</td>
                    <td className="py-3 align-top text-slate-600">{review.product_id}</td>
                    <td className="py-3 align-top">
                      <input defaultValue={review.display_name || ''} onBlur={(event) => { if (event.target.value !== (review.display_name || '')) mutateReviews({ id: review.id, display_name: event.target.value }, 'Display name updated.'); }} className="w-36 rounded-xl border border-slate-200 px-3 py-2" />
                    </td>
                    <td className="py-3 align-top"><StarsRow rating={review.rating || 0} /></td>
                    <td className="py-3 align-top">
                      <input defaultValue={review.headline || ''} onBlur={(event) => { if (event.target.value !== (review.headline || '')) mutateReviews({ id: review.id, headline: event.target.value }, 'Headline updated.'); }} className="w-44 rounded-xl border border-slate-200 px-3 py-2" />
                    </td>
                    <td className="py-3 align-top">
                      <textarea defaultValue={review.comment || ''} onBlur={(event) => { if (event.target.value !== (review.comment || '')) mutateReviews({ id: review.id, comment: event.target.value }, 'Comment updated.'); }} className="min-h-[90px] w-56 rounded-xl border border-slate-200 px-3 py-2" />
                    </td>
                    <td className="py-3 align-top">{review.verified_purchase ? <StatusBadge value="verified" positiveValues={['verified']} /> : '—'}</td>
                    <td className="py-3 align-top"><StatusBadge value={review.status} /></td>
                    <td className="py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        <ConfirmActionButton label="Approve" onConfirm={() => mutateReviews({ id: review.id, action: 'approve' }, 'Review approved.')} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700" />
                        <ConfirmActionButton label="Reject" onConfirm={() => mutateReviews({ id: review.id, action: 'reject' }, 'Review rejected.')} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" />
                        <ConfirmActionButton label="Delete" onConfirm={async () => { try { await supabaseRest.delete('product_reviews', { id: `eq.${review.id}` }); pushToast('success', 'Review deleted.'); load(); } catch (error) { pushToast('error', error.message); } }} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={filters.page} pageSize={25} total={state.total} onPageChange={(nextPage) => setFilters((previous) => ({ ...previous, page: nextPage }))} />
        </>
      ) : <EmptyState title="No reviews found" body="Product reviews will appear here once visitors submit them." />}
    </SectionCard>
  );
};

const ProductForm = ({ form, setForm, onSubmit, onDelete, isSaving }) => {
  const updateListItem = (key, index, value, nestedKey = '') => {
    setForm((previous) => {
      const next = [...previous[key]];
      next[index] = nestedKey ? { ...next[index], [nestedKey]: value } : value;
      return { ...previous, [key]: next };
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">ID</span>
          <input value={form.id} onChange={(event) => setForm((previous) => ({ ...previous, id: slugify(event.target.value) }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
          <input value={form.name} onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Tagline</span>
          <input value={form.tagline} onChange={(event) => setForm((previous) => ({ ...previous, tagline: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Price</span>
          <input value={form.price} onChange={(event) => setForm((previous) => ({ ...previous, price: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Category</span>
          <select value={form.category} onChange={(event) => setForm((previous) => ({ ...previous, category: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
            {PRODUCT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Series</span>
          <input value={form.series} onChange={(event) => setForm((previous) => ({ ...previous, series: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Origin</span>
          <input value={form.origin} onChange={(event) => setForm((previous) => ({ ...previous, origin: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Roast</span>
          <input value={form.roast} onChange={(event) => setForm((previous) => ({ ...previous, roast: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Format</span>
          <input value={form.format} onChange={(event) => setForm((previous) => ({ ...previous, format: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Weight lbs</span>
          <input value={form.weight_lbs} onChange={(event) => setForm((previous) => ({ ...previous, weight_lbs: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Sort order</span>
          <input type="number" value={form.sort_order} onChange={(event) => setForm((previous) => ({ ...previous, sort_order: Number(event.target.value) || 0 }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Description</span>
        <textarea value={form.description} onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))} className="min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
      </label>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ingredients</p>
            <button type="button" onClick={() => setForm((previous) => ({ ...previous, ingredients: [...previous.ingredients, ''] }))} className="text-sm text-slate-600">Add</button>
          </div>
          <div className="space-y-2">
            {form.ingredients.map((item, index) => (
              <div key={`ingredient-${index}`} className="flex gap-2">
                <input value={item} onChange={(event) => updateListItem('ingredients', index, event.target.value)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                <button type="button" onClick={() => setForm((previous) => ({ ...previous, ingredients: previous.ingredients.filter((_, itemIndex) => itemIndex !== index) || [''] }))} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-500"><X size={16} /></button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Badges</p>
            <button type="button" onClick={() => setForm((previous) => ({ ...previous, badges: [...previous.badges, ''] }))} className="text-sm text-slate-600">Add</button>
          </div>
          <div className="space-y-2">
            {form.badges.map((item, index) => (
              <div key={`badge-${index}`} className="flex gap-2">
                <input value={item} onChange={(event) => updateListItem('badges', index, event.target.value)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                <button type="button" onClick={() => setForm((previous) => ({ ...previous, badges: previous.badges.filter((_, itemIndex) => itemIndex !== index) || [''] }))} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-500"><X size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Benefits</p>
          <button type="button" onClick={() => setForm((previous) => ({ ...previous, benefits: [...previous.benefits, { name: '', description: '' }] }))} className="text-sm text-slate-600">Add</button>
        </div>
        <div className="space-y-2">
          {form.benefits.map((item, index) => (
            <div key={`benefit-${index}`} className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)_44px]">
              <input value={item.name} onChange={(event) => updateListItem('benefits', index, event.target.value, 'name')} placeholder="Name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <input value={item.description} onChange={(event) => updateListItem('benefits', index, event.target.value, 'description')} placeholder="Description" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <button type="button" onClick={() => setForm((previous) => ({ ...previous, benefits: previous.benefits.filter((_, itemIndex) => itemIndex !== index) || [{ name: '', description: '' }] }))} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-500"><X size={16} /></button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Images</p>
          <div className="flex gap-2">
            <FileToDataUrlButton label="Upload image" multiple onLoaded={(urls) => setForm((previous) => ({ ...previous, images: [...previous.images.filter(Boolean), ...urls] }))} />
            <button type="button" onClick={() => setForm((previous) => ({ ...previous, images: [...previous.images, ''] }))} className="text-sm text-slate-600">Add URL</button>
          </div>
        </div>
        <div className="space-y-2">
          {form.images.map((item, index) => (
            <div key={`image-${index}`} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_44px]">
              <input value={item} onChange={(event) => updateListItem('images', index, event.target.value)} placeholder="https://..." className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <button type="button" onClick={() => setForm((previous) => ({ ...previous, images: previous.images.filter((_, itemIndex) => itemIndex !== index) || [''] }))} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-500"><X size={16} /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((previous) => ({ ...previous, is_active: event.target.checked }))} />
          Active
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.is_featured} onChange={(event) => setForm((previous) => ({ ...previous, is_featured: event.target.checked }))} />
          Featured
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <ConfirmActionButton label="Save product" onConfirm={onSubmit} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white" />
        {form.id ? <ConfirmActionButton label="Delete product" onConfirm={onDelete} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700" /> : null}
        {isSaving ? <p className="self-center text-sm text-slate-500">Saving...</p> : null}
      </div>
    </div>
  );
};

const ProductsSection = ({ pushToast }) => {
  const [filters, setFilters] = useState({ category: '', isActive: '', page: 1 });
  const [state, setState] = useState({ isLoading: true, error: '', rows: [], total: 0 });
  const [form, setForm] = useState(EMPTY_PRODUCT_FORM);
  const [dragId, setDragId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = async (nextFilters = filters) => {
    setState((previous) => ({ ...previous, isLoading: true, error: '' }));
    try {
      const params = new URLSearchParams({
        select: '*',
        order: 'sort_order.asc.nullslast,name.asc',
        offset: String((nextFilters.page - 1) * 25),
        limit: '25',
      });
      if (nextFilters.category) params.set('category', `eq.${nextFilters.category}`);
      if (nextFilters.isActive) params.set('is_active', `eq.${nextFilters.isActive}`);
      const payload = await supabaseRest.select('products', params, { count: true });
      setState({
        isLoading: false,
        error: '',
        rows: (payload.data || []).map(normalizeAdminProduct),
        total: payload.count || 0,
      });
    } catch (error) {
      setState({ isLoading: false, error: error.message, rows: [], total: 0 });
      pushToast('error', error.message);
    }
  };

  useEffect(() => {
    load();
  }, [filters.page]);

  const save = async () => {
    setIsSaving(true);
    try {
      const cleaned = buildProductRow({
        ...form,
        ingredients: form.ingredients.map((item) => normalize(item)).filter(Boolean),
        badges: form.badges.map((item) => normalize(item)).filter(Boolean),
        images: form.images.map((item) => normalize(item)).filter(Boolean),
        benefits: form.benefits.filter((item) => normalize(item.name) || normalize(item.description)),
      }, Number(form.sort_order || 0));
      await supabaseRest.upsert('products', [cleaned], 'id');
      pushToast('success', 'Product saved.');
      setForm(EMPTY_PRODUCT_FORM);
      load();
    } catch (error) {
      pushToast('error', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const importFromStorefront = async () => {
    try {
      setState((previous) => ({ ...previous, isLoading: true }));
      const existing = await supabaseRest.select('products', { select: 'id' });
      const existingIds = new Set((existing.data || []).map((row) => normalize(row.id)).filter(Boolean));
      const sourceRows = STATIC_PRODUCTS.map((product, index) => buildProductRow(product, index));
      const imported = sourceRows.reduce((count, row) => (existingIds.has(normalize(row.id)) ? count : count + 1), 0);
      await supabaseRest.upsert('products', sourceRows, 'id');
      const totalSourceRecords = sourceRows.length;
      pushToast('success', `${imported} product${imported === 1 ? '' : 's'} imported from storefront${totalSourceRecords ? ` out of ${totalSourceRecords}` : ''}.`);
      await load({ ...filters, page: 1 });
      setFilters((previous) => ({ ...previous, page: 1 }));
    } catch (error) {
      pushToast('error', error.message);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <SectionCard title="Products">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Category</span>
            <select value={filters.category} onChange={(event) => setFilters((previous) => ({ ...previous, category: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">All</option>
              {PRODUCT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Active</span>
            <select value={filters.isActive} onChange={(event) => setFilters((previous) => ({ ...previous, isActive: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="button" onClick={() => { const next = { ...filters, page: 1 }; setFilters(next); load(next); }} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Apply</button>
            <ConfirmActionButton label="Import from storefront" onConfirm={importFromStorefront} className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800" />
            <button type="button" onClick={() => setForm(EMPTY_PRODUCT_FORM)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700">New</button>
          </div>
        </div>
        {state.isLoading ? <LoadingState label="Loading products..." /> : state.error ? <EmptyState title="Products unavailable" body={state.error} /> : state.rows.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium">Active</th>
                    <th className="pb-3 font-medium">Featured</th>
                    <th className="pb-3 font-medium">Sort</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.rows.map((product) => (
                    <tr
                      key={product.id}
                      draggable
                      onDragStart={() => setDragId(product.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={async () => {
                        if (!dragId || dragId === product.id) return;
                        const rows = [...state.rows];
                        const fromIndex = rows.findIndex((row) => row.id === dragId);
                        const toIndex = rows.findIndex((row) => row.id === product.id);
                        const [moved] = rows.splice(fromIndex, 1);
                        rows.splice(toIndex, 0, moved);
                        const reordered = rows.map((row, index) => ({ id: row.id, sort_order: index }));
                        setState((previous) => ({ ...previous, rows: rows.map((row, index) => ({ ...row, sort_order: index })) }));
                        try {
                          await Promise.all(reordered.map((item) => supabaseRest.update('products', {
                            id: `eq.${item.id}`,
                            select: 'id',
                          }, { sort_order: item.sort_order })));
                          pushToast('success', 'Product order updated.');
                          load();
                        } catch (error) {
                          pushToast('error', error.message);
                        }
                      }}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => setForm({
                        id: product.id || '',
                        name: product.name || '',
                        tagline: product.subtitle || '',
                        description: product.description || '',
                        price: String(product.price || 0),
                        category: product.category || 'functional',
                        series: product.series || '',
                        origin: product.origin || product.details?.origin || '',
                        roast: product.roast || product.details?.roast || '',
                        format: product.format || '',
                        ingredients: (product.ingredients || ['']).length ? (product.ingredients || ['']) : [''],
                        benefits: (product.benefits || [{ name: '', description: '' }]).length ? product.benefits : [{ name: '', description: '' }],
                        images: (product.images || ['']).length ? product.images : [''],
                        badges: (product.badges || ['']).length ? product.badges : [''],
                        weight_lbs: String(product.weight_lbs || 0),
                        is_active: Boolean(product.is_active),
                        is_featured: Boolean(product.is_featured),
                        sort_order: Number(product.sort_order || 0),
                      })}
                    >
                      <td className="py-3 font-medium text-slate-900">{product.id}</td>
                      <td className="py-3 text-slate-600">{product.name}</td>
                      <td className="py-3 text-slate-600">{product.category}</td>
                      <td className="py-3 text-slate-600">{toCurrency(product.price)}</td>
                      <td className="py-3"><StatusBadge value={product.is_active ? 'active' : 'inactive'} /></td>
                      <td className="py-3"><StatusBadge value={product.is_featured ? 'featured' : 'standard'} positiveValues={['featured']} /></td>
                      <td className="py-3 text-slate-600">{product.sort_order}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={filters.page} pageSize={25} total={state.total} onPageChange={(nextPage) => setFilters((previous) => ({ ...previous, page: nextPage }))} />
          </>
        ) : <EmptyState title="No products found" body="Create a product or import the existing catalog from the storefront." />}
      </SectionCard>
      <SectionCard title={form.id ? `Edit ${form.name || form.id}` : 'Add product'}>
        <ProductForm
          form={form}
          setForm={setForm}
          isSaving={isSaving}
          onSubmit={save}
          onDelete={async () => {
            try {
              await supabaseRest.delete('products', { id: `eq.${form.id}` });
              pushToast('success', 'Product deleted.');
              setForm(EMPTY_PRODUCT_FORM);
              load();
            } catch (error) {
              pushToast('error', error.message);
            }
          }}
        />
      </SectionCard>
    </div>
  );
};

const BlogSection = ({ pushToast }) => {
  const [filters, setFilters] = useState({ status: '', tag: '', page: 1 });
  const [state, setState] = useState({ isLoading: true, error: '', rows: [], total: 0 });
  const [form, setForm] = useState(EMPTY_BLOG_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const load = async (nextFilters = filters) => {
    setState((previous) => ({ ...previous, isLoading: true, error: '' }));
    try {
      const params = new URLSearchParams({
        select: '*',
        order: 'published_at.desc.nullslast,created_at.desc',
        offset: String((nextFilters.page - 1) * 25),
        limit: '25',
      });
      if (nextFilters.status) params.set('status', `eq.${nextFilters.status}`);
      if (nextFilters.tag) params.set('tags', `cs.{${nextFilters.tag}}`);
      const payload = await supabaseRest.select('blog_posts', params, { count: true });
      setState({
        isLoading: false,
        error: '',
        rows: (payload.data || []).map(normalizeAdminBlogPost),
        total: payload.count || 0,
      });
    } catch (error) {
      setState({ isLoading: false, error: error.message, rows: [], total: 0 });
      pushToast('error', error.message);
    }
  };

  useEffect(() => {
    load();
  }, [filters.page]);

  const save = async () => {
    setIsSaving(true);
    try {
      const payload = buildBlogRow({
        ...form,
        slug: form.slug || slugify(form.title),
        read_time_minutes: Number(form.read_time_minutes) || getReadTime(form.body),
      });
      await supabaseRest.upsert('blog_posts', [payload], 'slug');
      pushToast('success', 'Article saved.');
      setForm(EMPTY_BLOG_FORM);
      load();
    } catch (error) {
      pushToast('error', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const importFromStorefront = async () => {
    try {
      setState((previous) => ({ ...previous, isLoading: true }));
      const existing = await supabaseRest.select('blog_posts', { select: 'slug' });
      const existingSlugs = new Set((existing.data || []).map((row) => normalize(row.slug)).filter(Boolean));
      const sourceRows = STATIC_BLOG_POSTS.map((post) => buildBlogRow(post));
      const imported = sourceRows.reduce((count, row) => (existingSlugs.has(normalize(row.slug)) ? count : count + 1), 0);
      await supabaseRest.upsert('blog_posts', sourceRows, 'slug');
      const totalSourceRecords = sourceRows.length;
      pushToast('success', `${imported} article${imported === 1 ? '' : 's'} imported from storefront${totalSourceRecords ? ` out of ${totalSourceRecords}` : ''}.`);
      await load({ ...filters, page: 1 });
      setFilters((previous) => ({ ...previous, page: 1 }));
    } catch (error) {
      pushToast('error', error.message);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
      <SectionCard title="Blog">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
            <select value={filters.status} onChange={(event) => setFilters((previous) => ({ ...previous, status: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Tag</span>
            <select value={filters.tag} onChange={(event) => setFilters((previous) => ({ ...previous, tag: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">All</option>
              {BLOG_TAG_OPTIONS.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="button" onClick={() => { const next = { ...filters, page: 1 }; setFilters(next); load(next); }} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Apply</button>
            <ConfirmActionButton label="Import from storefront" onConfirm={importFromStorefront} className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800" />
            <button type="button" onClick={() => setForm(EMPTY_BLOG_FORM)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700">New</button>
          </div>
        </div>
        {state.isLoading ? <LoadingState label="Loading articles..." /> : state.error ? <EmptyState title="Journal unavailable" body={state.error} /> : state.rows.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium">Slug</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Published</th>
                    <th className="pb-3 font-medium">Tags</th>
                    <th className="pb-3 font-medium">Read time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.rows.map((post) => (
                    <tr key={post.slug} className="cursor-pointer hover:bg-slate-50" onClick={() => setForm({
                      title: post.title || '',
                      slug: post.slug || '',
                      subtitle: post.subtitle || '',
                      body: post.content || '<p></p>',
                      featured_image: post.heroImage || '',
                      tags: post.tags || [],
                      status: post.status || 'draft',
                      published_at: post.publishedAt ? post.publishedAt.slice(0, 10) : '',
                      read_time_minutes: post.readTimeMinutes || getReadTime(post.content || ''),
                      author: post.author || 'Joe Hart',
                    })}>
                      <td className="py-3 font-medium text-slate-900">{post.title}</td>
                      <td className="py-3 text-slate-600">{post.slug}</td>
                      <td className="py-3"><StatusBadge value={post.status} /></td>
                      <td className="py-3 text-slate-600">{toDateLabel(post.publishedAt)}</td>
                      <td className="py-3 text-slate-600">{(post.tags || []).join(', ')}</td>
                      <td className="py-3 text-slate-600">{post.readTime || `${post.readTimeMinutes} min read`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={filters.page} pageSize={25} total={state.total} onPageChange={(nextPage) => setFilters((previous) => ({ ...previous, page: nextPage }))} />
          </>
        ) : <EmptyState title="No articles found" body="Create a journal article or import the existing storefront articles." />}
      </SectionCard>
      <SectionCard
        title={form.slug ? `Edit ${form.title || form.slug}` : 'Add article'}
        actions={(
          <button type="button" onClick={() => setShowPreview((previous) => !previous)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
            {showPreview ? 'Hide preview' : 'Preview'}
          </button>
        )}
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Title</span>
              <input value={form.title} onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value, slug: previous.slug || slugify(event.target.value) }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Slug</span>
              <input value={form.slug} onChange={(event) => setForm((previous) => ({ ...previous, slug: slugify(event.target.value) }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Subtitle</span>
              <input value={form.subtitle} onChange={(event) => setForm((previous) => ({ ...previous, subtitle: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            </label>
          </div>
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Body</span>
            <RichTextEditor value={form.body} onChange={(body) => setForm((previous) => ({ ...previous, body, read_time_minutes: getReadTime(body) }))} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Featured image</span>
              <input value={form.featured_image} onChange={(event) => setForm((previous) => ({ ...previous, featured_image: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="https://..." />
            </label>
            <div className="flex items-end">
              <FileToDataUrlButton label="Upload featured image" onLoaded={(url) => setForm((previous) => ({ ...previous, featured_image: url }))} />
            </div>
          </div>
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Tags</span>
            <div className="flex flex-wrap gap-2">
              {BLOG_TAG_OPTIONS.map((tag) => {
                const active = form.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setForm((previous) => ({ ...previous, tags: active ? previous.tags.filter((item) => item !== tag) : [...previous.tags, tag] }))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
              <select value={form.status} onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Published at</span>
              <input type="date" value={form.published_at} onChange={(event) => setForm((previous) => ({ ...previous, published_at: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Read time minutes</span>
              <input type="number" value={form.read_time_minutes} onChange={(event) => setForm((previous) => ({ ...previous, read_time_minutes: Number(event.target.value) || 1 }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Author</span>
              <input value={form.author} onChange={(event) => setForm((previous) => ({ ...previous, author: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <ConfirmActionButton label="Save article" onConfirm={save} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white" />
            {form.slug ? <ConfirmActionButton label="Delete article" onConfirm={async () => { try { await supabaseRest.delete('blog_posts', { slug: `eq.${form.slug}` }); pushToast('success', 'Article deleted.'); setForm(EMPTY_BLOG_FORM); load(); } catch (error) { pushToast('error', error.message); } }} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700" /> : null}
            {isSaving ? <p className="self-center text-sm text-slate-500">Saving...</p> : null}
          </div>
          {showPreview ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Preview</p>
              {form.featured_image ? <img src={form.featured_image} alt={form.title} className="mt-4 h-48 w-full rounded-2xl object-cover" /> : null}
              <h3 className="mt-4 text-3xl font-semibold text-slate-900">{form.title || 'Untitled article'}</h3>
              <p className="mt-2 text-sm text-slate-500">{toDateLabel(form.published_at)} • {form.read_time_minutes} min read</p>
              <div className="prose prose-slate mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: form.body || '<p></p>' }} />
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
};

const NewsletterSection = ({ pushToast }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ isLoading: true, error: '', rows: [], total: 0, metric: 0 });

  const load = async (nextPage = page, nextSearch = search) => {
    setState((previous) => ({ ...previous, isLoading: true, error: '' }));
    try {
      const params = new URLSearchParams({
        select: 'email,source,created_at',
        order: 'created_at.desc',
        offset: String((nextPage - 1) * 25),
        limit: '25',
      });
      if (nextSearch) params.set('email', `ilike.*${nextSearch}*`);
      const payload = await supabaseRest.select('newsletter_subscribers', params, { count: true });
      setState({
        isLoading: false,
        error: '',
        rows: payload.data || [],
        total: payload.count || 0,
        metric: payload.count || 0,
      });
    } catch (error) {
      setState({ isLoading: false, error: error.message, rows: [], total: 0, metric: 0 });
      pushToast('error', error.message);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  return (
    <div className="space-y-6">
      <MetricCard label="Total subscribers" value={state.metric} />
      <SectionCard
        title="Newsletter subscribers"
        actions={(
          <button type="button" onClick={async () => { try { const params = new URLSearchParams({ select: 'email,source,created_at', order: 'created_at.desc' }); if (search) params.set('email', `ilike.*${search}*`); const payload = await supabaseRest.select('newsletter_subscribers', params); downloadCsv('velure-newsletter.csv', payload.data || []); pushToast('success', 'Subscribers exported.'); } catch (error) { pushToast('error', error.message); } }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
            Export CSV
          </button>
        )}
      >
        <div className="mb-4 flex gap-2">
          <div className="relative min-w-[260px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm" placeholder="Search by email" />
          </div>
          <button type="button" onClick={() => { setPage(1); load(1, search); }} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Search</button>
        </div>
        {state.isLoading ? <LoadingState label="Loading subscribers..." /> : state.error ? <EmptyState title="Newsletter unavailable" body={state.error} /> : state.rows.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Source</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.rows.map((subscriber) => (
                    <tr key={subscriber.email}>
                      <td className="py-3 font-medium text-slate-900">{subscriber.email}</td>
                      <td className="py-3 text-slate-600">{subscriber.source || 'site'}</td>
                      <td className="py-3 text-slate-600">{toDateTimeLabel(subscriber.created_at)}</td>
                      <td className="py-3">
                        <ConfirmActionButton label="Delete subscriber" onConfirm={async () => { try { await supabaseRest.delete('newsletter_subscribers', { email: `eq.${subscriber.email}` }); pushToast('success', 'Subscriber deleted.'); load(); } catch (error) { pushToast('error', error.message); } }} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={25} total={state.total} onPageChange={setPage} />
          </>
        ) : <EmptyState title="No subscribers yet" body="Newsletter signups will appear here after visitors join the ritual." />}
      </SectionCard>
    </div>
  );
};

const RewardsSection = ({ pushToast }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ isLoading: true, error: '', rows: [], total: 0 });
  const [detail, setDetail] = useState({ isLoading: false, data: null, pointsDelta: 0 });

  const load = async (nextPage = page, nextSearch = search) => {
    setState((previous) => ({ ...previous, isLoading: true, error: '' }));
    try {
      const params = new URLSearchParams({
        select: 'user_id,email,profile,created_at,updated_at',
        order: 'created_at.desc',
        offset: String((nextPage - 1) * 25),
        limit: '25',
      });
      if (nextSearch) params.set('email', `ilike.*${nextSearch}*`);
      const payload = await supabaseRest.select('rewards_profiles', params, { count: true });
      setState({
        isLoading: false,
        error: '',
        rows: (payload.data || []).map((profile) => {
          const data = parseProfileJson(profile.profile);
          const points = Number(data.points) || 0;
          return {
            ...profile,
            points_balance: points,
            tier: normalize(data.tier) || getRewardsTier(points),
          };
        }),
        total: payload.count || 0,
      });
    } catch (error) {
      setState({ isLoading: false, error: error.message, rows: [], total: 0 });
      pushToast('error', error.message);
    }
  };

  const loadDetail = async (userId) => {
    setDetail((previous) => ({ ...previous, isLoading: true }));
    try {
      const payload = await supabaseRest.select('rewards_profiles', {
        user_id: `eq.${userId}`,
        select: 'user_id,email,profile,created_at,updated_at',
        limit: 1,
      });
      setDetail({ isLoading: false, data: payload.data?.[0] || null, pointsDelta: 0 });
    } catch (error) {
      setDetail({ isLoading: false, data: null, pointsDelta: 0 });
      pushToast('error', error.message);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <SectionCard title="Rewards members">
        <div className="mb-4 flex gap-2">
          <div className="relative min-w-[260px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm" placeholder="Search by email" />
          </div>
          <button type="button" onClick={() => { setPage(1); load(1, search); }} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Search</button>
        </div>
        {state.isLoading ? <LoadingState label="Loading rewards..." /> : state.error ? <EmptyState title="Rewards unavailable" body={state.error} /> : state.rows.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium">Points</th>
                    <th className="pb-3 font-medium">Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.rows.map((profile) => (
                    <tr key={profile.user_id} className="cursor-pointer hover:bg-slate-50" onClick={() => loadDetail(profile.user_id)}>
                      <td className="py-3 font-medium text-slate-900">{profile.email || '—'}</td>
                      <td className="py-3 text-slate-600">{toDateLabel(profile.created_at)}</td>
                      <td className="py-3 text-slate-600">{profile.points_balance || 0}</td>
                      <td className="py-3"><StatusBadge value={profile.tier} positiveValues={['gold', 'silver', 'bronze']} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={25} total={state.total} onPageChange={setPage} />
          </>
        ) : <EmptyState title="No rewards members yet" body="Rewards members will appear here after they join the program." />}
      </SectionCard>
      <SectionCard title="Rewards profile">
        {detail.isLoading ? <LoadingState label="Loading profile..." /> : detail.data ? (
          <div className="space-y-4 text-sm">
            <p className="font-medium text-slate-900">{detail.data.email || 'Unknown member'}</p>
            <div className="flex gap-2">
              <input type="number" value={detail.pointsDelta} onChange={(event) => setDetail((previous) => ({ ...previous, pointsDelta: Number(event.target.value) || 0 }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Points" />
              <ConfirmActionButton label="Add" onConfirm={async () => { try { const profile = parseProfileJson(detail.data.profile); const nextPoints = Math.max(0, (Number(profile.points) || 0) + Math.abs(detail.pointsDelta)); await supabaseRest.update('rewards_profiles', { user_id: `eq.${detail.data.user_id}`, select: 'user_id' }, { profile: { ...profile, points: nextPoints, lifetimePoints: Math.max(Number(profile.lifetimePoints) || 0, nextPoints), tier: getRewardsTier(nextPoints) } }); pushToast('success', 'Points updated.'); load(page, search); loadDetail(detail.data.user_id); } catch (error) { pushToast('error', error.message); } }} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700" />
              <ConfirmActionButton label="Deduct" onConfirm={async () => { try { const profile = parseProfileJson(detail.data.profile); const nextPoints = Math.max(0, (Number(profile.points) || 0) - Math.abs(detail.pointsDelta)); await supabaseRest.update('rewards_profiles', { user_id: `eq.${detail.data.user_id}`, select: 'user_id' }, { profile: { ...profile, points: nextPoints, lifetimePoints: Math.max(Number(profile.lifetimePoints) || 0, nextPoints), tier: getRewardsTier(nextPoints) } }); pushToast('success', 'Points updated.'); load(page, search); loadDetail(detail.data.user_id); } catch (error) { pushToast('error', error.message); } }} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700" />
            </div>
            <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(detail.data.profile || {}, null, 2)}</pre>
          </div>
        ) : <EmptyState title="Select a rewards member" body="Click a row to inspect the full rewards profile and adjust points." />}
      </SectionCard>
    </div>
  );
};

const AdminShell = ({ activeSection, onNavigate, onLogout, username, pushToast }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sectionTitle = ADMIN_SECTIONS.find((section) => section.id === activeSection)?.label || 'Dashboard';

  const sectionComponent = {
    dashboard: <DashboardSection pushToast={pushToast} />,
    orders: <OrdersSection pushToast={pushToast} />,
    customers: <CustomersSection pushToast={pushToast} />,
    reviews: <ReviewsSection pushToast={pushToast} />,
    products: <ProductsSection pushToast={pushToast} />,
    blog: <BlogSection pushToast={pushToast} />,
    newsletter: <NewsletterSection pushToast={pushToast} />,
    rewards: <RewardsSection pushToast={pushToast} />,
  }[activeSection];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white p-5 shadow-sm transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Velure Admin</p>
              <p className="mt-2 text-sm text-slate-500">Signed in as {username}</p>
            </div>
            <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-xl border border-slate-200 p-2 lg:hidden">
              <X size={16} />
            </button>
          </div>
          <nav className="mt-8 space-y-1">
            {ADMIN_SECTIONS.map((section) => {
              const active = section.id === activeSection;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    onNavigate(section.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center rounded-2xl px-4 py-3 text-left text-sm font-medium ${active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {section.label}
                </button>
              );
            })}
          </nav>
          <button type="button" onClick={onLogout} className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
            <LogOut size={16} />
            Logout
          </button>
        </aside>
        <div className="flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-100/90 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-xl border border-slate-200 bg-white p-2 lg:hidden">
                  <Menu size={18} />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Admin</p>
                  <h1 className="text-2xl font-semibold text-slate-900">{sectionTitle}</h1>
                </div>
              </div>
            </div>
          </header>
          <main className="px-4 py-6 sm:px-6 lg:px-8">
            {sectionComponent}
          </main>
        </div>
      </div>
      {sidebarOpen ? <div className="fixed inset-0 z-30 bg-slate-950/20 lg:hidden" onClick={() => setSidebarOpen(false)} /> : null}
    </div>
  );
};

const AdminApp = () => {
  const [route, setRoute] = useState(() => getAdminRoute(typeof window !== 'undefined' ? window.location.pathname : '/admin'));
  const [sessionState, setSessionState] = useState({ isLoading: true, user: null, error: '' });
  const [loginState, setLoginState] = useState({ isSubmitting: false, error: '' });
  const { toasts, pushToast } = useToastQueue();

  const navigate = useCallback((sectionId, replace = false) => {
    const path = ADMIN_SECTIONS.find((section) => section.id === sectionId)?.path || '/admin';
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({}, '', path);
    setRoute(sectionId);
  }, []);

  const ensureSession = useCallback(() => {
    setSessionState((previous) => ({ ...previous, isLoading: true }));

    const isAuthenticated = readAdminAuth();
    const requestedRoute = getAdminRoute(window.location.pathname);

    if (!CLIENT_ADMIN_USERNAME || !CLIENT_ADMIN_PASSWORD) {
      clearAdminAuth();
      setSessionState({
        isLoading: false,
        user: null,
        error: 'Admin credentials are not configured. Set VITE_ADMIN_USERNAME and VITE_ADMIN_PASSWORD in .env.local.',
      });
      if (window.location.pathname !== '/admin/login') {
        window.history.replaceState({}, '', '/admin/login');
        setRoute('login');
      }
      return;
    }

    if (!isAuthenticated) {
      setSessionState({ isLoading: false, user: null, error: '' });
      if (window.location.pathname !== '/admin/login') {
        window.history.replaceState({}, '', '/admin/login');
        setRoute('login');
      } else {
        setRoute('login');
      }
      return;
    }

    const username = readAdminUsername() || CLIENT_ADMIN_USERNAME;
    setSessionState({
      isLoading: false,
      user: { username },
      error: '',
    });

    if (requestedRoute === 'login') {
      navigate('dashboard', true);
      return;
    }

    setRoute(requestedRoute);
  }, [navigate]);

  useEffect(() => {
    ensureSession();
    const handlePopState = () => {
      ensureSession();
    };
    const handleStorage = (event) => {
      if (event.key === ADMIN_AUTH_STORAGE_KEY || event.key === ADMIN_USERNAME_STORAGE_KEY) {
        ensureSession();
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('storage', handleStorage);
    };
  }, [ensureSession]);

  useEffect(() => {
    document.title = route === 'login' ? 'Velure Admin | Login' : `Velure Admin | ${ADMIN_SECTIONS.find((section) => section.id === route)?.label || 'Dashboard'}`;
  }, [route]);

  if (sessionState.isLoading) {
    return <div className="min-h-screen bg-slate-100 p-8"><LoadingState label="Loading admin..." /></div>;
  };

  if (!sessionState.user || route === 'login') {
    return (
      <>
        <AdminLogin
          isSubmitting={loginState.isSubmitting}
          error={loginState.error || sessionState.error}
          onLogin={async ({ username, password }) => {
            setLoginState({ isSubmitting: true, error: '' });
            try {
              if (normalize(username) !== CLIENT_ADMIN_USERNAME || normalize(password) !== CLIENT_ADMIN_PASSWORD) {
                throw new Error('Invalid username or password.');
              }
              writeAdminAuth(username);
              pushToast('success', 'Signed in.');
              setSessionState({ isLoading: false, user: { username: normalize(username) }, error: '' });
              navigate('dashboard', true);
            } catch (error) {
              clearAdminAuth();
              setLoginState({ isSubmitting: false, error: error instanceof Error ? error.message : 'Unable to sign in.' });
            } finally {
              setLoginState((previous) => ({ ...previous, isSubmitting: false }));
            }
          }}
        />
        <ToastStack toasts={toasts} />
      </>
    );
  }

  return (
    <>
      <AdminShell
        activeSection={route}
        onNavigate={navigate}
        username={sessionState.user.username}
        pushToast={pushToast}
        onLogout={() => {
          clearAdminAuth();
          setSessionState({ isLoading: false, user: null, error: '' });
          window.history.replaceState({}, '', '/admin/login');
          setRoute('login');
        }}
      />
      <ToastStack toasts={toasts} />
    </>
  );
};

export default AdminApp;
