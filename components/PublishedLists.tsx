"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Booklist } from "@/lib/api";
import { getPublishedLists } from "@/lib/booklistSchools";

/** The chosen school's published lists, for /find-my-school-list/?school=<id> (the home page's school picker). */
export default function PublishedLists() {
  const [lists, setLists] = useState<Booklist[] | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    const school = Number(new URLSearchParams(window.location.search).get("school"));
    if (!Number.isInteger(school) || school <= 0) return;
    let cancelled = false;
    Promise.resolve()
      .then(() => { setState("loading"); return getPublishedLists({ school }); })
      .then((all) => {
        if (cancelled) return;
        setLists(all.filter((l) => l.school === school && l.status === "published"));
        setState("done");
      })
      .catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, []);

  if (state === "idle") return null;
  return (
    <section className="published-lists" aria-live="polite">
      {state === "loading" && <p>Loading the school list…</p>}
      {state === "error" && <p role="alert">The school list did not load. Reload the page to try again.</p>}
      {state === "done" && lists?.length === 0 && <p>This school has no published list yet.</p>}
      {lists?.map((list) => (
        <article key={list.id}>
          <h2>{list.school_name}</h2>
          <p>{list.grade_name}: {list.name} ({list.year_name})</p>
          <ul>
            {list.items.map((item) => (
              <li key={item.id}>
                {item.required_quantity} × <Link href={`/shop/${item.product_id}/`}>{item.product_name}</Link>
                , KSh {Number(item.effective_price).toLocaleString("en-KE")}{item.status !== "required" && ` (${item.status === "optional" ? "optional" : "provided by school"})`}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
