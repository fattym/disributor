import ProductDetailClient from './ProductDetailClient';

  export async function generateStaticParams() {
    return [{ id: 'placeholder' }];
  }

export const metadata = {
  title: 'Product Details | Learning Pack',
  description: 'View product details and add to cart',
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ProductDetailClient params={params} />;
}
