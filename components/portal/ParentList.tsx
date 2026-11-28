'use client';

import { useState } from 'react';
import type { ListItem } from '@/lib/portalApi';
import { money } from '@/lib/portalApi';
import { DELIVERY_NOTE } from '@/lib/shopText';
import { card, primary, quiet } from './ui';

export interface Chosen { item: ListItem; quantity: number }

const orderable = (i: ListItem) => i.available && !i.provided_by_school;

/** A booklist as parents see it. The school's preview renders this same component, with ordering switched off. */
export default function ParentList({ items, onAdd }: { items: ListItem[]; onAdd?: (chosen: Chosen[]) => void }) {
  const [picked, setPicked] = useState<Set<number>>(() => new Set(items.filter((i) => orderable(i) && i.required).map((i) => i.variant_id)));
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const quantity = (i: ListItem) => quantities[i.variant_id] ?? i.quantity;
  const available = items.filter(orderable);
  const chosen = available.filter((i) => picked.has(i.variant_id));
  const total = chosen.reduce((sum, i) => sum + Number(i.price) * quantity(i), 0);
  const all = available.length > 0 && chosen.length === available.length;
  const toggle = (id: number) => setPicked((old) => {
    const next = new Set(old);
    if (!next.delete(id)) next.add(id);
    return next;
  });
  const setQuantity = (id: number, n: number) => setQuantities((old) => ({ ...old, [id]: Math.min(1000, Math.max(1, Math.round(n) || 1)) }));

  const groups = [
    { title: 'Required', rows: items.filter((i) => i.required && !i.provided_by_school) },
    { title: 'Optional', rows: items.filter((i) => !i.required && !i.provided_by_school) },
    { title: 'Provided by the school', rows: items.filter((i) => i.provided_by_school) },
  ].filter((g) => g.rows.length);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex min-h-11 items-center gap-3 font-bold text-[#0B1F3A]">
        <input type="checkbox" className="h-5 w-5 accent-[#E63B00]" checked={all} disabled={!available.length}
          onChange={() => setPicked(new Set(all ? [] : available.map((i) => i.variant_id)))} />
        Select all ({available.length})
      </label>
      {groups.map((g) => (
        <div key={g.title} className={`${card} !p-0`}>
          <h3 className="m-0 border-b border-[#DDE2EC] px-4 py-2.5 !text-sm font-bold uppercase tracking-wide !text-[#566079]">{g.title}</h3>
          <ul className="m-0 list-none p-0">
            {g.rows.map((i) => (
              <li key={i.variant_id} className="flex flex-wrap items-center gap-3 border-b border-[#EEF1F8] px-4 py-3 last:border-0">
                {i.provided_by_school ? <span className="w-5" /> : (
                  <input type="checkbox" className="h-5 w-5 flex-none accent-[#E63B00]" aria-label={`Select ${i.name}`}
                    checked={orderable(i) && picked.has(i.variant_id)} disabled={!orderable(i)} onChange={() => toggle(i.variant_id)} />
                )}
                <div className="min-w-0 flex-1 basis-40">
                  <p className="m-0 font-semibold">{i.name}</p>
                  <p className="m-0 text-xs text-[#566079]">
                    {[i.variant !== 'Default' && i.variant, i.publisher, i.provided_by_school ? `Quantity ${i.quantity}` : `${money(i.price)} each`].filter(Boolean).join(' · ')}
                  </p>
                  {!i.available && !i.provided_by_school && <p className="m-0 text-xs font-bold text-red-700">Not available now</p>}
                </div>
                {!i.provided_by_school && (
                  <div className="ml-8 flex items-center gap-3 sm:ml-0">
                    <label className="flex items-center gap-1 text-xs text-[#566079]">
                      Qty
                      <input type="number" inputMode="numeric" min={1} max={1000} value={quantity(i)} disabled={!orderable(i)}
                        onChange={(e) => setQuantity(i.variant_id, Number(e.target.value))}
                        className="h-11 w-16 rounded-lg border border-[#C6CDDB] bg-white px-2 text-base text-[#16213B] disabled:bg-[#F1F3F8]" />
                    </label>
                    <b className="w-24 text-right">{money(Number(i.price) * quantity(i))}</b>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className={`${card} sticky bottom-0 z-10 flex flex-col gap-2 shadow-[0_-8px_24px_-16px_rgba(11,31,58,.5)]`}>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm">{chosen.length} {chosen.length === 1 ? 'item' : 'items'} selected</span>
          <b className="text-xl text-[#0B1F3A]">{money(total)}</b>
        </div>
        <p className="m-0 text-xs text-[#566079]">{DELIVERY_NOTE}</p>
        <button type="button" className={primary} disabled={!onAdd || !chosen.length}
          onClick={() => onAdd?.(chosen.map((item) => ({ item, quantity: quantity(item) })))}>
          Add to trolley
        </button>
        {!onAdd && <p className="m-0 text-center text-xs font-semibold text-[#566079]">Preview: ordering is switched off.</p>}
        {onAdd && chosen.length > 0 && <button type="button" className={quiet} onClick={() => setPicked(new Set())}>Clear selection</button>}
      </div>
    </div>
  );
}
