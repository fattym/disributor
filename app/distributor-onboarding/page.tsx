"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import "./onboarding.css";

export default function DistributorOnboardingPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = "Distributor onboarding request";
    const body = [
      `Contact name: ${form.get("contactName")}`,
      `Business name: ${form.get("businessName")}`,
      `Email: ${form.get("email")}`,
      `Phone: ${form.get("phone")}`,
      `Location: ${form.get("location")}`,
      `Products supplied: ${form.get("products")}`,
      "",
      `Additional information:\n${form.get("message") || "None provided"}`,
    ].join("\n");

    setSubmitted(true);
    window.location.href = `mailto:info@theschoolbox.co.ke?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
            <button className="onboarding-submit" type="submit">
              Send onboarding request
            </button>
            {submitted && (
              <p className="onboarding-confirmation">
                Your email app should open with the request details ready to
                send.
              </p>
            )}
          </form>
        </div>
      </main>
      <GlobalFooter />
    </>
  );
}
