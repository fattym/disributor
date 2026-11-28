'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Editor from './Editor';
import { Notice } from '@/components/portal/ui';
import { schoolApi } from '@/lib/portalApi';
import { useLoad } from '@/lib/useLoad';

function Load() {
  // Read once: saving a new list puts its id in the address, and that must not reload the editor.
  const params = useSearchParams();
  const [id] = useState(() => Number(params.get('id')) || 0);
  const { data, error, loading } = useLoad(`edit:${id}`, async () => {
    const [years, list] = await Promise.all([schoolApi.years(), id ? schoolApi.list(id) : null]);
    return { years, list };
  });
  if (error) return <Notice tone="error">{error}</Notice>;
  if (loading || !data) return <p>Loading…</p>;
  return <Editor key={id} years={data.years} initial={data.list} />;
}

export default function Page() {
  return <Suspense fallback={<p>Loading…</p>}><Load /></Suspense>;
}
