import { api } from './api';

export type AccountType =
  | 'CUSTOMER'
  | 'SELLER'
  | 'TEACHER'
  | 'SCHOOL_ACCOUNT'
  | 'ADMINISTRATOR';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  account_type: AccountType;
  registration_date: string;
  status: UserStatus;
  last_login: string | null;
  avatar?: string | null;
}

export interface AdminSeller {
  id: number;
  store_name: string;
  owner: string;
  owner_email: string;
  products: number;
  orders: number;
  revenue: string;
  commission: string;
  status: UserStatus;
  registration_date: string;
  verified: boolean;
  payout_method?: string;
}

export interface AdminProduct {
  id: number;
  name: string;
  seller: string;
  seller_id: number;
  price: string;
  stock: number;
  status: 'PUBLISHED' | 'DRAFT' | 'PENDING_APPROVAL' | 'OUT_OF_STOCK' | 'DELETED';
  featured?: boolean;
  created_at: string;
  category: string;
  sku?: string;
  brand?: string;
  product_type?: 'physical' | 'digital' | 'service';
  cost_price?: string;
  tags?: string[];
  variants?: Array<{ label: string; size?: string; color?: string; stock_quantity?: number }>;
}

export interface AdminCourse {
  id: number;
  title: string;
  instructor: string;
  instructor_email: string;
  students: number;
  price: string;
  rating: number;
  rating_count: number;
  status: 'PUBLISHED' | 'DRAFT' | 'PENDING_APPROVAL' | 'DELETED';
  category: string;
  created_at: string;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type FundStatus = 'HELD' | 'RELEASED' | 'REFUNDED';

export interface AdminOrder {
  id: number;
  order_number: string;
  customer: string;
  customer_email: string;
  items: number;
  amount: string;
  payment: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  status: OrderStatus;
  fund_status?: FundStatus;
  disputed?: boolean;
  date: string;
  is_digital: boolean;
}

export type PaymentStatus = 'SUCCESSFUL' | 'PENDING' | 'FAILED' | 'REFUNDED';

export interface AdminPayment {
  id: number;
  transaction_id: string;
  order: string;
  customer: string;
  amount: string;
  method: 'M-Pesa' | 'Visa' | 'Mastercard' | 'Other';
  date: string;
  status: PaymentStatus;
}

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

export interface AdminWithdrawal {
  id: number;
  seller: string;
  seller_id: number;
  amount: string;
  platform_fee: string;
  seller_receives: string;
  status: WithdrawalStatus;
  requested_at: string;
  paid_at: string | null;
  payout_method: string;
}

export interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  product_count: number;
  course_count: number;
  children: CategoryNode[];
}

export interface AdminReview {
  id: number;
  product: string;
  product_id: number;
  customer: string;
  rating: number;
  comment: string;
  date: string;
  status: 'APPROVED' | 'HIDDEN' | 'PENDING';
}

export interface AdminCoupon {
  id: number;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value: string;
  start_date: string;
  end_date: string;
  usage_limit: number;
  used: number;
  active: boolean;
  created_at: string;
}

export interface PlatformNotification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
}

export interface ContentItem {
  id: number;
  key: string;
  title: string;
  content: string;
  type: 'page' | 'banner' | 'section';
  updated_at: string;
}

export interface AdminSettings {
  commission: number;
  currency: string;
  currency_symbol: string;
  default_country: string;
  allow_seller_registration: boolean;
  require_product_approval: boolean;
  require_course_approval: boolean;
  mpesa_enabled: boolean;
  visa_enabled: boolean;
  tax_rate: number;
  email_notifications: boolean;
}

export type Stat = {
  label: string;
  value: string;
  icon: string;
  href: string;
};

export type SalesPoint = {
  month: string;
  revenue: number;
  orders: number;
};

// ---- Dashboard tiles (labels only; values always come from the API) ----

