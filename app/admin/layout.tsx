'use client';

import { useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

interface NavChild {
  href: string;
  label: string;
  icon: string;
}

interface NavItem {
  href?: string;
  label: string;
  icon: string;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: '🏠' },
  {
    icon: '👥',
    label: 'Users',
    children: [
      { href: '/admin/users', label: 'All Users', icon: '👥' },
      { href: '/admin/users/customers', label: 'Customers', icon: '👤' },
      { href: '/admin/users/teachers', label: 'Teachers', icon: '🎓' },
      { href: '/admin/users/school-accounts', label: 'School Accounts', icon: '🏫' },
      { href: '/admin/users/administrators', label: 'Administrators', icon: '🛡️' },
    ],
  },
  {
    icon: '🏪',
    label: 'Sellers',
    children: [
      { href: '/admin/sellers', label: 'All Sellers', icon: '🏪' },
      { href: '/admin/sellers/pending', label: 'Pending Applications', icon: '⏳' },
    ],
  },
  {
    icon: '🛍️',
    label: 'Marketplace',
    children: [
      { href: '/admin/products', label: 'Products', icon: '📦' },
      { href: '/admin/categories', label: 'Categories', icon: '📁' },
      { href: '/admin/courses', label: 'Courses', icon: '🎓' },
      { href: '/admin/reviews', label: 'Reviews', icon: '⭐' },
    ],
  },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  {
    icon: '💳',
    label: 'Payments',
    children: [
      { href: '/admin/payments', label: 'Transactions', icon: '💳' },
      { href: '/admin/refunds', label: 'Refunds', icon: '↩️' },
      { href: '/admin/withdrawals', label: 'Withdrawals', icon: '🏧' },
    ],
  },
  {
    icon: '🎟️',
    label: 'Marketing',
    children: [
      { href: '/admin/coupons', label: 'Coupons', icon: '🎟️' },
      { href: '/admin/promotions', label: 'Promotions', icon: '📢' },
      { href: '/admin/featured', label: 'Featured Items', icon: '⭐' },
    ],
  },
  { href: '/admin/reports', label: 'Reports', icon: '📊' },
  { href: '/admin/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/admin/content', label: 'Content', icon: '🌐' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

function SidebarItem({ item, isCollapsed }: { item: NavItem; isCollapsed: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hasChildren = !!item.children && item.children.length > 0;

  if (hasChildren) {
    const isParentActive = item.children?.some((c) => c.href === pathname || pathname.startsWith(c.href + '/'));
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left ${
            isParentActive
              ? 'bg-orange-600 text-white'
              : 'text-zinc-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <span>{item.icon}</span>
          {!isCollapsed && <span className="flex-1">{item.label}</span>}
          {!isCollapsed && <span className="ml-auto transition-transform">{open ? '▼' : '▶'}</span>}
        </button>
        {!isCollapsed && open && (
          <div className="ml-5 border-l-2 border-orange-600/20 pl-2 mt-1 space-y-1">
            {item.children!.map((child) => {
              const active = pathname === child.href || pathname.startsWith(child.href + '/');
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`flex items-center gap-3 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    active
                      ? 'bg-orange-600 text-white'
                      : 'text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{child.icon}</span>
                  <span>{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const active = item.href ? pathname === item.href || pathname.startsWith(item.href + '/') : false;
  if (!item.href) return null;
  return (
    <Link
      key={item.label}
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
        active
          ? 'bg-orange-600 text-white'
          : 'text-zinc-300 hover:text-white hover:bg-white/10'
      }`}
    >
      <span>{item.icon}</span>
      {!isCollapsed && <span>{item.label}</span>}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside
        className={`flex flex-col bg-navy dark:bg-zinc-900 text-zinc-100 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-white">Learning Pack</h1>
              <p className="text-xs text-orange-400">Super Admin</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <SidebarItem key={item.label} item={item} isCollapsed={isCollapsed} />
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            type="button"
            onClick={logout}
            className="w-full px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy dark:text-zinc-100">Learning Pack Admin</h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              aria-label="Notifications"
            >
              <span className="text-xl">🔔</span>
              <span className="absolute -top-1 -right-1 flex h-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                5
              </span>
            </button>
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {user.first_name?.[0]}
                  {user.last_name?.[0]}
                </span>
              </div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden md:inline-block">
                {user.first_name} {user.last_name}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
