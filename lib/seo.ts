// Build-time SEO helpers (server only). Used by metadata, sitemap and JSON-LD.
import { shopApi, type ShopProduct, type Grade } from '@/lib/api';

export const SITE_URL = 'https://learningpack.codingclubskenya.com';
export const SITE_NAME = 'Learning Pack';
export const SITE_DESCRIPTION =
  "Find your child's school list, order everything in one go and pay with M-Pesa. Delivered to your door anywhere in Kenya.";
export const DEFAULT_OG_IMAGE = '/og-default.png';

export const abs = (path: string) => new URL(path, SITE_URL).toString();

/**
 * Public list item. `sku` is not in the public LIST response yet (only in the per-product detail, which the API's
 * anonymous rate limit of 1200/hour makes unusable for a 3,900-product build); it is picked up automatically once
 * the list serializer exposes it (ISBN then appears in the description).
 */
export type SeoProduct = ShopProduct & { backorders?: boolean };

// One catalogue fetch per build process (about 20 list requests). No fallback: a build that cannot read the
// catalogue must fail rather than ship a site with no products.
let catalogue: Promise<SeoProduct[]> | null = null;
export function getBuildProducts(): Promise<SeoProduct[]> {
  catalogue ??= shopApi.getPublicProducts().then((l) => l.filter((p) => p.is_active !== false) as SeoProduct[]);
  return catalogue;
}

let grades: Promise<Grade[]> | null = null;
export function getBuildGrades(): Promise<Grade[]> {
  grades ??= shopApi.getPublicGrades().then((g) => (Array.isArray(g) ? g : g.results || []));
  return grades;
}

export const plainText = (s: string | null | undefined, max = 300): string => {
  const t = (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
};

/** Absolute image URL, or undefined when the product has none (never emit a broken image). */
export const productImage = (p: ShopProduct): string | undefined => {
  const u = p.image_url || p.cover_image || p.image;
  if (!u) return undefined;
  try {
    return new URL(u, SITE_URL).toString();
  } catch {
    return undefined;
  }
};

const variantPrice = (v: ShopProduct['variants'][number]) => parseFloat(v.price_override ?? v.effective_price);

/** Lowest valid variant price, else the product price. Undefined when there is no valid price. */
export const productPrice = (p: ShopProduct): number | undefined => {
  const prices = (p.variants || []).map(variantPrice).filter((n) => Number.isFinite(n) && n > 0);
  if (prices.length) return Math.min(...prices);
  const base = parseFloat(p.effective_price || p.price);
  return Number.isFinite(base) && base > 0 ? base : undefined;
};

/**
 * schema.org availability. Real stock (variant.stock_quantity, as the public API reports it) > 0 -> InStock.
 * Variants at zero are orderable on the live site (0 = unlimited until the stock release), so BackOrder, never
 * OutOfStock: no product is hidden or marked unavailable. No variants -> undefined -> no offers block.
 */
export function availability(p: SeoProduct): 'InStock' | 'BackOrder' | undefined {
  const variants = p.variants || [];
  if (variants.length === 0) return undefined;
  return variants.some((v) => v.stock_quantity > 0) ? 'InStock' : 'BackOrder';
}

export const gradeNames = (p: ShopProduct, all: Grade[]): string[] =>
  (p.applicable_levels || []).map((id) => all.find((g) => g.id === id)?.name).filter((n): n is string => !!n);

const isbnOf = (sku?: string): string | undefined => {
  const d = (sku || '').replace(/[-\s]/g, '');
  return /^(\d{9}[\dXx]|\d{13})$/.test(d) ? d : undefined;
};

/** Built only from real fields (title, category, publisher/brand, grades, ISBN): nothing invented. */
export function autoDescription(p: SeoProduct, grades: string[]): string {
  const parts = [p.name.replace(/\.$/, '')];
  if (p.category_name) parts.push(`Category: ${p.category_name}`);
  if (p.brand) parts.push(`Publisher: ${p.brand}`);
  if (grades.length) parts.push(`For ${grades.join(', ')}`);
  const isbn = isbnOf(p.sku);
  if (isbn) parts.push(`ISBN ${isbn}`);
  return `${parts.join('. ')}.`;
}

/** The real description when the product has one, otherwise the automatic one. */
export const productDescription = (p: SeoProduct, grades: string[]): string =>
  plainText(p.description, 5000) || autoDescription(p, grades);

export function productJsonLd(p: SeoProduct, grades: string[]) {
  const url = abs(`/shop/${p.id}/`);
  const image = productImage(p);
  const price = productPrice(p);
  const avail = availability(p);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    url,
    ...(image && { image: [image] }),
    description: productDescription(p, grades),
    ...(p.sku && { sku: p.sku }),
    ...(isbnOf(p.sku) && { isbn: isbnOf(p.sku) }),
    ...(p.brand && { brand: { '@type': 'Brand', name: p.brand } }),
    ...(p.category_name && { category: p.category_name }),
    ...(price !== undefined && avail && {
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'KES',
        price: price.toFixed(2),
        availability: `https://schema.org/${avail}`,
        itemCondition: 'https://schema.org/NewCondition',
      },
    }),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: abs('/icons/logo-512.png'),
  areaServed: 'KE',
  contactPoint: [{ '@type': 'ContactPoint', telephone: '+254798734442', contactType: 'customer service', areaServed: 'KE', availableLanguage: 'en' }],
};
