'use client';

import Link from 'next/link';
import { Title, card, primary, secondary } from '@/components/portal/ui';
import { useAuth } from '@/lib/auth';
import { publicListApi, schoolApi } from '@/lib/portalApi';
import { useLoad } from '@/lib/useLoad';

export default function SchoolProfilePage() {
  const { user } = useAuth();
  // The account API returns only the school's id; its name is shown by the public record once a list is published.
  const { data, loading } = useLoad('profile', async () => {
    const lists = (await schoolApi.lists()).results;
    const published = lists.filter((l) => l.status === 'published');
    const school = published.length ? (await publicListApi.list(published[0].id)).school.name : '';
    return { school, published: published.length, drafts: lists.filter((l) => l.status === 'draft').length };
  });
  if (!user) return null;
  const rows = [
    ['School', data?.school || (loading ? '…' : 'Shown after your first list is published')],
    ['Contact', `${user.first_name} ${user.last_name}`.trim() || '-'],
    ['Sign-in email', user.email],
    ['Phone', user.phone || '-'],
  ];
  return (
    <>
      <Title sub="Who manages these booklists.">School profile</Title>
      <dl className={`${card} m-0 grid gap-3 sm:grid-cols-2`}>
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs font-bold uppercase tracking-wide text-[#566079]">{k}</dt>
            <dd className="m-0 break-words font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="grid grid-cols-2 gap-3">
        <div className={card}><b className="block text-2xl">{data?.published ?? '…'}</b>Published lists</div>
        <div className={card}><b className="block text-2xl">{data?.drafts ?? '…'}</b>Drafts</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link className={primary} href="/school/booklists">Manage booklists</Link>
        <Link className={secondary} href="/account/change-password">Change password</Link>
      </div>
      <p className="text-sm text-[#566079]">To change the school&apos;s details, message Learning Pack on WhatsApp.</p>
    </>
  );
}
