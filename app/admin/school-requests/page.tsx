'use client';

import { useCallback, useState } from 'react';
import Modal from '@/components/seller/Modal';
import { Badge, Field, Notice, Pager, Title, card, input, primary, secondary } from '@/components/portal/ui';
import { schoolRequestApi, type SchoolRequest } from '@/lib/portalApi';
import { parseApiError } from '@/lib/apiError';
import { useLoad } from '@/lib/useLoad';

const TABS = ['pending', 'approved', 'rejected'] as const;

export default function SchoolRequestsPage() {
  const [status, setStatus] = useState<(typeof TABS)[number]>('pending');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<{ kind: 'approve' | 'reject'; request: SchoolRequest } | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const { data, error, loading, reload } = useLoad(`requests:${status}:${page}`, () => schoolRequestApi.list(status, page));
  const close = useCallback(() => setOpen(null), []);

  const run = async (work: () => Promise<string>) => {
    setBusy(true); setNote(null);
    try { setNote({ tone: 'ok', text: await work() }); }
    catch (e) { setNote({ tone: 'error', text: parseApiError(e).message }); }
    finally { setBusy(false); setOpen(null); reload(); }
  };
  // The detail call adds email_in_use, which decides whether approval can work.
  const review = async (kind: 'approve' | 'reject', id: number) => {
    setNote(null); setReason('');
    try { setOpen({ kind, request: await schoolRequestApi.get(id) }); }
    catch (e) { setNote({ tone: 'error', text: parseApiError(e).message }); }
  };
  const decide = () => open && run(async () => {
    const { kind, request } = open;
    if (kind === 'reject') { await schoolRequestApi.reject(request.id, reason.trim()); return `Rejected ${request.school_name}. No email was sent.`; }
    const done = await schoolRequestApi.approve(request.id);
    return done.invite_sent ? `Approved ${request.school_name}. The invitation was sent to ${request.email}.` : `Approved ${request.school_name}, but the email did not send. Use “Resend invitation” under Approved.`;
  });
  const resend = (r: SchoolRequest) => run(async () => {
    if (!(await schoolRequestApi.resend(r.id)).invite_sent) throw new Error('not sent');
    return `Invitation sent to ${r.email}.`;
  });

  return (
    <div className="flex flex-col gap-4 text-[#16213B] dark:rounded-2xl dark:bg-[#F5F6FA] dark:p-4">
      <Title sub="Approving creates the school and its booklist account, and emails a set-password link.">School requests</Title>
      <div role="tablist" aria-label="Request status" className="flex gap-2">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={status === t} className={`${status === t ? primary : secondary} capitalize`} onClick={() => { setStatus(t); setPage(1); setNote(null); }}>{t}</button>
        ))}
      </div>
      {note && <Notice tone={note.tone}>{note.text}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {loading && <p className="m-0 text-sm">Loading…</p>}
      {!loading && data && !data.results.length && <Notice>No {status} requests.</Notice>}
      {!loading && data?.results.map((r) => (
        <article key={r.id} className={`${card} flex flex-col gap-2`}>
          <p className="m-0 flex flex-wrap items-center gap-2 font-bold">{r.school_name} <Badge status={r.status} /></p>
          <p className="m-0 text-sm">{[r.county, r.address].filter(Boolean).join(' · ')}</p>
          <p className="m-0 break-words text-sm">{r.contact_name} · <a className="underline" href={`mailto:${r.email}`}>{r.email}</a> · <a className="underline" href={`tel:${r.phone}`}>{r.phone}</a></p>
          {r.message && <p className="m-0 text-sm text-[#566079]">“{r.message}”</p>}
          {r.reject_reason && <p className="m-0 text-sm text-red-700">Reason: {r.reject_reason}</p>}
          <p className="m-0 text-xs text-[#566079]">Sent {new Date(r.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
          <div className="flex flex-wrap gap-2">
            {r.status === 'pending' && <button type="button" className={primary} onClick={() => review('approve', r.id)}>Approve</button>}
            {r.status === 'pending' && <button type="button" className={secondary} onClick={() => review('reject', r.id)}>Reject</button>}
            {r.status === 'approved' && <button type="button" className={secondary} disabled={busy} onClick={() => resend(r)}>Resend invitation</button>}
          </div>
        </article>
      ))}
      {data && <Pager page={page} count={data.count} onPage={setPage} />}
      {open && (
        <Modal title={`${open.kind === 'approve' ? 'Approve' : 'Reject'} ${open.request.school_name}?`} onClose={close}>
          {open.kind === 'approve' ? (
            open.request.email_in_use
              ? <Notice tone="error">{open.request.email} already has an account, so this cannot be approved. Reject it and ask for another email.</Notice>
              : <p className="m-0 text-sm">An account for {open.request.contact_name} is created and the invitation is emailed to {open.request.email}.</p>
          ) : (
            <Field label="Reason (optional, kept for your records)" hint="No email is sent.">
              <textarea className={`${input} py-2`} rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className={secondary} onClick={close}>Cancel</button>
            <button type="button" className={primary} disabled={busy || (open.kind === 'approve' && open.request.email_in_use)} onClick={decide}>
              {open.kind === 'approve' ? 'Approve and invite' : 'Reject'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
