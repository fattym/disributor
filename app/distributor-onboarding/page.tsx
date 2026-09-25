"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import { shopApi } from "@/lib/api";
import "./onboarding.css";

export default function DistributorOnboardingPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const formData = {
      contactName: String(form.get("contactName")),
      businessName: String(form.get("businessName")),
      email: String(form.get("email")),
      phone: String(form.get("phone")),
      location: String(form.get("location")),
      products: String(form.get("products")),
      message: String(form.get("message") || ""),
    };

    try {
      await shopApi.submitForm({ form_type: "onboarding", data: formData });
      setSubmitted(true);
    } catch (err) {
      setError("Failed to submit your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalHeader />
      <main className="onboarding-page" id="main">
        <div className="onboarding-shell">
          <div className="onboarding-copy">
            <p className="crumbs">
              <Link href="/login">Log in</Link> / Distributor onboarding
            </p>
            <p className="onboarding-kicker">Partner with Learning Pack</p>
            <h1>Get onboarded as a distributor</h1>
            <p>
              Tell us about your business and the products you supply. Our team
              will review your details and get back to you about the next steps.
            </p>
          </div>

          <form className="onboarding-form" onSubmit={handleSubmit}>
            <div className="onboarding-fields">
              <label>
                Contact name
                <input name="contactName" type="text" required />
              </label>
              <label>
                Business name
                <input name="businessName" type="text" required />
              </label>
              <label>
                Email address
                <input name="email" type="email" required />
              </label>
              <label>
                Phone number
                <input name="phone" type="tel" required />
              </label>
              <label>
                Location
                <input
                  name="location"
                  type="text"
                  placeholder="City or town"
                  required
                />
              </label>
              <label>
                Products supplied
                <input
                  name="products"
                  type="text"
                  placeholder="Stationery, books, electronics..."
                  required
                />
              </label>
            </div>
            <label>
              Tell us more <span>(optional)</span>
              <textarea
                name="message"
                rows={4}
                placeholder="Anything we should know about your business?"
              />
            </label>
            {error && <p className="onboarding-error" role="alert">{error}</p>}
            <button className="onboarding-submit" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send onboarding request"}
            </button>
            {submitted && (
              <p className="onboarding-confirmation">
                Your onboarding request has been received. Our team will review
                your details and contact you within 2 business days.
              </p>
            )}
          </form>
        </div>
      </main>
      <GlobalFooter />
    </>
  );
}
