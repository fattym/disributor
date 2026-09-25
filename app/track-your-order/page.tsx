"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import { shopApi } from "@/lib/api";
import "./track-order.css";

type OrderResult = {
  id?: number;
  status?: string;
  created_at?: string;
  total_amount?: string;
  delivery_address?: string;
};

export default function TrackYourOrderPage() {
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      const result = await shopApi.getOrder(String(form.get("orderNumber")));
      setOrder(result as OrderResult);
    } catch {
      setError("We could not find that order. Check the number and try again.");
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
            <p>
              Enter your order number to check its latest status and delivery
              details.
            </p>
          </div>

          <div className="track-card">
            <form onSubmit={handleSubmit}>
              <label htmlFor="orderNumber">Order number</label>
              <input
                id="orderNumber"
                name="orderNumber"
                type="text"
                placeholder="e.g. 1042"
                required
              />
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
                <h2>Order #{order.id}</h2>
                <p className="track-status">
                  {order.status || "Status unavailable"}
                </p>
                {order.created_at && (
                  <p>
                    Placed{" "}
                    {new Date(order.created_at).toLocaleDateString("en-KE")}
                  </p>
                )}
                {order.delivery_address && (
                  <p>Delivering to {order.delivery_address}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <GlobalFooter />
    </>
  );
}
