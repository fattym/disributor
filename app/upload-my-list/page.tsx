"use client";

import { ChangeEvent, FormEvent, useState, useRef } from "react";
import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import { shopApi } from "@/lib/api";
import "./upload-list.css";

export default function UploadMyListPage() {
  const [fileName, setFileName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.files?.[0]?.name || "");
    setSubmitted(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const data = new FormData(event.currentTarget);
    const file = fileInputRef.current?.files?.[0] || null;
    const formData = {
      parentName: String(data.get("parentName")),
      email: String(data.get("email")),
      school: String(data.get("school")),
    };

    try {
      await shopApi.submitForm({ form_type: "upload_list", data: formData, file });
      setSubmitted(true);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError("Failed to upload your file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalHeader />
      <main className="upload-page" id="main">
        <div className="upload-shell">
          <div className="upload-copy">
            <p className="crumbs">
              <Link href="/">Home</Link> / Upload my list
            </p>
            <p className="upload-kicker">Have a list already?</p>
            <h1>Upload your school list</h1>
            <p>
              Send us the list from your school and we&apos;ll help you turn it
              into a simple order.
            </p>
            <p className="upload-note">
              Accepted files: PDF, JPG, PNG or DOCX.
            </p>
          </div>

          <form className="upload-card" onSubmit={handleSubmit}>
            <label htmlFor="parentName">Your name</label>
            <input id="parentName" name="parentName" type="text" required />

            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" required />

            <label htmlFor="school">School</label>
            <input id="school" name="school" type="text" required />

            <label className="file-label" htmlFor="schoolList">
              School list file
            </label>
            <input
              id="schoolList"
              name="schoolList"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
              required
              ref={fileInputRef}
            />
            {fileName && <p className="selected-file">Selected: {fileName}</p>}

            {error && <p className="upload-error" role="alert">{error}</p>}
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send my list"}
            </button>
            {submitted && (
              <p className="upload-confirmation" role="status">
                Your file has been uploaded. Our team will review it and
                contact you within 2 business days.
              </p>
            )}
          </form>
        </div>
      </main>
      <GlobalFooter />
    </>
  );
}
