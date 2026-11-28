'use client';

import { useCallback, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Modal from '@/components/seller/Modal';
import { Badge, Notice, Title, card, input, primary, secondary } from './ui';
import { catalogueApi, type ImportBatch, type ImportRow } from '@/lib/portalApi';
import { parseApiError } from '@/lib/apiError';
import { useLoad } from '@/lib/useLoad';

const SHOW = 200;
const show = (v: unknown) => (v === null || v === undefined || v === '' ? '(blank)' : Array.isArray(v) ? v.join(', ') : String(v));
const when = (iso: string) => new Date(iso).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });

function Rows({ rows }: { rows: ImportRow[] }) {
  const changed = rows.filter((r) => r.action !== 'unchanged').sort((a, b) => Number(b.action === 'error') - Number(a.action === 'error') || a.row - b.row);
  if (!changed.length) return <p className="m-0 text-sm">Nothing in this file differs from the catalogue.</p>;
  return (
    <>
      <ul className="m-0 list-none p-0">
        {changed.slice(0, SHOW).map((r) => (
          <li key={r.row} className="border-t border-[#EEF1F8] py-2 text-sm">
            <p className="m-0 flex flex-wrap items-center gap-2"><span className="text-xs text-[#566079]">Line {r.row}</span><Badge status={r.action} /><b>{r.name}</b></p>
            {Object.entries(r.changes).map(([field, [from, to]]) => (
              <p key={field} className="m-0 break-words text-xs">{field.replace(/_/g, ' ')}: <span className="text-[#566079] line-through">{show(from)}</span> → <b>{show(to)}</b></p>
            ))}
            {Object.entries(r.errors).map(([field, message]) => <p key={field} className="m-0 text-xs font-semibold text-red-700">{field.replace(/_/g, ' ')}: {message}</p>)}
          </li>
        ))}
      </ul>
      {changed.length > SHOW && <p className="m-0 text-xs text-[#566079]">Showing the first {SHOW} of {changed.length} lines (errors first).</p>}
    </>
  );
}