export const STAT_TILES = {
  totalRevenue: { label: 'Total Revenue', icon: '💰', href: '/admin/reports' },
  todayRevenue: { label: "Today's Revenue", icon: '📈', href: '/admin/reports' },
  totalOrders: { label: 'Total Orders', icon: '📦', href: '/admin/orders' },
  pendingOrders: { label: 'Pending Orders', icon: '⏳', href: '/admin/orders' },
  totalCustomers: { label: 'Total Customers', icon: '👥', href: '/admin/users/customers' },
  activeSellers: { label: 'Active Sellers', icon: '🏪', href: '/admin/sellers' },
  totalProducts: { label: 'Total Products', icon: '📚', href: '/admin/products' },
  totalCourses: { label: 'Total Courses', icon: '🎓', href: '/admin/courses' },
} as const;

// ---- Helpers ----

function filterByParams<T>(data: T[], params?: Record<string, string>): T[] {
  if (!params) return data;
  return data.filter((item) =>
    Object.entries(params).every(([key, value]) => {
      if (!value) return true;
      const record = item as unknown as Record<string, unknown>;
      const itemValue = record[key];
      return String(itemValue ?? '').toLowerCase().includes(value.toLowerCase());
    }),
  );
}

// ---- Response mappers + API client ----

const asArray = <T,>(data: unknown): T[] =>
  Array.isArray(data)
    ? (data as T[])
    : data && typeof data === 'object' && 'results' in data
      ? asArray<T>((data as { results: unknown }).results)
      : [];

const slugify = (value: string): string =>
  value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const money = (value: string | number | null | undefined): string =>
  `${(parseFloat(value == null ? '0' : String(value)) || 0).toFixed(2)}`;

const statMoney = (value: number): string => `KSh ${(value || 0).toLocaleString()}`;
const statCount = (value: number): string => `${(value || 0).toLocaleString()}`;

const roleToAccountType = (role: string): AccountType => {
  switch (role) {
    case 'PARENT':
    case 'STUDENT':
      return 'CUSTOMER';
    case 'DISTRIBUTOR':
      return 'SELLER';
    case 'TEACHER':
      return 'TEACHER';
    case 'ADMIN':
    case 'STAFF':
      return 'ADMINISTRATOR';
    default:
      return 'CUSTOMER';
  }
};

interface BackendUser {
  id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  phone?: string;
  is_active?: boolean;
  created_at?: string;
  last_login?: string | null;
}

const mapUser = (u: BackendUser): AdminUser => ({
  id: u.id,
  name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || '',
  email: u.email || '',
  phone: u.phone || '',
  account_type: roleToAccountType(u.role || ''),
  registration_date: (u.created_at || '').slice(0, 10),
  status: u.is_active ? 'ACTIVE' : 'SUSPENDED',
  last_login: u.last_login ?? null,
  avatar: null,
});

interface BackendProfile {
  id: number;
  company_name?: string;
  email?: string;
  is_verified?: boolean;
  is_suspended?: boolean;
  created_at?: string;
  total_earned?: string | number;
  product_count?: number;
  order_count?: number;
  owner_name?: string;
}

const mapSeller = (
  p: BackendProfile,
  agg?: { revenue: number; commission: number },
): AdminSeller => {
  const earned = parseFloat(p.total_earned == null ? '0' : String(p.total_earned)) || 0;
  const revenue = agg && agg.revenue > 0 ? agg.revenue : earned;
  const commission = agg && agg.commission > 0 ? agg.commission : earned;
  return {
    id: p.id,
    store_name: p.company_name || '',
    owner: p.owner_name || '',
    owner_email: p.email || '',
    products: p.product_count ?? 0,
    orders: p.order_count ?? 0,
    revenue: money(revenue),
    commission: money(commission),
    status: p.is_suspended ? 'SUSPENDED' : p.is_verified ? 'ACTIVE' : 'PENDING',
    registration_date: (p.created_at || '').slice(0, 10),
    verified: !!p.is_verified,
    payout_method: 'M-Pesa',
  };
};

const mapPendingSeller = (p: BackendProfile): Omit<AdminSeller, 'products' | 'orders' | 'revenue' | 'commission'> => {
  const s = mapSeller(p);
  return {
    id: s.id,
    store_name: s.store_name,
    owner: s.owner,
    owner_email: s.owner_email,
    status: s.status,
    registration_date: s.registration_date,
    verified: s.verified,
  };
};

