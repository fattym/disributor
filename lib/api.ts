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
};
