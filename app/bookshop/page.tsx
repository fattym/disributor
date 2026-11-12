'use client';

import dynamic from "next/dynamic";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import "./bookshop.css";

const Bookshop3D = dynamic(
  () =>
    import("@/components/learning-pack-3d/src/App.jsx").then(
      (m) => m.default || m
    ),
  {
    ssr: false,
    loading: () => (
      <div className="bookshop-loading">
        <div className="spinner" />
        <p>Initializing 3D bookshop…</p>
      </div>
    ),
  }
);

export default function BookshopPage() {
  return (
    <>
      <GlobalHeader />
      <main id="main" className="bookshop-page">
        <div className="bookshop-viewport">
          <Bookshop3D />
        </div>
      </main>
      <GlobalFooter />
    </>
  );
}
