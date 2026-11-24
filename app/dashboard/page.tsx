'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { distributorApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import FulfilmentActions from '@/components/seller/FulfilmentActions';
import { STAGES, errText, itemsText, stageOf, whenText, whoWhere, type Fulfilment } from '@/lib/fulfilments';

interface Product {
  id: number;
  name: string;
  available_stock: number;
  sellable_stock?: number;
  on_backorder?: number;
  low_stock_threshold?: number;
  is_active: boolean;
}

const WORKING = STAGES.slice(0, 4); // pending, confirmed, packing, packed
const shareUrl = () => `https://wa.me/?text=${encodeURIComponent(`Shop school books and supplies on Learning Pack: ${window.location.origin}/shop`)}`;

const FLOW = [
  { n: '1', t: 'Parent checks out', d: 'Order is saved and you get an email. It shows as Waiting for payment.' },
  { n: '2', t: 'Payment confirmed', d: 'Learning Pack confirms the M-Pesa payment from WhatsApp. It moves to To pack.' },
  { n: '3', t: 'Pack and dispatch', d: 'Mark it ready, choose the carrier, add a waybill if you have one.' },
  { n: '4', t: 'Delivered', d: 'Mark it delivered. The parent can follow every step on the tracking page.' },
];

const CARD = 'rounded-2xl border border-[#E6E9F1] bg-white';
const LINK = 'text-sm font-semibold text-[#1E3A8A]';

