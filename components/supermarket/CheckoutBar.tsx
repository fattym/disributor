'use client';

import { useCart } from '@/lib/cart';
import { formatCurrency } from '@/lib/utils';

const CHECKOUT_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 9a2 2 0 0 0-2-2H8a2 2 0 0 0 0 4h10a2 2 0 0 0 2-2v-3z"/><path d="M5 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm15 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>';

export function CheckoutBar() {
  const { items, getItemCount, getTotal } = useCart();
  const count = getItemCount();
  const total = getTotal();

  if (count === 0) return null;

  const topItems = items.slice(0, 3);
  const extra = items.length - topItems.length;

  return (
    <div className="lp-checkout-conveyor">
      <div className="lp-conveyor-left">
        <span className="lp-conveyor-badge">{count} item{count !== 1 ? 's' : ''}</span>
        <div className="lp-conveyor-preview">
          {topItems.map((item) => (
            <span key={item.variant_id} className="lp-conveyor-tag" title={item.product_name}>
              {item.variant_label}
            </span>
          ))}
          {extra > 0 && <span className="lp-conveyor-tag">+{extra} more</span>}
        </div>
      </div>

      <div className="lp-conveyor-center">
        <span className="lp-conveyor-total">{formatCurrency(total)}</span>
      </div>

      <button
        type="button"
        className="lp-conveyor-checkout"
        onClick={() => (window.location.href = '/supermarket/checkout')}
        aria-label="Proceed to checkout"
      >
        <span dangerouslySetInnerHTML={{ __html: CHECKOUT_ICON }} />
        <span>Checkout</span>
      </button>
    </div>
  );
}
