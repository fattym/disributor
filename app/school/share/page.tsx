'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import QrCode from '@/components/portal/QrCode';
import { Field, Notice, Title, card, input, primary, secondary } from '@/components/portal/ui';
import { publicListApi, schoolApi } from '@/lib/portalApi';
import { useLoad } from '@/lib/useLoad';

function Share() {
  const { user } = useAuth();
  const wanted = useSearchParams().get('list') || '';
  const [target, setTarget] = useState(wanted);
  const [copied, setCopied] = useState('');
  const { data, error, loading } = useLoad('share', async () => {
    const lists = (await schoolApi.lists()).results.filter((l) => l.status === 'published');
    const name = lists.length ? (await publicListApi.list(lists[0].id)).school.name : '';
    return { lists, name };
  });
  if (error) return <Notice tone="error">{error}</Notice>;
  if (loading || !data || !user) return <p>Loading…</p>;
  if (!data.lists.length) {
    return <><Title>Share with parents</Title><Notice>Publish a list first. <Link className="font-bold underline" href="/school/booklists">Go to booklists</Link></Notice></>;
  }
  const list = data.lists.find((l) => String(l.id) === target);
  const url = `${window.location.origin}/find-my-school-list/?school=${user.school}${list ? `&list=${list.id}` : ''}`;
  const heading = list ? [list.grade, list.class_name].filter(Boolean).join(' ') + ' booklist' : 'School booklists';
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied('Link copied.'); }
    catch { setCopied('Copy the link by hand.'); }
  };
  return (
    <>
      <div className="flex flex-col gap-4 print:hidden">
        <Title sub="Parents open the link or scan the code. No sign-in needed.">Share with parents</Title>
        <div className={`${card} flex flex-col gap-3`}>
          <Field label="What to share">
            <select className={input} value={list ? target : ''} onChange={(e) => { setTarget(e.target.value); setCopied(''); }}>
              <option value="">All our published lists</option>
              {data.lists.map((l) => <option key={l.id} value={l.id}>{[l.grade, l.class_name, l.name !== l.grade && l.name].filter(Boolean).join(' · ')}</option>)}
            </select>
          </Field>
          <Field label="Link"><input className={input} readOnly value={url} onFocus={(e) => e.target.select()} /></Field>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondary} onClick={copy}>Copy link</button>
            <a className={secondary} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${data.name} ${heading}: ${url}`)}`}>Share on WhatsApp</a>
            <button type="button" className={primary} onClick={() => window.print()}>Print the QR poster</button>
          </div>
          {copied && <p role="status" className="m-0 text-sm">{copied}</p>}
        </div>
      </div>
      <div className={`${card} mx-auto flex w-full max-w-md flex-col items-center gap-3 text-center print:border-0`}>
        <p className="m-0 text-xl font-extrabold text-[#0B1F3A]">{data.name}</p>
        <p className="m-0 text-lg font-bold">{heading}</p>
        <QrCode value={url} label={`QR code for ${heading}`} />
        <p className="m-0 text-sm">Scan with your phone camera to see the list and order.</p>
        <p className="m-0 break-all text-xs text-[#566079]">{url}</p>
        <p className="m-0 text-sm font-bold text-[#E63B00]">Learning Pack</p>
      </div>
    </>
  );
}

export default function Page() {
  return <Suspense fallback={<p>Loading…</p>}><Share /></Suspense>;
}
