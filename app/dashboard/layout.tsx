'use client';

import { useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/products', label: 'Products', icon: '📦' },
  { href: '/orders', label: 'Orders', icon: '📋' },
  { href: '/deliveries', label: 'Deliveries', icon: '🚚' },
];

function SidebarNav({ isMobile = false, onItemClick }: { isMobile?: boolean; onItemClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto p-3 space-y-1">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={isMobile ? onItemClick : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              active
                ? 'bg-orange-600 text-white'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
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

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">Loading…</div>
      </div>
    );
  }

  if (!user || user.role !== 'DISTRIBUTOR') {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — off-canvas on mobile, fixed on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-navy dark:bg-zinc-900 text-zinc-100 flex flex-col transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Distributor</h2>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md text-zinc-300 hover:text-white hover:bg-white/10 md:hidden"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <div className="p-4 border-b border-white/10">
          <p className="text-sm text-zinc-300 break-all">{user.email}</p>
        </div>
        <SidebarNav isMobile onItemClick={() => setSidebarOpen(false)} />
        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content — shifted past the fixed sidebar on desktop */}
      <div className="flex flex-1 flex-col overflow-hidden md:ml-64">
        <header className="flex items-center justify-between bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Distributor Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-900 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
