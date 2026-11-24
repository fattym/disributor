import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Upload my school list', description: 'Upload a photo or PDF of your child’s school list and Learning Pack will assemble the order for you.', alternates: { canonical: '/upload-my-list/' } };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
