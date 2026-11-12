'use client';

import { useCart } from '@/lib/cart';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export function CartOverlay() {
  const { getItemCount, getTotal } = useCart();
  const count = getItemCount();
  const total = getTotal();

  if (count === 0) return null;
  return (
    <Link href="/cart" className="cart-overlay">
      <div className="cart-summary">
        <span className="cart-count">{count} item{count !== 1 ? 's' : ''}</span>
        <span className="cart-total">{formatCurrency(total)}</span>
      </div>
    </Link>
  );
}
