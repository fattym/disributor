"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import { shopApi } from "@/lib/api";
import "./contact.css";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const data = new FormData(event.currentTarget);
    const formData = {
      name: String(data.get("name")),
      email: String(data.get("email")),
      phone: String(data.get("phone") || ""),
      message: String(data.get("message")),
    };

    try {
      await shopApi.submitForm({ form_type: "contact", data: formData });
      setSent(true);
    } catch (err) {
      setError("Failed to send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalHeader />
      <main className="contact-page" id="main">
        <div className="contact-shell">
          <div className="contact-copy">
            <p className="crumbs">
              <Link href="/">Home</Link> / Contact us
            </p>
            <p className="contact-kicker">We&apos;re here to help</p>
            <h1>Contact Learning Pack</h1>
            <p>
              Need help finding a school list, choosing a pack, or tracking an
              order? Send us a message and our team will get back to you.
            </p>
            <div className="contact-details">
              <a href="mailto:admin@codingclubs.co.ke">
                admin@codingclubs.co.ke
              </a>
              <a href="tel:0798734442">0798 734 442</a>
              <a href="tel:0716815025">0716 815 025</a>
              <span>Mon–Fri, 8am to 6pm</span>
            </div>
          </div>

          <form className="contact-card" onSubmit={handleSubmit}>
            <label htmlFor="contact-name">Your name</label>
            <input id="contact-name" name="name" type="text" required />

            <label htmlFor="contact-email">Email address</label>
            <input id="contact-email" name="email" type="email" required />

            <label htmlFor="contact-phone">
              Phone number <span>(optional)</span>
            </label>
            <input id="contact-phone" name="phone" type="tel" />

            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              name="message"
              rows={6}
              required
              placeholder="How can we help?"
            />

            {error && <p className="contact-error" role="alert">{error}</p>}
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send message"}
            </button>
            {sent && (
              <p className="contact-confirmation" role="status">
                Your message has been sent. We&apos;ll get back to you soon.
              </p>
            )}
          </form>
        </div>
      </main>
      <GlobalFooter />
    </>
  );
}
