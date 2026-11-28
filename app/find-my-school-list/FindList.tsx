'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ParentList, { type Chosen } from '@/components/portal/ParentList';
import { Notice, card, input, secondary, primary } from '@/components/portal/ui';
import { publicListApi } from '@/lib/portalApi';
import { useCart } from '@/lib/cart';
import { useLoad } from '@/lib/useLoad';
import { WHATSAPP_NUMBERS } from '@/lib/shopText';

const id = (v: string | null) => (v && /^\d{1,10}$/.test(v) ? Number(v) : null);

function NotListed() {
  const text = encodeURIComponent("Hello Learning Pack, my child's school list is not on the website.");
  return (
    <div className={`${card} flex flex-col gap-3`}>
      <h2 className="m-0 !text-lg font-bold !text-[#0B1F3A]">School or list not here?</h2>
      <p className="m-0 text-sm">Send us the list you have and we will price it.</p>
      <div className="flex flex-wrap gap-2">
        <Link className={primary} href="/upload-my-list/">Upload my list</Link>
        <a className={secondary} href={`${WHATSAPP_NUMBERS[0].href}?text=${text}`} target="_blank" rel="noopener noreferrer">WhatsApp {WHATSAPP_NUMBERS[0].label}</a>
      </div>
      <p className="m-0 text-sm">Run a school? <Link className="font-bold underline" href="/list-your-school/">List your school&apos;s booklist</Link></p>
    </div>
  );
}

function SchoolSearch() {
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => { const t = setTimeout(() => setQ(text.trim()), 300); return () => clearTimeout(t); }, [text]);
  const { data, error, loading } = useLoad(`schools:${q}`, () => publicListApi.schools(q));
  return (
    <div className={`${card} flex flex-col gap-3`}>
      <label htmlFor="school-search" className="font-bold text-[#0B1F3A]">Search your child&apos;s school</label>
      <input id="school-search" type="search" className={input} placeholder="School name or area" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
      {error && <Notice tone="error">{error}</Notice>}
      <div aria-live="polite">
        {loading && !data && <p className="m-0 text-sm">Loading schools…</p>}
        {data && data.results.length === 0 && <p className="m-0 text-sm">{q ? `No school matches “${q}”.` : 'No school has published a list here yet.'}</p>}
        <ul className="m-0 list-none p-0">
          {data?.results.map((s) => (
            <li key={s.id} className="border-t border-[#EEF1F8]">
              <Link className="flex min-h-11 flex-col justify-center py-2 !text-[#0B1F3A]" href={`/find-my-school-list/?school=${s.id}`}>
                <b>{s.name}</b>
                {s.address && <span className="text-xs text-[#566079]">{s.address}</span>}
              </Link>
            </li>
          ))}
        </ul>
        {data && data.count > data.results.length && <p className="m-0 text-xs text-[#566079]">Showing {data.results.length} of {data.count}. Type more of the name.</p>}
      </div>
    </div>
  );
}

function Grades({ school }: { school: number }) {
  const { data, error, loading } = useLoad(`grades:${school}`, () => publicListApi.grades(school));
  return (
    <div className={`${card} flex flex-col gap-3`}>
      <h2 className="m-0 !text-lg font-bold !text-[#0B1F3A]">Choose your child&apos;s grade</h2>
      {loading && <p className="m-0 text-sm">Loading grades…</p>}
      {error && <Notice tone="error">This school&apos;s lists could not be loaded. It may have no published list.</Notice>}
      {data?.map((g) => (
        <div key={g.grade} className="border-t border-[#EEF1F8] pt-3">
          <h3 className="m-0 mb-2 !text-base font-bold !text-[#0B1F3A]">{g.grade}</h3>
          <div className="flex flex-wrap gap-2">
            {g.lists.map((l) => (
              <Link key={l.id} className={secondary} href={`/find-my-school-list/?school=${school}&list=${l.id}`}>
                {l.class_name || l.name} · {l.academic_year}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function OneList({ listId }: { listId: number }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { data, error, loading } = useLoad(`list:${listId}`, () => publicListApi.list(listId));
  const add = (chosen: Chosen[]) => {
    chosen.forEach(({ item, quantity }) => addItem({
      product_id: item.product_id, product_name: item.name, variant_id: item.variant_id, variant_label: item.variant,
      quantity, unit_price: Number(item.price), image_url: item.image_url, stock_quantity: item.stock,
    }));
    router.push('/cart/');
  };
  if (error) return <Notice tone="error">This list is not available. The school may have taken it down.</Notice>;
  if (loading || !data) return <p className="m-0">Loading the list…</p>;
  return (
    <div className="flex flex-col gap-3">
      <Link className="text-sm font-bold underline" href={`/find-my-school-list/?school=${data.school.id}`}>← Other grades</Link>
      <div>
        <h2 className="m-0 !text-xl font-extrabold !text-[#0B1F3A]">{data.school.name}</h2>
        <p className="m-0 text-sm text-[#566079]">{[data.grade, data.class_name, data.name, data.academic_year].filter(Boolean).join(' · ')}</p>
      </div>
      <ParentList key={data.id} items={data.items} onAdd={add} />
    </div>
  );
}

export default function FindList() {
  const params = useSearchParams();
  const school = id(params.get('school'));
  const list = id(params.get('list'));
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {school || list ? <Link className="text-sm font-bold underline" href="/find-my-school-list/">← Search another school</Link> : null}
      {list ? <OneList listId={list} /> : school ? <Grades school={school} /> : <SchoolSearch />}
      <NotListed />
    </div>
  );
}
