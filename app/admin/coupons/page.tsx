'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import type { AdminCoupon } from '@/lib/adminApi';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [form, setForm] = useState({
    code: '',
    discount_type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discount_value: '',
    start_date: '',
    end_date: '',
    usage_limit: '',
  });

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const data = await adminApi.getCoupons();
        setCoupons(data);
      } catch (error) {
        console.error('Failed to fetch coupons:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!form.code || !form.discount_value || !form.start_date || !form.end_date) {
      setMessageType('error');
      setMessage('Please fill in all required fields.');
      return;
    }
    try {
      const payload = {
        code: form.code,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        start_date: form.start_date,
        end_date: form.end_date,
        usage_limit: parseInt(form.usage_limit, 10) || 0,
        used: 0,
        active: true,
        created_at: new Date().toISOString(),
      };
      await adminApi.createCoupon(payload);
      setCoupons([payload as AdminCoupon, ...coupons]);
      setShowForm(false);
      setMessageType('success');
      setMessage('Coupon created successfully');
      setForm({
        code: '',
        discount_type: 'PERCENTAGE',
        discount_value: '',
        start_date: '',
        end_date: '',
        usage_limit: '',
      });
      setTimeout(() => setMessage(''), 4000);
    } catch {
      setMessageType('error');
      setMessage('Failed to create coupon');
    }
  };

  const toggleActive = (coupon: AdminCoupon) => {
    const nextActive = !coupon.active;
    setCoupons(coupons.map((c) => (c.id === coupon.id ? { ...c, active: nextActive } : c)));
    adminApi.updateCoupon(coupon.id.toString(), { active: nextActive }).catch(() => {});
  };

  if (loading) {
    return <div className="text-lg">Loading coupons...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Coupons & Promotions</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Create and manage discount codes ({coupons.length} active)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Create Coupon'}
        </button>
      </div>

      {message && (
        <div
          className={`p-3 text-sm rounded-md ${
            messageType === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {message}
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Create New Coupon</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. BACKTOSCHOOL"
                required
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Discount Value *</label>
              <input
                type="number"
                step="0.01"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                placeholder="e.g. 20"
                required
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Type *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="discount_type"
                    value="PERCENTAGE"
                    checked={form.discount_type === 'PERCENTAGE'}
                    onChange={() => setForm({ ...form, discount_type: 'PERCENTAGE' })}
                    className="h-4 w-4 border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700"
                  />
                  <span className="text-zinc-700 dark:text-zinc-300">Percentage (%)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="discount_type"
                    value="FIXED_AMOUNT"
                    checked={form.discount_type === 'FIXED_AMOUNT'}
                    onChange={() => setForm({ ...form, discount_type: 'FIXED_AMOUNT' })}
                    className="h-4 w-4 border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700"
                  />
                  <span className="text-zinc-700 dark:text-zinc-300">Fixed Amount (KSh)</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Start Date *</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">End Date *</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Usage Limit</label>
              <input
                type="number"
                value={form.usage_limit}
                onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                placeholder="e.g. 1000"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Create Coupon
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {coupons.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">No coupons created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Code</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Discount</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Valid Period</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Usage</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left py-3 px-4 text-zinc-600 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100 font-medium font-mono">{coupon.code}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                      {coupon.discount_type === 'PERCENTAGE'
                        ? `${coupon.discount_value}%`
                        : `KSh ${parseFloat(coupon.discount_value).toLocaleString()}`}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                      {coupon.start_date} → {coupon.end_date}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                      {coupon.used} / {coupon.usage_limit === 0 ? '∞' : coupon.usage_limit}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(coupon)}
                        className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                          coupon.active
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {coupon.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                      >
                        Edit
                      </button>
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
