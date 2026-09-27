'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { AdminPayment, AdminOrder, PaymentStatus, OrderStatus } from '@/lib/adminApi';

const statusColor: Record<PaymentStatus, string> = {
  SUCCESSFUL: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  PENDING: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  FAILED: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  REFUNDED: 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300',
};

const orderStatusColor: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  PAID: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  PROCESSING: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  SHIPPED: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
  DELIVERED: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  CANCELLED: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  REFUNDED: 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300',
};

const filterTabs = [
  { key: 'all', label: 'All Transactions' },
  { key: 'SUCCESSFUL', label: 'Successful' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'FAILED', label: 'Failed' },
  { key: 'REFUNDED', label: 'Refunded' },
  { key: 'held', label: 'Ready for Release' },
];

const methodIcons: Record<AdminPayment['method'], string> = {
  'M-Pesa': '📱',
  Visa: '💳',
  Mastercard: '💳',
  Other: '🏦',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [heldFunds, setHeldFunds] = useState<AdminOrder[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tx, held] = await Promise.all([
          adminApi.getTransactions(),
          adminApi.getHeldFunds(),
        ]);
        setPayments(tx);
        setHeldFunds(held);
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRelease = async (order: AdminOrder) => {
    try {
      await adminApi.releaseFunds(order.id.toString());
      setHeldFunds((prev) => prev.filter((o) => o.id !== order.id));
      setMessage(`Released ${order.order_number}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to release funds:', error);
    }
  };

  const filtered =
    activeTab === 'all'
      ? payments
      : payments.filter((p) => p.status === activeTab);

  const fundTotals = () => {
    const held = heldFunds.reduce((sum, o) => sum + parseFloat(o.amount), 0);
    const released = payments.filter((p) => p.status === 'SUCCESSFUL').reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const refunded = payments
      .filter((p) => p.status === 'FAILED' || p.status === 'REFUNDED')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    return { held, released, refunded };
  };

  const { held, released, refunded } = fundTotals();

  if (loading) {
    return <div className="text-lg">Loading payments...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Payments</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Track money flowing through the platform ({payments.length} transactions)
        </p>
      </div>

      {message && (
        <div className="p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Funds Held</p>
          <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400 mt-1">
            {formatCurrency(String(held))}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Ready for Release</p>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">
            {heldFunds.length} orders
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Released</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            {formatCurrency(String(released))}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Refunded</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-400 mt-1">
            {formatCurrency(String(refunded))}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'held' ? (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {heldFunds.length === 0 ? (
            <div className="p-6 text-center text-zinc-500">
              No funds waiting for release.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Order</th>
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Customer</th>
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Amount</th>
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Status</th>
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Date</th>
                    <th className="text-right py-3 px-4 text-zinc-600 dark:text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {heldFunds.map((order) => (
                    <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                        {order.order_number}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{order.customer}</td>
                      <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(order.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${orderStatusColor[order.status]}`}
                        >
                          {order.status}
                        </span>
                        <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-500">({order.fund_status})</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        {formatDateTime(order.date)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRelease(order)}
                          className="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700"
                        >
                          Release Funds
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-zinc-500">No transactions match this filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Transaction ID</th>
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Order</th>
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Customer</th>
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Amount</th>
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Payment Method</th>
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Date</th>
                    <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((payment) => (
                    <tr key={payment.id} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                        {payment.transaction_id}
                      </td>
                      <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{payment.order}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{payment.customer}</td>
                      <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{formatCurrency(payment.amount)}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <span>{methodIcons[payment.method]}</span>
                          <span>{payment.method}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{formatDateTime(payment.date)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor[payment.status]}`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
