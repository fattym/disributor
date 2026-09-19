'use client';

import { useEffect, useState } from 'react';
import { distributorApi } from '@/lib/api';

interface Order {
  id: number;
  school: number;
  status: string;
  total_amount: string;
  notes: string;
  created_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const data = await distributorApi.getOrders();
      setOrders(data.results || data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      await distributorApi.updateOrderStatus(orderId.toString(), newStatus);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const flow: Record<string, string> = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'PROCESSING',
      PROCESSING: 'SHIPPED',
      SHIPPED: 'DELIVERED',
    };
    return flow[currentStatus] || null;
  };

  if (loading) {
    return <div className="text-lg">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Orders</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Manage school bulk orders</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Order ID</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">School</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Amount</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Date</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Notes</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const nextStatus = getNextStatus(order.status);
                  return (
                    <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">#{order.id}</td>
                      <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">School {order.school}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">KSh {parseFloat(order.total_amount).toLocaleString()}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 max-w-xs truncate">{order.notes || '-'}</td>
                      <td className="py-3 px-4">
                        {nextStatus && (
                          <button
                            onClick={() => updateStatus(order.id, nextStatus)}
                            className="px-3 py-1 text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                          >
                            {nextStatus === 'CONFIRMED' && 'Confirm'}
                            {nextStatus === 'PROCESSING' && 'Process'}
                            {nextStatus === 'SHIPPED' && 'Ship'}
                            {nextStatus === 'DELIVERED' && 'Deliver'}
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
