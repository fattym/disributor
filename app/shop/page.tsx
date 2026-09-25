'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import { shopApi, ShopProduct } from '@/lib/api';
import { useCart } from '@/lib/cart';

export default function ShopPage() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>('All');
  const [sort, setSort] = useState<string>('default');
  const [addedIds, setAddedIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const prodData = await shopApi.getPublicProducts({}).catch(() => []);
        const prodList = Array.isArray(prodData) ? prodData : prodData.results || [];
        setProducts(prodList);
      } catch (err) {
        console.error('Failed to load shop:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categoryNames = Array.from(
    new Set(products.map((p) => p.category_name).filter(Boolean)),
  );

  const filtered = useMemo(() => {
    let list = products;
    if (activeCat !== 'All') {
      list = list.filter((p) => p.category_name === activeCat);
    }
    return list;
  }, [products, activeCat]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const price = (p: ShopProduct) => parseFloat(p.effective_price || p.price || '0');
    if (sort === 'price-asc') arr.sort((a, b) => price(a) - price(b));
    else if (sort === 'price-desc') arr.sort((a, b) => price(b) - price(a));
    else if (sort === 'name-asc') arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [filtered, sort]);

  const handleAdd = (product: ShopProduct) => {
    const variant =
      product.variants && product.variants.length > 0 ? product.variants[0] : null;
    if (variant) {
      addItem({
        product_id: product.id,
        product_name: product.name,
        variant_id: variant.id,
        variant_label: variant.label,
        quantity: 1,
        unit_price: parseFloat(variant.effective_price),
        image_url: product.image_url,
        stock_quantity: variant.stock_quantity,
      });
    } else {
      addItem({
        product_id: product.id,
        product_name: product.name,
        variant_id: 0,
        variant_label: 'Default',
        quantity: 1,
        unit_price: parseFloat(product.effective_price || product.price || '0'),
        image_url: product.image_url,
        stock_quantity: 0,
      });
    }
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(
      () => setAddedIds((prev) => ({ ...prev, [product.id]: false })),
      1400,
    );
  };

  const formatPrice = (value: string | null | undefined) =>
    `KSh ${parseInt(value || '0', 10).toLocaleString('en-KE')}`;

  return (
    <>
      <GlobalHeader />
      <main id="main">
        <div className="shop-hero">
          <div className="wrap">
            <p className="crumbs">
              <Link href="/">Home</Link> / Shop
            </p>
            <h1>Shop all products</h1>
            <p>
              Stationery, text books, desk accessories, electronics and
              ready-made student boxes — everything on the list, in one place.
            </p>
          </div>
        </div>

        <section className="shop">
          <div className="wrap">
            <div className="shop-bar">
              <ul className="pills" role="group" aria-label="Filter by category">
                <li>
                  <button
                    className={`pill ${activeCat === 'All' ? 'is-active' : ''}`}
                    data-filter="All"
                    type="button"
                    onClick={() => setActiveCat('All')}
                  >
                    All
                  </button>
                </li>
                {categoryNames.map((name) => (
                  <li key={name}>
                    <button
                      className={`pill ${activeCat === name ? 'is-active' : ''}`}
                      data-filter={name}
                      type="button"
                      onClick={() => setActiveCat(name)}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="sort">
                <label htmlFor="sort">Sort by</label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="default">Featured</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="name-asc">Name: A–Z</option>
                </select>
              </div>
            </div>

            <p className="count" id="count">
              {loading ? 'Loading…' : `${sorted.length} products`}
            </p>

            {loading ? (
              <div className="grid" id="grid">
                <p className="empty">Loading products…</p>
              </div>
            ) : sorted.length === 0 ? (
              <div className="grid" id="grid">
                <p className="empty" hidden={false}>
                  No products in this category yet.
                </p>
              </div>
            ) : (
              <div className="grid" id="grid">
                {sorted.map((product) => {
                  const isAdded = addedIds[product.id];
                  return (
                    <article
                      key={product.id}
                      className="product"
                      data-cat={product.category_name}
                    >
                      <Link
                        href={`/shop/${product.id}`}
                        className="product__img"
                        aria-label={product.name}
                      >
                        {product.distributor_name && (
                          <span className="p-badge">New</span>
                        )}
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            loading="lazy"
                            width={600}
                            height={600}
                          />
                        ) : (
                          <div className="product__img-placeholder">No image</div>
                        )}
                      </Link>
                      <p className="product__cat">{product.category_name}</p>
                      <h3 className="product__name">
                        <Link href={`/shop/${product.id}`}>{product.name}</Link>
                      </h3>
                      <p className="product__price">
                        <span>{formatPrice(product.effective_price)}</span>
                      </p>
                      <button
                        className="btn product__add"
                        type="button"
                        onClick={() => handleAdd(product)}
                      >
                        {isAdded ? 'Added ✓' : 'Add to cart'}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}

            <p className="empty" id="empty" hidden={sorted.length !== 0}>
              No products in this category yet.
            </p>

            <nav className="pagination" aria-label="Shop pagination">
              <span className="is-current">1</span>
            </nav>
          </div>
        </section>
      </main>
      <GlobalFooter />
    </>
  );
}