import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Find my school list', description: 'Search your child’s school and grade to get the official booklist, then order every item in one go.', alternates: { canonical: '/find-my-school-list/' } };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