interface BackendVariant {
  id?: number;
  label?: string;
  size?: string;
  color?: string;
  stock_quantity?: number;
  price_override?: string | null;
  effective_price?: string | number;
}

export interface BackendProduct {
  id: number;
  name?: string;
  distributor_name?: string;
  linked_distributor_product?: number | null;
  linked_distributor_product_name?: string | null;
  effective_price?: string | number;
  price?: string | number;
  category?: number;
  category_name?: string;
  description?: string;
  image?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  is_reseller_listing?: boolean;
  created_at?: string;
  variants?: BackendVariant[];
  images?: BackendProductImage[];
  tags?: BackendTag[];
  applicable_levels?: number[];
  learning_areas?: number[];
  sku?: string;
  brand?: string;
  product_type?: string;
  cost_price?: string | number | null;
  low_stock_threshold?: number;
  backorders?: boolean;
  shipping_weight?: string | number | null;
  shipping_length?: string | number | null;
  shipping_width?: string | number | null;
  shipping_height?: string | number | null;
}

interface BackendPayment {
  id?: number;
  status?: string;
  amount?: string | number;
  method?: string;
  mpesa_receipt_number?: string;
  confirmed_at?: string;
}

interface BackendOrder {
  id: number;
  pickup_code?: string;
  learner_name?: string;
  delivery_name?: string;
  items?: unknown[];
  total_amount?: string | number;
  payment?: BackendPayment | null;
  status?: string;
  created_at?: string;
  delivery_address?: string;
  fund_status?: string;
  disputed?: boolean;
}

interface BackendCourse {
  id: number;
  title?: string;
  teacher_name?: string;
  status?: string;
  enrollments?: unknown[];
  learning_area?: string | number;
  grade_name?: string;
  created_at?: string;
}

interface BackendCategory {
  id: number;
  name?: string;
  parent?: number | null;
}

export interface BackendGrade {
  id: number;
  name: string;
  stage: 'pre_primary' | 'primary' | 'junior_secondary' | 'senior_secondary';
  order: number;
}

export interface BackendLearningArea {
  id: number;
  name: string;
  code?: string;
  grade?: number;
  pathway?: number | null;
  school?: number;
}

export interface BackendPathway {
  id: number;
  name: string;
  code?: string;
}

export interface BackendTag {
  id: number;
  name: string;
}

export interface BackendProductImage {
  id: number;
  image_url?: string | null;
  alt?: string;
  is_primary?: boolean;
}

export interface CreateProductData {
  name: string;
  category: number;
  price: string | number;
  description?: string;
  is_active?: boolean;
  sku?: string;
  brand?: string;
  product_type?: 'physical' | 'digital' | 'service';
  cost_price?: string;
  low_stock_threshold?: number;
  backorders?: boolean;
  shipping_weight?: string;
  shipping_length?: string;
  shipping_width?: string;
  shipping_height?: string;
  applicable_levels?: number[];
  learning_areas?: number[];
  institution_categories?: string[];
  tags?: string[];
  variants?: Array<{
    label: string;
    size?: string;
    color?: string;
    stock_quantity?: number;
    price_override?: string | null;
  }>;
  images?: File[];
}

const mapProduct = (p: BackendProduct): AdminProduct => {
  const stock = Array.isArray(p.variants)
    ? p.variants.reduce((sum: number, v) => sum + (v.stock_quantity || 0), 0)
    : 0;
  const price = p.effective_price ?? p.price ?? 0;
  let status: AdminProduct['status'];
  if (!p.is_active) status = 'DRAFT';
  else if (stock === 0) status = 'OUT_OF_STOCK';
  else status = 'PUBLISHED';
  return {
    id: p.id,
    name: p.name || '',
    seller: p.distributor_name || p.linked_distributor_product_name || '',
    seller_id: p.linked_distributor_product ?? 0,
    price: money(price),
    stock,
    status,
    featured: !!p.is_reseller_listing,
    created_at: p.created_at || '',
    category: p.category_name || '',
  };
};

