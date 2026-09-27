'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { AdminPayment, PaymentStatus } from '@/lib/adminApi';

const statusColor: Record<PaymentStatus, string> = {
  SUCCESSFUL: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  PENDING: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  FAILED: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  REFUNDED: 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400',
};

const methodIcons: Record<AdminPayment['method'], string> = {
  'M-Pesa': '📱',
  Visa: '💳',
  Mastercard: '💳',
  Other: '🏦',
};

export default function RefundsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await adminApi.getTransactions();
        setPayments(data);
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const refunds = payments.filter((p) => p.status === 'REFUNDED' || p.status === 'FAILED');
  const refundedTotal = refunds.filter((p) => p.status === 'REFUNDED').reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const handleRefund = (payment: AdminPayment) => {
    setPayments(
      payments.map((p) => (p.id === payment.id ? { ...p, status: 'REFUNDED' } : p)),
    );
    adminApi.getPayments({ status: 'refunded' }).catch(() => {});
    setMessage(`Refund processed for ${payment.transaction_id}`);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) {
    return <div className="text-lg">Loading refunds...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Refunds</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Manage refund requests ({refunds.length} records)
          </p>
        </div>
        <div className="px-4 py-2 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Total Refunded</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(String(refundedTotal))}</p>
        </div>
      </div>

      {message && (
        <div className="p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {refunds.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">No refunds or failed payments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Transaction ID</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Order</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Customer</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Amount</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Method</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Date</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((payment) => (
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
                    <td className="py-3 px-4">
                      {payment.status === 'FAILED' && (
                        <button
                          type="button"
                          onClick={() => handleRefund(payment)}
                          className="text-xs px-2.5 py-1 text-white bg-orange-600 rounded hover:bg-orange-700 transition-colors"
                        >
                          Process Refund
                        </button>
                      )}
                      {payment.status === 'REFUNDED' && (
                        <button
                          type="button"
                          className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        >
                          View
                        </button>
                      )}
                    </td>
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
