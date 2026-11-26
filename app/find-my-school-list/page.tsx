"use client";

import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import PublishedLists from "@/components/PublishedLists";
import SchoolPicker from "@/components/SchoolPicker";
import "./school-list.css";

export default function FindMySchoolListPage() {
  return (
    <>
      <GlobalHeader />
      <main className="school-list-page" id="main">
        <PublishedLists />
        <div className="school-list-shell">
          <div className="school-list-copy">
            <p className="crumbs">
              <Link href="/">Home</Link> / Find my school list
            </p>
            <p className="school-list-kicker">Start with your school</p>
            <h1>Find your school list</h1>
            <p>
              Pick your child&apos;s school to see its published list, or upload
              the list you have.
            </p>
            <p>
              Already have the list?{" "}
              <Link href="/upload-my-list/" style={{ textDecoration: "underline", fontWeight: 700 }}>Upload my list</Link>
            </p>
            <div className="school-list-points">
              <span>Complete school supplies</span>
              <span>One simple order</span>
              <span>Delivery to your door</span>
            </div>
          </div>

          <SchoolPicker />
        </div>
      </main>
      <GlobalFooter />
    </>
  );
}
