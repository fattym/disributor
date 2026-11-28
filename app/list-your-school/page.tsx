'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import { Field, Notice, card, input, primary, secondary } from '@/components/portal/ui';
import { schoolRequestApi } from '@/lib/portalApi';
import { parseApiError } from '@/lib/apiError';

const FIELDS: { name: string; label: string; required?: boolean; type?: string; max: number; autoComplete?: string }[] = [
  { name: 'school_name', label: 'School name', required: true, max: 200 },
  { name: 'county', label: 'County', required: true, max: 100 },
  { name: 'address', label: 'Address (optional)', max: 255, autoComplete: 'street-address' },
  { name: 'contact_name', label: 'Your name', required: true, max: 150, autoComplete: 'name' },
  { name: 'email', label: 'Email (this becomes the sign-in)', required: true, type: 'email', max: 254, autoComplete: 'email' },
  { name: 'phone', label: 'Phone', required: true, type: 'tel', max: 20, autoComplete: 'tel' },
];

export default function ListYourSchoolPage() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState('');
  const set = (name: string, value: string) => setForm((f) => ({ ...f, [name]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true); setError(''); setErrors({});
    try {
      setDone((await schoolRequestApi.submit(form)).detail);
    } catch (err) {
      const parsed = parseApiError(err);
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(status === 429 ? 'Too many requests from this connection. Try again in an hour.' : parsed.message);
      setErrors(parsed.fields);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <GlobalHeader />
      <main id="main" className="min-h-[60vh] bg-[#F5F6FA] px-4 py-6 text-[#16213B]">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
          <p className="crumbs"><Link href="/">Home</Link> / List your school</p>
          <h1 className="m-0 !text-3xl font-extrabold !text-[#0B1F3A]">List your school&apos;s booklist</h1>
          <p className="m-0">Parents find your list, tick what they need and order it. Learning Pack checks each request, then emails you a link to set your password.</p>
          {done ? (
            <div className="flex flex-col gap-3">
              <Notice tone="ok">{done}</Notice>
              <Link className={secondary} href="/">Back to home</Link>
            </div>
          ) : (
            <form onSubmit={submit} className={`${card} flex flex-col gap-3`}>
              {error && <Notice tone="error">{error}</Notice>}
              {FIELDS.map((f) => (
                <Field key={f.name} label={f.label} error={errors[f.name]}>
                  <input className={input} name={f.name} type={f.type || 'text'} required={f.required} maxLength={f.max}
                    autoComplete={f.autoComplete} value={form[f.name] || ''} onChange={(e) => set(f.name, e.target.value)} />
                </Field>
              ))}
              <Field label="Anything we should know? (optional)" error={errors.message}>
                <textarea className={`${input} py-2`} rows={3} maxLength={1000} value={form.message || ''} onChange={(e) => set('message', e.target.value)} />
              </Field>
              <button type="submit" className={primary} disabled={sending}>{sending ? 'Sending…' : 'Send request'}</button>
            </form>
          )}
        </div>
      </main>
      <GlobalFooter />
    </>
  );
}
