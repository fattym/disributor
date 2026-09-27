'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import type { Stat, SalesPoint, AdminOrder, PlatformNotification } from '@/lib/adminApi';

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [salesData, setSalesData] = useState<SalesPoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, sales, orders, notes] = await Promise.all([
          adminApi.getDashboardStats(),
          adminApi.getSalesAnalytics(),
          adminApi.getRecentOrders(),
          adminApi.getNotifications(),
        ]);
        setStats(statsData);
        setSalesData(sales);
        setRecentOrders(orders);
        setNotifications(notes);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-lg">Loading dashboard...</div>;
  }

  const maxRevenue = Math.max(...salesData.map((s) => s.revenue), 1);
  const maxOrders = Math.max(...salesData.map((s) => s.orders), 1);
  const unpaidOrders = recentOrders.filter((o) => o.payment === 'PENDING').length;

  const statusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'PROCESSING':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'SHIPPED':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400';
      case 'PAID':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'PENDING':
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      case 'CANCELLED':
      case 'REFUNDED':
      case 'FAILED':
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Welcome back, Admin — your platform at a glance.</p>
        </div>
      </div>

      {/* Key statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales Analytics chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4"> Sales Analytics </h2>
          <div className="h-[260px]">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 640 200"
              preserveAspectRatio="xMidYMin meet"
              className="text-zinc-900 dark:text-zinc-100"
            >
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B1F3A" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#0B1F3A" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <text
                x="50%"
                y="-1"
                textAnchor="middle"
                className="text-xs fill-zinc-500 dark:fill-zinc-400"
                transform="translate(0, 10)"
              >
                Revenue / Orders
              </text>
              <g transform="translate(40, 40)">
                <line x1="0" y1="160" x2="560" y2="160" stroke="currentColor" strokeWidth="1" opacity={0.2} />
              </g>
              {salesData.map((point, i) => {
                const barWidth = 40;
                const gap = 4;
                const x = i * (barWidth + gap);
                const barHeight = (point.revenue / maxRevenue) * 140;
                const barX = x + 4;
                return (
                  <g key={point.month} transform="translate(0, 40)">
                    <rect x={barX} y={160 - barHeight} width={barWidth} height={barHeight} fill="url(#revGradient)" rx="3" />
                    <rect
                      x={barX + barWidth + 2}
                      y={160 - (point.orders / maxOrders) * 140}
                      width={barWidth}
                      height={(point.orders / maxOrders) * 140}
                      fill="currentColor"
                      opacity={0.25}
                      rx="3"
                    />
                    <text
                      x={barX + barWidth / 1.8}
                      y={168}
                      textAnchor="middle"
                      className="text-[8px] fill-zinc-500 dark:fill-zinc-400"
                    >
                      {point.month}
                    </text>
                  </g>
                );
              })}
              <g transform="translate(40, 40)">
                <text x="0" y={175} textAnchor="start" className="text-[9px] fill-zinc-500 dark:fill-zinc-400" />
                <line x1="0" y1="160" x2="560" y2="160" stroke="currentColor" strokeWidth="1" opacity={0.1} />
              </g>
            </svg>
          </div>
          <div className="mt-3 flex gap-5 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-zinc-900 dark:bg-zinc-100" />
              <span>Revenue (KSh)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-zinc-400 dark:bg-zinc-500" />
              <span>Orders</span>
            </div>
          </div>
        </div>

        {/* Notifications summary */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4"> Notifications </h2>
            <div className="space-y-3">
              {notifications.slice(0, 5).map((note) => (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg border ${
                    note.read
                      ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950'
                      : 'border-orange-200 dark:border-orange-900/30 bg-orange-50/30 dark:bg-orange-900/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{note.title}</p>
                    {!note.read && <span className="h-2 w-2 rounded-full bg-orange-500" />}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{note.message}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/admin/notifications"
              className="block text-center text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline mt-3"
            >
              View all notifications
            </Link>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/admin/sellers/pending"
                className="px-3 py-2 text-xs font-medium text-center text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Approve Sellers
              </Link>
              <Link
                href="/admin/products"
                className="px-3 py-2 text-xs font-medium text-center text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Moderate Products
              </Link>
              <Link
                href="/admin/withdrawals"
                className="px-3 py-2 text-xs font-medium text-center text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Process Payouts
              </Link>
              <Link
                href="/admin/reports"
                className="px-3 py-2 text-xs font-medium text-center text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Export Report
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Order #</th>
                <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Customer</th>
                <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Items</th>
                <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Amount</th>
                <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Payment</th>
                <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Status</th>
                <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">{order.order_number}</td>
                  <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{order.customer}</td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{order.items}</td>
                  <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">KSh {parseFloat(order.amount).toLocaleString()}</td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{order.payment}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                    {new Date(order.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {unpaidOrders > 0 && (
          <p className="mt-3 text-xs text-orange-600 dark:text-orange-400">
            ⚠ {unpaidOrders} order(s) awaiting payment.
          </p>
        )}
      </div>
    </div>
  );
}
