'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { AdminOrder, OrderStatus } from '@/lib/adminApi';

const statusColor: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  PAID: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  PROCESSING: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  SHIPPED: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
  DELIVERED: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  CANCELLED: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  REFUNDED: 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await adminApi.getOrders();
        setOrders(data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getNextStatus = (order: AdminOrder): OrderStatus | null => {
    if (order.status === 'CANCELLED' || order.status === 'REFUNDED' || order.status === 'DELIVERED') return null;
    const flow: Record<OrderStatus, OrderStatus | undefined> = {
      PENDING: 'PAID',
      PAID: order.is_digital ? undefined : 'PROCESSING',
      PROCESSING: 'SHIPPED',
      SHIPPED: 'DELIVERED',
      DELIVERED: undefined,
      CANCELLED: undefined,
      REFUNDED: undefined,
    };
    return flow[order.status] ?? null;
  };

  const advanceStatus = async (order: AdminOrder, next: OrderStatus) => {
    setOrders(orders.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
    adminApi.updateOrder(order.id.toString(), { status: next }).catch(() => {});
    setMessage(`Order ${order.order_number} moved to ${next}`);
    setTimeout(() => setMessage(''), 3000);
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const statusOptions = ['all', 'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

  if (loading) {
    return <div className="text-lg">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Orders</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Complete view of all orders ({orders.length} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Orders' : s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div className="p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">No orders match this filter.</div>
        ) : (
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
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const next = getNextStatus(order);
                  return (
                    <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">
                        {order.order_number}
                        {order.is_digital && <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">📥</span>}
                      </td>
                      <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{order.customer}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{order.items}</td>
                      <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{formatCurrency(order.amount)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor[order.payment as OrderStatus]}`}>
                          {order.payment}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor[order.status]}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{formatDateTime(order.date)}</td>
                      <td className="py-3 px-4">
                        {next && (
                          <button
                            type="button"
                            onClick={() => advanceStatus(order, next)}
                            className="text-xs px-2.5 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                          >
                            → {next.replace('_', ' ')}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
