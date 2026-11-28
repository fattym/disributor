'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import GlobalHeader from '@/components/GlobalHeader';
import { changePassword } from '@/lib/api';
import { useAuth } from '@/lib/auth';

function firstError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (data) {
      for (const key of ['current_password', 'new_password', 'non_field_errors', 'detail']) {
        const value = data[key];
        if (Array.isArray(value) && value.length) return String(value[0]);
        if (typeof value === 'string') return value;
      }
    }
  }
  return 'Could not change your password. Please try again.';
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const forced = Boolean(user?.must_change_password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (next.length < 8) {
      setError('Your new password must be at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      setError('The new passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await changePassword(current, next);
      const role = user?.role;
      router.replace(role === 'ADMIN' ? '/admin' : role === 'BOOKLIST_ADMIN' ? '/school' : role === 'DISTRIBUTOR' ? '/dashboard' : role === 'PARENT' ? '/shop' : '/');
    } catch (err) {
      setError(firstError(err));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#E63B00]';

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-zinc-950">
      <GlobalHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h1 className="text-2xl font-bold text-[#0B1F3A] dark:text-zinc-100">Set a new password</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {forced
              ? 'Your account was given a temporary password. Choose your own password to continue.'
              : 'Enter your current password and choose a new one.'}
          </p>

          {error && (
            <div role="alert" className="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="current" className="block text-sm font-medium text-[#202124] dark:text-zinc-200 mb-1">
                {forced ? 'Temporary password' : 'Current password'}
              </label>
              <input id="current" type="password" autoComplete="current-password" required
                value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="new" className="block text-sm font-medium text-[#202124] dark:text-zinc-200 mb-1">
                New password
              </label>
              <input id="new" type="password" autoComplete="new-password" required minLength={8}
                value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} />
              <p className="mt-1 text-xs text-zinc-500">At least 8 characters; avoid common or all-number passwords.</p>
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-[#202124] dark:text-zinc-200 mb-1">
                Confirm new password
              </label>
              <input id="confirm" type="password" autoComplete="new-password" required
                value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-md bg-[#E63B00] px-4 py-2.5 font-semibold text-white hover:bg-[#c93300] disabled:opacity-60 transition-colors">
              {loading ? 'Saving…' : 'Save new password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
