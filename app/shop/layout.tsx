import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: { default: 'Shop school books and stationery', template: '%s | Learning Pack' }, description: 'Browse school books, stationery and learning materials for every grade. Pay with M-Pesa and get delivery across Kenya.', alternates: { canonical: '/shop/' } };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
