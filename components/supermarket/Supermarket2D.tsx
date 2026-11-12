'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProductMapping } from '@/lib/types/storefront';
import { storefrontApi } from '@/lib/storefrontApi';
import { useSupermarketStore } from '@/lib/store/supermarketStore';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';

export function Supermarket2D() {
  const { setMappings, searchQuery, categoryFilter } = useSupermarketStore();
  const [products, setProducts] = useState<ProductMapping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storefrontApi.getModelMappings()
      .then((list) => {
        setProducts(list as ProductMapping[]);
        setMappings(list as ProductMapping[]);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [setMappings]);

  const handleAdd = (m: ProductMapping) => {
    const variantId = m.variant || 0;
    useSupermarketStore.getState().addToCart(variantId, 1);
  };

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesSearch = !searchQuery.trim() || `${product.product_name} ${product.category_name}`.toLowerCase().includes(searchQuery.trim().toLowerCase());
    const matchesCategory = categoryFilter === 'All departments' || product.category_name === categoryFilter || product.shelf_section_name === categoryFilter;
    return matchesSearch && matchesCategory;
  }), [products, searchQuery, categoryFilter]);

  if (loading) {
    return <div className="supermarket-2d"><p>Loading products…</p></div>;
  }

  return (
    <div className="supermarket-2d">
      <div className="product-grid-2d">
        {visibleProducts.length === 0 ? (
          <p className="empty-state">No products match this search.</p>
        ) : (
          visibleProducts.map((m) => (
            <article key={m.id} className="product-card-2d">
              <div className="card-image-2d">
                {m.image_url ? <Image src={m.image_url} alt={m.product_name} fill sizes="160px" /> : <span>No image</span>}
              </div>
              <div className="card-body-2d">
                <h3 className="card-title-2d">{m.product_name}</h3>
                <p className="card-meta-2d">{m.category_name} • {m.shelf_section_name}</p>
                <p className="card-price-2d">{formatCurrency(parseFloat(m.effective_price))}</p>
                <p className={`card-stock-2d ${m.stock_quantity > 0 ? 'in' : 'out'}`}>
                  {m.stock_quantity > 0 ? `${m.stock_quantity} in stock` : 'Out of stock'}
                </p>
                <button className="card-add-2d" type="button" onClick={() => handleAdd(m)} disabled={m.stock_quantity <= 0}>
                  Add to Cart
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
