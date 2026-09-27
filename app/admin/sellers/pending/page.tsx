'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import type { AdminSeller } from '@/lib/adminApi';

interface PendingSeller extends Omit<AdminSeller, 'products' | 'orders' | 'revenue' | 'commission'> {
  business_description?: string;
  payout_method?: string;
}

export default function PendingSellersPage() {
  const [sellers, setSellers] = useState<PendingSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingSeller | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const data = await adminApi.getPendingSellers();
        setSellers(data);
      } catch (error) {
        console.error('Failed to fetch pending sellers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  const handleApprove = (seller: PendingSeller) => {
    adminApi.approveSeller(seller.id.toString()).catch(() => {});
    setSellers(sellers.filter((s) => s.id !== seller.id));
    setMessage(`${seller.store_name} has been approved`);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleReject = (seller: PendingSeller) => {
    adminApi.rejectSeller(seller.id.toString()).catch(() => {});
    setSellers(sellers.filter((s) => s.id !== seller.id));
    setMessage(`${seller.store_name} has been rejected`);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) {
    return <div className="text-lg">Loading pending applications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Pending Seller Applications</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            {sellers.length} application{sellers.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
        <Link
          href="/admin/sellers"
          className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          ← All Sellers
        </Link>
      </div>

      {message && (
        <div className="p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {sellers.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">No pending applications at the moment. 🎉</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Store Name</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Owner</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Email</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Joined</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr key={seller.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">{seller.store_name}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{seller.owner}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{seller.owner_email}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{seller.registration_date}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelected(seller)}
                          className="text-xs px-2.5 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(seller)}
                          className="text-xs px-2.5 py-1 text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(seller)}
                          className="text-xs px-2.5 py-1 text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Seller profile modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl mx-4">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Seller Application — {selected.store_name}</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Owner</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{selected.owner}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Email</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{selected.owner_email}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Registration Date</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{selected.registration_date}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Payout Method</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{selected.payout_method || 'M-Pesa'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Business Description</p>
                <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-200">
                  {selected.business_description ||
                    `${selected.store_name} offers quality educational materials and learning resources to students across Kenya.`}
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => handleReject(selected)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleApprove(selected)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              >
                Approve & Activate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
