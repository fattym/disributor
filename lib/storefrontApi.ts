import { api } from '@/lib/api';
import { ShelfSection, ProductMapping, Booklist, BooklistItem, Grade, School, StorefrontProduct } from '@/lib/types/storefront';

type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };
type ApiResponse<T> = T[] | Paginated<T>;

function extractList<T>(data: ApiResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results || [];
}

async function getAllPages<T>(url: string, params?: Record<string, string | number>): Promise<T[]> {
  const MAX_PAGES = 20;
  const first = await api.get<ApiResponse<T>>(url, { params: { page_size: 100, ...params } });
  if (Array.isArray(first.data)) return first.data;

  const pageData = first.data;
  const items = [...pageData.results];
  let nextUrl = pageData.next;
  let pages = 1;
  while (nextUrl && pages < MAX_PAGES) {
    const next = await api.get<ApiResponse<T>>(nextUrl);
    if (Array.isArray(next.data)) {
      items.push(...next.data);
      break;
    }
    items.push(...next.data.results);
    nextUrl = next.data.next;
    pages += 1;
  }
  return items;
}

export const storefrontApi = {
  getSchools: () =>
    api.get<ApiResponse<School>>('/storefront/schools/').then((r) => extractList(r.data)),
  getShelfSections: () =>
    api.get<ApiResponse<ShelfSection>>('/storefront/shelf-sections/').then((r) => extractList(r.data)),
  getModelMappings: (params?: Record<string, string | number>) =>
    getAllPages<ProductMapping>('/storefront/model-mappings/', params),
  getPublicProducts: (params?: Record<string, string | number>) =>
    getAllPages<StorefrontProduct>('/shop/public/', params),
  getProduct: (id: number | string) =>
    api.get<StorefrontProduct>(`/shop/public/${id}/`).then((r) => r.data),
  getGrades: () =>
    api.get<ApiResponse<Grade>>('/academics/grades/').then((r) => extractList(r.data)),
  getMyCart: () =>
    api.get('/carts/').then((r) => r.data),
  addToCart: (variant: number, quantity: number) =>
    api.post('/carts/items/', { variant, quantity }).then((r) => r.data),
  updateCartItem: (id: number, quantity: number) =>
    api.patch(`/carts/items/${id}/`, { quantity }).then((r) => r.data),
  deleteCartItem: (id: number) =>
    api.delete(`/carts/items/${id}/`).then((r) => r.data),
  clearCart: () =>
    api.post('/carts/clear/', {}).then((r) => r.data),
  getBooklists: (params?: Record<string, string | number>) =>
    api.get<ApiResponse<Booklist>>('/booklists/booklists/', { params }).then((r) => extractList(r.data)),
  getBooklist: (id: number | string) =>
    api.get<Booklist>(`/booklists/booklists/${id}/`).then((r) => r.data),
  getBooklistItems: (id: number | string) =>
    api.get<ApiResponse<BooklistItem>>(`/booklists/booklists/${id}/items/`).then((r) => extractList(r.data)),
  createOrder: (data: { learner?: number; items: Array<{ variant?: number; product?: number; quantity: number }> }) =>
    api.post('/shop/orders/', data).then((r) => r.data),
  payMpesa: (orderId: number | string, phone?: string) =>
    api.post(`/shop/orders/${orderId}/pay_mpesa/`, { phone }).then((r) => r.data),
  getPaymentStatus: (orderId: number | string) =>
    api.get(`/shop/orders/${orderId}/payment-status/`).then((r) => r.data),
  getOrders: () =>
    api.get('/shop/orders/my_orders/').then((r) => r.data),
};