const mapCourse = (c: BackendCourse): AdminCourse => {
  const st = (c.status || '').toLowerCase();
  let status: AdminCourse['status'];
  if (st === 'published') status = 'PUBLISHED';
  else if (st === 'submitted_for_review') status = 'PENDING_APPROVAL';
  else status = 'DRAFT';
  return {
    id: c.id,
    title: c.title || '',
    instructor: c.teacher_name || '',
    instructor_email: '',
    students: Array.isArray(c.enrollments) ? c.enrollments.length : 0,
    price: '0.00',
    rating: 0,
    rating_count: 0,
    status,
    category: [c.grade_name, c.learning_area ? String(c.learning_area) : ''].filter(Boolean).join(' > '),
    created_at: c.created_at || '',
  };
};

const mapOrder = (o: BackendOrder): AdminOrder => {
  const st = (o.status || '').toLowerCase();
  let status: OrderStatus;
  switch (st) {
    case 'paid':
      status = 'PAID';
      break;
    case 'ready_for_pickup':
      status = 'PROCESSING';
      break;
    case 'picked_up':
      status = 'SHIPPED';
      break;
    case 'cancelled':
      status = 'CANCELLED';
      break;
    case 'pending_payment':
      status = 'PENDING';
      break;
    default:
      status = 'PENDING';
  }
  let payment: AdminOrder['payment'] = 'PENDING';
  if (o.payment) {
    const ps = (o.payment.status || '').toLowerCase();
    payment = ps === 'confirmed' ? 'PAID' : ps === 'failed' ? 'FAILED' : 'PENDING';
  }
  const customer = o.learner_name || o.delivery_name || `Order #${o.id}`;
  return {
    id: o.id,
    order_number: o.pickup_code || `LP${o.id}`,
    customer,
    customer_email: '',
    items: Array.isArray(o.items) ? o.items.length : 0,
    amount: money(o.total_amount),
    payment,
    status,
    fund_status: (o.fund_status || 'HELD') as FundStatus,
    disputed: !!o.disputed,
    date: o.created_at || '',
    is_digital: false,
  };
};

const mapPayment = (o: BackendOrder, idx: number): AdminPayment => {
  const pm = o.payment || {};
  const method = (pm.method || '').toLowerCase() === 'mpesa' ? 'M-Pesa' : 'Other';
  const ps = (pm.status || '').toLowerCase();
  const status: PaymentStatus = ps === 'confirmed' ? 'SUCCESSFUL' : ps === 'failed' ? 'FAILED' : 'PENDING';
  return {
    id: pm.id || idx,
    transaction_id: pm.mpesa_receipt_number || `PAY-${pm.id || idx}`,
    order: o.pickup_code || `LP${o.id}`,
    customer: o.learner_name || o.delivery_name || '',
    amount: money(pm.amount || o.total_amount),
    method,
    date: pm.confirmed_at || o.created_at || '',
    status,
  };
};

const mapCategoryTree = (flat: BackendCategory[]): CategoryNode[] => {
  const byId = new Map<number, CategoryNode>();
  const nodes: CategoryNode[] = [];
  flat.forEach((c) =>
    byId.set(c.id, {
      id: c.id,
      name: c.name || '',
      slug: slugify(c.name || ''),
      product_count: 0,
      course_count: 0,
      children: [],
    }),
  );
  flat.forEach((c) => {
    const node = byId.get(c.id);
    if (node && c.parent && byId.has(c.parent)) {
      byId.get(c.parent)!.children.push(node);
    } else if (node) {
      nodes.push(node);
    }
  });
  return nodes;
};

/** GET a DRF list and follow `next` so paginated endpoints (shop products) are not cut to page 1. */
async function getAllPages<T>(url: string, params?: Record<string, string>): Promise<T[]> {
  let res = await api.get(url, { params });
  let rows = asArray<T>(res.data);
  let guard = 0;
  while (res.data && !Array.isArray(res.data) && res.data.next && guard++ < 200) {
    // Re-request our own URL with the page number, never the absolute `next` (scheme/host/prefix may differ behind nginx).
    const page = new URL(res.data.next, 'http://x').searchParams.get('page');
    if (!page) break;
    res = await api.get(url, { params: { ...params, page } });
    rows = rows.concat(asArray<T>(res.data));
  }
  return rows;
}

