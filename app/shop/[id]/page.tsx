import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import JsonLd from '@/components/JsonLd';
import {
  abs, breadcrumbJsonLd, DEFAULT_OG_IMAGE, getBuildGrades, getBuildProducts, gradeNames, plainText,
  productDescription, productImage, productJsonLd,
} from '@/lib/seo';

export async function generateStaticParams() {
  // No try/catch on purpose: if the catalogue cannot be read the build must fail, not ship a site with no products.
  const products = await getBuildProducts();
  // Every product, plus 'placeholder': nginx serves /shop/placeholder/ for ids that were not
  // pre-rendered (products added after this build); the page reads the real id client-side.
  return [...products.map((p) => ({ id: String(p.id) })), { id: 'placeholder' }];
}

const findProduct = async (id: string) => (await getBuildProducts()).find((p) => String(p.id) === id) ?? null;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await findProduct(id);
  if (!p) {
    // The placeholder shell is served for ids that were not pre-rendered (new or unknown products): never index it.
    return { title: 'Product not found', robots: { index: false, follow: true }, alternates: { canonical: null } };
  }
  const grades = gradeNames(p, await getBuildGrades());
  const description = plainText(productDescription(p, grades), 155);
  const image = productImage(p) ?? DEFAULT_OG_IMAGE;
  const url = abs(`/shop/${p.id}/`);
  return {
    title: p.name,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', siteName: 'Learning Pack', locale: 'en_KE', url, title: p.name, description, images: [{ url: image, alt: p.name }] },
    twitter: { card: 'summary_large_image', title: p.name, description, images: [image] },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await findProduct(id);
  if (!product) return <ProductDetailClient params={params} />;

  const grades = gradeNames(product, await getBuildGrades());
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop/' },
    ...(product.category_name ? [{ name: product.category_name, path: `/shop/?category=${product.category}` }] : []),
    { name: product.name, path: `/shop/${product.id}/` },
  ];
  return (
    <>
      <JsonLd data={productJsonLd(product, grades)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <ProductDetailClient
        params={params}
        initialProduct={product}
        grades={grades}
        autoDescription={productDescription(product, grades)}
        crumbs={crumbs.map((c) => ({ name: c.name, href: c.path }))}
      />
    </>
  );
}
