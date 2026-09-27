'use client';

import { useEffect, useState } from 'react';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import { useAuth } from '@/lib/auth';
import { shopApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface Payment {
  status: string;
  method: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
}

interface ParentOrder {
  id: number;
  pickup_code?: string;
  status: string;
  total_amount: string;
  created_at: string;
  fund_status?: string;
  delivered?: boolean;
  delivery_confirmed_at?: string;
  disputed?: boolean;
  dispute_reason?: string;
  payment?: Payment | null;
  items?: OrderItem[];
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const DELIVERABLE = new Set(['paid', 'ready_for_pickup', 'picked_up']);

const fundBadge = (fund_status?: string) => {
  if (!fund_status || fund_status === 'RELEASED' || fund_status === 'REFUNDED') return null;
  return (
    <span className="inline-flex ml-2 text-xs font-medium text-orange-700 dark:text-orange-300">
      (Funds held)
    </span>
  );
};

export default function MyOrdersPage() {
  const { user, loading: userLoading } = useAuth();
  const [orders, setOrders] = useState<ParentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [disputeOpen, setDisputeOpen] = useState<ParentOrder | null>(null);
  const [reason, setReason] = useState('');
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'DISTRIBUTOR') {
      window.location.href = '/dashboard';
      return;
    }
    const fetchOrders = async () => {
      try {
        const raw = await shopApi.getMyOrders();
        const list: ParentOrder[] = Array.isArray(raw)
          ? (raw as ParentOrder[])
          : (raw as { results: ParentOrder[] }).results;
        setOrders(list);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const refreshOrder = async (id: number) => {
    try {
      const order = await shopApi.getOrder(id);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...(order as ParentOrder) } : o)),
      );
    } catch (error) {
      console.error('Failed to refresh order:', error);
    }
  };

  const confirmDelivery = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      await shopApi.confirmDelivery(orderId);
      await refreshOrder(orderId);
    } catch (error) {
      console.error('Failed to confirm delivery:', error);
      alert('Could not confirm delivery. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const dispute = async () => {
    if (!disputeOpen || !reason.trim()) return;
    setActionLoading(disputeOpen.id);
    try {
      await shopApi.disputeOrder(disputeOpen.id, reason, image);
      await refreshOrder(disputeOpen.id);
      setDisputeOpen(null);
      setReason('');
      setImage(null);
      alert('Report submitted. Our team will review your evidence.');
    } catch (error) {
      console.error('Failed to file dispute:', error);
      alert('Could not submit report. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  if (userLoading || !user) {
    return (
      <>
        <GlobalHeader />
        <main className="max-w-6xl mx-auto px-4 py-12">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">Loading…</p>
        </main>
        <GlobalFooter />
      </>
    );
  }

  const canConfirmDelivery = (order: ParentOrder) =>
    DELIVERABLE.has(order.status) && !order.disputed;

  return (
    <>
      <GlobalHeader />
      <main className="max-w-6xl mx-auto px-4 py-12" id="main">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">My Orders</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Orders placed by {user.email}</p>
        </div>

        {loading ? (
          <p className="text-zinc-600 dark:text-zinc-400">Loading your orders…</p>
        ) : orders.length === 0 ? (
          <p className="text-zinc-500">You have no orders yet.</p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    Order #{order.id} {order.pickup_code ? `(${order.pickup_code})` : ''}
                  </h2>
                  <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {STATUS_LABEL[order.status] || order.status}
                  </span>
                </div>
                <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <p>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Date:</span>{' '}
                    {formatDateTime(order.created_at)}
                  </p>
                  <p>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Total:</span>{' '}
                    {formatCurrency(order.total_amount)}
                  </p>
                  {order.payment && (
                    <p>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">Payment:</span>{' '}
                      {order.payment.method} • {order.payment.status}
                    </p>
                  )}
                  {fundBadge(order.fund_status)}
                  {order.disputed && (
                    <p className="mt-1 text-orange-700 dark:text-orange-300">
                      Disputed: {order.dispute_reason || 'under review'}
                    </p>
                  )}
                  {order.items && order.items.length > 0 && (
                    <ul className="mt-2 list-disc list-inside">
                      {order.items.map((item, i) => (
                        <li key={i}>
                          {item.product_name} × {item.quantity}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {canConfirmDelivery(order) && (
                    <button
                      type="button"
                      onClick={() => confirmDelivery(order.id)}
                      disabled={actionLoading === order.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-navy rounded-md hover:opacity-90 disabled:opacity-60"
                    >
                      {actionLoading === order.id ? 'Confirming…' : 'Confirm Delivery'}
                    </button>
                  )}
                  {!order.disputed &&
                    order.status !== 'cancelled' &&
                    order.status !== 'pending_payment' && (
                      <button
                        type="button"
                        onClick={() => setDisputeOpen(order)}
                        className="px-4 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      >
                        Report a Problem
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}

        {disputeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Report a Problem — Order #{disputeOpen.id}
              </h3>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the problem…"
                className="w-full text-sm px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                rows={4}
              />
              <label className="block mt-3 text-sm">
                <span className="text-zinc-700 dark:text-zinc-300">Attach a photo (optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="mt-1 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-navy file:text-white"
                />
              </label>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDisputeOpen(null);
                    setReason('');
                    setImage(null);
                  }}
                  className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={dispute}
                  disabled={actionLoading === disputeOpen.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-navy rounded-md hover:opacity-90 disabled:opacity-60"
                >
                  {actionLoading === disputeOpen.id ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <GlobalFooter />
    </>
  );
}
