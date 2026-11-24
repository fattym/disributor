import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import DashboardLayout from './DashboardShell';

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false, follow: false } };

export default function Layout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
