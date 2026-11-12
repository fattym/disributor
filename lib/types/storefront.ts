export interface StorefrontProductVariant {
  id: number;
  label: string;
  stock_quantity: number;
  price_override: string | null;
  effective_price: string;
}

export interface StorefrontProduct {
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
  variants: StorefrontProductVariant[];
  sku?: string;
  brand?: string;
  tags?: Array<{ id: number; name: string }>;
  applicable_levels?: number[];
  stock_quantity?: number;
}

export interface ShelfSection {
  id: number;
  name: string;
  slug: string;
  display_order: number;
  color: string;
}

export interface ProductMapping {
  id: number;
  product: number;
  product_name: string;
  variant: number | null;
  model_key: string;
  model_type: string;
  shelf_section: number;
  shelf_section_name: string;
  aisle: string;
  shelf_index: number;
  position_x: string;
  effective_price: string;
  stock_quantity: number;
  category_name: string;
  image_url: string | null;
  active: boolean;
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
  status: string;
  is_active: boolean;
  items: BooklistItem[];
  total_items: number;
  total_required_price: string;
}

export interface Grade {
  id: number;
  name: string;
  stage: string;
  order: number;
}

export interface School {
  id: number;
  name: string;
  code: string;
}
