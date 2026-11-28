'use client';

import { DELIVERY_NOTE, WHATSAPP_NUMBERS, withDeliveryLine } from '@/lib/shopText';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { shopApi, type WhatsAppCheckoutResult } from '@/lib/api';
import { storefrontApi } from '@/lib/storefrontApi';
import { useCart } from '@/lib/cart';
import { LOGO_SVG } from '@/components/logo';
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
      <h2>How you&apos;ll pay</h2>
      <label className="lp-co__pay on">
        <input type="radio" name="pay" defaultChecked />
        <span>
          <b>Pay with M-Pesa after we confirm your order on WhatsApp</b>
          <small>We save your order and open WhatsApp with the details. Our team replies with the M-Pesa payment details and confirms delivery.</small>
        </span>
      </label>
      <button type="button" className="lp-co__pay off" disabled aria-disabled="true">
        <b>M-Pesa on this page</b>
        <span className="lp-co__soon">Coming soon</span>
      </button>
    </section>
  );
}

const WA_ICON = 'M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z';

/** Group lines by who sells and packs them, keeping the order they were added in. */
function groupBySeller<T extends { seller_name?: string | null }>(lines: T[]): { seller: string; lines: T[] }[] {
  const groups: { seller: string; lines: T[] }[] = [];
  for (const line of lines) {
    const seller = line.seller_name || 'Learning Pack';
    const g = groups.find((x) => x.seller === seller);
    if (g) g.lines.push(line); else groups.push({ seller, lines: [line] });
  }
  return groups;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({
    delivery_name: '', delivery_phone: '', delivery_notes: '', parent_school: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<(WhatsAppCheckoutResult & { total: number }) | null>(null);

  useEffect(() => {
    storefrontApi.getSchools().then((list) => setSchools(list)).catch(() => setSchools([]));
  }, []);

  const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const count = items.reduce((n, i) => n + i.quantity, 0);
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
        delivery_address: '',
        delivery_county: '',
        delivery_notes: form.delivery_notes.trim(),
        parent_school: form.parent_school ? Number(form.parent_school) : null,
        items: items.map((i) => (i.variant_id > 0
          ? { variant: i.variant_id, quantity: i.quantity }
          : { product: i.product_id, quantity: i.quantity })),
      });
      // The order is saved. Only now is the cart emptied and WhatsApp opened.
      result.whatsapp_url = withDeliveryLine(result.whatsapp_url);
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

  const placeButton = (
    <button className="lp-co__btn lp-co__btn--go" type="submit" disabled={loading}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={WA_ICON} /></svg>
      {loading ? 'Saving your order…' : 'Place order on WhatsApp'}
    </button>
  );

  let body;
  if (done) {
    body = (
      <div className="lp-co__done" role="status">
        <div className="lp-co__ok" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
        </div>
        <h1>Order saved. Now press send on WhatsApp.</h1>
        <p className="lp-co__lead">WhatsApp should have opened with your order. <strong>Press send</strong> so our team can reply with the M-Pesa payment details.</p>
        <div className="lp-co__track">
          <span>Your tracking number</span>
          <b>{done.tracking_ref}</b>
          <span>Keep it with your phone number to follow your order.</span>
        </div>
        <div className="lp-co__acts">
          <a className="lp-co__btn lp-co__btn--go" href={done.whatsapp_url} target="_blank" rel="noopener noreferrer">Open WhatsApp again</a>
          <Link className="lp-co__btn lp-co__btn--ghost" href="/track-your-order">Track this order</Link>
        </div>
      </div>
    );
  } else if (items.length === 0) {
    body = (
      <div className="lp-co__empty">
        <h1>Your trolley is empty</h1>
        <p className="lp-co__hint">Add something from the shop to check out.</p>
        <Link className="lp-co__btn lp-co__btn--go" href="/shop">Browse the shop</Link>
      </div>
    );
  } else {
    body = (
      <form className="lp-co__grid" onSubmit={submit} noValidate>
        <div className="lp-co__main">
          <h1 className="lp-co__h1">Your trolley <small>{count} {count === 1 ? 'item' : 'items'}</small></h1>

          {groupBySeller(items).map((g) => (
            <section key={g.seller} className="lp-co__card lp-co__group" aria-label={`Sold and packed by ${g.seller}`}>
              <div className="lp-co__seller">
                <span>Sold and packed by <strong>{g.seller}</strong></span>
                <span className="lp-co__n">{g.lines.length} {g.lines.length === 1 ? 'item' : 'items'}</span>
              </div>
              <ul className="lp-co__lines">
                {g.lines.map((i) => {
                  const backorder = i.stock_quantity <= 0 || i.quantity > i.stock_quantity;
                  return (
                    <li key={i.variant_id} className="lp-co__line">
                      <span className="lp-co__thumb" style={i.image_url ? { backgroundImage: `url(${i.image_url})` } : undefined} aria-hidden="true">
                        {!i.image_url && <span className="lp-co__nophoto">No photo yet</span>}
                      </span>
                      <span className="lp-co__name">
                        <b>{i.product_name}</b>
                        <small>{i.variant_label && i.variant_label !== 'Default' ? `${i.variant_label} · ` : ''}{kes(i.unit_price)} each</small>
                        <span className={'lp-co__stock' + (backorder ? ' back' : '')}>{backorder ? 'We confirm the delivery date on WhatsApp.' : 'In stock'}</span>
                      </span>
                      <span className="lp-co__qty">
                        <button type="button" aria-label={`One fewer ${i.product_name}`} onClick={() => updateQuantity(i.variant_id, i.quantity - 1)}>−</button>
                        <span aria-live="polite">{i.quantity}</span>
                        <button type="button" aria-label={`One more ${i.product_name}`} onClick={() => updateQuantity(i.variant_id, i.quantity + 1)}>+</button>
                      </span>
                      <span className="lp-co__tot">
                        <b>{kes(i.unit_price * i.quantity)}</b>
                        <button type="button" className="lp-co__rm" onClick={() => removeItem(i.variant_id)}>Remove<span className="lp-co__sr"> {i.product_name}</span></button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <section className="lp-co__card">
            <h2>Your details</h2>
            <p className="lp-co__hint">No account needed. We only use these to reach you about this order.</p>
            <div className="lp-co__two">
              <label className={'lp-co__fld' + (fieldErrors.delivery_name ? ' bad' : '')}>Your name
                <input value={form.delivery_name} onChange={(e) => set('delivery_name')(e.target.value)} autoComplete="name" required />
                {fieldErrors.delivery_name && <em>{fieldErrors.delivery_name}</em>}
              </label>
              <label className={'lp-co__fld' + (fieldErrors.delivery_phone ? ' bad' : '')}>Phone number (M-Pesa / WhatsApp)
                <input type="tel" inputMode="tel" placeholder="07XX XXX XXX" value={form.delivery_phone}
                  onChange={(e) => set('delivery_phone')(e.target.value)} autoComplete="tel" required />
                {fieldErrors.delivery_phone && <em>{fieldErrors.delivery_phone}</em>}
              </label>
              <label className="lp-co__fld">Your child&apos;s school <span className="lp-co__opt">(optional, we deliver to the school)</span>
                <select value={form.parent_school} onChange={(e) => set('parent_school')(e.target.value)}>
                  <option value="">Choose a school…</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {fieldErrors.parent_school && <em>{fieldErrors.parent_school}</em>}
              </label>
              <label className="lp-co__fld">Delivery note <span className="lp-co__opt">(optional)</span>
                <input placeholder="e.g. Grade 4 East, or a home address" value={form.delivery_notes} onChange={(e) => set('delivery_notes')(e.target.value)} />
              </label>
            </div>
          </section>

          <PaymentMethods />
          <p className="lp-co__trust-m">{DELIVERY_NOTE}</p>
          <p className="lp-co__trust-m">Your order gets a tracking number before WhatsApp opens, and we hold your items for 48 hours while you pay.</p>
        </div>

        <aside className="lp-co__card lp-co__sum" aria-label="Order summary">
          <h2>Order summary</h2>
          <div className="lp-co__row"><span>Items ({count})</span><span>{kes(total)}</span></div>
          <div className="lp-co__row"><span>Delivery</span><span>Confirmed on WhatsApp</span></div>
          <p className="lp-co__hint">{DELIVERY_NOTE}</p>
          <hr />
          <div className="lp-co__row big"><span>Total</span><b>{kes(total)}</b></div>
          {error && <p className="lp-co__err" role="alert">{error}</p>}
          {placeButton}
          <ul className="lp-co__trust">
            <li><span aria-hidden="true">✓</span><p>Your order is saved with a tracking number before WhatsApp opens.</p></li>
            <li><span aria-hidden="true">✓</span><p>We hold your items for 48 hours while you pay.</p></li>
            <li><span aria-hidden="true">✓</span><p>Questions? WhatsApp {WHATSAPP_NUMBERS.map((n, i) => <span key={n.e164}>{i > 0 && ' or '}<a href={n.href} target="_blank" rel="noopener noreferrer">{n.label}</a></span>)}.</p></li>
          </ul>
        </aside>

        <div className="lp-co__bar">
          <div className="lp-co__row"><span>Total · delivery confirmed on WhatsApp</span><b>{kes(total)}</b></div>
          {error && <p className="lp-co__err" role="alert">{error}</p>}
          {placeButton}
        </div>
      </form>
    );
  }

  return (
    <main id="main" className="lp-co">
      <header className="lp-co__top">
        <div className="lp-co__top-in">
          <Link className="lp-co__logo" href="/" aria-label="Learning Pack home"><span dangerouslySetInnerHTML={{ __html: LOGO_SVG }} /></Link>
          <nav className="lp-co__steps" aria-label="Checkout steps">
            <b>1 Trolley</b><span aria-hidden="true">›</span><b>2 Your details</b><span aria-hidden="true">›</span>
            <span className={done ? 'on' : ''}>3 Confirm on WhatsApp</span>
          </nav>
          <Link className="lp-co__more" href="/shop">Continue shopping</Link>
        </div>
      </header>
      {body}
    </main>
  );
}
