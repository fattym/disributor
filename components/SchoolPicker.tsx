"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublishedLists, schoolsWithLists } from "@/lib/booklistSchools";

/** Only schools with a published list can be picked. With none (or if they cannot be loaded), offer the upload instead. */
export default function SchoolPicker() {
  const [schools, setSchools] = useState<{ id: number; name: string }[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [chosen, setChosen] = useState("");

  useEffect(() => {
    let cancelled = false;
    getPublishedLists()
      .then((lists) => {
        if (cancelled) return;
        setSchools(schoolsWithLists(lists));
        setChosen(new URLSearchParams(window.location.search).get("school") ?? "");
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  if (!failed && schools === null) {
    return <div className="school-list-card" aria-live="polite"><p>Loading schools…</p></div>;
  }
  if (!schools?.length) {
    return (
      <div className="school-list-card" aria-live="polite">
        <p>
          {failed
            ? "School lists did not load. Reload the page, or upload your list."
            : "No school has published a list here yet. Upload the one you have."}
        </p>
        <Link className="btn" href="/upload-my-list/" style={{ marginTop: "1rem" }}>Upload my list</Link>
      </div>
    );
  }
  return (
    <div className="school-list-card">
      <form action="/find-my-school-list/" method="get">
        <label htmlFor="school">School</label>
        <select id="school" name="school" required value={chosen} onChange={(e) => setChosen(e.target.value)}>
          <option value="" disabled>Select your school</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="btn" type="submit">Show my list</button>
      </form>
    </div>
  );
}
