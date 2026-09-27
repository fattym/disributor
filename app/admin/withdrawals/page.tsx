'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { AdminWithdrawal, WithdrawalStatus } from '@/lib/adminApi';
import { mockSettings } from '@/lib/adminApi';

const statusColor: Record<WithdrawalStatus, string> = {
  PENDING: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  APPROVED: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  PAID: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  REJECTED: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
};

const filterTabs = [
  { key: 'all', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'PAID', label: 'Paid' },
  { key: 'REJECTED', label: 'Rejected' },
];

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [detail, setDetail] = useState<AdminWithdrawal | null>(null);

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        const data = await adminApi.getWithdrawals();
        setWithdrawals(data);
      } catch (error) {
        console.error('Failed to fetch withdrawals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWithdrawals();
  }, []);

  const filtered =
    activeTab === 'all'
      ? withdrawals
      : withdrawals.filter((w) => w.status === activeTab);

  const updateStatus = (id: number, status: WithdrawalStatus) => {
    setWithdrawals(withdrawals.map((w) => (w.id === id ? { ...w, status } : w)));
    adminApi.updateWithdrawal(id.toString(), { status }).catch(() => {});
    const label = status === 'APPROVED' ? 'approved' : status === 'PAID' ? 'marked as paid' : status === 'REJECTED' ? 'rejected' : 'updated';
    setMessage(`Withdrawal ${label}`);
    setTimeout(() => setMessage(''), 3000);
  };

  const commissionRate = mockSettings.commission;

  if (loading) {
    return <div className="text-lg">Loading withdrawals...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Seller Withdrawals</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Manage payouts to sellers ({withdrawals.length} total)
        </p>
      </div>

      {message && (
        <div className="p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
          {message}
        </div>
      )}

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

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">No withdrawals match this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Seller</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Amount</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Platform Fee</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Seller Receives</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Payout Method</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Requested</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">{w.seller}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{formatCurrency(w.amount)}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{formatCurrency(w.platform_fee)}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{formatCurrency(w.seller_receives)}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{w.payout_method}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{formatDateTime(w.requested_at)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor[w.status]}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDetail(w)}
                          className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        >
                          View
                        </button>
                        {w.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => updateStatus(w.id, 'APPROVED')}
                            className="text-xs px-2 py-1 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {w.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => updateStatus(w.id, 'PAID')}
                            className="text-xs px-2 py-1 text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                        {(w.status === 'PENDING' || w.status === 'APPROVED') && (
                          <button
                            type="button"
                            onClick={() => updateStatus(w.id, 'REJECTED')}
                            className="text-xs px-2 py-1 text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-xl mx-4">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Withdrawal Details</h2>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Seller</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{detail.seller}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor[detail.status]}`}>
                    {detail.status}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Commission Breakdown (Platform fee {commissionRate}%)</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Sale</span>
                      <span className="text-zinc-900 dark:text-zinc-100">{formatCurrency(detail.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Learning Pack fee ({commissionRate}%)</span>
                      <span className="text-zinc-900 dark:text-zinc-100">{formatCurrency(detail.platform_fee)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t border-zinc-200 dark:border-zinc-800 pt-1">
                      <span className="text-zinc-600 dark:text-zinc-400">Seller receives</span>
                      <span className="text-zinc-900 dark:text-zinc-100">{formatCurrency(detail.seller_receives)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Payout Method</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{detail.payout_method}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Requested At</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatDateTime(detail.requested_at)}</p>
                </div>
                {detail.paid_at && (
                  <div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Paid At</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatDateTime(detail.paid_at)}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 justify-end">
              {detail.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => updateStatus(detail.id, 'APPROVED')}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Approve
                </button>
              )}
              {detail.status === 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => updateStatus(detail.id, 'PAID')}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                >
                  Mark as Paid
                </button>
              )}
              {(detail.status === 'PENDING' || detail.status === 'APPROVED') && (
                <button
                  type="button"
                  onClick={() => updateStatus(detail.id, 'REJECTED')}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
