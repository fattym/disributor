'use client';

import { useState } from 'react';
import { navigationData } from '@/lib/shopCategories';
import { useCart } from '@/lib/cart';
import { useSupermarketStore } from '@/lib/store/supermarketStore';

const DEPARTMENT_COLORS: Record<string, string> = {
  'educational-cbc-books': '#E63B00',
  'school-supplies-stationery': '#2563EB',
  'art-craft-practical-learning': '#7C3AED',
  'toys-board-games-ecde-aids': '#0F766E',
  'reference-books-atlases': '#FBBF24',
  'bags-school-gear': '#059669',
};


export function SupermarketHeader({ activeAisle }: { activeAisle: string | null }) {
  const { getItemCount } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const { searchQuery, setSearchQuery, setBooklistKioskOpen } = useSupermarketStore();
  const count = getItemCount();

  const dept = activeAisle ? navigationData.find((c) => c.slug === activeAisle) : null;
  const color = (dept && DEPARTMENT_COLORS[dept.slug]) || '#0B1F3A';

  return (
    <div className="lp-store-header">
      <div className="lp-store-brand">
        <span className="lp-store-logo" aria-hidden="true">🛒</span>
        <span className="lp-store-name">Learning Pack Supermarket</span>
        <span className="lp-store-tagline">Grab a trolley and shop the aisles</span>
      </div>

      <div
        className="lp-store-aisle lp-store-icon-action"
        style={{ '--dept-color': color } as Record<string, string>}
        title={dept ? `Current aisle: ${dept.label}` : 'All aisles'}
        aria-label={dept ? `Current aisle: ${dept.label}` : 'All aisles'}
      >
        <span className="lp-aisle-dot" aria-hidden="true" />
        <span className="lp-aisle-label">{dept ? dept.label : 'All aisles'}</span>
      </div>

      <div className={`lp-store-search ${searchOpen ? 'lp-store-search--open' : ''}`}>
        <button
          type="button"
          className="lp-store-icon-button lp-store-search-button"
          aria-label={searchOpen ? 'Close product search' : 'Search products'}
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen((open) => !open)}
        >
          ⌕
        </button>
        {searchOpen && (
          <input
            autoFocus
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search products"
            aria-label="Search supermarket products"
          />
        )}
      </div>

      <button
        type="button"
        className="lp-store-icon-button lp-store-booklist"
        onClick={() => setBooklistKioskOpen(true)}
        aria-label="Shop your booklist"
        title="Shop your booklist"
      >
        📋
      </button>

      <div className="lp-shopping-challenge lp-store-icon-action" title="Shopping challenge" aria-label="Shopping challenge">
        <span className="lp-challenge-star" aria-hidden="true">★</span>
        <span className="lp-challenge-label">{count >= 5 ? 'Shelf master!' : `${Math.min(count, 5)} / 5 aisle picks`}</span>
      </div>
    </div>
  );
}
