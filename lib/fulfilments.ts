export interface FulfilmentLine { id: number; product_name: string; variant_label: string; quantity: number }
export interface Fulfilment {
  id: number;
  tracking_ref: string | null;
  order_ref: string | null;
  payment_method: string;
  payment_received: boolean;
  status: string;
  created_at: string;
  lines: FulfilmentLine[];
  ship_to: { type?: string; name: string; phone: string; address: string; county: string; notes: string } | null;
  next_actions: string[];
  distributor_name: string;
  stuck: boolean;
}

/** The seller-facing stages, in order. `status` is the API status each one maps to. */
export const STAGES = [
  { status: 'pending', label: 'Waiting for payment', hint: 'Confirmed by Learning Pack', dot: '#8A93AD', chipBg: '#EEF0F6', chipFg: '#3D4865' },
  { status: 'confirmed', label: 'To pack', hint: 'Payment received', dot: '#F26B1D', chipBg: '#FFF1E7', chipFg: '#9A3412' },
  { status: 'packing', label: 'Packing', hint: 'In progress', dot: '#1E3A8A', chipBg: '#E8ECF6', chipFg: '#1E2F5C' },
  { status: 'packed', label: 'Ready to dispatch', hint: 'Needs a carrier', dot: '#0F766E', chipBg: '#E3F2EE', chipFg: '#0B5F55' },
  { status: 'dispatched', label: 'Dispatched', hint: 'On the way', dot: '#1E3A8A', chipBg: '#E8ECF6', chipFg: '#1E2F5C' },
  { status: 'delivered', label: 'Delivered', hint: 'Done', dot: '#0F766E', chipBg: '#E3F2EE', chipFg: '#0B5F55' },
] as const;

const OTHER = { label: '', chipBg: '#FDECEC', chipFg: '#9B1C1C' };
export function stageOf(status: string) {
  const s = STAGES.find((x) => x.status === status);
  if (s) return s;
  return { ...OTHER, label: status === 'failed' ? 'Delivery failed' : status === 'cancelled' ? 'Cancelled' : status };
}

export const itemCount = (f: Fulfilment) => f.lines.reduce((n, l) => n + l.quantity, 0);
export const itemsText = (f: Fulfilment) => { const n = itemCount(f); return `${n} item${n === 1 ? '' : 's'}`; };

/** Who and where, using only what the API sends. School orders carry the school, never the buyer. */
export function whoWhere(f: Fulfilment): { customer: string; deliverTo: string; deliverLine: string } {
  const s = f.ship_to;
  if (!s) return { customer: '—', deliverTo: 'Address to be confirmed', deliverLine: 'Address to be confirmed' };
  if (s.type === 'school') return { customer: 'School order', deliverTo: s.name, deliverLine: `Deliver to ${s.name}` };
  const where = [s.address, s.county].filter(Boolean).join(', ');
  const place = where || s.notes;
  return { customer: s.name, deliverTo: place || 'Address to be confirmed on WhatsApp', deliverLine: place ? `Deliver to ${place}` : 'Address to be confirmed on WhatsApp' };
}

export function errText(e: unknown): string {
  const data = (e as { response?: { data?: Record<string, unknown> } })?.response?.data;
  const first = data && Object.values(data)[0];
  return String(Array.isArray(first) ? first[0] : first || 'Something went wrong.');
}

export function whenText(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  const time = d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (days <= 0 && d.getDate() === new Date().getDate()) return `Today, ${time}`;
  if (days <= 1) return 'Yesterday';
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

export const methodText = (m: string) => (m === 'whatsapp' ? 'WhatsApp' : m === 'mpesa' ? 'M-Pesa' : m || 'M-Pesa');
