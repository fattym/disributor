import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SchoolShell from './SchoolShell';

export const metadata: Metadata = { title: 'School booklists', robots: { index: false, follow: false } };

export default function Layout({ children }: { children: ReactNode }) {
  return <SchoolShell>{children}</SchoolShell>;
}
