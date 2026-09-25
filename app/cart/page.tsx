'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import { shopApi, ShopProduct } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';

interface Learner {
  id: number;
  learner: number;
  relationship: string;
}

function errorDetail(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data?.detail) {
    return String(error.response.data.detail);
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart();
  const router = useRouter();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<number | ''>('');
  const phoneRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'cart' | 'delivery' | 'checkout' | 'payment' | 'success'>('cart');
  const [order, setOrder] = useState<{ id: number; total_amount: string; status: string } | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [guestMode, setGuestMode] = useState(false);
  const [delivery, setDelivery] = useState({
    delivery_name: '',
    delivery_phone: '',
    delivery_address: '',
    delivery_county: '',
    delivery_notes: '',
  });

  useEffect(() => {
    if (!user) return;
    shopApi.getLearners().then((data) => {
      const list = Array.isArray(data) ? data : (data.results || []);
      setLearners(list);
    }).catch(() => setLearners([]));
  }, [user]);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!user) {
      if (!guestMode) {
        router.push('/login');
        return;
      }
      setStep('delivery');
      return;
    }
    if (!selectedLearner) {
      setMessage('Please select a learner for this order.');
      return;
    }
    setMessage('');
    setLoading(true);
    try {
      const payload = {
        learner: Number(selectedLearner),
        items: items.map((i) =>
          i.variant_id > 0
            ? { variant: i.variant_id, quantity: i.quantity }
            : { product: i.product_id, quantity: i.quantity },
        ),
      };
      const data = await shopApi.createOrder(payload);
      setOrder(data);
      setStep('checkout');
    } catch (error) {
      setMessage(errorDetail(error, 'Failed to create order.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestOrder = async () => {
    if (
      !delivery.delivery_name ||
      !delivery.delivery_phone ||
      !delivery.delivery_address ||
      !delivery.delivery_county
    ) {
      setMessage('Please fill in all required delivery fields.');
      return;
    }
    setMessage('');
    setLoading(true);
    try {
      const payload = {
        ...delivery,
        items: items.map((i) =>
          i.variant_id > 0
            ? { variant: i.variant_id, quantity: i.quantity }
            : { product: i.product_id, quantity: i.quantity },
        ),
      };
      const data = await shopApi.createGuestOrder(payload);
      setOrder(data);
      setStep('checkout');
      setMessage('Order placed. Enter your M-Pesa number below to receive an STK push.');
    } catch (error) {
      setMessage(errorDetail(error, 'Failed to create order.'));
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!order) return;
    const phone = phoneRef.current?.value || delivery.delivery_phone || user?.phone || '';
    if (!phone) {
      setMessage('A phone number is required to pay via M-Pesa.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response: any = guestMode
        ? await shopApi.payGuestMpesa(order.id, phone)
        : await shopApi.payMpesa(order.id, phone);
      setStep('payment');
      setMessage('STK push sent. Check your phone to complete the payment.');
      setCheckoutRequestId(response?.checkout_request_id);
    } catch (error) {
      setMessage(errorDetail(error, 'Failed to initiate payment.'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!order) return;
    setLoading(true);
    setMessage('');
    try {
      const data = guestMode
        ? await shopApi.confirmGuestPayment(order.id, {
            checkout_request_id: checkoutRequestId || undefined,
            force: !checkoutRequestId,
          })
        : await shopApi.confirmPayment(order.id);
      setOrder({ ...order, status: data.order_status });
      setStep('success');
      clearCart();
      setMessage('Payment confirmed. The commission has been credited to the distributor.');
    } catch (error) {
      setMessage(errorDetail(error, 'Failed to confirm payment.'));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div>
        <GlobalHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">Loading...</p>
        </main>
      </div>
    );
  }

  const total = getTotal();

  return (
    <div>
      <GlobalHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Your Cart</h1>

        {message && (
          <div className="mb-4 p-3 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm">
            {message}
          </div>
        )}

        {step === 'success' && (
          <div className="mb-6 p-4 rounded-md bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300">
            <h2 className="font-bold">Order placed!</h2>
            <p className="mt-1">Order #{order?.id} — Status: {order?.status}</p>
            <p className="mt-1">
              The payment goes to the Coding Clubs Kenya main account; the commission balance
              has been reflected on the distributor who supplied the items.
            </p>
            <Link href="/shop" className="underline">Continue shopping</Link>
          </div>
        )}

        {step === 'cart' && (
          <>
            {items.length === 0 ? (
              <p className="text-zinc-500">
                Your cart is empty. <Link href="/shop" className="underline">Browse products</Link>.
              </p>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.variant_id} className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.product_name}</p>
                      <p className="text-sm text-zinc-500">{item.variant_label}</p>
                    </div>
                    <div className="w-20 text-right">
                      <input
                        type="number"
                        min={1}
                        max={item.stock_quantity}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.variant_id, Number(e.target.value))}
                        className="w-16 text-center px-1 py-0.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                      <p className="text-xs text-zinc-500 mt-1">KSh {(item.unit_price * item.quantity).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.variant_id)}
                      className="text-red-600 dark:text-red-400 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-700 dark:text-zinc-300">Total</span>
                  <span className="text-2xl font-bold text-[#0B1F3A] dark:text-[#E63B00]">
                    KSh {total.toLocaleString()}
                  </span>
                </div>

                {!user ? (
                  <div className="pt-2 space-y-3">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Sign in to complete your purchase, or continue as a guest.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push('/login')}
                        className="flex-1 px-5 py-2.5 bg-[#0B1F3A] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md font-medium hover:bg-[#E63B00] dark:hover:bg-[#E63B00]/90 transition-colors"
                      >
                        Sign in
                      </button>
                      <button
                        onClick={() => {
                          setGuestMode(true);
                          setStep('delivery');
                        }}
                        className="flex-1 px-5 py-2.5 border border-[#0B1F3A] dark:border-zinc-100 rounded-md text-[#0B1F3A] dark:text-zinc-100 font-medium hover:bg-[#E63B00]/10 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Checkout as guest
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 pt-2">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Deliver to (learner)
                      </label>
                      <select
                        value={selectedLearner}
                        onChange={(e) => setSelectedLearner(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                      >
                        <option value="">Select a learner</option>
                        {learners.map((l) => (
                          <option key={l.id} value={l.learner}>{l.relationship} (#{l.learner})</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleCheckout}
                      disabled={loading || !selectedLearner}
                      className="w-full px-5 py-3 bg-[#0B1F3A] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md font-medium hover:bg-[#E63B00] dark:hover:bg-[#E63B00]/90 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Placing order...' : 'Proceed to pay'}
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}

         {step === 'delivery' && (
           <div className="space-y-4">
             <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
               Delivery details
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                   Full name *
                 </label>
                 <input
                   type="text"
                   value={delivery.delivery_name}
                   onChange={(e) => setDelivery({ ...delivery, delivery_name: e.target.value })}
                   placeholder="Jane Doe"
                   className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                   Phone number *
                 </label>
                 <input
                   type="tel"
                   value={delivery.delivery_phone}
                   onChange={(e) => setDelivery({ ...delivery, delivery_phone: e.target.value })}
                   placeholder="07XX XXX XXX"
                   className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                 />
               </div>
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                   Delivery address *
                 </label>
                 <input
                   type="text"
                   value={delivery.delivery_address}
                   onChange={(e) => setDelivery({ ...delivery, delivery_address: e.target.value })}
                   placeholder="Street, building, landmark"
                   className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                   County *
                 </label>
                 <input
                   type="text"
                   value={delivery.delivery_county}
                   onChange={(e) => setDelivery({ ...delivery, delivery_county: e.target.value })}
                   placeholder="e.g. Nairobi"
                   className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                 />
               </div>
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                   Delivery notes (optional)
                 </label>
                 <input
                   type="text"
                   value={delivery.delivery_notes}
                   onChange={(e) => setDelivery({ ...delivery, delivery_notes: e.target.value })}
                   placeholder="e.g. Gate fees, nearest bus stop"
                   className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                 />
               </div>
             </div>
             <div className="flex gap-3">
               <button
                 onClick={() => setStep('cart')}
                 className="px-5 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
               >
                 Back
               </button>
               <button
                 onClick={handleGuestOrder}
                 disabled={loading}
                 className="px-5 py-2.5 bg-[#0B1F3A] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md font-medium hover:bg-[#E63B00] dark:hover:bg-[#E63B00]/90 transition-colors disabled:opacity-50"
               >
                 {loading ? 'Placing order...' : `Pay KSh ${total.toLocaleString()}`}
               </button>
             </div>
           </div>
         )}

         {step === 'checkout' && order && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Pay for order #{order.id}
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              Total: <span className="font-bold">KSh {parseFloat(order.total_amount).toLocaleString()}</span>
            </p>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                M-Pesa phone number
              </label>
              <input
                type="tel"
                ref={phoneRef}
                defaultValue={guestMode ? delivery.delivery_phone : (user?.phone || '')}
                placeholder="07XX XXX XXX"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePay}
                disabled={loading}
                className="px-5 py-2.5 bg-[#0B1F3A] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md font-medium hover:bg-[#E63B00] dark:hover:bg-[#E63B00]/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Pay with M-Pesa'}
              </button>
              <button
                onClick={() => { clearCart(); setStep('cart'); }}
                className="px-5 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'payment' && order && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Confirm payment — order #{order.id}
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              An M-Pesa STK push has been sent for KSh {parseFloat(order.total_amount).toLocaleString()}.
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Complete the prompt on your phone, then click below (simulates the Daraja callback that
              marks the payment confirmed and credits the distributor&apos;s commission balance).
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-5 py-2.5 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Confirming...' : 'Confirm payment'}
              </button>
              <button
                onClick={() => setStep('checkout')}
                className="px-5 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </main>
      <GlobalFooter />
    </div>
  );
}
