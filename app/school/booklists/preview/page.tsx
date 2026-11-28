'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ParentList from '@/components/portal/ParentList';
import { Notice } from '@/components/portal/ui';
import { schoolApi } from '@/lib/portalApi';
import { useLoad } from '@/lib/useLoad';

function Preview() {
  const id = Number(useSearchParams().get('id')) || 0;
  const { data, error, loading } = useLoad(`preview:${id}`, () => schoolApi.list(id));
  if (error) return <Notice tone="error">{error}</Notice>;
  if (loading || !data) return <p>Loading…</p>;
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
      <Link className="text-sm font-bold underline" href="/school/booklists">← All lists</Link>
      <Notice>{data.status === 'published' ? 'This is what parents see.' : 'This is what parents will see after you publish.'}</Notice>
      <div>
        <h1 className="m-0 !text-xl font-extrabold !text-[#0B1F3A]">{data.grade}</h1>
        <p className="m-0 text-sm text-[#566079]">{[data.class_name, data.name, data.academic_year.name].filter(Boolean).join(' · ')}</p>
      </div>
      {data.items.length ? <ParentList items={data.items} /> : <Notice>This list has no items yet.</Notice>}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p>Loading…</p>}><Preview /></Suspense>;
}
