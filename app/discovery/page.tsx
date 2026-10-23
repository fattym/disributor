"use client";

import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import InstitutionEnquiryForm from "@/components/discovery/InstitutionEnquiryForm";
import {
  fetchDiscoveryProducts,
  fetchShoppableVideos,
  fetchDistributors,
  INSTITUTION_TYPES,
  type DiscoveryProduct,
  type ShoppableVideo,
  type DistributorInfo,
} from "@/lib/discoveryApi";

interface DiscoveryPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function formatPrice(value: string | number | undefined | null): string {
  const num = typeof value === "number" ? value : parseFloat(value || "0");
  if (isNaN(num)) return "KSh 0";
  return `KSh ${num.toLocaleString("en-KE")}`;
}

export default function DiscoveryPage({ searchParams }: DiscoveryPageProps) {
  const resolvedSearchParams = use(searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>));

  const initialSearch = typeof resolvedSearchParams?.search === "string" ? resolvedSearchParams.search : "";
  const initialCategory = typeof resolvedSearchParams?.category === "string" ? resolvedSearchParams.category : "";
  const initialInstitutionType =
    typeof resolvedSearchParams?.institution_type === "string" ? resolvedSearchParams.institution_type : "";
  const initialDistributor = typeof resolvedSearchParams?.distributor === "string" ? resolvedSearchParams.distributor : "";
  const initialMinPrice = typeof resolvedSearchParams?.min_price === "string" ? resolvedSearchParams.min_price : "";
  const initialMaxPrice = typeof resolvedSearchParams?.max_price === "string" ? resolvedSearchParams.max_price : "";

  const [products, setProducts] = useState<DiscoveryProduct[]>([]);
  const [videos, setVideos] = useState<ShoppableVideo[]>([]);
  const [distributors, setDistributors] = useState<DistributorInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory || "All");
  const [activeDistributor, setActiveDistributor] = useState<string>(initialDistributor || "All");
  const [activeInstitutionType, setActiveInstitutionType] = useState<string>(initialInstitutionType || "All");
  const [queryInput, setQueryInput] = useState<string>(initialSearch || "");
  const [query, setQuery] = useState<string>(initialSearch || "");
  const [minPrice, setMinPrice] = useState<string>(initialMinPrice || "");
  const [maxPrice, setMaxPrice] = useState<string>(initialMaxPrice || "");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | undefined> = {};
        if (query.trim()) params.search = query.trim();
        if (activeCategory !== "All") params.category = activeCategory;
        if (activeDistributor !== "All") params.distributor = activeDistributor;
        if (activeInstitutionType !== "All") params.institution_type = activeInstitutionType;
        if (minPrice) params.min_price = minPrice;
        if (maxPrice) params.max_price = maxPrice;

        const [prodData, vidData, distData] = await Promise.all([
          fetchDiscoveryProducts(params).catch(() => []),
          fetchShoppableVideos().catch(() => []),
          fetchDistributors().catch(() => []),
        ]);

        setProducts(prodData);
        setVideos(vidData);
        setDistributors(distData);
      } catch (err) {
        console.error("Discovery fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [query, activeCategory, activeDistributor, activeInstitutionType, minPrice, maxPrice]);

  const categoryNames = useMemo(
    () => Array.from(new Set(products.map((p) => p.category_name).filter(Boolean))),
    [products],
  );

  const distributorNames = useMemo(
    () =>
      Array.from(
        new Set(
          products.map((p) => p.distributor_name).filter((n): n is string => Boolean(n)),
        ),
      ),
    [products],
  );

  const institutionTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          products.flatMap((p) => p.institution_categories || []).filter(Boolean),
        ),
      ),
    [products],
  );

  const uniqueInstitutionTypes = useMemo(
    () => [...new Set([...institutionTypeOptions, ...INSTITUTION_TYPES.map((t) => t.label)])],
    [institutionTypeOptions],
  );

  const minPriceVal = products.length > 0
    ? Math.min(...products.map((p) => parseFloat(p.effective_price || p.price || "0")))
    : 0;
  const maxPriceVal = products.length > 0
    ? Math.max(...products.map((p) => parseFloat(p.effective_price || p.price || "0")))
    : 10000;

  const affiliateProducts = useMemo(
    () =>
      products.filter(
        (p) => p.commission_amount && parseFloat(p.commission_amount) > 0,
      ),
    [products],
  );

  const clearFilters = () => {
    setQuery("");
    setQueryInput("");
    setActiveCategory("All");
    setActiveDistributor("All");
    setActiveInstitutionType("All");
    setMinPrice("");
    setMaxPrice("");
  };

  return (
    <>
      <GlobalHeader />
      <main id="main">
        {/* ===== Section A: Product Discovery ===== */}
        <section className="py-8">
          <div className="wrap">
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              LEARNING PACK MARKETPLACE
            </p>
            <h1 className="mt-2 text-3xl font-bold">Discover products</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Explore products, distributors and learning supplies.
            </p>

            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setQuery(queryInput);
              }}
              className="mt-5 flex flex-col gap-3 sm:flex-row"
            >
              <input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Search products, distributors, keywords..."
                className="min-w-0 flex-1 rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
              />
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-700"
              >
                Search
              </button>
              {(query ||
                activeCategory !== "All" ||
                activeDistributor !== "All" ||
                activeInstitutionType !== "All" ||
                minPrice ||
                maxPrice) && (
                <button
                  onClick={clearFilters}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600"
                >
                  Clear filters
                </button>
              )}
            </form>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Category
                </label>
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
                >
                  <option value="All">All categories</option>
                  {categoryNames.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Institution type
                </label>
                <select
                  value={activeInstitutionType}
                  onChange={(e) => setActiveInstitutionType(e.target.value)}
                  className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
                >
                  <option value="All">All institution types</option>
                  {uniqueInstitutionTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Distributor
                </label>
                <select
                  value={activeDistributor}
                  onChange={(e) => setActiveDistributor(e.target.value)}
                  className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
                >
                  <option value="All">All distributors</option>
                  {distributorNames.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Min price
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  min={0}
                  placeholder={formatPrice(minPriceVal)}
                  className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Max price
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min={0}
                  placeholder={formatPrice(maxPriceVal)}
                  className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600"
                />
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {loading
                ? "Loading..."
                : `${products.length} product${products.length !== 1 ? "s" : ""} found`}
            </p>
          </div>
        </section>

        {/* Product grid */}
        <section className="wrap pb-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse rounded-xl border bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="py-12 text-center text-gray-500 dark:text-gray-400">
              No products found. Try adjusting your search or filters.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700"
                >
                  <Link href={`/shop/${product.id}`} className="block">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-48 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-700">
                        No image
                      </div>
                    )}
                  </Link>

                  <div className="p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {product.category_name || "General"}
                    </p>
                    <h3 className="mt-1 font-semibold">{product.name}</h3>
                    <p className="mt-2 text-lg font-bold">
                      {formatPrice(product.effective_price || product.price)}
                    </p>

                    {product.commission_amount &&
                      parseFloat(product.commission_amount) > 0 && (
                      <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                        Affiliate commission: {formatPrice(product.commission_amount)}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Stock:{" "}
                      {product.total_stock > 0
                        ? `${product.total_stock} available`
                        : "Out of stock"}
                    </p>

                    {product.institution_categories &&
                      product.institution_categories.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {product.institution_categories.join(", ")}
                      </p>
                    )}

                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/shop/${product.id}`}
                        className="flex-1 rounded-lg border border-indigo-600 px-3 py-2 text-center text-sm font-medium text-indigo-600"
                      >
                        View Product
                      </Link>
                      <Link
                        href="/cart"
                        className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-indigo-700"
                      >
                        Buy Now
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ===== Section B: Shoppable Videos ===== */}
        {videos.length > 0 && (
          <section className="py-12">
            <div className="wrap">
              <h2 className="text-2xl font-bold">Watch &amp; Shop</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Short product demonstration videos linked to real products.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                  <article
                    key={video.id}
                    className="overflow-hidden rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700"
                  >
                    <div className="relative aspect-video">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="h-full w-full object-cover"
                        />
                      ) : video.product_image_url ? (
                        <img
                          src={video.product_image_url}
                          alt={video.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-700">
                          No thumbnail
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <svg
                          className="h-12 w-12 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M10 15l5-3-5-3v6z" />
                          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 6h16v12H4V6z" />
                        </svg>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold">{video.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {video.description || "Product demonstration video"}
                      </p>
                      {video.product_url && (
                        <Link
                          href={video.product_url}
                          className="mt-2 block text-sm font-medium text-indigo-600 dark:text-indigo-400"
                        >
                          View product →
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===== Section C: Distributor Marketplace ===== */}
        {distributors.length > 0 && (
          <section className="py-12 bg-gray-50 dark:bg-gray-900">
            <div className="wrap">
              <h2 className="text-2xl font-bold">Approved Distributors</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Browse verified distributors and their products.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {distributors.map((distributor) => (
                  <article
                    key={distributor.id}
                    className="rounded-xl border bg-white p-6 dark:bg-gray-800 dark:border-gray-700"
                  >
                    <div className="flex items-start gap-4">
                      {distributor.logo_url ? (
                        <img
                          src={distributor.logo_url}
                          alt={distributor.company_name}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
                          {distributor.company_name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold">{distributor.company_name}</h3>
                        {distributor.is_verified && (
                          <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            Verified
                          </span>
                        )}
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {distributor.product_count} products available
                        </p>
                        {distributor.email && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {distributor.email}
                          </p>
                        )}
                        {distributor.phone && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {distributor.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {distributor.distributor_products &&
                      distributor.distributor_products.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {distributor.distributor_products
                          .slice(0, 3)
                          .map((prod) => (
                            <div key={prod.id} className="text-center">
                              {prod.image_url ? (
                                <img
                                  src={prod.image_url}
                                  alt={prod.name}
                                  className="mx-auto h-12 w-12 rounded object-cover"
                                />
                              ) : (
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
                                  <span className="text-xs">No img</span>
                                </div>
                              )}
                              <p className="mt-1 line-clamp-1 text-xs">
                                {prod.name}
                              </p>
                              <p className="text-xs font-medium">
                                {formatPrice(prod.unit_price)}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===== Section D: Affiliate & Institutional Discovery ===== */}
        <section className="py-12">
          <div className="wrap">
            {affiliateProducts.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold">Affiliate Picks</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Products available for affiliate promotion with commission.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {affiliateProducts.map((product) => (
                    <article
                      key={product.id}
                      className="overflow-hidden rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700"
                    >
                      <Link href={`/shop/${product.id}`} className="block">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-40 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-40 items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400">
                            No image
                          </div>
                        )}
                      </Link>
                      <div className="p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {product.category_name}
                        </p>
                        <h3 className="mt-1 font-semibold">{product.name}</h3>
                        <p className="mt-2 font-bold">
                          {formatPrice(product.effective_price || product.price)}
                        </p>
                        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                          Commission: {formatPrice(product.commission_amount)}
                        </p>
                        <Link
                          href={`/shop/${product.id}`}
                          className="mt-3 block rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white"
                        >
                          Promote
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold">Bulk Order Enquiry</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Schools, colleges, and other institutions: enquire about bulk
                orders and custom pricing.
              </p>

              <div className="mt-6 max-w-2xl">
                <InstitutionEnquiryForm
                  categories={[
                    ...INSTITUTION_TYPES.map((t) => t.value),
                    ...uniqueInstitutionTypes,
                  ]}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <GlobalFooter />
    </>
  );
}
