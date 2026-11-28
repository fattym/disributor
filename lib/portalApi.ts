/** Catalogue and booklist-school endpoints. Contract: docs/specs/catalogue-and-booklists-api.md. */
import { api } from './api';

export interface Page<T> { count: number; next: string | null; previous: string | null; results: T[] }
export interface AcademicYearRef { id: number; name: string }
export interface AcademicYearRow extends AcademicYearRef { is_current?: boolean }

export interface ListItem {
  item_id: number; variant_id: number; product_id: number; name: string; variant: string;
  publisher: string | null; isbn_sku: string | null; image_url: string | null;
  quantity: number; required: boolean; provided_by_school: boolean;
  price: string; line_total: string; stock: number; available: boolean;
}
export interface ManagedList {
  id: number; grade: string; class_name: string; name: string; academic_year: AcademicYearRef; version: string;
  status: 'draft' | 'published' | 'archived'; items: ListItem[]; required_total: string; optional_total: string; updated_at: string;
}
export interface PublicList {
  id: number; school: { id: number; name: string }; grade: string; class_name: string; name: string; academic_year: string;
  items: ListItem[]; required_total: string; optional_total: string;
}
export interface CatalogueChoice {
  variant_id: number; product_id: number; name: string; variant: string; category: string; publisher: string | null;
  isbn_sku: string | null; grades: string[]; price: string; stock: number; available: boolean; image_url: string | null;
}
export interface ListInput {
  grade: string; class_name: string; name: string; academic_year?: number;
  items?: { variant_id: number; quantity: number; required: boolean }[];
}
export interface PublicSchool { id: number; name: string; address: string }
export interface SchoolGrade { grade: string; lists: { id: number; name: string; class_name: string; academic_year: string }[] }

export interface SchoolRequest {
  id: number; school_name: string; county: string; address: string; contact_name: string; email: string; phone: string;
  message: string; status: 'pending' | 'approved' | 'rejected'; reject_reason: string; school_id: number | null;
  reviewed_at: string | null; created_at: string; email_in_use?: boolean; invite_sent?: boolean;
}

export interface CatalogueProduct {
  id: number; source: 'platform' | 'seller'; seller_id: number | null; name: string; category: string; grades: string[];
  publisher: string | null; isbn_sku: string | null; price: string; supplier_cost?: string | null; stock: number;
  image_url: string | null; active: boolean; supplier_linked: boolean;
  variants: { id: number; label: string; stock: number; price: string }[];
}
export interface ImportRow {
  row: number; action: 'create' | 'update' | 'unchanged' | 'error'; product_id: number | null; name: string;
  changes: Record<string, [unknown, unknown]>; errors: Record<string, string>;
}
export interface ImportBatch {
  id: number; status: string; filename: string; seller_id: number | null; created_by: string | null; created_at: string;
  applied_at: string | null; undone_at: string | null;
  counts: Record<'create' | 'update' | 'unchanged' | 'error', number>;
  rows?: ImportRow[];
  undo_result: { restored: number; deleted: number; deactivated: number; skipped: { product_id: number; field: string; reason: string }[] } | null;
}

const data = <T>(r: { data: T }) => r.data;

export const schoolApi = {
  lists: () => api.get<Page<ManagedList>>('/booklists/manage/lists/', { params: { page_size: 500 } }).then(data),
  list: (id: number) => api.get<ManagedList>(`/booklists/manage/lists/${id}/`).then(data),
  create: (body: ListInput) => api.post<ManagedList>('/booklists/manage/lists/', body).then(data),
  update: (id: number, body: ListInput) => api.patch<ManagedList>(`/booklists/manage/lists/${id}/`, body).then(data),
  remove: (id: number) => api.delete(`/booklists/manage/lists/${id}/`).then(data),
  action: (id: number, name: 'publish' | 'archive' | 'new-version') =>
    api.post<ManagedList>(`/booklists/manage/lists/${id}/${name}/`).then(data),
  catalogue: (params: { q?: string; grade?: string; page?: number }) =>
    api.get<Page<CatalogueChoice>>('/booklists/catalogue/', { params: { ...params, page_size: 20 } }).then(data),
  years: () => api.get<AcademicYearRow[] | Page<AcademicYearRow>>('/booklists/academic-years/')
    .then((r) => (Array.isArray(r.data) ? r.data : r.data.results)),
};

