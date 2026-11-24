import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// One refresh at a time: concurrent 401s share the in-flight refresh. The API rotates and blacklists
// refresh tokens, so a second refresh with the old token fails and would log the user out; the new
// refresh token from each response must be stored too.
let refreshPromise: Promise<string> | null = null;
const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh/`, { refresh: localStorage.getItem('refresh_token') })
      .then((response) => {
        const { access, refresh } = response.data;
        localStorage.setItem('access_token', access);
        if (refresh) localStorage.setItem('refresh_token', refresh);
        return access as string;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Account holds a temporary password: the API refuses everything until it is changed.
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === 'password_change_required' &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/account/change-password')
    ) {
      window.location.href = '/account/change-password';
      return Promise.reject(error);
    }
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry
        && !String(originalRequest.url || '').includes('/auth/refresh/')) {
      originalRequest._retry = true;
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (refreshToken) {
        try {
          const access = await refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login/', { email, password });
  return response.data;
};

export const changePassword = async (current_password: string, new_password: string) => {
  const response = await api.post('/auth/change-password/', { current_password, new_password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/users/me/');
  return response.data;
};

export const distributorApi = {
  getProducts: (params?: { category?: string; tags?: string; min_price?: number; max_price?: number }) =>
    api.get('/distributor/products/', { params }).then((r) => r.data),
   createProduct: (data: unknown) => api.post('/distributor/products/', data).then((r) => r.data),
   updateProduct: (id: string, data: unknown) => api.patch(`/distributor/products/${id}/`, data).then((r) => r.data),
   deleteProduct: (id: string) => api.delete(`/distributor/products/${id}/`).then((r) => r.data),
   uploadProductImages: (id: number, files: File[]) => {
     const form = new FormData();
     files.forEach((f) => form.append('files', f));
     return api
       .post(`/distributor/products/${id}/upload_images/`, form, {
         headers: { 'Content-Type': 'multipart/form-data' },
       })
       .then((r) => r.data);
   },

  getOrders: () => api.get('/distributor/orders/').then((r) => r.data),
  updateOrderStatus: (id: string, status: string) => api.patch(`/distributor/orders/${id}/`, { status }).then((r) => r.data),

  getFulfilments: (status?: string, pageSize?: number) =>
    api.get('/distributor/fulfilments/', { params: { ...(status ? { status } : {}), ...(pageSize ? { page_size: pageSize } : {}) } }).then((r) => r.data),
  advanceFulfilment: (id: number, to: string) =>
    api.post(`/distributor/fulfilments/${id}/advance/`, { to }).then((r) => r.data),
  dispatchFulfilment: (id: number, data: { carrier: string; tracking_number?: string }) =>
    api.post(`/distributor/fulfilments/${id}/dispatch/`, data).then((r) => r.data),
  getPackingList: (id: number) => api.get(`/distributor/fulfilments/${id}/packing-list/`).then((r) => r.data),
  deliverFulfilment: (id: number) => api.post(`/distributor/fulfilments/${id}/mark_delivered/`, {}).then((r) => r.data),
  failFulfilment: (id: number, reason: string) =>
    api.post(`/distributor/fulfilments/${id}/mark_failed/`, { reason }).then((r) => r.data),

  getDeliveries: () => api.get('/distributor/deliveries/').then((r) => r.data),
  updateDelivery: (id: string, data: unknown) => api.patch(`/distributor/deliveries/${id}/`, data).then((r) => r.data),

   getWallet: () => api.get('/distributor/wallet/').then((r) => r.data),

   getCategories: () =>
     api.get('/shop/categories/').then((r) => r.data),
getGrades: () =>
      api.get('/academics/grades/').then((r) => r.data),
   getLearningAreas: () =>
      api.get('/academics/learning-areas/').then((r) => r.data),
   getPathways: () =>
      api.get('/academics/pathways/').then((r) => r.data),
   searchVariants: (query: string) =>
      api.get('/shop/variants/search/', { params: { q: query } }).then((r) => r.data),
};

export interface ShopProductVariant {
  id: number;
  label: string;
  stock_quantity: number;
  price_override: string | null;
  effective_price: string;
}

export interface ShopProduct {
  id: number;
  name: string;
  title?: string;
  description: string;
  price: string;
  effective_price: string;
  image: string | null;
  image_url: string | null;
  cover_image?: string | null;
  category: number;
  category_name: string;
  is_active: boolean;
  variants: ShopProductVariant[];
  linked_distributor_product: number | null;
  linked_distributor_product_name: string | null;
  distributor_name: string | null;
  distributor_price: string | null;
  commission_amount: string | null;
  markup_type: string | null;
  markup_value: string | null;
  is_reseller_listing: boolean;
  created_at: string;
  brand?: string;
  tags?: Array<{ id: number; name: string }>;
  applicable_levels?: number[];
  learning_areas?: number[];
  institution_categories?: string[];
  sku?: string;
  product_type?: string;
}

export interface ShopCategory {
  id: number;
  name: string;
  school: number;
}

export interface Grade {
  id: number;
  name: string;
  stage: string;
  order: number;
}

export interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface BooklistItem {
  id: number;
  booklist: number;
  variant: number;
  variant_label: string;
  product_id: number;
  product_name: string;
  required_quantity: number;
  status: 'required' | 'optional' | 'provided';
  approved_alternative: number | null;
  approved_alternative_label: string | null;
  effective_price: string;
  stock_quantity: number;
  is_available: boolean;
  image_url: string | null;
  notes: string;
}

export interface Booklist {
  id: number;
  school: number;
  school_name: string;
  grade: number;
  grade_name: string;
  name: string;
  academic_year: number;
  year_name: string;
  version: string;
  status: 'draft' | 'published' | 'archived';
  is_active: boolean;
  items: BooklistItem[];
  total_items: number;
  total_required_price: number;
  created_at: string;
  updated_at: string;
}

export interface BooklistItemCreate {
  variant: number;
  required_quantity?: number;
  status?: 'required' | 'optional' | 'provided';
  approved_alternative?: number | null;
  notes?: string;
}

export interface VariantSearchResult {
  id: number;
  product_id: number;
  product_name: string;
  category_name: string;
  label: string;
  size: string;
  color: string;
  stock_quantity: number;
  effective_price: string;
  image_url: string | null;
}

export const booklistApi = {
  getAcademicYears: () =>
    api.get<AcademicYear[] | { results: AcademicYear[] }>('/booklists/academic-years/').then((r) => r.data),
  getBooklists: (params?: Record<string, string | number>) =>
    api.get<Booklist[] | { results: Booklist[] }>('/booklists/', { params: { page_size: 20, ...params } }).then((r) => r.data),
  getBooklist: (id: number | string) =>
    api.get<Booklist>(`/booklists/${id}/`).then((r) => r.data),
  getBooklistItems: (id: number | string) =>
    api.get<BooklistItem[]>(`/booklists/${id}/items/`).then((r) => r.data),
  createBooklist: (data: {
    grade: number;
    academic_year: number;
    name: string;
    version?: string;
    status?: 'draft' | 'published' | 'archived';
  }) => api.post<Booklist>('/booklists/', data).then((r) => r.data),
  updateBooklist: (id: number | string, data: Partial<Booklist>) =>
    api.patch<Booklist>(`/booklists/${id}/`, data).then((r) => r.data),
  addItems: (id: number | string, items: BooklistItemCreate[]) =>
    api.post<BooklistItem[]>(`/booklists/${id}/add_items/`, { items }).then((r) => r.data),
  publishBooklist: (id: number | string) =>
    api.post(`/booklists/${id}/publish/`).then((r) => r.data),
  archiveBooklist: (id: number | string) =>
    api.post(`/booklists/${id}/archive/`).then((r) => r.data),
  deleteBooklist: (id: number | string) =>
    api.delete(`/booklists/${id}/`).then((r) => r.data),
};

export interface PaymentStatus {
  order_status: string;
  payment_status: 'initiated' | 'confirmed' | 'failed' | null;
  result_desc?: string;
  mpesa_receipt_number?: string;
}

export const shopApi = {
  getCategories: () =>
    api.get<ShopCategory[] | { results: ShopCategory[] }>('/shop/categories/').then((r) => r.data),
  getProducts: (params?: Record<string, string | number>) =>
    api.get<ShopProduct[] | { results: ShopProduct[] }>('/shop/products/', { params }).then((r) => r.data),
  getProduct: (id: number | string) => api.get<ShopProduct>(`/shop/products/${id}/`).then((r) => r.data),

  getPublicProducts: async (params?: Record<string, string | number>): Promise<ShopProduct[]> => {
    type Page = ShopProduct[] | { results?: ShopProduct[]; count?: number };
    const pageSize = 200;
    const first = await api.get<Page>('/shop/public/', { params: { page_size: pageSize, page: 1, ...params } }).then((r) => r.data);
    if (Array.isArray(first)) return first;
    const results: ShopProduct[] = [...(first.results || [])];
    const count = first.count || results.length;
    if (count <= results.length) return results;
    const totalPages = Math.ceil(count / pageSize);
    const pageNums: number[] = [];
    for (let p = 2; p <= totalPages; p++) pageNums.push(p);
    const batchSize = 6;
    for (let i = 0; i < pageNums.length; i += batchSize) {
      const batch = pageNums.slice(i, i + batchSize);
      const pages = await Promise.all(
        batch.map((p) => api.get<Page>('/shop/public/', { params: { page_size: pageSize, page: p, ...params } }).then((r) => r.data))
      );
      for (const pg of pages) results.push(...(Array.isArray(pg) ? pg : pg.results || []));
    }
    return results;
  },
  getHeroItems: () =>
    api.get<ShopProduct[] | { results: ShopProduct[] }>('/shop/public/hero_items/').then((r) => {
      const data = r.data;
      return Array.isArray(data) ? data : (data.results || []);
    }),
  getPublicProduct: (id: number | string) => api.get<ShopProduct>(`/shop/public/${id}/`).then((r) => r.data),
  getPublicGrades: () =>
    api.get<Grade[] | { results: Grade[] }>('/academics/grades/').then((r) => r.data),

  getLearners: () =>
    api.get<Array<{ id: number; parent: number; learner: number; relationship: string }> | { results: Array<{ id: number; parent: number; learner: number; relationship: string }> }>('/auth/parent-learner-links/').then((r) => r.data),

  createOrder: (data: { learner?: number; items: Array<{ variant?: number; product?: number; quantity: number }> }) =>
    api.post('/shop/orders/', data).then((r) => r.data),
  getOrder: (id: number | string) => api.get(`/shop/orders/${id}/`).then((r) => r.data),
  getMyOrders: () => api.get<{ results: unknown[] } | unknown[]>('/shop/orders/my_orders/').then((r) => r.data),
  payMpesa: (orderId: number | string, phone?: string) =>
    api.post(`/shop/orders/${orderId}/pay_mpesa/`, { phone }).then((r) => r.data),
  /** Read-only: the backend re-checks with M-Pesa. Orders are never confirmed by the client. */
  getPaymentStatus: (orderId: number | string) =>
    api.get<PaymentStatus>(`/shop/orders/${orderId}/payment-status/`).then((r) => r.data),

  /** WhatsApp checkout: the order is recorded first; the response carries the wa.me link. */
  whatsappCheckout: (data: {
    delivery_name: string;
    delivery_phone: string;
    delivery_address?: string;
    delivery_county?: string;
    delivery_notes?: string;
    parent_school?: number | null;
    items: Array<{ variant?: number; product?: number; quantity: number }>;
  }) => api.post<WhatsAppCheckoutResult>('/shop/guest-orders/whatsapp/', data).then((r) => r.data),
  /** Public tracking: needs the tracking number AND the phone the order was placed with. */
  trackOrder: (tracking_ref: string, phone: string) =>
    api.post<TrackedOrder>('/shop/track/', { tracking_ref, phone }).then((r) => r.data),

  createGuestOrder: (data: {
    delivery_name: string;
    delivery_phone: string;
    delivery_address: string;
    delivery_county: string;
    delivery_notes?: string;
    items: Array<{ variant?: number; product?: number; quantity: number }>;
  }) => api.post('/shop/guest-orders/', data).then((r) => r.data),
  /** Guest orders are addressed by their unguessable public_token, never the numeric id. */
  payGuestMpesa: (publicToken: string, phone?: string) =>
    api.post(`/shop/guest-orders/${publicToken}/pay_mpesa/`, { phone }).then((r) => r.data),
  getGuestPaymentStatus: (publicToken: string) =>
    api.get<PaymentStatus>(`/shop/guest-orders/${publicToken}/payment-status/`).then((r) => r.data),

  submitForm: (data: { form_type: string; data: Record<string, unknown>; file?: File | null }) => {
    if (data.file) {
      const form = new FormData();
      form.append('form_type', data.form_type);
      form.append('data', JSON.stringify(data.data));
      form.append('file', data.file);
      return api.post('/shop/form-submissions/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data);
    }
    return api.post('/shop/form-submissions/', { form_type: data.form_type, data: data.data }).then((r) => r.data);
  },
  confirmDelivery: (id: number | string) =>
    api.post(`/shop/orders/${id}/confirm_delivery/`).then((r) => r.data),
  disputeOrder: (id: number | string, reason: string, image?: File | null) => {
    if (image) {
      const form = new FormData();
      form.append('reason', reason);
      form.append('image', image);
      return api
        .post(`/shop/orders/${id}/dispute/`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data);
    }
    return api.post(`/shop/orders/${id}/dispute/`, { reason }).then((r) => r.data);
  },
};


export interface WhatsAppCheckoutResult {
  public_token: string;
  tracking_ref: string;
  status: string;
  total_amount: string;
  whatsapp_url: string;
}

export interface TrackedFulfilment {
  tracking_ref: string | null;
  seller: string;
  status: string;
  carrier: string;
  carrier_reference: string;
  lines: Array<{ name: string; quantity: number }>;
  history: Array<{ status: string; at: string }>;
}

export interface TrackedOrder {
  tracking_ref: string;
  status: string;
  placed_at: string;
  total_amount: string;
  payment: { method: string; received: boolean };
  items: Array<{ name: string; quantity: number }>;
  fulfilments: TrackedFulfilment[];
}
