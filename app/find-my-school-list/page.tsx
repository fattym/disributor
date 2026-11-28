import { Suspense } from 'react';
import Link from 'next/link';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import FindList from './FindList';

export default function FindMySchoolListPage() {
  return (
    <>
      <GlobalHeader />
      <main className="min-h-[60vh] bg-[#F5F6FA] px-4 py-6 text-[#16213B]" id="main">
        <div className="mx-auto mb-4 w-full max-w-2xl">
          <p className="crumbs"><Link href="/">Home</Link> / Find my school list</p>
          <h1 className="mt-3 !text-3xl font-extrabold !text-[#0B1F3A]">Find your school list</h1>
          <p className="mt-1">Search your school, choose the grade, tick what you need. Already have the list? <Link className="font-bold underline" href="/upload-my-list/">Upload my list</Link></p>
        </div>
        <Suspense fallback={<p className="mx-auto max-w-2xl">Loading…</p>}>
          <FindList />
        </Suspense>
      </main>
      <GlobalFooter />
    </>
  );
}
