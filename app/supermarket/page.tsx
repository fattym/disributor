'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { BooklistSelector } from '@/components/supermarket/BooklistSelector';
import { InteractionPanel } from '@/components/supermarket/InteractionPanel';
import { TrolleyPanel } from '@/components/supermarket/TrolleyPanel';
import { CategoryPanel } from '@/components/supermarket/CategoryPanel';
import { SupermarketHeader } from '@/components/supermarket/SupermarketHeader';
import { CheckoutBar } from '@/components/supermarket/CheckoutBar';
import { BooklistProgress } from '@/components/supermarket/BooklistProgress';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import { useSupermarketStore } from '@/lib/store/supermarketStore';
import '@/components/supermarket/supermarket.css';

const SupermarketScene = dynamic(
  () => import('@/components/supermarket/SupermarketScene').then((m) => m.SupermarketScene),
  {
    ssr: false,
    loading: () => (
      <div className="supermarket-loading">
        <div className="spinner" />
        <p>Initializing 3D supermarket…</p>
      </div>
    ),
  },
);

export default function SupermarketPage() {
  const { trolleyOpen, setTrolleyOpen, booklistKioskOpen, setBooklistKioskOpen, selectedProduct } = useSupermarketStore();
  const [targetAisle, setTargetAisle] = useState<string | null>(null);
  const showConveyor = !selectedProduct && !trolleyOpen;

  return (
    <>
      <GlobalHeader />

      <main id="main" className="supermarket-page">
        <div className="lp-supermarket-shell">
          <aside className="lp-side-panel lp-side-panel--left">
            <CategoryPanel onSelectDepartment={setTargetAisle} />
          </aside>

          <div className="supermarket-viewport lp-viewport">
            <SupermarketHeader activeAisle={targetAisle} />
            <BooklistProgress />

            <div className="supermarket-3d-wrapper">
              <SupermarketScene targetAisle={targetAisle} onArrive={() => setTargetAisle(null)} />
            </div>

            {booklistKioskOpen && (
              <button
                type="button"
                className="lp-booklist-backdrop"
                aria-label="Close booklist kiosk"
                onClick={() => setBooklistKioskOpen(false)}
              />
            )}
            <BooklistSelector />
            {booklistKioskOpen && (
              <button
                type="button"
                className="lp-booklist-close"
                aria-label="Close booklist kiosk"
                onClick={() => setBooklistKioskOpen(false)}
              >
                ×
              </button>
            )}

            {showConveyor && <CheckoutBar />}
          </div>

          <TrolleyPanel open={trolleyOpen} onClose={() => setTrolleyOpen(false)} />
        </div>

      </main>

      <InteractionPanel />
      <GlobalFooter />
    </>
  );
}
