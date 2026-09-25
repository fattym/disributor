"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import "./upload-list.css";

export default function UploadMyListPage() {
  const [fileName, setFileName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.files?.[0]?.name || "");
    setSubmitted(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
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
            />
            {fileName && <p className="selected-file">Selected: {fileName}</p>}

            <button className="btn" type="submit">
              Send my list
            </button>
            {submitted && (
              <p className="upload-confirmation" role="status">
                Your file is selected. Email it to info@theschoolbox.co.ke so
                our team can review it and contact you.
              </p>
            )}
          </form>
        </div>
      </main>
      <GlobalFooter />
    </>
  );
}
