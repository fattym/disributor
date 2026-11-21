import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Learning Pack supermarket', description: 'Shop school supplies in one place with M-Pesa checkout and delivery across Kenya.', alternates: { canonical: '/supermarket/' } };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
