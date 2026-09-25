"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import { shopApi, ShopProduct } from "@/lib/api";
import { useCart } from "@/lib/cart";

const formatPrice = (value: string | null | undefined) =>
  `KSh ${parseInt(value || "0", 10).toLocaleString("en-KE")}`;

export default function StudentBoxesPage() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await shopApi.getPublicProducts({});
        const list = Array.isArray(response)
          ? response
          : response.results || [];
        setProducts(list);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const packs = useMemo(
    () =>
      products.filter((product) => {
        const category = product.category_name.toLowerCase();
        return category.includes("student") || category.includes("box");
      }),
    [products],
  );

  const handleAdd = (product: ShopProduct) => {
    const variant = product.variants?.[0];
    addItem({
      product_id: product.id,
      product_name: product.name,
      variant_id: variant?.id ?? 0,
      variant_label: variant?.label ?? "Default",
      quantity: 1,
      unit_price: parseFloat(
        variant?.effective_price ||
          product.effective_price ||
          product.price ||
          "0",
      ),
      image_url: product.image_url,
      stock_quantity: variant?.stock_quantity ?? 0,
    });
    setAddedIds((current) => ({ ...current, [product.id]: true }));
    setTimeout(
      () => setAddedIds((current) => ({ ...current, [product.id]: false })),
      1400,
    );
  };

  return (
    <>
      <GlobalHeader />
      <main id="main">
        <div className="shop-hero">
          <div className="wrap">
            <p className="crumbs">
              <Link href="/">Home</Link> / School packs
            </p>
            <h1>School packs, ready to order</h1>
            <p>
              Complete student boxes for the school year, packed so you can get
              everything your child needs in one go.
            </p>
            <p className="pack-benefit">
              Select 12 items and have them delivered free.
            </p>
          </div>
        </div>

        <section className="shop">
          <div className="wrap">
            <div className="category-intro">
              <h2>Student boxes</h2>
              <p>Choose a pack, check the contents, and add it to your cart.</p>
            </div>

            {loading ? (
              <div className="empty">Loading school packs...</div>
            ) : packs.length === 0 ? (
              <div className="empty">
                School packs are being prepared. Browse the full shop for
                available items.
                <Link className="btn" href="/shop">
                  Browse all products
                </Link>
              </div>
            ) : (
              <div className="grid">
                {packs.map((product) => {
                  const isAdded = addedIds[product.id];
                  return (
                    <article className="product" key={product.id}>
                      <Link
                        className="product__img"
                        href={`/shop/${product.id}`}
                        aria-label={product.name}
                      >
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            loading="lazy"
                            width="600"
                            height="600"
                          />
                        ) : (
                          <div className="product__img-placeholder">
                            No image
                          </div>
                        )}
                      </Link>
                      <p className="product__cat">School pack</p>
                      <h3 className="product__name">
                        <Link href={`/shop/${product.id}`}>{product.name}</Link>
                      </h3>
                      <p className="product__price">
                        {formatPrice(product.effective_price || product.price)}
                      </p>
                      <button
                        className="btn product__add"
                        type="button"
                        onClick={() => handleAdd(product)}
                      >
                        {isAdded ? "Added" : "Add to cart"}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <GlobalFooter />
    </>
  );
}
