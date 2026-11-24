'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { distributorApi } from '@/lib/api';
import FulfilmentActions from '@/components/seller/FulfilmentActions';
import PackingList from '@/components/seller/PackingList';
import { STAGES, errText, itemsText, methodText, stageOf, whenText, whoWhere, type Fulfilment } from '@/lib/fulfilments';

const LIMIT = 200;
const GHOST = 'inline-flex items-center gap-1.5 h-11 px-3 rounded-[10px] border border-[#CDD3E1] bg-white text-[13px] font-semibold text-[#16213B] cursor-pointer';

export default function FulfilmentsPage() {
  const [rows, setRows] = useState<Fulfilment[]>([]);
  const [total, setTotal] = useState(0);
  const [tab, setTab] = useState('confirmed');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [tick, setTick] = useState(0);
  const load = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let stale = false;
    distributorApi.getFulfilments('', LIMIT)
      .then((data) => {
        if (stale) return;
        const list: Fulfilment[] = data.results || data;
        setRows(list);
        setTotal(typeof data.count === 'number' ? data.count : list.length);
        setError('');
      })
      .catch((e) => { if (!stale) setError(errText(e)); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [tick]);

  const tabs = useMemo(() => {
    const base: { status: string; label: string }[] = STAGES.map((s) => ({ status: s.status, label: s.label }));
    if (rows.some((r) => r.status === 'failed')) base.push({ status: 'failed', label: 'Delivery failed' });
    return base.map((t) => ({ ...t, n: rows.filter((r) => r.status === t.status).length }));
  }, [rows]);

  const needle = q.trim().toLowerCase();
  const shown = rows.filter((r) => r.status === tab).filter((r) => {
    if (!needle) return true;
    const w = whoWhere(r);
    return [r.tracking_ref, r.order_ref, w.customer, w.deliverTo].some((x) => (x || '').toLowerCase().includes(needle));
  });

  return (
    <div className="flex flex-col gap-5 font-[family-name:var(--font-body,'DM_Sans')]">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 !text-[#16213B] text-[28px] font-bold tracking-tight">Fulfilments</h1>
          <p className="m-0 text-[15px] text-[#5B6683]">Every order line you need to pack and send, by stage.</p>
        </div>
        <label className="flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-[#E1E5EE] bg-white px-3.5 sm:w-auto sm:min-w-[300px]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B6683" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" /></svg>
          <input type="search" aria-label="Search fulfilments" placeholder="Order number, customer or school" value={q} onChange={(e) => setQ(e.target.value)}
            className="h-11 min-w-0 flex-1 border-0 bg-transparent text-sm text-[#16213B] outline-none" />
        </label>
      </header>

      <div role="tablist" aria-label="Stage" className="flex flex-wrap gap-1.5 self-start rounded-[14px] bg-[#E9ECF4] p-1">
        {tabs.map((t) => (
          <button key={t.status} type="button" role="tab" aria-selected={tab === t.status} onClick={() => setTab(t.status)}
            className={`h-11 cursor-pointer rounded-[10px] border-0 px-3.5 text-sm ${tab === t.status ? 'bg-white font-bold text-[#0F1E3D]' : 'bg-transparent font-semibold text-[#3D4865]'}`}>
            {t.label} <span className="font-medium text-[#5B6683]">{t.n}</span>
          </button>
        ))}
      </div>

      {error && <div role="alert" className="text-sm font-semibold text-[#9B1C1C]">{error}</div>}
      {total > rows.length && <p className="m-0 text-[13px] text-[#5B6683]">Showing the latest {rows.length} of {total} fulfilments.</p>}

      <section className="flex flex-col gap-3 !py-0">
        {loading ? <div className="text-[#5B6683]">Loading…</div> : shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#CDD3E1] bg-white p-8 text-center text-[15px] text-[#5B6683]">Nothing in this stage right now.</div>
        ) : shown.map((f) => {
          const st = stageOf(f.status);
          const w = whoWhere(f);
          return (
            <article key={f.id} className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl border border-[#E6E9F1] bg-white px-5 py-[18px]">
              <div className="flex min-w-[200px] flex-[1_1_200px] flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2.5">
                  <span className="text-base font-bold">{f.tracking_ref || `#${f.id}`}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-xs font-bold" style={{ background: st.chipBg, color: st.chipFg }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.chipFg }} />{st.label}{f.stuck ? ' · waiting too long' : ''}
                  </span>
                </span>
                <span className="text-[13px] text-[#5B6683]">{whenText(f.created_at)} · {f.payment_received ? `Paid via ${methodText(f.payment_method)}` : 'Payment not yet received'}</span>
              </div>
              <div className="flex min-w-[180px] flex-[1_1_180px] flex-col gap-0.5">
                <span className="text-sm font-semibold">{w.customer}</span>
                <span className="text-[13px] text-[#5B6683]">{w.deliverLine}</span>
              </div>
              <div className="flex min-w-[160px] flex-[1_1_160px] flex-col gap-0.5">
                <span className="text-sm text-[#3D4865]">{itemsText(f)}</span>
                <span className="text-[13px] text-[#5B6683]">{f.lines.map((l) => l.product_name).slice(0, 2).join(', ')}{f.lines.length > 2 ? '…' : ''}</span>
              </div>
              <div className="flex flex-[1_1_220px] flex-wrap items-center justify-end gap-2">
                <PackingList id={f.id} className={GHOST} />
                <FulfilmentActions f={f} onChanged={load} onError={setError} />
              </div>
            </article>
          );
        })}
      </section>

      <p className="m-0 text-[13px] text-[#5B6683]">Orders waiting for payment stay locked until Learning Pack confirms the M-Pesa payment. Dispatch asks for the carrier and an optional waybill number; the parent sees each step on the tracking page.</p>
    </div>
  );
}
