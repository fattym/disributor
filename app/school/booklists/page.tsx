'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Notice, Title, card, primary, secondary } from '@/components/portal/ui';
import { GRADES, money, schoolApi, type ManagedList } from '@/lib/portalApi';
import { parseApiError } from '@/lib/apiError';
import { useLoad } from '@/lib/useLoad';

export default function SchoolBooklistsPage() {
  const router = useRouter();
  const { data, error, loading, reload } = useLoad('lists', schoolApi.lists);
  const [busy, setBusy] = useState(0);
  const [note, setNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const lists = data?.results ?? [];
  const order = (g: string) => (GRADES.indexOf(g) + 1) || 99;
  const grades = Array.from(new Set(lists.map((l) => l.grade))).sort((a, b) => order(a) - order(b));

  const run = async (list: ManagedList, name: 'publish' | 'archive' | 'new-version') => {
    setBusy(list.id); setNote(null);
    try {
      const result = await schoolApi.action(list.id, name);
      if (name === 'new-version') return router.push(`/school/booklists/edit?id=${result.id}`);
      setNote({ tone: 'ok', text: name === 'publish' ? 'Published. Parents can see it now.' : 'Unpublished. Parents no longer see it.' });
      reload();
    } catch (e) {
      const p = parseApiError(e);
      setNote({ tone: 'error', text: p.fields.items || p.message });
    } finally {
      setBusy(0);
    }
  };

  return (
    <>
      <Title sub="One published list per grade, class and year." actions={<Link className={primary} href="/school/booklists/edit">New list</Link>}>Booklists</Title>
      {note && <Notice tone={note.tone}>{note.text}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {loading && !data && <p>Loading lists…</p>}
      {data && !lists.length && <Notice>No lists yet. Start with “New list”.</Notice>}
      {grades.map((grade) => (
        <div key={grade} className="flex flex-col gap-2">
          <h2 className="m-0 !text-lg font-bold !text-[#0B1F3A]">{grade}</h2>
          {lists.filter((l) => l.grade === grade).map((l) => (
            <article key={l.id} className={`${card} flex flex-wrap items-center justify-between gap-3`}>
              <div className="min-w-0">
                <p className="m-0 flex flex-wrap items-center gap-2 font-bold">{l.name} <Badge status={l.status === 'archived' ? 'unpublished' : l.status} /></p>
                <p className="m-0 text-sm text-[#566079]">
                  {[l.class_name, l.academic_year.name, `version ${l.version}`, `${l.items.length} items`, `required ${money(l.required_total)}`].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {l.status === 'draft' && <Link className={secondary} href={`/school/booklists/edit?id=${l.id}`}>Edit</Link>}
                <Link className={secondary} href={`/school/booklists/preview?id=${l.id}`}>Preview</Link>
                {l.status === 'draft' && <button type="button" className={primary} disabled={busy === l.id} onClick={() => run(l, 'publish')}>Publish</button>}
                {l.status === 'published' && <Link className={secondary} href={`/school/share?list=${l.id}`}>Share</Link>}
                {l.status === 'published' && <button type="button" className={secondary} disabled={busy === l.id} onClick={() => run(l, 'archive')}>Unpublish</button>}
                {l.status !== 'draft' && <button type="button" className={secondary} disabled={busy === l.id} onClick={() => run(l, 'new-version')}>Edit a new version</button>}
              </div>
            </article>
          ))}
        </div>
      ))}
    </>
  );
}
