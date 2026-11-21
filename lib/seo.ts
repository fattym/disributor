// Build-time SEO constants/helpers (server only).
import { shopApi, type ShopProduct } from '@/lib/api';

export const SITE_URL = 'https://learningpack.codingclubskenya.com';
export const SITE_NAME = 'Learning Pack';
export const SITE_DESCRIPTION =
  "Find your child's school list, order everything in one go and pay with M-Pesa. Delivered to your door anywhere in Kenya.";
export const DEFAULT_OG_IMAGE = '/og-default.png';

export const abs = (path: string) => new URL(path, SITE_URL).toString();

// One fetch of the full public catalogue per build process.
let products: Promise<ShopProduct[]> | null = null;
export function getBuildProducts(): Promise<ShopProduct[]> {
  products ??= shopApi.getPublicProducts().then((l) => l.filter((p) => p.is_active !== false));
  return products;
}
