import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Walk-through 3D bookshop', description: 'Explore the Learning Pack bookshop in 3D and find books and stationery for your child’s grade.', alternates: { canonical: '/bookshop/' } };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
