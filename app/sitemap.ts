import type { MetadataRoute } from 'next';
import { abs, getBuildProducts } from '@/lib/seo';

export const dynamic = 'force-static';

// Public, indexable pages that exist today. Categories/grades are client-side filters of /shop (no URLs of
// their own) and there are no policy pages yet, so they are not listed.
const STATIC_PAGES: Array<[string, number]> = [
  ['/', 1.0],
  ['/shop/', 0.9],
  ['/bookshop/', 0.5],
  ['/product-category/student-boxes/', 0.7],
  ['/find-my-school-list/', 0.7],
  ['/upload-my-list/', 0.5],
  ['/contact/', 0.4],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  // No try/catch: a build that cannot read the catalogue must fail, not ship a sitemap without products.
  const products = await getBuildProducts();
  return [
    ...STATIC_PAGES.map(([path, priority]) => ({ url: abs(path), lastModified: now, priority })),
    ...products.map((p) => ({ url: abs(`/shop/${p.id}/`), lastModified: now, priority: 0.8 })),
  ];
}
