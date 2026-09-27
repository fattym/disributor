'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'DISTRIBUTOR') {
    router.push('/login');
    return null;
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/products', label: 'Products', icon: '📦' },
    { href: '/orders', label: 'Orders', icon: '📋' },
    { href: '/deliveries', label: 'Deliveries', icon: '🚚' },
  ];

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="flex items-center justify-between bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Distributor Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-block text-sm text-zinc-600 dark:text-zinc-400">
            {user.email}
          </span>
          <ThemeToggle />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-zinc-900 text-white flex flex-col">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-xl font-bold">Distributor</h2>
            <p className="text-sm text-zinc-400 mt-1">{user.email}</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  pathname === item.href
                    ? 'bg-orange-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-zinc-800">
            <button
              onClick={logout}
              className="w-full px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>
        </aside>
        <main className="flex-1 p-8 bg-zinc-50 dark:bg-zinc-900 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
