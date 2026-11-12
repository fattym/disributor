'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Booklist, School, Grade } from '@/lib/types/storefront';
import { storefrontApi } from '@/lib/storefrontApi';
import { useCart } from '@/lib/cart';
import { useSupermarketStore } from '@/lib/store/supermarketStore';
import { formatCurrency } from '@/lib/utils';

export type BooklistView = 'pack' | 'browse' | 'missing';

export function BooklistSelector() {
  const {
    selectedSchoolId, selectedGradeId, selectedBooklistId, booklistKioskOpen,
    setSelectedSchool, setSelectedGrade, setSelectedBooklist,
  } = useSupermarketStore();
  const { addItem, items } = useCart();

  const [schools, setSchools] = useState<School[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [booklists, setBooklists] = useState<Booklist[]>([]);
  const [loadingBooklists, setLoadingBooklists] = useState(false);
  const [loadingPack, setLoadingPack] = useState(false);
  const [packMessage, setPackMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'warning' | 'error'>('success');
  const [view, setView] = useState<BooklistView>('pack');
  const [toast, setToast] = useState<{ text: string; type: 'error' | 'info' } | null>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!booklistKioskOpen) return;
    const panel = selectorRef.current;
    if (!panel) return;
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    panel.classList.add('lp-kiosk-open');
    const focusTarget = panel.querySelector<HTMLElement>('select, button, [tabindex="0"]');
    window.setTimeout(() => focusTarget?.focus(), 350);
    return () => panel.classList.remove('lp-kiosk-open');
  }, [booklistKioskOpen, selectedSchoolId, selectedGradeId, selectedBooklistId]);

  const activeBooklist = useMemo(
    () => booklists.find((b) => b.id === selectedBooklistId) || null,
    [booklists, selectedBooklistId],
  );

  const cartQty = useMemo(() => {
    const m = new Map<number, number>();
    for (const i of items) m.set(i.variant_id, (m.get(i.variant_id) ?? 0) + i.quantity);
    return m;
  }, [items]);

  const requiredItems = useMemo(
    () => (activeBooklist?.items.filter((i) => i.status === 'required') || []),
    [activeBooklist],
  );

  const fulfilledCount = useMemo(() => {
    return requiredItems.filter((i) => (cartQty.get(i.variant) ?? 0) >= i.required_quantity).length;
  }, [requiredItems, cartQty]);

  const missingItems = useMemo(
    () => requiredItems.filter((i) => i.stock_quantity <= 0 || (cartQty.get(i.variant) ?? 0) < i.required_quantity),
    [requiredItems, cartQty],
  );

  const requiredTotal = useMemo(() => {
    return requiredItems.reduce((sum, i) => sum + parseFloat(i.effective_price) * i.required_quantity, 0);
  }, [requiredItems]);

  useEffect(() => {
    storefrontApi.getSchools().then((list) => setSchools(list)).catch(() => setSchools([]));
    storefrontApi.getGrades().then((list) => setGrades(list)).catch(() => setGrades([]));
  }, []);

  useEffect(() => {
    if (!selectedSchoolId || !selectedGradeId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag set before async fetch resolves
    setLoadingBooklists(true);
    storefrontApi.getBooklists({ school: selectedSchoolId, grade: selectedGradeId })
      .then((list) => {
        setBooklists(list);
        if (list.length === 1 && !selectedBooklistId) {
          setSelectedBooklist(list[0].id);
        } else if (list.length === 0) {
          setToast({ text: 'No booklist is available for this school and grade yet. You can still browse the catalogue.', type: 'info' });
        }
      })
      .catch(() => setBooklists([]))
      .finally(() => setLoadingBooklists(false));
  }, [selectedSchoolId, selectedGradeId, selectedBooklistId, setSelectedBooklist]);

  const handleCompletePack = useCallback(async () => {
    if (!activeBooklist) return;
    setLoadingPack(true);
    setPackMessage(null);
    try {
      let added = 0;
      let missing = 0;
      for (const item of activeBooklist.items) {
        if (item.status !== 'required') continue;
        if (item.stock_quantity <= 0) {
          missing++;
          continue;
        }
        addItem({
          product_id: item.product_id,
          product_name: item.product_name,
          variant_id: item.variant,
          variant_label: item.variant_label,
          quantity: item.required_quantity,
          unit_price: parseFloat(item.effective_price),
          image_url: item.image_url || null,
          stock_quantity: item.stock_quantity,
        });
        added += item.required_quantity;
      }
      setView('pack');
      const subtotal = activeBooklist.items
        .filter((i) => i.status === 'required' && i.stock_quantity > 0)
        .reduce((sum, i) => sum + parseFloat(i.effective_price) * i.required_quantity, 0);
      setPackMessage(`${added} items added to your trolley. ${missing ? `${missing} out of stock.` : ''} Pack total: ${formatCurrency(subtotal)}`);
      setMessageType(missing ? 'warning' : 'success');
    } catch {
      setPackMessage('Failed to add pack items.');
      setMessageType('error');
    } finally {
      setLoadingPack(false);
    }
  }, [activeBooklist, addItem]);

  const handleAddItem = (item: { product_id: number; product_name: string; variant: number; variant_label: string; required_quantity: number; effective_price: string; stock_quantity: number; image_url: string | null }) => {
    addItem({
      product_id: item.product_id,
      product_name: item.product_name,
      variant_id: item.variant,
      variant_label: item.variant_label,
      quantity: item.required_quantity,
      unit_price: parseFloat(item.effective_price),
      image_url: item.image_url || null,
      stock_quantity: item.stock_quantity,
    });
    setView('pack');
  };

  const dismissToast = () => setToast(null);

  if (!selectedSchoolId) {
    return (
      <div ref={selectorRef} className="pack-selector lp-school-select">
        <h2>Select your school</h2>
        <select value="" onChange={(e) => setSelectedSchool(e.target.value ? Number(e.target.value) : null)} className="selector">
          <option value="">— Choose a school —</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
    );
  }

  if (!selectedGradeId) {
    return (
      <div ref={selectorRef} className="pack-selector lp-grade-select">
        <h2>For which grade?</h2>
        <select value="" onChange={(e) => setSelectedGrade(e.target.value ? Number(e.target.value) : null)} className="selector">
          <option value="">— Choose a grade —</option>
          {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
    );
  }

  if (loadingBooklists) {
    return <div ref={selectorRef} className="pack-selector lp-loading"><p>Loading booklists…</p></div>;
  }

  if (booklists.length === 0) {
    return (
      <div ref={selectorRef} className="pack-selector lp-no-booklists">
        <p>No booklist found for this school and grade.</p>
        <button type="button" className="lp-change-select" onClick={() => setSelectedSchool(null)}>
          Choose a different school
        </button>
      </div>
    );
  }

  if (!activeBooklist) {
    const list = booklists.filter((b) => b.status === 'published');
    return (
      <div ref={selectorRef} className="pack-selector lp-booklist-select">
        <h2>Select a booklist</h2>
        <select value="" onChange={(e) => setSelectedBooklist(e.target.value ? Number(e.target.value) : null)} className="selector">
          <option value="">— Choose a booklist —</option>
          {list.map((b) => <option key={b.id} value={b.id}>{b.name} (v{b.version})</option>)}
        </select>
      </div>
    );
  }

  const progress = requiredItems.length ? Math.round((fulfilledCount / requiredItems.length) * 100) : 0;

  return (
    <div ref={selectorRef} className="pack-selector lp-booklist-panel">
      {toast && (
        <div className={`lp-toast lp-toast--${toast.type}`} onClick={dismissToast} role="status" aria-live="polite">
          {toast.text}
        </div>
      )}

      <div className="lp-booklist-header">
        <div className="lp-booklist-title-wrap">
          <h2>{activeBooklist.name}</h2>
          <p className="lp-booklist-meta">{activeBooklist.school_name} · {activeBooklist.grade_name} · {activeBooklist.year_name}</p>
        </div>
      </div>

      <div className="lp-booklist-progress">
        <div className="lp-progress-label">
          <span>{fulfilledCount} of {requiredItems.length} required items added</span>
          <span className="lp-progress-pct">{progress}%</span>
        </div>
        <div className="lp-progress-track">
          <div
            className="lp-progress-fill"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      <div className="lp-booklist-summary">
        <span>{requiredItems.length} required items</span>
        <span>Total: {formatCurrency(requiredTotal)}</span>
      </div>

      {missingItems.length > 0 && (
        <div className="pack-warning lp-missing-warning">
          <strong>{missingItems.length} item(s) still needed:</strong>
          {missingItems.map((i) => <span key={i.id}>{i.product_name}</span>)}
        </div>
      )}

      <div className="lp-booklist-views">
        <button
          type="button"
          className={`lp-view-btn ${view === 'pack' ? 'lp-view-btn--active' : ''}`}
          onClick={() => setView('pack')}
        >
          Shop full booklist
        </button>
        <button
          type="button"
          className={`lp-view-btn ${view === 'browse' ? 'lp-view-btn--active' : ''}`}
          onClick={() => setView('browse')}
        >
          Browse supermarket
        </button>
        <button
          type="button"
          className={`lp-view-btn ${view === 'missing' ? 'lp-view-btn--active' : ''}`}
          onClick={() => setView('missing')}
        >
          View missing items ({missingItems.length})
        </button>
      </div>

      {view === 'pack' && (
        <>
          <button className="pack-complete-btn lp-complete-btn" onClick={handleCompletePack} disabled={loadingPack}>
            {loadingPack ? 'Adding…' : 'Complete This Pack (add all required items)'}
          </button>
          {packMessage && (
            <p className={`pack-message lp-pack-message ${messageType}`}>{packMessage}</p>
          )}
        </>
      )}

      {view === 'missing' && missingItems.length > 0 && (
        <div className="lp-missing-list">
          <h3>Items to add</h3>
          {missingItems.map((item) => (
            <div key={item.id} className="lp-missing-row">
              <span className="lp-missing-name">{item.product_name}</span>
              <span className="lp-missing-price">{formatCurrency(item.effective_price)}</span>
              <button
                type="button"
                className="lp-missing-add"
                onClick={() => handleAddItem(item)}
                disabled={item.stock_quantity <= 0}
              >
                {item.stock_quantity <= 0 ? 'Out of stock' : 'Add'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
