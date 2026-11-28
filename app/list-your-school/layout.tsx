import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'List your school’s booklist', description: 'Schools: publish your booklists on Learning Pack so parents can order every item in one go.', alternates: { canonical: '/list-your-school/' } };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
