'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import type { AdminSeller, UserStatus } from '@/lib/adminApi';
import { formatCurrency } from '@/lib/utils';

const statusColor: Record<Exclude<UserStatus, null>, string> = {
  ACTIVE: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  SUSPENDED: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  PENDING: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
};

export default function SellersPage() {
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const data = await adminApi.getSellers();
        setSellers(data);
      } catch (error) {
        console.error('Failed to fetch sellers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSellers();
  }, []);

  const handleToggleStatus = (seller: AdminSeller) => {
    const newStatus: UserStatus = seller.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setSellers(sellers.map((s) => (s.id === seller.id ? { ...s, status: newStatus } : s)));
    adminApi.updateSeller(seller.id.toString(), { status: newStatus }).catch(() => {});
    setMessage(`${seller.store_name} status updated`);
    setTimeout(() => setMessage(''), 3000);
  };

  const commissionRate = (s: AdminSeller) => {
    const rev = parseFloat(s.revenue);
    const comm = parseFloat(s.commission);
    return rev > 0 ? ((comm / rev) * 100).toFixed(1) : '0';
  };

  if (loading) {
    return <div className="text-lg">Loading sellers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Sellers</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Manage marketplace sellers ({sellers.length} total)
          </p>
        </div>
        <Link
          href="/admin/sellers/pending"
          className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors"
        >
          Review Applications
        </Link>
      </div>

      {message && (
        <div className="p-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {sellers.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">No sellers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Seller</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Owner</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Products</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Orders</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Revenue</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Commission</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Rate</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr key={seller.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">{seller.store_name}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{seller.owner}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{seller.products}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{seller.orders}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{formatCurrency(seller.revenue)}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{formatCurrency(seller.commission)}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{commissionRate(seller)}%</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor[seller.status]}`}>
                        {seller.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(seller)}
                          className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        >
                          {seller.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        >
                          View
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
    </div>
  );
}
