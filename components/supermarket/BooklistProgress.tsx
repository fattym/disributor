'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSupermarketStore } from '@/lib/store/supermarketStore';
import { useCart } from '@/lib/cart';
import { storefrontApi } from '@/lib/storefrontApi';
import { formatCurrency } from '@/lib/utils';
import { Booklist } from '@/lib/types/storefront';

const BOOK_CACHE = new Map<number, Booklist>();

export function BooklistProgress() {
  const {
    selectedSchoolId,
    selectedGradeId,
    selectedBooklistId,
    setBooklistKioskOpen,
  } = useSupermarketStore();
  const { items: cartItems } = useCart();

  const cartQty = useMemo(() => {
    const m = new Map<number, number>();
    for (const i of cartItems) m.set(i.variant_id, (m.get(i.variant_id) ?? 0) + i.quantity);
    return m;
  }, [cartItems]);

  const cached = selectedBooklistId ? BOOK_CACHE.get(selectedBooklistId) : undefined;
  const [fetched, setFetched] = useState<Booklist | null>(cached ?? null);

  useEffect(() => {
    const id = selectedBooklistId;
    if (!id || BOOK_CACHE.has(id)) return;
    let cancelled = false;
    storefrontApi
      .getBooklist(id)
      .then((bl) => {
        BOOK_CACHE.set(id, bl);
        if (!cancelled) setFetched(bl);
      })
      .catch(() => {
        if (!cancelled) setFetched(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBooklistId]);

  const booklist = selectedBooklistId ? (cached ?? fetched) : null;

  const summary = useMemo(() => {
    if (!booklist) return null;
    const required = booklist.items.filter((i) => i.status === 'required');
    const collected = required.filter((i) => (cartQty.get(i.variant) ?? 0) >= i.required_quantity);
    const missing = required.filter(
      (i) => i.stock_quantity <= 0 || (cartQty.get(i.variant) ?? 0) < i.required_quantity,
    );
    const collectedCount = collected.length;
    const requiredCount = required.length;
    const pct = requiredCount ? Math.round((collectedCount / requiredCount) * 100) : 0;
    const subtotal = collected.reduce(
      (s, i) => s + parseFloat(i.effective_price) * i.required_quantity,
      0,
    );
    return { requiredCount, missingCount: missing.length, pct, subtotal };
  }, [booklist, cartQty]);

  if (!selectedSchoolId || !selectedGradeId) {
    return (
      <div className="lp-booklist-progress-card">
        <span className="lp-bp-title">Select your school & grade to start shopping.</span>
        <button
          type="button"
          className="lp-bp-cta"
          onClick={() => setBooklistKioskOpen(true)}
        >
          Choose school
        </button>
      </div>
    );
  }

  if (!selectedBooklistId) {
    return (
      <div className="lp-booklist-progress-card">
        <span className="lp-bp-title">📚 Select a booklist for your grade.</span>
        <button
          type="button"
          className="lp-bp-cta"
          onClick={() => setBooklistKioskOpen(true)}
        >
          Open booklist
        </button>
      </div>
    );
  }

  if (!booklist || !summary) {
    return (
      <div className="lp-booklist-progress-card">
        <span className="lp-bp-title">Loading your booklist…</span>
      </div>
    );
  }

  const label = booklist
    ? `${booklist.grade_name} · ${booklist.school_name}`
    : '';

  return (
    <div className="lp-booklist-progress-card">
      <div className="lp-bp-head">
        <span className="lp-bp-title" title={booklist?.name || ''}>
          📚 {label || 'Your booklist'}
        </span>
        <span className="lp-bp-count">{summary.requiredCount} items</span>
      </div>

      <div className="lp-bp-track">
        <div
          className="lp-bp-fill"
          style={{ width: `${summary.pct}%` }}
          role="progressbar"
          aria-valuenow={summary.pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Booklist completion"
        />
      </div>

      <div className="lp-bp-foot">
        <span className="lp-bp-missing">{summary.missingCount} missing</span>
        <span className="lp-bp-total">{formatCurrency(summary.subtotal)}</span>
        <button
          type="button"
          className="lp-bp-cta"
          onClick={() => setBooklistKioskOpen(true)}
        >
          Open booklist
        </button>
      </div>
    </div>
  );
}
