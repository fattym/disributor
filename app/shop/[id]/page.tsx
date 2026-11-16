import ProductDetailClient from './ProductDetailClient';
import { shopApi } from '@/lib/api';

export async function generateStaticParams() {
  try {
    // getPublicProducts already follows pagination and returns the full list.
    const products = await shopApi.getPublicProducts();
    // Every product, plus 'placeholder': nginx serves /shop/placeholder/ for ids that were not
    // pre-rendered (products added after this build); the page reads the real id client-side.
    return [...products.map((p) => ({ id: String(p.id) })), { id: 'placeholder' }];
  } catch {
    return [{ id: 'placeholder' }];
  }
}

export const metadata = {
  title: 'Product Details | Learning Pack',
  description: 'View product details and add to cart',
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ProductDetailClient params={params} />;
}
