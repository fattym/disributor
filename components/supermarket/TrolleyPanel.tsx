'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';

const DELIVERY_FEE = 150;

export function TrolleyPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, removeItem, updateQuantity, getItemCount } = useCart();
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'collection'>('delivery');

  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const deliveryFee = deliveryOption === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const itemCount = getItemCount();

  const overlayClass = `lp-trolley-overlay ${open ? 'lp-trolley-open' : ''}`;
  const panelClass = `lp-trolley-panel ${open ? 'lp-trolley-open' : ''}`;

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className="lp-trolley-backdrop" onClick={(e) => e.stopPropagation()} />
      <div className={panelClass} onClick={(e) => e.stopPropagation()}>
        <div className="lp-trolley-header">
          <h2 className="lp-trolley-title">Your trolley</h2>
          <button type="button" className="lp-trolley-close" onClick={onClose} aria-label="Close trolley">✕</button>
        </div>

        <div className="lp-trolley-body">
          {items.length === 0 ? (
            <div className="lp-trolley-empty">
              <p className="lp-trolley-empty-text">Your trolley is empty.</p>
              <p className="lp-trolley-empty-hint">Browse the aisles and add items as you shop.</p>
            </div>
          ) : (
            <>
              <div className="lp-trolley-list">
                {items.map((item) => (
                  <div key={item.variant_id} className="lp-trolley-row">
                    <div className="lp-trolley-thumb">
                      {item.image_url ? (
                        <Image src={item.image_url} alt={item.product_name} fill sizes="64px" className="lp-trolley-img" />
                      ) : (
                        <div className="lp-trolley-img lp-trolley-img--placeholder">📦</div>
                      )}
                    </div>
                    <div className="lp-trolley-info">
                      <div className="lp-trolley-name">{item.product_name}</div>
                      <div className="lp-trolley-variant">{item.variant_label}</div>
                      <div className="lp-trolley-price">{formatCurrency(item.unit_price)} each</div>
                      <div className="lp-trolley-qty">
                        <button
                          type="button"
                          className="lp-qty-btn"
                          onClick={() => updateQuantity(item.variant_id, Math.max(1, item.quantity - 1))}
                          aria-label={`Decrease ${item.product_name}`}
                        >
                          −
                        </button>
                        <span className="lp-qty-value">{item.quantity}</span>
                        <button
                          type="button"
                          className="lp-qty-btn"
                          onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                          aria-label={`Increase ${item.product_name}`}
                          disabled={item.quantity >= (item.stock_quantity || 99)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="lp-trolley-actions">
                      <div className="lp-trolley-line-total">{formatCurrency(item.unit_price * item.quantity)}</div>
                      <button
                        type="button"
                        className="lp-remove-btn"
                        onClick={() => removeItem(item.variant_id)}
                        aria-label={`Remove ${item.product_name}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lp-divider" />

              <div className="lp-delivery">
                <label className="lp-delivery-label">How would you like to receive your order?</label>
                <div className="lp-delivery-options">
                  <label className="lp-delivery-option">
                    <input
                      type="radio"
                      name="delivery"
                      value="delivery"
                      checked={deliveryOption === 'delivery'}
                      onChange={() => setDeliveryOption('delivery')}
                    />
                    <span className="lp-delivery-radio"></span>
                    Delivery
                    <span className="lp-delivery-fee">{formatCurrency(DELIVERY_FEE)}</span>
                  </label>
                  <label className="lp-delivery-option">
                    <input
                      type="radio"
                      name="delivery"
                      value="collection"
                      checked={deliveryOption === 'collection'}
                      onChange={() => setDeliveryOption('collection')}
                    />
                    <span className="lp-delivery-radio"></span>
                    Collection (free)
                  </label>
                </div>
              </div>

              <div className="lp-summary">
                <div className="lp-summary-row">
                  <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="lp-summary-row lp-summary-row--delivery">
                  <span>{deliveryOption === 'delivery' ? 'Delivery' : 'Collection'}</span>
                  <span>{deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee)}</span>
                </div>
                <div className="lp-summary-row lp-summary-row--total">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="lp-trolley-actions-bottom">
                <button type="button" className="lp-btn lp-btn--outline lp-btn--continue" onClick={onClose}>
                  Continue shopping
                </button>
                <button type="button" className="lp-btn lp-btn--primary lp-btn--checkout" onClick={() => window.location.href = '/supermarket/checkout'}>
                  Proceed to checkout
                </button>
              </div>
            </>
          )}
        </div>

        {items.length === 0 && (
          <div className="lp-trolley-footer">
            <button type="button" className="lp-btn lp-btn--outline lp-btn--full" onClick={onClose}>
              Keep shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
