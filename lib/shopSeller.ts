/** Seller (distributor) filter for /shop. Pure: no imports. Products without a linked distributor are Learning Pack's own. */
export const PLATFORM_SELLER = 'Learning Pack';

export const sellerOf = (p: { distributor_name?: string | null }): string => (p.distributor_name || '').trim() || PLATFORM_SELLER;

/** Distinct seller names with how many products each has, A to Z. */
export function sellerOptions(products: { distributor_name?: string | null }[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of products) counts.set(sellerOf(p), (counts.get(sellerOf(p)) || 0) + 1);
  return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
}

/** A crawlable href for /shop with the seller set (or removed), keeping the other query params and dropping paging. */
export function sellerHref(currentQuery: string, seller: string | null): string {
  const params = new URLSearchParams(currentQuery);
  params.delete('page');
  if (seller) params.set('seller', seller); else params.delete('seller');
  const qs = params.toString();
  return qs ? `/shop/?${qs}` : '/shop/';
}
