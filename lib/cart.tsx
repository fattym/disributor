'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  product_id: number;
  product_name: string;
  variant_id: number;
  variant_label: string;
  quantity: number;
  unit_price: number;
  image_url: string | null;
  stock_quantity: number;
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

const STORAGE_KEY = 'learningpack_cart';

function loadFromStorage(): CartItem[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch {}
    }
  }
  return [];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  const stockCap = (stock: number) => (stock > 0 ? stock : Infinity);

  const addItem = (item: CartItem) => {
    const cap = stockCap(item.stock_quantity);
    setItems((prev) => {
      const existing = prev.find((i) => i.variant_id === item.variant_id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + item.quantity, cap);
        return prev.map((i) =>
          i.variant_id === item.variant_id ? { ...i, quantity: nextQty } : i,
        );
      }
      return [...prev, { ...item, quantity: Math.min(item.quantity, cap) }];
    });
  };

  const removeItem = (variantId: number) => {
    setItems((prev) => prev.filter((i) => i.variant_id !== variantId));
  };

  const updateQuantity = (variantId: number, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.variant_id === variantId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, stockCap(i.stock_quantity))) }
          : i,
      ),
    );
  };

  const clearCart = () => setItems([]);

  const getTotal = () => items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const getItemCount = () => items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount }}>
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
