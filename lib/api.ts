import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          const { access } = response.data;
          localStorage.setItem('access_token', access);
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

  getOrders: () => api.get('/distributor/orders/').then((r) => r.data),
  updateOrderStatus: (id: string, status: string) => api.patch(`/distributor/orders/${id}/`, { status }).then((r) => r.data),

  getDeliveries: () => api.get('/distributor/deliveries/').then((r) => r.data),
  updateDelivery: (id: string, data: unknown) => api.patch(`/distributor/deliveries/${id}/`, data).then((r) => r.data),

  getWallet: () => api.get('/distributor/wallet/').then((r) => r.data),
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
  description: string;
  price: string;
  effective_price: string;
  image: string | null;
  image_url: string | null;
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
}

export interface ShopCategory {
  id: number;
  name: string;
  school: number;
}

export const shopApi = {
  getCategories: () =>
    api.get<ShopCategory[] | { results: ShopCategory[] }>('/shop/categories/').then((r) => r.data),
  getProducts: (params?: Record<string, string | number>) =>
    api.get<ShopProduct[] | { results: ShopProduct[] }>('/shop/products/', { params }).then((r) => r.data),
  getProduct: (id: number | string) => api.get<ShopProduct>(`/shop/products/${id}/`).then((r) => r.data),

  getPublicProducts: (params?: Record<string, string | number>) =>
    api.get<ShopProduct[] | { results: ShopProduct[] }>('/shop/public/', { params }).then((r) => r.data),
  getPublicProduct: (id: number | string) => api.get<ShopProduct>(`/shop/public/${id}/`).then((r) => r.data),

  getLearners: () =>
    api.get<Array<{ id: number; parent: number; learner: number; relationship: string }> | { results: Array<{ id: number; parent: number; learner: number; relationship: string }> }>('/auth/parent-learner-links/').then((r) => r.data),

  createOrder: (data: { learner?: number; items: Array<{ variant?: number; product?: number; quantity: number }> }) =>
    api.post('/shop/orders/', data).then((r) => r.data),
  getOrder: (id: number | string) => api.get(`/shop/orders/${id}/`).then((r) => r.data),
  getMyOrders: () => api.get<{ results: unknown[] } | unknown[]>('/shop/orders/my_orders/').then((r) => r.data),
  payMpesa: (orderId: number | string, phone?: string) =>
    api.post(`/shop/orders/${orderId}/pay_mpesa/`, { phone }).then((r) => r.data),
  confirmPayment: (orderId: number | string) =>
    api.post(`/shop/orders/${orderId}/confirm-payment/`).then((r) => r.data),

  createGuestOrder: (data: {
    delivery_name: string;
    delivery_phone: string;
    delivery_address: string;
    delivery_county: string;
    delivery_notes?: string;
    items: Array<{ variant?: number; product?: number; quantity: number }>;
  }) => api.post('/shop/guest-orders/', data).then((r) => r.data),
  payGuestMpesa: (orderId: number | string, phone?: string) =>
    api.post(`/shop/guest-orders/${orderId}/pay_mpesa/`, { phone }).then((r) => r.data),
  confirmGuestPayment: (orderId: number | string, body?: { checkout_request_id?: string; force?: boolean }) =>
    api.post(`/shop/guest-orders/${orderId}/confirm-payment/`, body || {}).then((r) => r.data),

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
};
