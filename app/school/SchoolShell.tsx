'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const NAV = [
  { href: '/school', label: 'School profile' },
  { href: '/school/booklists', label: 'Booklists' },
  { href: '/school/share', label: 'Share & QR' },
];

/** The booklist-only school's own area. No ERP, no seller tools. The API also limits each account to its school. */
export default function SchoolShell({ children }: { children: ReactNode }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const path = usePathname().replace(/\/$/, '');
  const allowed = !!user && !!user.school && (user.role === 'BOOKLIST_ADMIN' || user.role === 'ADMIN');
  const denied = !loading && !allowed;

  useEffect(() => { if (denied) router.replace('/login'); }, [denied, router]);

  if (loading) return <p className="p-8 text-center">Loading…</p>;
  if (!allowed) return null;

  return (
    <div className="lp-app min-h-screen bg-[#F5F6FA] text-[#16213B]">
      <header className="bg-[#0F1E3D] text-white print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <span className="font-extrabold">Learning Pack · School booklists</span>
          <button type="button" onClick={logout} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-[#C9D1E6] hover:bg-white/10">Sign out</button>
        </div>
        <nav aria-label="School menu" className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map((n) => {
            const active = n.href === '/school' ? path === '/school' : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center whitespace-nowrap rounded-xl px-3 text-sm no-underline ${active ? 'bg-[#F26B1D] font-bold !text-[#0F1E3D]' : 'font-semibold !text-[#C9D1E6] hover:bg-white/10'}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main id="main" className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5">{children}</main>
    </div>
  );
}
