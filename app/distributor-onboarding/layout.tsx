import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Become a distributor', description: 'Apply to supply books and learning materials through the Learning Pack platform.', alternates: { canonical: '/distributor-onboarding/' } };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
