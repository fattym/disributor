'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import { shopApi, type WhatsAppCheckoutResult } from '@/lib/api';
import { storefrontApi } from '@/lib/storefrontApi';
import { useCart } from '@/lib/cart';
import './cart.css';

const kes = (n: number) => `KSh ${n.toLocaleString('en-KE')}`;

/** Turn a DRF error body into one readable sentence plus per-field messages. */
function readError(error: unknown): { message: string; fields: Record<string, string> } {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  const fields: Record<string, string> = {};
  let message = 'We could not place your order. Please try again.';
  if (data && typeof data === 'object') {
    const body = data as Record<string, unknown>;
    if (typeof body.detail === 'string') message = body.detail;
    for (const [key, value] of Object.entries(body)) {
      if (key === 'detail') continue;
      const text = Array.isArray(value) ? value.map(String).join(' ') : typeof value === 'string' ? value : '';
      if (text) {
        if (key === 'items') message = text;
        else fields[key] = text;
      }
    }
  }
  return { message, fields };
}

// Payment methods. M-Pesa (Daraja) is not live in production, so it is shown but cannot be chosen.
function PaymentMethods() {
  return (
    <section className="lp-co__card" aria-label="Payment method">
      <h2>Payment method</h2>
      <div className="lp-co__choice">
        <button type="button" className="lp-co__pay on" aria-pressed="true">
          <b>WhatsApp checkout</b>
          <small>We record your order, then you send it to us on WhatsApp to confirm payment and delivery.</small>
        </button>
        <button type="button" className="lp-co__pay" disabled aria-disabled="true">
          <b>M-Pesa <span className="lp-co__soon">Coming soon</span></b>
          <small>Pay on the site with an M-Pesa prompt.</small>
        </button>
      </div>
    </section>
  );
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({
    delivery_name: '', delivery_phone: '', delivery_address: '', delivery_county: '', delivery_notes: '', parent_school: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<(WhatsAppCheckoutResult & { total: number }) | null>(null);

  useEffect(() => {
    storefrontApi.getSchools().then((list) => setSchools(list)).catch(() => setSchools([]));
  }, []);

  const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.delivery_name.trim()) errors.delivery_name = 'Enter your name.';
    if (!form.delivery_phone.trim()) errors.delivery_phone = 'Enter your phone number.';
    setFieldErrors(errors);
    setError('');
    if (Object.keys(errors).length || items.length === 0) return;
    setLoading(true);
    try {
      const result = await shopApi.whatsappCheckout({
        delivery_name: form.delivery_name.trim(),
        delivery_phone: form.delivery_phone.trim(),
        delivery_address: form.delivery_address.trim(),
        delivery_county: form.delivery_county.trim(),
        delivery_notes: form.delivery_notes.trim(),
        parent_school: form.parent_school ? Number(form.parent_school) : null,
        items: items.map((i) => (i.variant_id > 0
          ? { variant: i.variant_id, quantity: i.quantity }
          : { product: i.product_id, quantity: i.quantity })),
      });
      // The order is saved. Only now is the cart emptied and WhatsApp opened.
      setDone({ ...result, total });
      clearCart();
      window.open(result.whatsapp_url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      const { message, fields } = readError(e);
      setError(message);
      setFieldErrors(fields);
    } finally {
      setLoading(false);
    }
  };

  let body;
  if (done) {
    body = (
      <div className="lp-co__done" role="status">
        <div className="lp-co__ok" aria-hidden="true">✓</div>
        <h2>Order recorded</h2>
        <dl className="lp-co__dl">
          <div><dt>Order number</dt><dd>{done.tracking_ref}</dd></div>
          <div><dt>Total</dt><dd>{kes(done.total)}</dd></div>
          <div><dt>Status</dt><dd>Pending (awaiting payment)</dd></div>
        </dl>
        <p className="lp-co__hint">
          Your order is saved, but it is not confirmed until you message us. Tap the button to open WhatsApp and send it.
          We confirm payment and delivery details there. Keep your order number and phone to track it.
        </p>
        <a className="lp-co__btn lp-co__btn--wa" href={done.whatsapp_url} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>
        <Link className="lp-co__btn lp-co__btn--ghost" href="/track-your-order">Track this order</Link>
      </div>
    );
  } else if (items.length === 0) {
    body = (
      <div className="lp-co__empty">
        <h2>Your cart is empty</h2>
        <p className="lp-co__hint">Add something from the shop to check out.</p>
        <Link className="lp-co__btn" href="/shop">Browse the shop</Link>
      </div>
    );
  } else {
    body = (
      <form className="lp-co__grid" onSubmit={submit} noValidate>
        <div className="lp-co__main">
          <section className="lp-co__card">
            <h2>Your details</h2>
            <p className="lp-co__hint">No account needed. Name and phone are enough: we confirm delivery details with you on WhatsApp.</p>
            <div className="lp-co__two">
              <label className={'lp-co__fld' + (fieldErrors.delivery_name ? ' bad' : '')}>Full name
                <input value={form.delivery_name} onChange={(e) => set('delivery_name')(e.target.value)} autoComplete="name" required />
                {fieldErrors.delivery_name && <em>{fieldErrors.delivery_name}</em>}
              </label>
              <label className={'lp-co__fld' + (fieldErrors.delivery_phone ? ' bad' : '')}>Phone number
                <input type="tel" inputMode="tel" placeholder="07XX XXX XXX" value={form.delivery_phone}
                  onChange={(e) => set('delivery_phone')(e.target.value)} autoComplete="tel" required />
                {fieldErrors.delivery_phone && <em>{fieldErrors.delivery_phone}</em>}
              </label>
            </div>
            <label className="lp-co__fld">School <span className="lp-co__opt">(optional)</span>
              <select value={form.parent_school} onChange={(e) => set('parent_school')(e.target.value)}>
                <option value="">Not sure / not for a school</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {fieldErrors.parent_school && <em>{fieldErrors.parent_school}</em>}
            </label>
            <div className="lp-co__two">
              <label className="lp-co__fld">Delivery address <span className="lp-co__opt">(optional)</span>
                <input value={form.delivery_address} onChange={(e) => set('delivery_address')(e.target.value)} autoComplete="street-address" />
              </label>
              <label className="lp-co__fld">County <span className="lp-co__opt">(optional)</span>
                <input value={form.delivery_county} onChange={(e) => set('delivery_county')(e.target.value)} />
              </label>
            </div>
            <label className="lp-co__fld">Notes <span className="lp-co__opt">(optional)</span>
              <textarea value={form.delivery_notes} onChange={(e) => set('delivery_notes')(e.target.value)} />
            </label>
          </section>
          <PaymentMethods />
        </div>

        <aside className="lp-co__card lp-co__sum" aria-label="Order summary">
          <h2>Your cart</h2>
          <ul className="lp-co__lines">
            {items.map((i) => (
              <li key={i.variant_id} className="lp-co__line">
                <span className="lp-co__thumb" style={i.image_url ? { backgroundImage: `url(${i.image_url})` } : undefined} aria-hidden="true" />
                <span className="lp-co__name">{i.product_name}
                  <small>{i.variant_label && i.variant_label !== 'Default' ? `${i.variant_label} · ` : ''}{kes(i.unit_price)}</small>
                </span>
                <span className="lp-co__qty">
                  <button type="button" aria-label="Fewer" onClick={() => updateQuantity(i.variant_id, i.quantity - 1)}>−</button>
                  <span>{i.quantity}</span>
                  <button type="button" aria-label="More" onClick={() => updateQuantity(i.variant_id, i.quantity + 1)}>+</button>
                </span>
                <button type="button" className="lp-co__rm" onClick={() => removeItem(i.variant_id)}>Remove</button>
              </li>
            ))}
          </ul>
          <div className="lp-co__row big"><span>Total</span><b>{kes(total)}</b></div>
          <p className="lp-co__hint">Delivery cost is confirmed in the WhatsApp chat.</p>
          {error && <p className="lp-co__err" role="alert">{error}</p>}
          <button className="lp-co__btn lp-co__btn--wa" type="submit" disabled={loading}>
            {loading ? 'Saving your order…' : 'Place order and open WhatsApp'}
          </button>
        </aside>
      </form>
    );
  }

  return (
    <>
      <GlobalHeader />
      <main id="main" className="lp-co">
        <div className="lp-co__top">
          <div className="lp-co__top-in">
            <h1>Checkout</h1>
            <Link className="lp-co__back" href="/shop">← Keep shopping</Link>
          </div>
        </div>
        {body}
      </main>
      <GlobalFooter />
    </>
  );
}
