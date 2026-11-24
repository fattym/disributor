import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Student boxes', description: 'Ready-made student boxes with the books and stationery your child needs for the term, delivered across Kenya.', alternates: { canonical: '/product-category/student-boxes/' } };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
