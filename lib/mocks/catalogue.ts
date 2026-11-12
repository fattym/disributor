export interface MockVariant {
  id: number;
  label: string;
  stock_quantity: number;
  effective_price: number;
}

export interface MockProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  effective_price: number;
  image: string | null;
  image_url: string | null;
  category: number;
  category_name: string;
  is_active: boolean;
  variants: MockVariant[];
  sku?: string;
  brand?: string;
  tags?: Array<{ id: number; name: string }>;
  applicable_levels?: number[];
  stock_quantity?: number;
  shape: string;
  promo?: string;
}

export const mockCatalogue: MockProduct[] = [];