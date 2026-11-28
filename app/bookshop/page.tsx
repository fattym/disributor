'use client';

import dynamic from "next/dynamic";
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
        <p>Opening the Learning Pack store…</p>
      </div>
    ),
  }
);

export default function BookshopPage() {
  return (
    // full screen, like a game: the way back to the site is in the pause menu
    <main id="main" className="bookshop-page">
      <h1 className="bookshop-sr">Learning Pack 3D bookshop</h1>
      <div className="bookshop-viewport">
        <Bookshop3D />
      </div>
    </main>
  );
}
