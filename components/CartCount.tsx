'use client';

import { useCart } from '@/lib/cart';

/** The cart icon's count badge, for server-rendered headers. */
export default function CartCount() {
  const { getItemCount } = useCart();
  const n = getItemCount();
  if (n <= 0) return null;
  return (
    <span className="cart-count-badge" aria-label={`${n} item${n === 1 ? '' : 's'} in cart`}>
      {n > 99 ? '99+' : n}
    </span>
  );
}
