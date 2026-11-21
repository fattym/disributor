import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Contact us', description: 'Call, WhatsApp or write to Learning Pack for help with school lists, orders and delivery in Kenya.', alternates: { canonical: '/contact/' } };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
