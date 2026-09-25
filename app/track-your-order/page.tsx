"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import { shopApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import "./track-order.css";

type OrderResult = {
  id?: string | number;
  status?: string;
  created_at?: string;
  total_amount?: string;
  delivery_address?: string;
};

export default function TrackYourOrderPage() {
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setOrder(null);
    setSubmitted(false);
    setLoading(true);
    const form = new FormData(event.currentTarget);

    const formData = {
      orderNumber: String(form.get("orderNumber")),
      contactName: String(form.get("contactName") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
    };

    try {
      await shopApi.submitForm({ form_type: "track_order", data: formData });
      setOrderNumber(formData.orderNumber);

      if (user) {
        try {
          const result = await shopApi.getOrder(formData.orderNumber);
          setOrder(result as OrderResult);
        } catch {
          setOrder({ id: formData.orderNumber, status: "not_found" });
        }
      } else {
        setOrder({ id: formData.orderNumber, status: "submitted" });
        setSubmitted(true);
      }
    } catch (err) {
      setError("We could not submit your request. Please try again.");
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

              <label htmlFor="contactName">
                Your name <span>(optional)</span>
              </label>
              <input id="contactName" name="contactName" type="text" />

              <label htmlFor="email">
                Email address <span>(optional)</span>
              </label>
              <input id="email" name="email" type="email" />

              <label htmlFor="phone">
                Phone number <span>(optional)</span>
              </label>
              <input id="phone" name="phone" type="tel" />

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
                {order.status === 'submitted' && (
                  <p className="track-status">
                    Your request has been submitted. We'll email you updates
                    once we find your order (order #{orderNumber}).
                  </p>
                )}
                {order.status !== 'submitted' && order.status !== 'not_found' && (
                  <>
                    <p className="track-status">{order.status || "Status unavailable"}</p>
                    {order.created_at && (
                      <p>
                        Placed{" "}
                        {new Date(order.created_at).toLocaleDateString("en-KE")}
                      </p>
                    )}
                    {order.delivery_address && (
                      <p>Delivering to {order.delivery_address}</p>
                    )}
                  </>
                )}
                {order.status === 'not_found' && (
                  <p className="track-error">
                    We could not find that order. Check the number and try again.
                  </p>
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
