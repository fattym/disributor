export interface DiscoveryVariant {
  id: number;
  label: string;
  size: string;
  color: string;
  stock_quantity: number;
  effective_price: string;
}

export interface DiscoveryProduct {
  id: number;
  name: string;
  description: string;
  price: string;
  effective_price: string;
  image_url: string | null;
  category: number;
  category_name: string;
  is_active: boolean;
  institution_categories: string[];
  brand: string;
  product_type: string;
  is_reseller_listing: boolean;
  commission_amount: string | null;
  tags: number[];
  learning_areas: number[];
  created_at: string;
  distributor_name: string | null;
  distributor_id: number | null;
  total_stock: number;
  variants: DiscoveryVariant[];
}

export interface ShoppableVideo {
  id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  product: number | null;
  product_name: string | null;
  product_price: string | null;
  product_image_url: string | null;
  product_url: string | null;
  distributor: number | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface DistributorProductPreview {
  id: number;
  name: string;
  unit_price: string;
  image_url: string | null;
}

export interface DistributorInfo {
  id: number;
  company_name: string;
  registration_number: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string | null;
  is_verified: boolean;
  product_count: number;
  distributor_products: DistributorProductPreview[];
  created_at: string;
}

export interface CategoryInfo {
  id: number;
  name: string;
  parent: number | null;
  children: CategoryInfo[];
}

export interface InstitutionEnquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  institution_name: string;
  institution_type: string;
  message: string;
  product_ids: number[];
  status: string;
  created_at: string;
  updated_at: string;
}

export const INSTITUTION_TYPES = [
  { value: 'pre_primary', label: 'Pre-Primary' },
  { value: 'primary', label: 'Primary School' },
  { value: 'junior_secondary', label: 'Junior Secondary' },
  { value: 'senior_secondary', label: 'Senior Secondary' },
  { value: 'university', label: 'University' },
  { value: 'tvet', label: 'TVET / Vocational' },
  { value: 'other', label: 'Other' },
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchDiscoveryProducts(
  params: Record<string, string | undefined> = {},
): Promise<DiscoveryProduct[]> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });

  const response = await fetch(
    `${API_BASE_URL}/discovery/?${searchParams.toString()}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Unable to load discovery products.");
  }

  return response.json();
}

export async function fetchShoppableVideos(): Promise<ShoppableVideo[]> {
  const response = await fetch(`${API_BASE_URL}/videos/?is_featured=true`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load shoppable videos.");
  }

  return response.json();
}

export async function fetchDistributors(): Promise<DistributorInfo[]> {
  const response = await fetch(`${API_BASE_URL}/distributors/`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load distributors.");
  }

  return response.json();
}

export async function fetchCategories(): Promise<CategoryInfo[]> {
  const response = await fetch(`${API_BASE_URL}/categories/`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load categories.");
  }

  return response.json();
}

export async function submitInstitutionEnquiry(
  data: Omit<InstitutionEnquiry, "id" | "status" | "created_at" | "updated_at">,
): Promise<InstitutionEnquiry> {
  const response = await fetch(`${API_BASE_URL}/institution-enquiries/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Unable to submit enquiry.");
  }

  return response.json();
}
