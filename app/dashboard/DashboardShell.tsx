'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

interface NavItem {
  href: string;
  label: string;
  /** SVG path data (24x24, stroke icon). */
  icon: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z' },
  { href: '/dashboard/products', label: 'Products', icon: 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8' },
  { href: '/dashboard/catalogue', label: 'Catalogue', icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { href: '/dashboard/fulfilments', label: 'Fulfilments', icon: 'M3 7h18v13H3zM3 7l3-4h12l3 4M9 12h6' },
  { href: '/dashboard/orders', label: 'School orders', icon: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7' },
  { href: '/dashboard/deliveries', label: 'Deliveries', icon: 'M1 6h13v10H1zM14 10h4l3 3v3h-7M5.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z' },
];

const HELP_URL = 'https://wa.me/254716815025';
const ROW = 'flex items-center gap-3 min-h-11 px-3 rounded-xl text-sm no-underline';

function Icon({ d, color }: { d: string; color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** Exactly one item is active: the longest href that matches the path (so /dashboard is not lit on its sub-pages). */
function activeHref(pathname: string): string | null {
  const hits = navItems.filter((i) => pathname === i.href || pathname.startsWith(i.href + '/'));
  return hits.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;
}

function SidebarNav({ onItemClick }: { onItemClick?: () => void }) {
  const current = activeHref(usePathname());
  return (
    <nav aria-label="Seller menu" className="flex flex-col gap-0.5">
      {navItems.map((item) => {
        const active = item.href === current;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            aria-current={active ? 'page' : undefined}
            className={`${ROW} ${active ? 'bg-[#F26B1D] !text-[#0F1E3D] font-bold' : 'font-semibold !text-[#C9D1E6] hover:!text-white hover:bg-white/10'}`}
          >
            <Icon d={item.icon} color={active ? '#0F1E3D' : '#C9D1E6'} />
            <span className="flex-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const denied = !loading && (!user || user.role !== 'DISTRIBUTOR');

  useEffect(() => {
    if (denied) router.replace('/login');
  }, [denied, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading…</div>
      </div>
    );
  }

  if (denied || !user) return null;

  return (
    <div className="lp-app flex h-screen w-full overflow-hidden bg-[#F5F6FA] text-[#16213B]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* Sidebar: off-canvas on mobile, fixed on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[264px] bg-[#0F1E3D] text-[#E6EAF5] flex flex-col gap-1 px-3.5 pt-[18px] pb-5 overflow-y-auto transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-1.5 pb-4">
          <div aria-hidden="true" className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F26B1D] text-[#0F1E3D] font-extrabold text-[15px] flex-none">LP</div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[15px] font-bold text-white">Learning Pack</span>
            <span className="text-xs text-[#9AA6C4]">Seller centre</span>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl text-[#C9D1E6] hover:bg-white/10" aria-label="Close menu">
            <Icon d="M6 6l12 12M18 6 6 18" color="#C9D1E6" />
          </button>
        </div>
        <div className="flex flex-col gap-0.5 p-3 mb-2.5 rounded-[14px] bg-[#1A2C52]">
          <span className="text-xs text-[#9AA6C4]">Signed in as</span>
          <span className="text-sm font-semibold text-white truncate">{user.email}</span>
          <span className="text-xs font-semibold text-[#FFB27A]">Seller</span>
        </div>
        <SidebarNav onItemClick={() => setSidebarOpen(false)} />
        <div className="flex-1" />
        <a href={HELP_URL} target="_blank" rel="noopener noreferrer" className={`${ROW} font-semibold !text-[#C9D1E6] hover:!text-white hover:bg-white/10`}>
          <Icon d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z" color="#C9D1E6" />
          Help on WhatsApp
        </a>
        <button type="button" onClick={logout} className={`${ROW} font-semibold text-[#C9D1E6] hover:text-white hover:bg-white/10 text-left`}>
          <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" color="#C9D1E6" />
          Sign out
        </button>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden md:ml-[264px]">
        <header className="md:hidden flex items-center gap-3 bg-[#0F1E3D] px-3 py-2">
          <button type="button" onClick={() => setSidebarOpen(true)} className="flex items-center justify-center w-11 h-11 rounded-xl text-white hover:bg-white/10" aria-label="Open menu">
            <Icon d="M4 6h16M4 12h16M4 18h16" color="#FFFFFF" />
          </button>
          <span className="text-[15px] font-bold text-white">Learning Pack · Seller centre</span>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:pt-5 md:pb-12">{children}</main>
      </div>
    </div>
  );
}
