import ProductDetailClient from './ProductDetailClient';
import { shopApi } from '@/lib/api';

export async function generateStaticParams() {
  try {
    const data = await shopApi.getPublicProducts();
    const products = Array.isArray(data) ? data : data.results || [];
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
