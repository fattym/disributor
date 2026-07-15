'use client';

import { useEffect, useState } from 'react';
import { distributorApi } from '@/lib/api';

interface Delivery {
  id: number;
  order: number;
  tracking_number: string;
  carrier: string;
  status: string;
  estimated_delivery: string;
  delivered_at: string;
  notes: string;
  created_at: string;
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = async () => {
    try {
      const data = await distributorApi.getDeliveries();
      setDeliveries(data.results || data);
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const updateDelivery = async (id: number, data: { status?: string; tracking_number?: string; carrier?: string; estimated_delivery?: string; notes?: string }) => {
    try {
      await distributorApi.updateDelivery(id.toString(), data);
      fetchDeliveries();
    } catch (error) {
      console.error('Failed to update delivery:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      case 'IN_TRANSIT':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'DELIVERED':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'FAILED':
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300';
    }
  };

  if (loading) {
    return <div className="text-lg">Loading deliveries...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Deliveries</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Track and manage order deliveries</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {deliveries.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">No deliveries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Delivery ID</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Order ID</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Tracking #</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Carrier</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Est. Delivery</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium">#{delivery.id}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">Order #{delivery.order}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{delivery.tracking_number || '-'}</td>
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">{delivery.carrier || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(delivery.status)}`}>
                        {delivery.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                      {delivery.estimated_delivery ? new Date(delivery.estimated_delivery).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {delivery.status === 'PENDING' && (
                          <button
                            onClick={() => updateDelivery(delivery.id, { status: 'IN_TRANSIT' })}
                            className="text-xs px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded hover:bg-zinc-800 dark:hover:bg-zinc-200"
                          >
                            Ship
                          </button>
                        )}
                        {delivery.status === 'IN_TRANSIT' && (
                          <button
                            onClick={() => updateDelivery(delivery.id, { status: 'DELIVERED' })}
                            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Mark Delivered
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
    </div>
  );
}
