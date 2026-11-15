import ProductDetailClient from './ProductDetailClient';
import { shopApi } from '@/lib/api';

export async function generateStaticParams() {
  try {
    // getPublicProducts already follows pagination and returns the full list.
    const products = await shopApi.getPublicProducts();
    return products.slice(0, 100).map((p) => ({ id: String(p.id) }));
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
