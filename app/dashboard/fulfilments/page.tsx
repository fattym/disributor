'use client';

import { useCallback, useEffect, useState } from 'react';
import { distributorApi } from '@/lib/api';

interface Line { id: number; product_name: string; variant_label: string; quantity: number }
interface Fulfilment {
  id: number;
  tracking_ref: string | null;
  order_ref: string | null;
  payment_method: string;
  payment_received: boolean;
  status: string;
  created_at: string;
  lines: Line[];
  ship_to: { name: string; phone: string; address: string; county: string; notes: string } | null;
  next_actions: string[];
  distributor_name: string;
  stuck: boolean;
}

const LABEL: Record<string, string> = {
  pending: 'Pending (awaiting payment)', confirmed: 'Confirmed', packing: 'Processing', packed: 'Ready for dispatch',
  dispatched: 'Dispatched', delivered: 'Delivered', failed: 'Delivery failed', cancelled: 'Cancelled',
};
const FILTERS = ['', 'pending', 'confirmed', 'packing', 'packed', 'dispatched', 'delivered'];
const BTN = 'px-3 py-1 text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded hover:opacity-80 disabled:opacity-50';

function errText(e: unknown): string {
  const data = (e as { response?: { data?: Record<string, unknown> } })?.response?.data;
  const first = data && Object.values(data)[0];
  return String(Array.isArray(first) ? first[0] : first || 'Something went wrong.');
}

export default function FulfilmentsPage() {
  const [rows, setRows] = useState<Fulfilment[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [carrier, setCarrier] = useState<Record<number, string>>({});
  const [ref, setRef] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    try {
      const data = await distributorApi.getFulfilments(filter);
      setRows(data.results || data);
      setError('');
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const run = async (id: number, fn: () => Promise<unknown>) => {
    setBusy(id);
    setError('');
    try { await fn(); await load(); } catch (e) { setError(errText(e)); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Fulfilments</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Website orders to pack and ship. A new order waits as &ldquo;Pending&rdquo; until payment is confirmed by Learning Pack.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f || 'all'} onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full border ${filter === f ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'}`}>
            {f ? LABEL[f] : 'All'}
          </button>
        ))}
      </div>
      {error && <div role="alert" className="text-sm text-red-600">{error}</div>}
      {loading ? <div>Loading...</div> : rows.length === 0 ? (
        <div className="p-6 text-center text-zinc-500 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">Nothing here yet.</div>
      ) : rows.map((f) => (
        <div key={f.id} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">{f.tracking_ref || `#${f.id}`}</div>
            <span className="px-2 py-1 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {LABEL[f.status] || f.status}{f.stuck ? ' - waiting too long' : ''}
            </span>
          </div>
          <div className="text-xs text-zinc-500">
            Placed {new Date(f.created_at).toLocaleString()} - paid via {f.payment_method || 'n/a'} - {f.payment_received ? 'payment received' : 'payment not yet received'}
          </div>
          <ul className="text-sm text-zinc-800 dark:text-zinc-200 list-disc pl-5">
            {f.lines.map((l) => <li key={l.id}>{l.product_name}{l.variant_label && l.variant_label !== 'Default' ? ` (${l.variant_label})` : ''} x{l.quantity}</li>)}
          </ul>
          {f.ship_to && (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Ship to: {f.ship_to.name}, {f.ship_to.phone}{f.ship_to.address ? `, ${f.ship_to.address}` : ' (address to be confirmed on WhatsApp)'}{f.ship_to.county ? `, ${f.ship_to.county}` : ''}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {f.status === 'pending' && <span className="text-xs text-zinc-500">Waiting for payment confirmation. You can&apos;t move this yet.</span>}
            {f.next_actions.includes('packing') && <button className={BTN} disabled={busy === f.id} onClick={() => run(f.id, () => distributorApi.advanceFulfilment(f.id, 'packing'))}>Start processing</button>}
            {f.next_actions.includes('packed') && <button className={BTN} disabled={busy === f.id} onClick={() => run(f.id, () => distributorApi.advanceFulfilment(f.id, 'packed'))}>Ready for dispatch</button>}
            {f.next_actions.includes('dispatch') && (
              <>
                <input aria-label="Carrier" placeholder="Carrier / rider" value={carrier[f.id] || ''} onChange={(e) => setCarrier({ ...carrier, [f.id]: e.target.value })} className="border rounded px-2 py-1 text-xs dark:bg-zinc-800" />
                <input aria-label="Waybill" placeholder="Waybill no. (optional)" value={ref[f.id] || ''} onChange={(e) => setRef({ ...ref, [f.id]: e.target.value })} className="border rounded px-2 py-1 text-xs dark:bg-zinc-800" />
                <button className={BTN} disabled={busy === f.id || !(carrier[f.id] || '').trim()} onClick={() => run(f.id, () => distributorApi.dispatchFulfilment(f.id, { carrier: carrier[f.id], tracking_number: ref[f.id] || '' }))}>Dispatch</button>
              </>
            )}
            {f.next_actions.includes('mark_delivered') && <button className={BTN} disabled={busy === f.id} onClick={() => run(f.id, () => distributorApi.deliverFulfilment(f.id))}>Mark delivered</button>}
            {f.next_actions.includes('mark_failed') && (
              <button className={BTN} disabled={busy === f.id} onClick={() => {
                const reason = window.prompt('Why did the delivery fail?');
                if (reason && reason.trim()) run(f.id, () => distributorApi.failFulfilment(f.id, reason.trim()));
              }}>Delivery failed</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
