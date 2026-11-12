'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart';
import { storefrontApi } from '@/lib/storefrontApi';
import { useSupermarketStore } from '@/lib/store/supermarketStore';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const DELIVERY_FEE = 150;

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const { setTrolleyOpen } = useSupermarketStore();
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [grades, setGrades] = useState<{ id: number; name: string }[]>([]);
  const [step, setStep] = useState<'form' | 'payment' | 'confirm'>('form');
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'collection'>('delivery');
  const [phone, setPhone] = useState('');
  const [mpesaStatus, setMpesaStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);

  useEffect(() => {
    storefrontApi.getSchools().then((list) => setSchools(list)).catch(() => setSchools([]));
    storefrontApi.getGrades().then((list) => setGrades(list)).catch(() => setGrades([]));
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const deliveryFee = deliveryOption === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const handleCreateOrder = async () => {
    setMpesaStatus('pending');
    setMpesaMessage('Creating demo order…');
    try {
      const res = await storefrontApi.createOrder({
        items: items.map((i) => ({ variant: i.variant_id, product: i.product_id, quantity: i.quantity })),
      });
      const order = res as { id?: number; order_id?: number } | null;
      const id = order?.id ?? order?.order_id ?? null;
      setOrderId(id ? Number(id) : null);
      setStep('payment');
      setMpesaMessage('Order created. Ready for M-Pesa payment (demo).');
    } catch (e) {
      setMpesaStatus('failed');
      setMpesaMessage('Demo order creation failed: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handlePayMpesa = async () => {
    if (!orderId) return;
    setMpesaStatus('pending');
    setMpesaMessage('Sending M-Pesa STK push to ' + phone || '07XXXXXXXX' + ' (demo)…');
    // Simulate a demo payment delay without hitting real M-Pesa
    await new Promise((r) => setTimeout(r, 1800));
    setMpesaStatus('success');
    setMpesaMessage('Demo payment succeeded. This is a simulation — no real money was charged.');
    setStep('confirm');
  };

  const handleRestart = () => {
    setStep('form');
    setMpesaStatus('idle');
    setMpesaMessage('');
    setOrderId(null);
    setTrolleyOpen(false);
  };

  if (items.length === 0 && step === 'form') {
    return (
      <div className="checkout-page">
        <div className="checkout-wrap">
          <Link href="/supermarket" className="checkout-back">← Back to supermarket</Link>
          <h1>Your trolley is empty</h1>
          <p>Add some items from the aisles before checking out.</p>
          <button className="btn btn--orange" onClick={() => window.location.href = '/supermarket'}>Keep shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <nav className="checkout-steps">
        <span className={`step ${step !== 'form' ? 'done' : ''}`}>1. Details</span>
        <span className={`step ${step === 'payment' ? 'current' : step === 'confirm' ? 'done' : ''}`}>2. Payment</span>
        <span className={`step ${step === 'confirm' ? 'current' : ''}`}>3. Confirmation</span>
      </nav>

      <div className="checkout-wrap">
        <aside className="checkout-order">
          <h2>Order summary</h2>
          <div className="order-items">
            {items.map((item) => (
              <div key={item.variant_id} className="order-item">
                <span className="order-item-name">{item.quantity}× {item.product_name}</span>
                <span className="order-item-price">{formatCurrency(item.unit_price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="order-totals">
            <div className="order-total-row"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="order-total-row"><span>{deliveryOption === 'delivery' ? 'Delivery' : 'Collection'}</span><span>{deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee)}</span></div>
            <div className="order-total-row order-total-row--total"><span>Total (KES)</span><span>{formatCurrency(total)}</span></div>
          </div>
          <p className="demo-note"><strong>Demo mode:</strong> This checkout is a simulation. No real payment is processed.</p>
        </aside>

        <section className="checkout-form">
          {step === 'form' && (
            <>
              <h1>Checkout</h1>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateOrder(); }} className="form-grid">
                <div className="form-field">
                  <label>Parent full name</label>
                  <input type="text" required placeholder="e.g. Jane Wanjiku" />
                </div>
                <div className="form-field">
                  <label>Phone number</label>
                  <input type="tel" required placeholder="07XXXXXXXX" />
                </div>
                <div className="form-field">
                  <label>Email address</label>
                  <input type="email" required placeholder="jane@example.com" />
                </div>
                <div className="form-field full">
                  <label>Child’s school</label>
                  <select required>
                    <option value="">— Select school —</option>
                    {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-field full">
                  <label>Grade / class</label>
                  <select required>
                    <option value="">— Select grade —</option>
                    {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="form-field full">
                  <label>How would you like to receive your order?</label>
                  <div className="field-radio">
                    <label><input type="radio" name="delivery" defaultChecked={deliveryOption === 'delivery'} onChange={() => setDeliveryOption('delivery')} /> Delivery <span style={{ color: '#64748b', fontSize: '0.85rem' }}>(+{formatCurrency(DELIVERY_FEE)})</span></label>
                    <label><input type="radio" name="delivery" onChange={() => setDeliveryOption('collection')} /> Collection from store</label>
                  </div>
                </div>
                {deliveryOption === 'delivery' && (
                  <>
                    <div className="form-field full">
                      <label>Delivery address</label>
                      <input type="text" required placeholder="Estate, road, house number, Nairobi" />
                    </div>
                    <div className="form-field full">
                      <label>County</label>
                      <input type="text" required placeholder="e.g. Nairobi" />
                    </div>
                  </>
                )}
                <button type="submit" className="btn btn--orange btn--full">Continue to payment</button>
              </form>
              {mpesaStatus === 'failed' && <p className="error">{mpesaMessage}</p>}
            </>
          )}

          {step === 'payment' && (
            <>
              <h1>Pay with M-Pesa</h1>
              <p className="payment-hint">Enter the phone number registered with M-Pesa. A demo STK push will be sent.</p>
              <div className="form-field">
                <label>Phone number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="07XXXXXXXX" />
              </div>
              <div className="demo-banner"><strong>Demo:</strong> This simulates M-Pesa integration. No real transaction occurs.</div>
              <button className="btn btn--orange btn--full" onClick={handlePayMpesa} disabled={mpesaStatus === 'pending' || !phone}>
                {mpesaStatus === 'pending' ? 'Sending STK push…' : 'Send M-Pesa payment (demo)'}
              </button>
              <p className="payment-note">In production, this integrates M-Pesa through a secure backend with verified payment callbacks.</p>
              {mpesaStatus === 'failed' && <p className="error">{mpesaMessage}</p>}
            </>
          )}

          {step === 'confirm' && (
            <>
              <div className="confirm-card">
                <div className="confirm-icon">✅</div>
                <h1>Order received</h1>
                <p>Thank you for shopping at Learning Pack Supermarket.</p>
                {orderId && <p className="confirm-id">Order reference: <strong>{`LP-${orderId}`}</strong></p>}
                <p className="confirm-total">Total paid: <strong>{formatCurrency(total)}</strong></p>
                <p className="demo-note"><strong>Demo mode:</strong> Order confirmation is simulated. No real payment was collected.</p>
              </div>
              <div className="confirm-actions">
                <button className="btn btn--outline" onClick={() => { clearCart(); handleRestart(); }}>Start a new order</button>
                <Link href="/supermarket" className="btn btn--outline btn--full" style={{ marginTop: '0.5rem' }}>Return to supermarket</Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