/** Products worth a look: owing stock on backorder, or at/below their own low-stock level. */
function stockToWatch(products: Product[]) {
  const list = products.filter((p) => p.is_active).map((p) => {
    const sellable = p.sellable_stock ?? p.available_stock;
    const held = Math.max(0, p.available_stock - sellable);
    const back = p.on_backorder ?? 0;
    const low = (p.low_stock_threshold ?? 0) > 0 && sellable <= (p.low_stock_threshold ?? 0);
    return { p, sellable, held, back, low };
  }).filter((x) => x.back > 0 || x.low || x.sellable <= 0);
  list.sort((a, b) => (b.back > 0 ? 1 : 0) - (a.back > 0 ? 1 : 0) || a.sellable - b.sellable);
  return list.slice(0, 5).map(({ p, sellable, held, back }) => (back > 0
    ? { id: p.id, name: p.name, sub: 'Orders still accepted', tag: `${back} on backorder`, bg: '#E8ECF6', fg: '#1E2F5C' }
    : { id: p.id, name: p.name, sub: held > 0 ? `${held} held for unpaid orders` : `${p.available_stock} on hand`, tag: sellable > 0 ? `${sellable} left` : 'Out of stock', bg: '#FFF1E7', fg: '#9A3412' }));
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<number[]>([]);
  const [orders, setOrders] = useState<Fulfilment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [tick, setTick] = useState(0);
  const load = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let stale = false;
    Promise.all([
      Promise.all(WORKING.map((s) => distributorApi.getFulfilments(s.status, 1))),
      distributorApi.getFulfilments(WORKING.map((s) => s.status).join(','), 8),
      distributorApi.getProducts(),
    ])
      .then(([lists, open, prods]) => {
        if (stale) return;
        setCounts(lists.map((d) => (typeof d.count === 'number' ? d.count : (d.results || d).length)));
        setOrders(open.results || open);
        const pl = prods.results || prods;
        setProducts(Array.isArray(pl) ? pl : []);
        setError('');
      })
      .catch((e) => { if (!stale) setError(errText(e)); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [tick]);

  if (loading) return <div className="text-[#5B6683]">Loading dashboard…</div>;

  const hour = new Date().getHours();
  const part = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const name = user?.first_name?.trim();
  const watch = stockToWatch(products);
  const noOrders = counts.every((n) => n === 0);

  return (
    <div className="flex flex-col gap-[22px] font-[family-name:var(--font-body,'DM_Sans')]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 !text-[#16213B] text-2xl font-bold tracking-tight sm:text-[28px]">Good {part}{name ? `, ${name}` : ''}</h1>
          <p className="m-0 text-[15px] text-[#5B6683]">Here is what needs you today.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/shop" className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#CDD3E1] bg-white px-4 text-sm font-semibold !text-[#16213B] no-underline">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16213B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" /></svg>
            View my shop
          </Link>
          <Link href="/dashboard/products" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#F26B1D] px-4 text-sm font-bold !text-[#0F1E3D] no-underline">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F1E3D" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            Add product
          </Link>
        </div>
      </header>

      {error && <div role="alert" className="text-sm font-semibold text-[#9B1C1C]">{error}</div>}

      <section aria-label="Orders by stage" className="!py-0 [display:grid] grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
        {WORKING.map((s, i) => (
          <Link key={s.status} href="/dashboard/fulfilments" className={`${CARD} flex flex-col gap-2 p-[18px] !text-[#16213B] no-underline`}>
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#3D4865]">{s.label}</span>
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: s.dot }} />
            </span>
            <span className="text-[32px] font-bold tracking-tight">{counts[i] ?? 0}</span>
            <span className="text-[13px] text-[#5B6683]">{s.hint}</span>
          </Link>
        ))}
      </section>

      {noOrders ? (
        <section className={`${CARD} flex flex-col items-center gap-3.5 px-6 !py-10 text-center`}>
          <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#FFF1E7]">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" /></svg>
          </span>
          <h2 className="m-0 !text-[#16213B] text-xl font-bold">No orders yet</h2>
          <p className="m-0 max-w-[460px] text-[15px] leading-normal text-[#5B6683]">When a parent checks out on Learning Pack, their order appears here straight away, and you get an email. Share your shop to get the first one.</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <a href={shareUrl()} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-xl bg-[#F26B1D] px-[18px] text-sm font-bold !text-[#0F1E3D] no-underline">Share shop on WhatsApp</a>
            <Link href="/dashboard/products" className="inline-flex h-11 items-center rounded-xl border border-[#CDD3E1] px-[18px] text-sm font-semibold !text-[#16213B] no-underline">Check my products</Link>
          </div>
        </section>
      ) : (
        <section className={`${CARD} overflow-hidden !py-0`}>
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#EEF0F6] px-5 py-[18px]">
            <h2 className="m-0 !text-[#16213B] text-[17px] font-bold">Orders that need you</h2>
            <Link href="/dashboard/fulfilments" className={LINK}>All fulfilments</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#F7F8FC] text-left text-xs uppercase tracking-[0.06em] text-[#5B6683]">
                  <th scope="col" className="px-5 py-3 font-semibold">Order</th>
                  <th scope="col" className="p-3 font-semibold">Customer</th>
                  <th scope="col" className="p-3 font-semibold">Items</th>
                  <th scope="col" className="p-3 font-semibold">Stage</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Next step</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((f) => {
                  const st = stageOf(f.status);
                  const w = whoWhere(f);
                  return (
                    <tr key={f.id} className="border-t border-[#EEF0F6]">
                      <td className="px-5 py-3.5"><span className="flex flex-col gap-0.5"><b>{f.tracking_ref || `#${f.id}`}</b><span className="text-[13px] text-[#5B6683]">{whenText(f.created_at)}</span></span></td>
                      <td className="p-3.5"><span className="flex flex-col gap-0.5"><span className="font-semibold">{w.customer}</span><span className="text-[13px] text-[#5B6683]">{w.deliverTo}</span></span></td>
                      <td className="p-3.5 text-[#3D4865]">{itemsText(f)}</td>
                      <td className="p-3.5"><span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: st.chipBg, color: st.chipFg }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: st.chipFg }} />{st.label}</span></td>
                      <td className="px-5 py-3.5"><div className="flex flex-wrap items-center justify-end gap-2"><FulfilmentActions f={f} onChanged={load} onError={setError} /></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="!py-0 [display:grid] grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-4">
        <article className={`${CARD} flex flex-col gap-3.5 p-5`}>
          <div className="flex items-center justify-between gap-2.5">
            <h2 className="m-0 !text-[#16213B] text-[17px] font-bold">Stock to watch</h2>
            <Link href="/dashboard/products" className={LINK}>Products</Link>
          </div>
          {watch.length === 0 ? (
            <p className="m-0 rounded-xl bg-[#F7F8FC] p-3 text-sm text-[#3D4865]">Nothing low or on backorder right now.</p>
          ) : watch.map((k) => (
            <div key={k.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#F7F8FC] p-3">
              <span className="flex min-w-0 flex-col gap-0.5"><span className="text-sm font-semibold">{k.name}</span><span className="text-[13px] text-[#5B6683]">{k.sub}</span></span>
              <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: k.bg, color: k.fg }}>{k.tag}</span>
            </div>
          ))}
        </article>
        <article className="flex flex-col gap-3 rounded-2xl bg-[#0F1E3D] p-5 text-white">
          <h2 className="m-0 text-[17px] font-bold !text-white">How an order flows</h2>
          {FLOW.map((f) => (
            <div key={f.n} className="flex items-start gap-3">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#1A2C52] text-[13px] font-bold text-[#FFB27A]">{f.n}</span>
              <span className="flex flex-col gap-0.5"><span className="text-sm font-bold">{f.t}</span><span className="text-[13px] leading-[1.45] text-[#C9D1E6]">{f.d}</span></span>
            </div>
          ))}
        </article>
      </section>
    </div>
  );
}