export default function CatalogueImport({ base }: { base: '/dashboard' | '/admin' }) {
  const history = useLoad('imports', catalogueApi.imports);
  const [file, setFile] = useState<File | null>(null);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [skip, setSkip] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [undoing, setUndoing] = useState<ImportBatch | null>(null);
  const closeUndo = useCallback(() => setUndoing(null), []);

  const run = async (work: () => Promise<void>) => {
    setBusy(true); setNote(null);
    try { await work(); }
    catch (e) { const p = parseApiError(e); setNote({ tone: 'error', text: [p.message, ...Object.values(p.fields)].join(' ') }); }
    finally { setBusy(false); }
  };
  const upload = (e: FormEvent) => {
    e.preventDefault();
    if (file) run(async () => { setBatch(await catalogueApi.upload(file)); setSkip(false); history.reload(); });
  };
  const confirm = () => batch && run(async () => {
    const done = await catalogueApi.confirm(batch.id, skip);
    setBatch(done); setNote({ tone: 'ok', text: 'Changes applied. You can undo them below.' }); history.reload();
  });
  const undo = () => {
    const target = undoing;
    setUndoing(null);
    if (target) run(async () => { setBatch(await catalogueApi.undo(target.id)); setNote({ tone: 'ok', text: 'Upload undone.' }); history.reload(); });
  };
  const open = (id: number) => run(async () => { setBatch(await catalogueApi.importDetail(id)); setSkip(false); window.scrollTo({ top: 0 }); });

  const errors = batch?.counts.error ?? 0;
  const applicable = batch ? batch.counts.create + batch.counts.update : 0;
  const result = batch?.undo_result;

  return (
    <div className="flex flex-col gap-4 text-[#16213B] dark:rounded-2xl dark:bg-[#F5F6FA] dark:p-4">
      <Link className="text-sm font-bold underline" href={`${base}/catalogue`}>← Catalogue</Link>
      <Title sub="Upload, check the preview, then apply. Nothing changes before you confirm, and nothing is deleted." actions={<>
        <button type="button" className={secondary} onClick={() => run(() => catalogueApi.download('xlsx'))}>Export Excel</button>
        <button type="button" className={secondary} onClick={() => run(() => catalogueApi.download('csv'))}>Export CSV</button>
      </>}>Bulk upload and export</Title>
      <form onSubmit={upload} className={`${card} flex flex-col gap-3`}>
        <p className="m-0 text-sm">Start from an export: edit the cells, keep the column names, and upload it here. CSV or Excel, up to 5,000 rows and 10 MB. A blank cell leaves the value as it is. New products stay inactive unless the file says active.</p>
        <input type="file" accept=".csv,.xlsx" aria-label="CSV or Excel file" className={`${input} py-2`} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button type="submit" className={primary} disabled={!file || busy}>{busy ? 'Working…' : 'Preview changes'}</button>
      </form>
      {note && <Notice tone={note.tone}>{note.text}</Notice>}
      {batch && (
        <div className={`${card} flex flex-col gap-3`}>
          <h2 className="m-0 flex flex-wrap items-center gap-2 !text-lg font-bold !text-[#0B1F3A]">{batch.filename} <Badge status={batch.status} /></h2>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {(['create', 'update', 'unchanged', 'error'] as const).map((k) => (
              <div key={k} className="rounded-xl bg-[#F1F3F8] py-2">
                <b className={`block text-xl ${k === 'error' && batch.counts[k] ? 'text-red-700' : ''}`}>{batch.counts[k]}</b>
                {{ create: 'New', update: 'Changed', unchanged: 'Same', error: 'Errors' }[k]}
              </div>
            ))}
          </div>
          {result && (
            <Notice>
              Restored {result.restored}, deleted {result.deleted}, made inactive {result.deactivated}.
              {result.skipped.map((s) => <span key={`${s.product_id}${s.field}`} className="block">Product {s.product_id}: {s.field.replace(/_/g, ' ')} kept ({s.reason}).</span>)}
            </Notice>
          )}
          <Rows rows={batch.rows ?? []} />
          {batch.status === 'previewed' && (
            <div className="flex flex-col gap-2 border-t border-[#DDE2EC] pt-3">
              {errors > 0 && (
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" className="h-5 w-5 accent-[#E63B00]" checked={skip} onChange={(e) => setSkip(e.target.checked)} />
                  Leave out the {errors} {errors === 1 ? 'line' : 'lines'} with errors and apply the rest
                </label>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={primary} disabled={busy || !applicable || (errors > 0 && !skip)} onClick={confirm}>Apply {applicable} {applicable === 1 ? 'change' : 'changes'}</button>
                <button type="button" className={secondary} onClick={() => setBatch(null)}>Close without applying</button>
              </div>
            </div>
          )}
          {batch.status === 'applied' && <button type="button" className={secondary} disabled={busy} onClick={() => setUndoing(batch)}>Undo this upload</button>}
        </div>
      )}
      <div className={`${card} flex flex-col gap-2`}>
        <h2 className="m-0 !text-lg font-bold !text-[#0B1F3A]">Past uploads</h2>
        {history.error && <Notice tone="error">{history.error}</Notice>}
        {history.data && !history.data.results.length && <p className="m-0 text-sm">None yet.</p>}
        <ul className="m-0 list-none p-0">
          {history.data?.results.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF1F8] py-2">
              <div className="min-w-0 text-sm">
                <p className="m-0 flex flex-wrap items-center gap-2"><b className="break-all">{b.filename}</b><Badge status={b.status} /></p>
                <p className="m-0 text-xs text-[#566079]">{[when(b.created_at), b.created_by, `${b.counts.create} new, ${b.counts.update} changed, ${b.counts.error} errors`].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className={secondary} disabled={busy} onClick={() => open(b.id)}>View</button>
                {b.status === 'applied' && <button type="button" className={secondary} disabled={busy} onClick={() => setUndoing(b)}>Undo</button>}
              </div>
            </li>
          ))}
        </ul>
      </div>
      {undoing && (
        <Modal title="Undo this upload?" onClose={closeUndo}>
          <p className="m-0 text-sm">Changed products get their old values back. Products it created are removed, or made inactive if already used. Anything edited or sold since is kept.</p>
          <div className="flex justify-end gap-2">
            <button type="button" className={secondary} onClick={closeUndo}>Cancel</button>
            <button type="button" className={primary} onClick={undo}>Undo upload</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
