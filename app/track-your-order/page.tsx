"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import { shopApi, type TrackedOrder } from "@/lib/api";
import "./track-order.css";

// Tracking needs the order number AND the phone it was placed with: numbers are sequential, so a number alone shows nothing.
function TrackYourOrderContent() {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ref = String(form.get("trackingRef") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    setError("");
    setOrder(null);
    if (!ref || !phone) {
      setError("Enter your order number and the phone number you ordered with.");
      return;
    }
    setLoading(true);
    try {
      setOrder(await shopApi.trackOrder(ref, phone));
    } catch (e) {
      const res = (e as { response?: { status?: number; data?: { detail?: string } } }).response;
      setError(res?.data?.detail || "We could not look up your order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalHeader />
      <main className="track-page" id="main">
        <div className="track-shell">
          <div className="track-copy">
            <p className="crumbs">
              <Link href="/">Home</Link> / Track your order
            </p>
            <p className="track-kicker">Order updates</p>
            <h1>Track your order</h1>
            <p>Enter your order number (like LP-2026-000123) and the phone number you ordered with.</p>
          </div>

          <div className="track-card">
            <form onSubmit={handleSubmit}>
              <label htmlFor="trackingRef">Order number</label>
              <input id="trackingRef" name="trackingRef" type="text" placeholder="LP-2026-000123" autoCapitalize="characters" required />

              <label htmlFor="phone">Phone number</label>
              <input id="phone" name="phone" type="tel" inputMode="tel" placeholder="07XX XXX XXX" autoComplete="tel" required />

              <button className="btn" type="submit" disabled={loading}>
                {loading ? "Checking..." : "Track order"}
              </button>
            </form>

            {error && (
              <p className="track-error" role="alert">
                {error}
              </p>
            )}
            {order && (
              <div className="track-result" role="status">
                <h2>{order.tracking_ref}</h2>
                <p className="track-status">{order.status}</p>
                <p>
                  Placed {new Date(order.placed_at).toLocaleDateString("en-KE")} · KSh {Number(order.total_amount).toLocaleString("en-KE")}
                  {order.payment.method ? ` · ${order.payment.method}${order.payment.received ? " (payment received)" : " (payment not yet confirmed)"}` : ""}
                </p>
                {order.fulfilments.map((f) => (
                  <div key={f.tracking_ref || f.seller} className="track-part">
                    <h3>
                      {f.seller}
                      {f.tracking_ref ? ` · ${f.tracking_ref}` : ""}
                    </h3>
                    <p className="track-status">{f.status}</p>
                    <ul>
                      {f.lines.map((l, i) => (
                        <li key={i}>
                          {l.name} × {l.quantity}
                        </li>
                      ))}
                    </ul>
                    {f.carrier && (
                      <p>
                        Carrier: {f.carrier}
                        {f.carrier_reference ? ` · reference ${f.carrier_reference}` : ""}
                      </p>
                    )}
                    <ol className="track-history">
                      {f.history.map((h, i) => (
                        <li key={i}>
                          {h.status} · {new Date(h.at).toLocaleString("en-KE")}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <GlobalFooter />
    </>
  );
}

export default function TrackYourOrderPage() {
  return (
    <Suspense fallback={null}>
      <TrackYourOrderContent />
    </Suspense>
  );
}
