export async function generateStaticParams() {
  return [];
}

export const metadata = {
  title: 'Product Details | Learning Pack',
  description: 'View product details and add to cart',
};

export default function ShopIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
