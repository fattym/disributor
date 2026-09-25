'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { distributorApi } from '@/lib/api';

interface Product {
  id: number;
  name: string;
  unit_price: string;
  available_stock: number;
  is_active: boolean;
}

interface Order {
  id: number;
  school: number;
  status: string;
  total_amount: string;
  created_at: string;
}

interface Wallet {
  id: number;
  distributor: number;
  distributor_name: string;
  balance: string;
  total_earned: string;
  total_withdrawn: string;
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, ordersData, walletData] = await Promise.all([
          distributorApi.getProducts(),
          distributorApi.getOrders(),
          distributorApi.getWallet(),
        ]);
        const prodList = productsData.results || productsData;
        const ordersList = ordersData.results || ordersData;
        const walletList = walletData.results || walletData;
        setProducts(Array.isArray(prodList) ? prodList : []);
        setOrders(Array.isArray(ordersList) ? ordersList : []);
        setWallet(Array.isArray(walletList) && walletList.length ? walletList[0] : null);
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

  const activeProducts = products.filter((p) => p.is_active).length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

  const stats = [
    { label: 'Active Products', value: activeProducts, href: '/products' },
    { label: 'Pending Orders', value: pendingOrders, href: '/orders' },
    { label: 'Total Revenue', value: `KSh ${totalRevenue.toLocaleString()}`, href: '/orders' },
    { label: 'Wallet Balance', value: wallet ? `KSh ${parseFloat(wallet.balance).toLocaleString()}` : '—', href: '#' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Welcome to your distributor dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-zinc-500">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left py-2 text-zinc-600 dark:text-zinc-400">Order ID</th>
                  <th className="text-left py-2 text-zinc-600 dark:text-zinc-400">School</th>
                  <th className="text-left py-2 text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left py-2 text-zinc-600 dark:text-zinc-400">Amount</th>
                  <th className="text-left py-2 text-zinc-600 dark:text-zinc-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2 text-zinc-900 dark:text-zinc-100">#{order.id}</td>
                    <td className="py-2 text-zinc-900 dark:text-zinc-100">School {order.school}</td>
                    <td className="py-2">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 text-zinc-900 dark:text-zinc-100">KSh {parseFloat(order.total_amount).toLocaleString()}</td>
                    <td className="py-2 text-zinc-600 dark:text-zinc-400">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