export const publicListApi = {
  schools: (q: string) => api.get<Page<PublicSchool>>('/booklists/public/schools/', { params: { q, page_size: 20 } }).then(data),
  grades: (school: number) => api.get<SchoolGrade[]>(`/booklists/public/schools/${school}/grades/`).then(data),
  list: (id: number) => api.get<PublicList>(`/booklists/public/lists/${id}/`).then(data),
};

export const schoolRequestApi = {
  submit: (body: Record<string, string>) => api.post<{ detail: string }>('/booklists/school-requests/', body).then(data),
  list: (status: string, page: number) => api.get<Page<SchoolRequest>>('/booklists/school-requests/', { params: { status, page } }).then(data),
  get: (id: number) => api.get<SchoolRequest>(`/booklists/school-requests/${id}/`).then(data),
  approve: (id: number) => api.post<SchoolRequest>(`/booklists/school-requests/${id}/approve/`).then(data),
  reject: (id: number, reason: string) => api.post<SchoolRequest>(`/booklists/school-requests/${id}/reject/`, { reason }).then(data),
  resend: (id: number) => api.post<{ invite_sent: boolean }>(`/booklists/school-requests/${id}/resend-invite/`).then(data),
};

export type CatalogueFilters = Partial<Record<'q' | 'category' | 'grade' | 'active' | 'stock' | 'ordering', string>>;
const clean = (f: CatalogueFilters) => Object.fromEntries(Object.entries(f).filter(([, v]) => v));

export const catalogueApi = {
  grades: () => api.get<{ grades: string[] }>('/shop/catalogue/grades/').then((r) => r.data.grades),
  categories: () => api.get<{ categories: string[] }>('/shop/catalogue/categories/').then((r) => r.data.categories),
  products: (filters: CatalogueFilters, page: number) =>
    api.get<Page<CatalogueProduct>>('/shop/catalogue/products/', { params: { ...clean(filters), page } }).then(data),
  update: (id: number, body: Record<string, unknown>) => api.patch<CatalogueProduct>(`/shop/catalogue/products/${id}/`, body).then(data),
  /** Fetched with the token, then saved from memory: a plain link would not be signed in. */
  download: async (file: 'csv' | 'xlsx', filters: CatalogueFilters = {}) => {
    const res = await api.get<Blob>('/shop/catalogue/export/', { params: { ...clean(filters), file }, responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = /filename="([^"]+)"/.exec(String(res.headers['content-disposition'] || ''))?.[1] || `catalogue.${file}`;
    a.click();
    URL.revokeObjectURL(url);
  },
  imports: () => api.get<Page<ImportBatch>>('/shop/catalogue/imports/', { params: { page_size: 20 } }).then(data),
  importDetail: (id: number) => api.get<ImportBatch>(`/shop/catalogue/imports/${id}/`).then(data),
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<ImportBatch>('/shop/catalogue/imports/', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(data);
  },
  confirm: (id: number, skip_errors: boolean) => api.post<ImportBatch>(`/shop/catalogue/imports/${id}/confirm/`, { skip_errors }).then(data),
  undo: (id: number) => api.post<ImportBatch>(`/shop/catalogue/imports/${id}/undo/`).then(data),
};

/** Grade names the API accepts, in order (spec section 1). */
export const GRADES = ['Playgroup', 'PP1', 'PP2', ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`), 'Form 1', 'Form 2', 'Form 3', 'Form 4'];

export const money = (value: string | number) =>
  `KSh ${Number(value).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;
