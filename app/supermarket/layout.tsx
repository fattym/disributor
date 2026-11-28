import { DELIVERY_NOTE } from '@/lib/shopText';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Learning Pack supermarket', description: `Shop school supplies in one place. Pay with M-Pesa after we confirm your order on WhatsApp. ${DELIVERY_NOTE}`, alternates: { canonical: '/supermarket/' } };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
