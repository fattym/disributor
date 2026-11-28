'use client';

import { useCallback, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Modal from '@/components/seller/Modal';
import { Badge, Field, Notice, Pager, Title, card, input, primary, secondary } from './ui';
import { catalogueApi, money, type CatalogueFilters, type CatalogueProduct } from '@/lib/portalApi';
import { parseApiError } from '@/lib/apiError';
import { useLoad } from '@/lib/useLoad';

function EditProduct({ product, grades, onClose, onSaved }: { product: CatalogueProduct; grades: string[]; onClose: () => void; onSaved: (p: CatalogueProduct) => void }) {
  const showsCost = 'supplier_cost' in product;
  const before: Record<string, string | boolean | string[]> = {
    name: product.name, category: product.category, publisher: product.publisher ?? '', isbn_sku: product.isbn_sku ?? '',
    price: product.price, stock: String(product.stock), image_url: product.image_url ?? '', active: product.active, grades: product.grades,
    ...(showsCost ? { supplier_cost: product.supplier_cost ?? '' } : {}),
  };
  const [form, setForm] = useState(before);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string | boolean | string[]) => setForm((f) => ({ ...f, [k]: v }));
  const chosen = form.grades as string[];
  const stockLocked = product.supplier_linked || product.variants.length > 1;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const changed = Object.fromEntries(Object.entries(form).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(before[k])));
    if (!Object.keys(changed).length) return onClose();
    setBusy(true); setError(''); setErrors({});
    try {
      onSaved(await catalogueApi.update(product.id, changed));
    } catch (err) {
      const p = parseApiError(err);
      setError(p.message); setErrors(p.fields); setBusy(false);
    }
  };

  const text = (k: string, label: string, extra: { disabled?: boolean; hint?: string; mode?: 'decimal' | 'numeric' } = {}) => (
    <Field label={label} error={errors[k]} hint={extra.hint}>
      <input className={input} inputMode={extra.mode} disabled={extra.disabled} value={form[k] as string} onChange={(e) => set(k, e.target.value)} />
    </Field>
  );

  return (
    <Modal title="Edit product" onClose={onClose}>
      <form onSubmit={save} className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
        {error && <Notice tone="error">{error}</Notice>}
        {product.supplier_linked && <Notice>Price, stock and cost follow the supplier&apos;s product.</Notice>}
        {text('name', 'Name')}
        {text('category', 'Category', { hint: 'Parent > Child is allowed' })}
        <div className="grid grid-cols-2 gap-3">
          {text('price', 'Price (KSh)', { disabled: product.supplier_linked, mode: 'decimal' })}
          {text('stock', 'Stock', { disabled: stockLocked, mode: 'numeric', hint: product.variants.length > 1 ? 'Set on each variant' : undefined })}
        </div>
        {showsCost && text('supplier_cost', 'Supplier cost (KSh)', { disabled: product.supplier_linked, mode: 'decimal' })}
        <div className="grid grid-cols-2 gap-3">{text('publisher', 'Publisher')}{text('isbn_sku', 'ISBN / SKU')}</div>
        {text('image_url', 'Image address (https)')}
        <fieldset className="m-0 border-0 p-0">
          <legend className="text-sm font-semibold">Grades</legend>
          <div className="mt-1 flex flex-wrap gap-x-4">
            {Array.from(new Set([...grades, ...chosen])).map((g) => (
              <label key={g} className="flex min-h-9 items-center gap-1.5 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-[#E63B00]" checked={chosen.includes(g)} onChange={(e) => set('grades', e.target.checked ? [...chosen, g] : chosen.filter((x) => x !== g))} />
                {g}
              </label>
            ))}
          </div>
          {errors.grades && <p role="alert" className="m-0 text-xs font-semibold text-red-700">{errors.grades}</p>}
        </fieldset>
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-5 w-5 accent-[#E63B00]" checked={form.active as boolean} onChange={(e) => set('active', e.target.checked)} />
          Active (shown in the shop)
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className={secondary} onClick={onClose}>Cancel</button>
          <button type="submit" className={primary} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

/** The whole catalogue. The API decides which one: the platform's for the platform admin, otherwise the seller's own. */
export default function CatalogueManager({ base }: { base: '/dashboard' | '/admin' }) {
  const [filters, setFilters] = useState<CatalogueFilters>({ ordering: 'name' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<CatalogueProduct | null>(null);
  const [note, setNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const lookups = useLoad('lookups', async () => {
    const [grades, categories] = await Promise.all([catalogueApi.grades(), catalogueApi.categories()]);
    return { grades, categories };
  });
  const { data, error, loading, reload } = useLoad(`products:${JSON.stringify(filters)}:${page}`, () => catalogueApi.products(filters, page));
  const filter = (patch: CatalogueFilters) => { setFilters((f) => ({ ...f, ...patch })); setPage(1); };
  const close = useCallback(() => setEditing(null), []);
  const download = (file: 'csv' | 'xlsx') => catalogueApi.download(file, filters).catch((e) => setNote({ tone: 'error', text: parseApiError(e, 'The export failed.').message }));
  const showsCost = !!data?.results.some((p) => 'supplier_cost' in p);

  const select = (k: keyof CatalogueFilters, label: string, options: [string, string][]) => (
    <Field label={label}>
      <select className={input} value={filters[k] ?? ''} onChange={(e) => filter({ [k]: e.target.value })}>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </Field>
  );

  return (
    <div className="flex flex-col gap-4 text-[#16213B] dark:rounded-2xl dark:bg-[#F5F6FA] dark:p-4">
      <Title sub={data ? `${data.count.toLocaleString('en-KE')} products` : 'Loading…'} actions={<>
        <Link className={primary} href={`${base}/catalogue/import`}>Bulk upload</Link>
        <button type="button" className={secondary} onClick={() => download('csv')}>Export CSV</button>
        <button type="button" className={secondary} onClick={() => download('xlsx')}>Export Excel</button>
      </>}>Catalogue</Title>
      <div className={`${card} flex flex-col gap-3`}>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); filter({ q: search.trim() }); }}>
          <input type="search" className={input} aria-label="Search the catalogue" placeholder="Name, publisher or ISBN/SKU" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" className={secondary}>Search</button>
        </form>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {select('category', 'Category', [['', 'All'], ...(lookups.data?.categories ?? []).map((c): [string, string] => [c, c])])}
          {select('grade', 'Grade', [['', 'All'], ...(lookups.data?.grades ?? []).map((g): [string, string] => [g, g])])}
          {select('stock', 'Stock', [['', 'All'], ['in', 'In stock'], ['out', 'Out of stock']])}
          {select('active', 'Status', [['', 'All'], ['true', 'Active'], ['false', 'Inactive']])}
          {select('ordering', 'Sort', [['name', 'Name A–Z'], ['-name', 'Name Z–A'], ['price', 'Price low–high'], ['-price', 'Price high–low'], ['-id', 'Newest']])}
        </div>
      </div>
      {note && <Notice tone={note.tone}>{note.text}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {loading && <p className="m-0 text-sm" role="status">Loading products…</p>}
      {data && !data.results.length && !loading && <Notice>No product matches these filters.</Notice>}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {data?.results.map((p) => (
          <li key={p.id} className={`${card} grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_7rem_5rem_6rem_auto]`}>
            <div className="col-span-2 min-w-0 md:col-span-1">
              <p className="m-0 text-sm font-bold">{p.name}</p>
              <p className="m-0 text-xs text-[#566079]">{[p.category, p.publisher, p.isbn_sku].filter(Boolean).join(' · ')}</p>
            </div>
            <p className="col-span-2 m-0 text-xs md:col-span-1">{p.grades.join(', ') || <span className="text-[#566079]">No grade</span>}</p>
            <p className="m-0 text-sm"><b>{money(p.price)}</b>{showsCost && <span className="block text-xs text-[#566079]">Cost {p.supplier_cost ? money(p.supplier_cost) : '–'}</span>}</p>
            <p className={`m-0 text-right text-sm md:text-left ${p.stock ? '' : 'font-bold text-red-700'}`}>{p.stock} in stock</p>
            <div><Badge status={p.active ? 'active' : 'inactive'} /></div>
            <button type="button" className={`${secondary} justify-self-end`} onClick={() => { setNote(null); setEditing(p); }} aria-label={`Edit ${p.name}`}>Edit</button>
          </li>
        ))}
      </ul>
      {data && <Pager page={page} count={data.count} onPage={setPage} />}
      {editing && <EditProduct product={editing} grades={lookups.data?.grades ?? []} onClose={close} onSaved={(p) => { setEditing(null); setNote({ tone: 'ok', text: `Saved ${p.name}.` }); reload(); }} />}
    </div>
  );
}
