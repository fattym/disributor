'use client';

import { createContext, useContext, useEffect, useMemo, useCallback, useState, ReactNode } from 'react';
import { useSupermarketStore } from '@/lib/store/supermarketStore';
import { storefrontApi } from '@/lib/storefrontApi';
import type { StorefrontProduct, StorefrontProductVariant } from '@/lib/types/storefront';

export interface CartItem {
  product_id: number;
  product_name: string;
  variant_id: number;
  variant_label: string;
  quantity: number;
  unit_price: number;
  image_url: string | null;
  stock_quantity: number;
  /** Who sells and packs it; null for the platform's own listings. */
  seller_name?: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const cartItems = useSupermarketStore((s) => s.cartItems);
  const setCartItems = useSupermarketStore((s) => s.setCartItems);
  const addToCart = useSupermarketStore((s) => s.addToCart);
  const removeFromCart = useSupermarketStore((s) => s.removeFromCart);
  const updateCartQuantity = useSupermarketStore((s) => s.updateCartQuantity);
  const clearCartStore = useSupermarketStore((s) => s.clearCart);
  const products = useSupermarketStore((s) => s.products);

  interface CartServerItem {
    variant?: number;
    variant_id?: number;
    quantity?: number;
    variant_label?: string;
    product_id?: number;
    product_name?: string;
    effective_price?: string;
    stock_quantity?: number;
    image_url?: string | null;
  }

  // Line details straight from the server cart, so /cart renders on a direct page load
  // (the product store is only filled by the shop/bookshop pages).
  const [serverLines, setServerLines] = useState<Map<number, CartServerItem>>(new Map());

  useEffect(() => {
    let cancelled = false;
    // Guests have no server cart (GET /carts/ answers 400 without an X-Session-Key); their cart lives in the local store.
    if (typeof window === 'undefined' || !localStorage.getItem('access_token')) return;
    storefrontApi.getMyCart().then((data) => {
      if (cancelled) return;
      // GET /carts/ answers one cart object {id, items: [...]}; older shapes (a bare list, DRF results) still work.
      const serverItems = (Array.isArray(data) ? data : (data.items || data.results || [])) as CartServerItem[];
      const normalized = serverItems.map((i) => ({
        variant_id: i.variant ?? i.variant_id ?? 0,
        quantity: i.quantity ?? 1,
      }));
      setCartItems(normalized);
      setServerLines(new Map(serverItems.map((i) => [i.variant ?? i.variant_id ?? 0, i])));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [setCartItems]);

  const productByVariant = useMemo(() => {
    const map = new Map<number, { product: StorefrontProduct; variant: StorefrontProductVariant }>();
    for (const p of products) {
      for (const v of p.variants) {
        map.set(v.id, { product: p, variant: v });
      }
    }
    return map;
  }, [products]);

  const items = useMemo(() => cartItems.map((ci) => {
    const entry = productByVariant.get(ci.variant_id);
    const product = entry?.product;
    const variant = entry?.variant;
    const server = serverLines.get(ci.variant_id);
    return {
      product_id: product?.id ?? server?.product_id ?? ci.product_id ?? 0,
      product_name: product?.name ?? server?.product_name ?? ci.product_name ?? '',
      variant_id: ci.variant_id,
      variant_label: variant?.label ?? server?.variant_label ?? ci.variant_label ?? '',
      quantity: ci.quantity,
      unit_price: variant ? parseFloat(variant.effective_price || '0') : server?.effective_price ? parseFloat(server.effective_price) : (ci.unit_price ?? 0),
      image_url: product?.image_url ?? server?.image_url ?? ci.image_url ?? null,
      stock_quantity: variant?.stock_quantity ?? server?.stock_quantity ?? ci.stock_quantity ?? 0,
      seller_name: ci.seller_name ?? null,
    };
  }), [cartItems, productByVariant, serverLines]);

  const getTotal = useCallback(() => items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0), [items]);
  const getItemCount = useCallback(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const addItem = useCallback((item: CartItem) => {
    addToCart(item.variant_id, item.quantity, {
      product_id: item.product_id,
      product_name: item.product_name,
      variant_label: item.variant_label,
      unit_price: item.unit_price,
      image_url: item.image_url,
      stock_quantity: item.stock_quantity,
      seller_name: item.seller_name ?? null,
    });
  }, [addToCart]);

  const removeItem = useCallback((variantId: number) => {
    removeFromCart(variantId);
  }, [removeFromCart]);

  const updateQuantity = useCallback((variantId: number, quantity: number) => {
    updateCartQuantity(variantId, quantity);
  }, [updateCartQuantity]);

  const clear = useCallback(() => {
    clearCartStore();
  }, [clearCartStore]);

  const value = useMemo(() => ({ items, addItem, removeItem, updateQuantity, clearCart: clear, getTotal, getItemCount }), [items, addItem, removeItem, updateQuantity, clear, getTotal, getItemCount]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
