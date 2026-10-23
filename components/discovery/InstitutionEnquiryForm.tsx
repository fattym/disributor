"use client";

import { useState } from "react";
import { submitInstitutionEnquiry } from "@/lib/discoveryApi";

interface EnquiryFormProps {
  categories: string[];
  productIds?: number[];
}

export default function InstitutionEnquiryForm({ categories, productIds = [] }: EnquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      institution_name: formData.get("institution_name") as string,
      institution_type: formData.get("institution_type") as string,
      message: formData.get("message") as string,
      product_ids: productIds,
    };

    try {
      await submitInstitutionEnquiry(payload);
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:bg-green-900/20">
        <div className="mb-2 text-3xl">✓</div>
        <h3 className="font-bold text-green-800 dark:text-green-200">Enquiry sent!</h3>
        <p className="mt-1 text-sm text-green-700 dark:text-green-300">
          Thank you for your enquiry. We&apos;ll be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Name *</label>
          <input
            type="text"
            name="name"
            required
            className="mt-1 block w-full rounded-lg border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email *</label>
          <input
            type="email"
            name="email"
            required
            className="mt-1 block w-full rounded-lg border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input
            type="tel"
            name="phone"
            className="mt-1 block w-full rounded-lg border px-3 py-2"
            placeholder="+254 7XX XXX XXX"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Institution Name *</label>
          <input
            type="text"
            name="institution_name"
            required
            className="mt-1 block w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Institution Type *</label>
        <select
          name="institution_type"
          defaultValue="primary"
          required
          className="mt-1 block w-full rounded-lg border px-3 py-2"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Message</label>
        <textarea
          name="message"
          rows={3}
          placeholder="Tell us about your requirements, preferred products, and estimated quantity..."
          className="mt-1 block w-full rounded-lg border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-navy px-5 py-3 font-medium text-white transition hover:bg-navy/90 disabled:opacity-50"
      >
        {isSubmitting ? "Sending..." : "Submit enquiry"}
      </button>
    </form>
  );
}
