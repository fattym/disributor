'use client';

import { useCallback, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Modal from '@/components/seller/Modal';
import { Badge, Field, Notice, Pager, Title, card, input, primary, quiet, secondary } from '@/components/portal/ui';
import { GRADES, money, schoolApi, type AcademicYearRow, type CatalogueChoice, type ManagedList } from '@/lib/portalApi';
import { parseApiError } from '@/lib/apiError';
import { useLoad } from '@/lib/useLoad';

interface Line { variant_id: number; name: string; detail: string; price: string; quantity: number; required: boolean; provided: boolean }

const toLines = (list: ManagedList | null): Line[] => (list?.items ?? []).map((i) => ({
  variant_id: i.variant_id, name: i.name, detail: [i.variant !== 'Default' && i.variant, i.publisher].filter(Boolean).join(' · '),
  price: i.price, quantity: i.quantity, required: i.required, provided: i.provided_by_school,
}));

function Search({ grade, taken, onAdd }: { grade: string; taken: Set<number>; onAdd: (c: CatalogueChoice) => void }) {
  const [text, setText] = useState('');
  const [query, setQuery] = useState({ q: '', thisGrade: false, page: 1 });
  const wanted = { q: query.q, grade: query.thisGrade ? grade : '', page: query.page };
  const { data, error, loading } = useLoad(`catalogue:${JSON.stringify(wanted)}`, () => schoolApi.catalogue(wanted));
  const submit = (e: FormEvent) => { e.preventDefault(); setQuery((s) => ({ ...s, q: text.trim(), page: 1 })); };
  return (
    <div className={`${card} flex flex-col gap-3`}>
      <h2 className="m-0 !text-lg font-bold !text-[#0B1F3A]">Add items</h2>
      <form onSubmit={submit} className="flex gap-2">
        <input type="search" className={input} aria-label="Search the catalogue" placeholder="Name, publisher or ISBN" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" className={secondary}>Search</button>
      </form>
      {grade && (
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-[#E63B00]" checked={query.thisGrade} onChange={(e) => setQuery((s) => ({ ...s, thisGrade: e.target.checked, page: 1 }))} />
          Only items marked {grade}
        </label>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {loading && !data && <p className="m-0 text-sm">Searching…</p>}
      {data && !data.results.length && <p className="m-0 text-sm">Nothing found.</p>}
      <ul className="m-0 list-none p-0">
        {data?.results.map((c) => (
          <li key={c.variant_id} className="flex items-center justify-between gap-3 border-t border-[#EEF1F8] py-2">
            <div className="min-w-0">
              <p className="m-0 text-sm font-semibold">{c.name}</p>
              <p className="m-0 text-xs text-[#566079]">{[c.variant !== 'Default' && c.variant, c.publisher, money(c.price), !c.available && 'not available now'].filter(Boolean).join(' · ')}</p>
            </div>
            <button type="button" className={secondary} disabled={taken.has(c.variant_id)} onClick={() => onAdd(c)} aria-label={`Add ${c.name}`}>
              {taken.has(c.variant_id) ? 'Added' : 'Add'}
            </button>
          </li>
        ))}
      </ul>
      {data && <Pager page={query.page} count={data.count} size={20} onPage={(page) => setQuery((s) => ({ ...s, page }))} />}
    </div>
  );
}

export default function Editor({ years, initial }: { years: AcademicYearRow[]; initial: ManagedList | null }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [details, setDetails] = useState({
    grade: initial?.grade ?? '', class_name: initial?.class_name ?? '', name: initial?.name ?? '',
    academic_year: initial?.academic_year.id ?? years.find((y) => y.is_current)?.id ?? 0,
  });
  const [lines, setLines] = useState<Line[]>(() => toLines(initial));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const closeDelete = useCallback(() => setDeleting(false), []);

  const change = (patch: Partial<typeof details>) => { setDetails((d) => ({ ...d, ...patch })); setDirty(true); };
  const edit = (id: number, patch: Partial<Line>) => { setLines((ls) => ls.map((l) => (l.variant_id === id ? { ...l, ...patch } : l))); setDirty(true); };
  const drop = (id: number) => { setLines((ls) => ls.filter((l) => l.variant_id !== id)); setDirty(true); };
  const add = (c: CatalogueChoice) => {
    setLines((ls) => [...ls, { variant_id: c.variant_id, name: c.name, detail: [c.variant !== 'Default' && c.variant, c.publisher].filter(Boolean).join(' · '), price: c.price, quantity: 1, required: true, provided: false }]);
    setDirty(true);
  };

  const readOnly = !!list && list.status !== 'draft';
  const total = (required: boolean) => lines.filter((l) => l.required === required && !l.provided).reduce((s, l) => s + Number(l.price) * l.quantity, 0);

  const save = async (publish: boolean) => {
    if (!details.grade) return setNote({ tone: 'error', text: 'Choose the grade first.' });
    setBusy(true); setNote(null);
    const body = {
      grade: details.grade, class_name: details.class_name.trim(), name: details.name.trim(),
      ...(details.academic_year ? { academic_year: details.academic_year } : {}),
      items: lines.map((l) => ({ variant_id: l.variant_id, quantity: l.quantity, required: l.required })),
    };
    try {
      let saved = list ? await schoolApi.update(list.id, body) : await schoolApi.create(body);
      setList(saved); setDirty(false);
      setDetails({ grade: saved.grade, class_name: saved.class_name, name: saved.name, academic_year: saved.academic_year.id });
      if (!list) window.history.replaceState(null, '', `?id=${saved.id}`);
      if (publish) { saved = await schoolApi.action(saved.id, 'publish'); setList(saved); }
      setNote({ tone: 'ok', text: publish ? 'Published. Parents can see it now.' : 'Draft saved.' });
    } catch (e) {
      const p = parseApiError(e);
      setNote({ tone: 'error', text: [p.message, ...Object.values(p.fields)].join(' ') });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!list) return;
    try { await schoolApi.remove(list.id); router.push('/school/booklists'); }
    catch (e) { setNote({ tone: 'error', text: parseApiError(e).message }); setDeleting(false); }
  };

  return (
    <>
      <Link className="text-sm font-bold underline" href="/school/booklists">← All lists</Link>
      <Title sub={list ? <Badge status={list.status === 'archived' ? 'unpublished' : list.status} /> : 'A new list starts as a draft.'}>{list ? list.name : 'New list'}</Title>
      {readOnly && <Notice>This list can no longer be changed. Use “Edit a new version” on the Booklists page.</Notice>}
      <fieldset disabled={readOnly || busy} className={`${card} m-0 grid gap-3 sm:grid-cols-2`}>
        <Field label="Grade">
          <select className={input} value={details.grade} onChange={(e) => change({ grade: e.target.value })}>
            <option value="">Choose a grade…</option>
            {details.grade && !GRADES.includes(details.grade) && <option>{details.grade}</option>}
            {GRADES.map((g) => <option key={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Class (optional)" hint="For example East or Blue">
          <input className={input} maxLength={40} value={details.class_name} onChange={(e) => change({ class_name: e.target.value })} />
        </Field>
        <Field label="List name (optional)">
          <input className={input} maxLength={120} value={details.name} onChange={(e) => change({ name: e.target.value })} />
        </Field>
        <Field label="School year">
          <select className={input} value={details.academic_year} onChange={(e) => change({ academic_year: Number(e.target.value) })}>
            {!details.academic_year && <option value={0}>Current year</option>}
            {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </Field>
      </fieldset>

      <div className="grid items-start gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className={`${card} flex flex-col gap-2`}>
          <h2 className="m-0 !text-lg font-bold !text-[#0B1F3A]">On this list ({lines.length})</h2>
          {!lines.length && <p className="m-0 text-sm">No items yet.</p>}
          <ul className="m-0 list-none p-0">
            {lines.map((l) => (
              <li key={l.variant_id} className="flex flex-col gap-2 border-t border-[#EEF1F8] py-3">
                <div>
                  <p className="m-0 text-sm font-semibold">{l.name}</p>
                  <p className="m-0 text-xs text-[#566079]">{[l.detail, `${money(l.price)} each`].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1 text-xs">
                    Qty
                    <input type="number" min={1} max={1000} className="h-11 w-20 rounded-lg border border-[#C6CDDB] bg-white px-2 text-base" disabled={readOnly}
                      value={l.quantity} onChange={(e) => edit(l.variant_id, { quantity: Math.min(1000, Math.max(1, Math.round(Number(e.target.value)) || 1)) })} />
                  </label>
                  <select aria-label={`Required or optional: ${l.name}`} className="h-11 rounded-lg border border-[#C6CDDB] bg-white px-2 text-sm" disabled={readOnly}
                    value={l.required ? 'required' : 'optional'} onChange={(e) => edit(l.variant_id, { required: e.target.value === 'required', provided: false })}>
                    <option value="required">Required</option>
                    <option value="optional">{l.provided ? 'Provided by school' : 'Optional'}</option>
                  </select>
                  {!readOnly && <button type="button" className={quiet} onClick={() => drop(l.variant_id)}>Remove</button>}
                </div>
              </li>
            ))}
          </ul>
          <p className="m-0 border-t border-[#DDE2EC] pt-2 text-sm">Required <b>{money(total(true))}</b> · Optional <b>{money(total(false))}</b></p>
        </div>
        {!readOnly && <Search grade={details.grade} taken={new Set(lines.map((l) => l.variant_id))} onAdd={add} />}
      </div>

      {note && <Notice tone={note.tone}>{note.text}</Notice>}
      <div className="sticky bottom-0 z-10 flex flex-wrap gap-2 border-t border-[#DDE2EC] bg-[#F5F6FA] py-3">
        {!readOnly && <button type="button" className={secondary} disabled={busy} onClick={() => save(false)}>{busy ? 'Saving…' : 'Save draft'}</button>}
        {!readOnly && <button type="button" className={primary} disabled={busy || !lines.length} onClick={() => save(true)}>Save and publish</button>}
        {list && (dirty
          ? <span className="self-center text-sm text-[#566079]">Save to preview your changes.</span>
          : <Link className={secondary} href={`/school/booklists/preview?id=${list.id}`}>Preview</Link>)}
        {list?.status === 'draft' && <button type="button" className={quiet} onClick={() => setDeleting(true)}>Delete draft</button>}
      </div>
      {deleting && (
        <Modal title="Delete this draft?" onClose={closeDelete}>
          <p className="m-0 text-sm">The list and its items are removed. This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button type="button" className={secondary} onClick={closeDelete}>Keep it</button>
            <button type="button" className={primary} onClick={remove}>Delete</button>
          </div>
        </Modal>
      )}
    </>
  );
}
