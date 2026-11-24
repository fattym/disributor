'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductMapping, Booklist, Grade, StorefrontProduct } from '@/lib/types/storefront';
import { storefrontApi } from '@/lib/storefrontApi';

export type ViewMode = '3d' | '2d';

export interface SelectedProduct {
  mapping: ProductMapping;
  product: StorefrontProduct;
  worldPosition: [number, number, number];
}

interface SupermarketState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  hoveredProduct: SelectedProduct | null;
  setHoveredProduct: (p: SelectedProduct | null) => void;

  selectedSchoolId: number | null;
  selectedGradeId: number | null;
  selectedBooklistId: number | null;
  booklistKioskOpen: boolean;
  setBooklistKioskOpen: (open: boolean) => void;
  setSelectedSchool: (id: number | null) => void;
  setSelectedGrade: (id: number | null) => void;
  setSelectedBooklist: (id: number | null) => void;

  selectedProduct: SelectedProduct | null;
  setSelectedProduct: (p: SelectedProduct | null) => void;

  products: StorefrontProduct[];
  setProducts: (p: StorefrontProduct[]) => void;

  mappings: ProductMapping[];
  setMappings: (m: ProductMapping[]) => void;

  booklists: Booklist[];
  setBooklists: (b: Booklist[]) => void;

  grades: Grade[];
  setGrades: (g: Grade[]) => void;

  cartItems: CartLine[];
  setCartItems: (items: CartLine[]) => void;
  addToCart: (variantId: number, quantity?: number, snapshot?: Omit<CartLine, 'variant_id' | 'quantity'>) => void;
  removeFromCart: (variantId: number) => void;
  clearCart: () => void;

  trolleyOpen: boolean;
  setTrolleyOpen: (open: boolean) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
   updateCartQuantity: (variantId: number, quantity: number) => void;
}

// A cart line keeps a display snapshot so the cart renders after a page load or from pages that
// never fill `products` (the shop page). Checkout always re-prices on the server.
export interface CartLine {
  variant_id: number;
  quantity: number;
  product_id?: number;
  product_name?: string;
  variant_label?: string;
  unit_price?: number;
  image_url?: string | null;
  stock_quantity?: number;
}

export const useSupermarketStore = create<SupermarketState>()(
  persist(
    (set, get) => ({
      viewMode: '3d',
      setViewMode: (mode) => set({ viewMode: mode }),

      hoveredProduct: null,
      setHoveredProduct: (p) => set({ hoveredProduct: p }),

      selectedSchoolId: null,
      selectedGradeId: null,
      selectedBooklistId: null,
      booklistKioskOpen: false,
      setBooklistKioskOpen: (open) => set({ booklistKioskOpen: open }),
      setSelectedSchool: (id) => set({ selectedSchoolId: id, selectedBooklistId: null }),
      setSelectedGrade: (id) => set({ selectedGradeId: id, selectedBooklistId: null }),
      setSelectedBooklist: (id) => set({ selectedBooklistId: id }),

      selectedProduct: null,
      setSelectedProduct: (p) => set({ selectedProduct: p }),

      products: [],
      setProducts: (p) => set({ products: p }),

      mappings: [],
      setMappings: (m) => set({ mappings: m }),

      booklists: [],
      setBooklists: (b) => set({ booklists: b }),

      grades: [],
      setGrades: (g) => set({ grades: g }),

      cartItems: [],
      setCartItems: (items) => set({ cartItems: items }),
      trolleyOpen: false,
      setTrolleyOpen: (open) => set({ trolleyOpen: open }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      categoryFilter: 'All departments',
      setCategoryFilter: (category) => set({ categoryFilter: category }),
      updateCartQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          set({ cartItems: get().cartItems.filter((item) => item.variant_id !== variantId) });
          storefrontApi.deleteCartItem(variantId).catch(() => {});
          return;
        }
        set({
          cartItems: get().cartItems.map((item) =>
            item.variant_id === variantId ? { ...item, quantity } : item,
          ),
        });
        storefrontApi.updateCartItem(variantId, quantity).catch(() => {});
      },
      addToCart: (variantId, quantity = 1, snapshot) => {
        const existing = get().cartItems.find((i) => i.variant_id === variantId);
        if (existing) {
          set({
            cartItems: get().cartItems.map((i) =>
              i.variant_id === variantId ? { ...i, ...snapshot, quantity: i.quantity + quantity } : i,
            ),
          });
        } else {
          set({ cartItems: [...get().cartItems, { ...snapshot, variant_id: variantId, quantity }] });
        }
        storefrontApi.addToCart(variantId, quantity).catch(() => {});
      },
      removeFromCart: (variantId) => {
        set({ cartItems: get().cartItems.filter((i) => i.variant_id !== variantId) });
        storefrontApi.deleteCartItem(variantId).catch(() => {});
      },
      clearCart: () => {
        set({ cartItems: [] });
        storefrontApi.clearCart().catch(() => {});
      },
    }),
    { name: 'supermarket-store' },
  ),
);
