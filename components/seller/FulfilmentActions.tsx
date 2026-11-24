'use client';

import { useState } from 'react';
import { distributorApi } from '@/lib/api';
import { errText, type Fulfilment } from '@/lib/fulfilments';
import Modal from './Modal';

const PRIMARY = 'inline-flex items-center justify-center h-11 px-4 rounded-[10px] border-0 bg-[#0F1E3D] text-white text-[13px] font-bold whitespace-nowrap cursor-pointer disabled:opacity-50';
const SECONDARY = 'inline-flex items-center justify-center h-11 px-4 rounded-[10px] border border-[#CDD3E1] bg-white text-[#16213B] text-[13px] font-semibold whitespace-nowrap cursor-pointer disabled:opacity-50';
const FIELD = 'h-11 rounded-xl border border-[#CDD3E1] px-3 text-[15px] text-[#16213B] bg-white';

/** The next-step buttons for one fulfilment, using the existing advance/dispatch/deliver/fail endpoints. */
export default function FulfilmentActions({ f, onChanged, onError }: { f: Fulfilment; onChanged: () => void | Promise<void>; onError: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<'dispatch' | 'failed' | null>(null);
  const [carrier, setCarrier] = useState('');
  const [waybill, setWaybill] = useState('');
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState('');

  const run = async (fn: () => Promise<unknown>, fromModal = false) => {
    setBusy(true);
    onError('');
    setLocalError('');
    try {
      await fn();
      setModal(null);
      await onChanged();
    } catch (e) {
      if (fromModal) setLocalError(errText(e)); else onError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const a = f.next_actions;
  return (
    <>
      {f.status === 'pending' && <span className="text-[13px] text-[#5B6683]">Waiting for payment</span>}
      {a.includes('packing') && <button type="button" className={PRIMARY} disabled={busy} onClick={() => run(() => distributorApi.advanceFulfilment(f.id, 'packing'))}>Start processing</button>}
      {a.includes('packed') && <button type="button" className={PRIMARY} disabled={busy} onClick={() => run(() => distributorApi.advanceFulfilment(f.id, 'packed'))}>Mark ready</button>}
      {a.includes('dispatch') && <button type="button" className={PRIMARY} disabled={busy} onClick={() => setModal('dispatch')}>Dispatch</button>}
      {a.includes('mark_delivered') && <button type="button" className={PRIMARY} disabled={busy} onClick={() => run(() => distributorApi.deliverFulfilment(f.id))}>Mark delivered</button>}
      {a.includes('mark_failed') && <button type="button" className={SECONDARY} disabled={busy} onClick={() => setModal('failed')}>Delivery failed</button>}

      {modal === 'dispatch' && (
        <Modal title={`Dispatch ${f.tracking_ref || `#${f.id}`}`} onClose={() => setModal(null)}>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Carrier or rider
            <input className={FIELD} value={carrier} onChange={(e) => setCarrier(e.target.value)} autoComplete="off" />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Waybill number <span className="font-normal text-[#5B6683]">(optional)</span>
            <input className={FIELD} value={waybill} onChange={(e) => setWaybill(e.target.value)} autoComplete="off" />
          </label>
          {localError && <p role="alert" className="m-0 text-sm font-semibold text-[#9B1C1C]">{localError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className={SECONDARY} onClick={() => setModal(null)}>Cancel</button>
            <button type="button" className={PRIMARY} disabled={busy || !carrier.trim()}
              onClick={() => run(() => distributorApi.dispatchFulfilment(f.id, { carrier: carrier.trim(), tracking_number: waybill.trim() }), true)}>Dispatch</button>
          </div>
        </Modal>
      )}
      {modal === 'failed' && (
        <Modal title="Why did the delivery fail?" onClose={() => setModal(null)}>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Reason
            <textarea className={`${FIELD} h-24 py-2`} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          {localError && <p role="alert" className="m-0 text-sm font-semibold text-[#9B1C1C]">{localError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className={SECONDARY} onClick={() => setModal(null)}>Cancel</button>
            <button type="button" className={PRIMARY} disabled={busy || !reason.trim()}
              onClick={() => run(() => distributorApi.failFulfilment(f.id, reason.trim()), true)}>Mark as failed</button>
          </div>
        </Modal>
      )}
    </>
  );
}
