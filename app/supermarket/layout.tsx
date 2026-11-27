import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Learning Pack supermarket', description: 'Shop school supplies in one place with delivery across Kenya. Pay with M-Pesa after we confirm your order on WhatsApp.', alternates: { canonical: '/supermarket/' } };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
