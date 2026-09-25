"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import "./contact.css";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = `Learning Pack enquiry from ${data.get("name")}`;
    const body = [
      `Name: ${data.get("name")}`,
      `Email: ${data.get("email")}`,
      `Phone: ${data.get("phone") || "Not provided"}`,
      "",
      String(data.get("message")),
    ].join("\n");

    setSent(true);
    window.location.href = `mailto:info@theschoolbox.co.ke?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
              <a href="mailto:info@theschoolbox.co.ke">
                info@theschoolbox.co.ke
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

            <button className="btn" type="submit">
              Send message
            </button>
            {sent && (
              <p className="contact-confirmation" role="status">
                Your email app should open with your message ready to send.
              </p>
            )}
          </form>
        </div>
      </main>
      <GlobalFooter />
    </>
  );
}
