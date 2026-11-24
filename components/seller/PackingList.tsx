'use client';

import { useState } from 'react';
import { distributorApi } from '@/lib/api';
import { errText } from '@/lib/fulfilments';
import Modal from './Modal';

interface Slip {
  order_number: number;
  distributor_name: string;
  ship_to: { name: string; phone: string; address: string; county: string; notes: string } | null;
  lines: { id: number; product_name: string; variant_label: string; sku: string; quantity: number }[];
  total_units: number;
}

export default function PackingList({ id, className }: { id: number; className: string }) {
  const [slip, setSlip] = useState<Slip | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const show = async () => {
    setOpen(true);
    setError('');
    try { setSlip(await distributorApi.getPackingList(id)); } catch (e) { setError(errText(e)); }
  };

  return (
    <>
      <button type="button" className={className} onClick={show}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16213B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /></svg>
        Packing list
      </button>
      {open && (
        <Modal title="Packing list" onClose={() => setOpen(false)}>
          <style>{'@media print{body *{visibility:hidden}.lp-print,.lp-print *{visibility:visible}.lp-print{position:absolute;left:0;top:0;width:100%}}'}</style>
          <div className="lp-print flex flex-col gap-3 text-sm">
            {error && <p role="alert" className="m-0 font-semibold text-[#9B1C1C]">{error}</p>}
            {!slip && !error && <p className="m-0 text-[#5B6683]">Loading…</p>}
            {slip && (
              <>
                {slip.ship_to && (
                  <div>
                    <div className="font-semibold">Ship to</div>
                    <div className="text-[#3D4865]">{[slip.ship_to.name, slip.ship_to.phone, slip.ship_to.address, slip.ship_to.county].filter(Boolean).join(', ')}</div>
                  </div>
                )}
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {slip.lines.map((l) => (
                    <li key={l.id} className="flex justify-between gap-3 border-b border-[#EEF0F6] pb-1.5">
                      <span>{l.product_name}{l.variant_label && l.variant_label !== 'Default' ? ` (${l.variant_label})` : ''}</span>
                      <b>×{l.quantity}</b>
                    </li>
                  ))}
                </ul>
                <div className="font-bold">Total units: {slip.total_units}</div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="h-11 rounded-[10px] border border-[#CDD3E1] bg-white px-4 text-[13px] font-semibold" onClick={() => setOpen(false)}>Close</button>
            {slip && <button type="button" className="h-11 rounded-[10px] bg-[#0F1E3D] px-4 text-[13px] font-bold text-white" onClick={() => window.print()}>Print</button>}
          </div>
        </Modal>
      )}
    </>
  );
}
