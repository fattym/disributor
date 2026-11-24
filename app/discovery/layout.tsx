import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Discover books and learning materials', description: 'Discover popular books and learning materials chosen for Kenyan learners.', alternates: { canonical: '/discovery/' } };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
