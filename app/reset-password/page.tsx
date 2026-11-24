'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { api } from '@/lib/api';

function errorText(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    const first = data && ['new_password2', 'new_password1', 'token', 'uid', 'detail'].map((k) => data[k]).flat().filter(Boolean)[0];
    if (first) return String(first).includes('Invalid') ? 'This link is invalid or has expired. Ask for a new one.' : String(first);
  }
  return 'Could not set your password. Please try again.';
}

function ResetForm() {
  const params = useSearchParams();
  const uid = params.get('uid') || '';
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Your password must be at least 8 characters.');
    if (password !== confirm) return setError('The passwords do not match.');
    setLoading(true);
    try {
      await api.post('/auth/password/reset/confirm/', { uid, token, new_password1: password, new_password2: confirm });
      setDone(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  };

  const input = 'w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#E63B00]';

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl font-bold text-[#0B1F3A] dark:text-zinc-100">Set your password</h1>
        {done ? (
          <div className="mt-4 space-y-4">
            <p role="status" className="text-sm text-zinc-700 dark:text-zinc-300">Your password is saved. You can sign in now.</p>
            <Link href="/login" className="block w-full text-center rounded-md bg-[#E63B00] px-4 py-2.5 font-semibold text-white">Go to sign in</Link>
          </div>
        ) : !uid || !token ? (
          <p role="alert" className="mt-4 text-sm text-red-700">This link is incomplete. Open the link from your email again.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {error && <div role="alert" className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">{error}</div>}
            <div>
              <label htmlFor="pw" className="block text-sm font-medium mb-1">New password</label>
              <input id="pw" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
              <p className="mt-1 text-xs text-zinc-500">At least 8 characters; avoid common or all-number passwords.</p>
            </div>
            <div>
              <label htmlFor="pw2" className="block text-sm font-medium mb-1">Confirm password</label>
              <input id="pw2" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-md bg-[#E63B00] px-4 py-2.5 font-semibold text-white disabled:opacity-60">
              {loading ? 'Saving…' : 'Save password'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-zinc-950">
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
