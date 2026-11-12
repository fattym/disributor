'use client';

import { useSupermarketStore } from '@/lib/store/supermarketStore';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';

export function InteractionPanel() {
  const { selectedProduct } = useSupermarketStore();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') useSupermarketStore.getState().setSelectedProduct(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  if (!selectedProduct) return null;

  const { product, mapping } = selectedProduct;
  const price = parseFloat(product.effective_price || product.price || '0');
  const variant = product.variants?.find((v) => v.id === mapping.variant) || product.variants?.[0];
  const stock = variant?.stock_quantity ?? product.stock_quantity ?? 0;
  const isAvailable = stock > 0;
  const variantId = variant?.id ?? mapping.variant ?? 0;

  const gradeLabel = product.applicable_levels?.length
    ? `Level ${product.applicable_levels.join(', ')}`
    : mapping.shelf_section_name;

  const handleAdd = () => {
    addItem({
      product_id: product.id,
      product_name: product.name,
      variant_id: variantId,
      variant_label: variant?.label || 'Default',
      quantity,
      unit_price: price,
      image_url: product.image_url || null,
      stock_quantity: stock,
    });
    setQuantity(1);
  };

  return (
    <div className="lp-interaction-panel">
      <div className="lp-interaction-card">
        <button
          type="button"
          className="lp-interaction-close"
          onClick={() => useSupermarketStore.getState().setSelectedProduct(null)}
          aria-label="Close"
        >
          <span aria-hidden="true">×</span>
        </button>
        <div className="lp-interaction-image">
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} fill sizes="160px" className="lp-interaction-img" />
          ) : (
            <span className="lp-image-placeholder--large" role="img" aria-label="no image">
              📦
            </span>
          )}
        </div>
        <div className="lp-interaction-body">
          <h3 className="lp-interaction-title">{product.name}</h3>
          <div className="lp-interaction-meta">
            <span className="lp-interaction-publisher">{product.brand || 'Publisher'}</span>
            <span className="lp-interaction-divider">·</span>
            <span className="lp-interaction-section">{mapping.shelf_section_name}</span>
          </div>
          <div className="lp-interaction-grade">
            <span className="lp-interaction-grade-label">Grade:</span>
            <span className="lp-interaction-grade-value">{gradeLabel}</span>
          </div>
          <p className="lp-interaction-price">{formatCurrency(price)}</p>
          <p className={`lp-interaction-stock ${isAvailable ? 'lp-in-stock' : 'lp-out-stock'}`}>
            {isAvailable ? `In stock (${stock})` : 'Out of stock'}
          </p>
          {product.description && (
            <p className="lp-interaction-desc">{product.description}</p>
          )}
          {!product.image_url && !product.image && (
            <p className="lp-interaction-placeholder">Illustrative placeholder product image</p>
          )}
          <div className="lp-interaction-qty" aria-label="Quantity">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
            <span>{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => Math.min(stock || 99, q + 1))} aria-label="Increase quantity" disabled={quantity >= stock}>+</button>
          </div>
          <button
            className="lp-interaction-add"
            onClick={handleAdd}
            disabled={!isAvailable}
            type="button"
          >
            {isAvailable ? 'Add to Trolley' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}