const toPayments = (rows: BackendOrder[]): AdminPayment[] => rows.map((o, i) => mapPayment(o, i));

// Every read throws on failure (callers show the error) and returns [] / null for genuinely empty data.
// There is no mock fallback: a failed request must never render as invented figures.
export const adminApi = {
  getDashboardStats: async (): Promise<Stat[]> => {
    const [orders, users, productCount, sellers, courses] = await Promise.all([
      adminApi.getOrders(),
      adminApi.getUsers(),
      adminApi.getProductCount(),
      adminApi.getSellers(),
      adminApi.getCourses(),
    ]);
    const totalRevenue = orders.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
    const today = new Date().toISOString().slice(0, 10);
    const todayRevenue = orders
      .filter((o) => (o.date || '').slice(0, 10) === today)
      .reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
    const pendingOrders = orders.filter((o) => o.status === 'PENDING' || o.payment === 'PENDING').length;
    const totalCustomers = users.filter((u) => u.account_type === 'CUSTOMER').length;
    const activeSellers = sellers.filter((s) => s.status === 'ACTIVE').length;
    return [
      { ...STAT_TILES.totalRevenue, value: statMoney(totalRevenue) },
      { ...STAT_TILES.todayRevenue, value: statMoney(todayRevenue) },
      { ...STAT_TILES.totalOrders, value: statCount(orders.length) },
      { ...STAT_TILES.pendingOrders, value: statCount(pendingOrders) },
      { ...STAT_TILES.totalCustomers, value: statCount(totalCustomers) },
      { ...STAT_TILES.activeSellers, value: statCount(activeSellers) },
      { ...STAT_TILES.totalProducts, value: statCount(productCount) },
      { ...STAT_TILES.totalCourses, value: statCount(courses.length) },
    ];
  },

  getSalesAnalytics: async (): Promise<SalesPoint[]> => {
    const orders = await adminApi.getOrders();
    const byMonth = new Map<string, { revenue: number; orders: number }>();
    orders.forEach((o) => {
      const d = new Date(o.date);
      if (!o.date || Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const cur = byMonth.get(key) || { revenue: 0, orders: 0 };
      cur.revenue += parseFloat(o.amount) || 0;
      cur.orders += 1;
      byMonth.set(key, cur);
    });
    return Array.from(byMonth.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([key, v]) => {
        const [y, m] = key.split('-').map(Number);
        const month = `${new Date(y, m - 1, 1).toLocaleString('default', { month: 'short' })} ${y}`;
        return { month, revenue: Math.round(v.revenue), orders: v.orders };
      });
  },

  getRecentOrders: () => adminApi.getOrders().then((orders) => orders.slice(0, 5)),

  getUsers: (params?: Record<string, string>) =>
    api.get('/auth/users/', { params }).then((r) => asArray<BackendUser>(r.data).map(mapUser)),
  getUser: (id: string) => api.get(`/auth/users/${id}/`).then((r) => mapUser(r.data)),
  updateUser: (id: string, data: Partial<AdminUser>) => {
    const patch: Record<string, unknown> = {};
    if (data.status === 'ACTIVE') patch.is_active = true;
    else if (data.status === 'SUSPENDED') patch.is_active = false;
    if (data.name) {
      const [first, ...rest] = data.name.split(' ');
      if (first) patch.first_name = first;
      if (rest.length) patch.last_name = rest.join(' ');
    }
    if (data.phone) patch.phone = data.phone;
    return api.patch(`/auth/users/${id}/`, patch).then((r) => mapUser(r.data));
  },
  deleteUser: (id: string) => api.delete(`/auth/users/${id}/`).then((r) => r.data),

  getSellers: async (): Promise<AdminSeller[]> => {
    const [profiles, wallets] = await Promise.all([
      api.get('/distributor/profiles/').then((r) => asArray<BackendProfile>(r.data)),
      api.get('/distributor/wallet/').then((r) =>
        asArray<{ distributor: number; transactions?: Array<{ order_total?: string | number; amount?: string | number }> }>(r.data),
      ),
    ]);
    const walletByProfile = new Map<number, { revenue: number; commission: number }>();
    wallets.forEach((w) => {
      const base = walletByProfile.get(w.distributor) || { revenue: 0, commission: 0 };
      (w.transactions || []).forEach((t) => {
        base.revenue += parseFloat(t.order_total == null ? '0' : String(t.order_total)) || 0;
        base.commission += parseFloat(t.amount == null ? '0' : String(t.amount)) || 0;
      });
      walletByProfile.set(w.distributor, base);
    });
    return profiles.map((p) => mapSeller(p, walletByProfile.get(p.id)));
  },
  getSeller: (id: string) => api.get(`/distributor/profiles/${id}/`).then((r) => mapSeller(r.data)),
  updateSeller: (id: string, data: Partial<AdminSeller>) => {
    if (data.status === 'SUSPENDED') {
      return api.post(`/distributor/profiles/${id}/suspend/`).then((r) =>
        mapSeller(r.data.profile ?? r.data),
      );
    }
    if (data.status === 'ACTIVE') {
      return api.post(`/distributor/profiles/${id}/unsuspend/`).then((r) =>
        mapSeller(r.data.profile ?? r.data),
      );
    }
    return api.patch(`/distributor/profiles/${id}/`, data).then((r) => mapSeller(r.data));
  },
  getPendingSellers: () =>
    api.get('/distributor/profiles/pending/').then((r) => asArray<BackendProfile>(r.data).map(mapPendingSeller)),
  approveSeller: (id: string) => api.post(`/distributor/profiles/${id}/approve/`).then((r) => r.data),
  rejectSeller: (id: string) => api.post(`/distributor/profiles/${id}/suspend/`).then((r) => r.data),

  getProducts: (params?: Record<string, string>) =>
    getAllPages<BackendProduct>('/shop/products/', params).then((rows) => filterByParams(rows.map(mapProduct), params)),
  /** Total from the paginated list's `count`, so the dashboard does not download every product page. */
  getProductCount: (): Promise<number> =>
    api.get('/shop/products/', { params: { page_size: 1 } }).then((r) => {
      const d = r.data as { count?: number } | unknown[];
      return Array.isArray(d) ? d.length : typeof d?.count === 'number' ? d.count : asArray(d).length;
    }),
  getProduct: (id: string) => api.get(`/shop/products/${id}/`).then((r) => mapProduct(r.data)),
  updateProduct: (id: string, data: Partial<AdminProduct>) => {
    const patch: Record<string, unknown> = {};
    if (data.status !== undefined) {
      patch.is_active =
        data.status === 'PUBLISHED' || data.status === 'OUT_OF_STOCK' || data.status === 'PENDING_APPROVAL';
    }
    return api.patch(`/shop/products/${id}/`, patch).then((r) => mapProduct(r.data));
  },
  deleteProduct: (id: string) => api.delete(`/shop/products/${id}/`).then((r) => r.data),
  createProduct: async (data: CreateProductData) => {
    const payload: Record<string, unknown> = {
      name: data.name,
      category: data.category,
      price: data.price,
      description: data.description ?? '',
      is_active: data.is_active !== false,
      low_stock_threshold: data.low_stock_threshold ?? 0,
      backorders: !!data.backorders,
      applicable_levels: data.applicable_levels ?? [],
      learning_areas: data.learning_areas ?? [],
      tags_data: data.tags ?? [],
      variants_data: data.variants ?? [],
    };
    if (data.sku) payload.sku = data.sku;
    if (data.brand) payload.brand = data.brand;
    if (data.product_type) payload.product_type = data.product_type;
    if (data.cost_price) payload.cost_price = data.cost_price;
    if (data.shipping_weight) payload.shipping_weight = data.shipping_weight;
    if (data.shipping_length) payload.shipping_length = data.shipping_length;
    if (data.shipping_width) payload.shipping_width = data.shipping_width;
    if (data.shipping_height) payload.shipping_height = data.shipping_height;
    if (data.institution_categories && data.institution_categories.length)
      payload.institution_categories = data.institution_categories;
    // A failed create must reject: never hand back an invented product.
    const product: BackendProduct = await api.post('/shop/products/', payload).then((r) => r.data);
    if (data.images && data.images.length > 0 && product.id) {
      const form = new FormData();
      data.images.forEach((f) => form.append('files', f));
      try {
        await api.post(`/shop/products/${product.id}/upload_images/`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch {
        throw new Error('Product was created, but its images failed to upload. Add them from the product page.');
      }
    }
    return product;
  },
  uploadProductImages: (id: number, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return api
      .post(`/shop/products/${id}/upload_images/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => asArray<BackendProductImage>(r.data));
  },
  importProducts: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post('/shop/products/import_products/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data as { created: number; failed: number; errors: unknown[] });
  },

  getCourses: (params?: Record<string, string>) =>
    api
      .get('/courses/courses/', { params })
      .then((r) => filterByParams(asArray<BackendCourse>(r.data).map(mapCourse), params)),
  getCourse: (id: string) => api.get(`/courses/courses/${id}/`).then((r) => mapCourse(r.data)),
  updateCourse: (id: string, data: Partial<AdminCourse>) =>
    api.patch(`/courses/courses/${id}/`, data).then((r) => mapCourse(r.data)),

  getOrders: (params?: Record<string, string>) =>
    getAllPages<BackendOrder>('/shop/orders/', params).then((rows) => filterByParams(rows.map(mapOrder), params)),
  updateOrder: (id: string, data: Partial<AdminOrder>) => {
    const patch: Record<string, unknown> = {};
    if (data.status !== undefined) {
      const map: Record<string, string> = {
        PAID: 'paid',
        PROCESSING: 'ready_for_pickup',
        SHIPPED: 'picked_up',
        DELIVERED: 'picked_up',
        CANCELLED: 'cancelled',
        REFUNDED: 'cancelled',
        PENDING: 'pending_payment',
      };
      patch.status = map[data.status] || 'pending_payment';
    }
    return api.patch(`/shop/orders/${id}/`, patch).then((r) => mapOrder(r.data));
  },

  getPayments: (params?: Record<string, string>) =>
    getAllPages<BackendOrder>('/shop/orders/').then((rows) => filterByParams(toPayments(rows), params)),
  getTransactions: () => getAllPages<BackendOrder>('/shop/orders/').then(toPayments),

  getHeldFunds: () =>
    adminApi
      .getOrders()
      .then((orders) => orders.filter((o) => o.fund_status === 'HELD' && o.status === 'DELIVERED' && !o.disputed)),
  releaseFunds: (id: string) =>
    api.post(`/shop/orders/${id}/release_funds/`, {}).then((r) => r.data),
  confirmDelivery: (id: string) =>
    api.post(`/shop/orders/${id}/confirm_delivery/`, {}).then((r) => r.data),
  disputeOrder: (id: string, reason: string) =>
    api.post(`/shop/orders/${id}/dispute/`, { reason }).then((r) => r.data),

  getCategories: () =>
    api.get('/shop/categories/').then((r) => mapCategoryTree(asArray<BackendCategory>(r.data))),
  createCategory: (data: unknown) => api.post('/shop/categories/', data).then((r) => r.data),
  updateCategory: (id: string, data: unknown) => api.patch(`/shop/categories/${id}/`, data).then((r) => r.data),

  getGrades: () => api.get('/academics/grades/').then((r) => asArray<BackendGrade>(r.data)),
  getLearningAreas: () => api.get('/academics/learning-areas/').then((r) => asArray<BackendLearningArea>(r.data)),
  getPathways: () => api.get('/academics/pathways/').then((r) => asArray<BackendPathway>(r.data)),

  // Coupons, withdrawals, settings, reviews, notifications and content have no backend yet
  // (see docs/specs/distributor-december-plan.md). Their methods were removed, not mocked.
};
