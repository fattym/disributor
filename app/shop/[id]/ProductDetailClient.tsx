'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import { shopApi, ShopProduct } from '@/lib/api';
import { useAuth } from '@/lib/auth';
  import { useCart } from '@/lib/cart';

  export default function ProductDetailPage({ params, initialProduct = null, grades = [], autoDescription = '', crumbs = [] }: {
  params: Promise<{ id: string }>;
  // Build-time snapshot, pre-rendered into the HTML so crawlers see the product. Price/stock are refreshed live below.
  initialProduct?: ShopProduct | null;
  grades?: string[];
  autoDescription?: string; // built from real fields at build time; shown when the product has no description
  crumbs?: Array<{ name: string; href: string }>;
}) {
  const { user } = useAuth();
  const { addItem, getItemCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [product, setProduct] = useState<ShopProduct | null>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [variantId, setVariantId] = useState<number | ''>(initialProduct?.variants?.[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Static export: /shop/<any id>/ may be served by the /shop/placeholder/ page
      // (nginx rewrite), so the real id comes from the browser URL, not build-time params.
      const resolved = await params;
      const fromUrl = (pathname || '').split('/').filter(Boolean)[1];
      const id = fromUrl && fromUrl !== 'placeholder' ? decodeURIComponent(fromUrl) : resolved.id;
      try {
        const data = await shopApi.getPublicProduct(id);
        setProduct(data);
        document.title = `${data.name} | Learning Pack`;
        setVariantId((cur) => (data.variants?.some((v) => v.id === cur) ? cur : data.variants?.[0]?.id ?? ''));
      } catch (e) {
        // 404 for an id that does not exist (only reachable through the placeholder shell, which is noindex).
        if (!initialProduct && (e as { response?: { status?: number } })?.response?.status === 404) {
          document.title = 'Product not found | Learning Pack';
          setNotFound(true);
        }
        // otherwise keep the pre-rendered snapshot if the live refresh fails
      }
      setLoading(false);
    };
    load();
  }, [params, pathname]);

  if (loading) {
    return (
      <div>
        <GlobalHeader />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">Loading product...</p>
        </main>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div>
        <GlobalHeader />
        <main className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Product not found</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">This product does not exist or is no longer available.</p>
          <Link href="/shop/" className="mt-6 inline-block px-5 py-2.5 bg-[#0B1F3A] text-white rounded-md font-medium hover:bg-[#E63B00] transition-colors">Browse the shop</Link>
        </main>
        <GlobalFooter />
      </div>
    );
  }

  const hasVariants = product.variants && product.variants.length > 0;
  const selectedVariant = hasVariants ? product.variants.find((v) => v.id === variantId) : null;
  const unitPrice = parseFloat(selectedVariant ? (selectedVariant.price_override ?? selectedVariant.effective_price) : product.effective_price || product.price || '0');
  const stock = selectedVariant ? selectedVariant.stock_quantity : (hasVariants ? 0 : 0);
  const maxQty = Math.max(stock, 1);

  const handleAdd = () => {
    if (!hasVariants || !selectedVariant) {
      return; // unavailable: never add a line without a variant id
    } else {
      addItem({
        product_id: product.id,
        product_name: product.name,
        variant_id: selectedVariant.id,
        variant_label: selectedVariant.label,
        quantity,
        unit_price: parseFloat(selectedVariant.effective_price),
        image_url: product.image_url,
        stock_quantity: selectedVariant.stock_quantity,
      });
    }
    setAdded(true);
  };

  return (
    <div>
      <GlobalHeader />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {crumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="text-sm text-zinc-600 dark:text-zinc-400">
            <ol className="flex flex-wrap gap-x-2">
              {crumbs.map((c, i) => (
                <li key={c.href}>
                  {i < crumbs.length - 1 ? <Link href={c.href} className="hover:text-zinc-900 dark:hover:text-zinc-200">{c.name}</Link> : <span aria-current="page">{c.name}</span>}
                  {i < crumbs.length - 1 && <span aria-hidden="true"> /</span>}
                </li>
              ))}
            </ol>
          </nav>
        ) : (
          <Link href="/shop" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200">&larr; Back to shop</Link>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover object-center" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-400">No image</div>
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{product.name}</h1>
            {product.distributor_name && (
              <p className="text-sm text-zinc-500">Sold by {product.distributor_name}</p>
            )}
            <p className="text-3xl font-bold text-[#0B1F3A] dark:text-[#E63B00]">
              KSh {unitPrice.toLocaleString()}
            </p>

            {(product.category_name || grades.length > 0) && (
              <p className="text-sm text-zinc-500">
                {product.category_name}{product.category_name && grades.length > 0 ? ' · ' : ''}{grades.length > 0 && `For ${grades.join(', ')}`}
              </p>
            )}

            {(product.description || autoDescription) && (
              <p className="text-zinc-700 dark:text-zinc-300">{product.description || autoDescription}</p>
            )}

            {hasVariants && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Variant</label>
                <select
                  value={variantId}
                  onChange={(e) => setVariantId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                >
                  {product.variants.map((v) => (
                    <option key={v.id} value={v.id} disabled={v.stock_quantity <= 0}>
                      {v.label} {v.stock_quantity > 0 ? `(${v.stock_quantity} in stock)` : '(out of stock)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Quantity</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  −
                </button>
                <span className="w-8 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(quantity + 1, maxQty))}
                  className="px-3 py-1 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  disabled={quantity >= maxQty}
                >
                  +
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleAdd}
                disabled={!hasVariants}
                className="px-5 py-2.5 bg-[#0B1F3A] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md font-medium hover:bg-[#E63B00] dark:hover:bg-[#E63B00]/90 transition-colors"
              >
                {!hasVariants ? 'Unavailable' : added ? 'Added ✓' : 'Add to cart'}
              </button>
              <button
                onClick={() => router.push('/cart')}
                className="px-5 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                View cart ({getItemCount()})
              </button>
            </div>
            {!user && (
              <p className="text-xs text-zinc-500">
                You can keep shopping — sign in at checkout when you are ready to pay.
              </p>
            )}
          </div>
        </div>
      </main>
      <GlobalFooter />
    </div>
  );
}
