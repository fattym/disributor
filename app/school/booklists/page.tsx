'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import { booklistApi, type Booklist, type AcademicYear, type Grade, type VariantSearchResult } from '@/lib/api';
import { distributorApi } from '@/lib/api';
import './booklists.css';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  archived: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

interface ItemRow {
  id: number;
  variant: number | '';
  product_name: string;
  variant_label: string;
  required_quantity: number;
  status: 'required' | 'optional' | 'provided';
  notes: string;
}

export default function SchoolBooklistsPage() {
  const [booklists, setBooklists] = useState<Booklist[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState('');

  const gradeMap = new Map(grades.map((g) => [g.id, g.name]));
  const yearMap = new Map(years.map((y) => [y.id, y.name]));

  async function load() {
    try {
      const [blRes, yrRes, gdRes] = await Promise.all([
        booklistApi.getBooklists(),
        booklistApi.getAcademicYears(),
        distributorApi.getGrades(),
      ]);
      const bl = Array.isArray(blRes) ? blRes : (blRes as { results: Booklist[] }).results || [];
      setBooklists(bl);
      setYears(Array.isArray(yrRes) ? yrRes : (yrRes as { results: AcademicYear[] }).results || []);
      setGrades(Array.isArray(gdRes) ? gdRes : (gdRes as { results: Grade[] }).results || []);
    } catch (err) {
      setError('Failed to load booklists.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handlePublish(id: number) {
    setActionMsg('');
    try {
      await booklistApi.publishBooklist(id);
      await load();
      setActionMsg('Booklist published.');
    } catch (e) {
      setActionMsg('Failed to publish booklist.');
    }
  }

  async function handleArchive(id: number) {
    setActionMsg('');
    try {
      await booklistApi.archiveBooklist(id);
      await load();
      setActionMsg('Booklist archived.');
    } catch (e) {
      setActionMsg('Failed to archive booklist.');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this booklist and all its items? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await booklistApi.deleteBooklist(id);
      await load();
      setActionMsg('Booklist deleted.');
    } catch (e) {
      setActionMsg('Failed to delete booklist.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <GlobalHeader />
      <main id="main" className="booklists-page">
        <div className="booklists-wrap">
          <div className="booklists-head">
            <div>
              <p className="crumbs">
                <Link href="/">Home</Link> / <Link href="/school">School</Link> / Booklists
              </p>
              <h1>School booklists</h1>
              <p className="sub">
                Build a list of required items per grade and publish it so parents can
                discover it by their child's grade and shop it online.
              </p>
            </div>
            <Link href="/school/booklists/new" className="btn btn-primary">
              + New booklist
            </Link>
          </div>

          {actionMsg && <p className="booklists-note" role="status">{actionMsg}</p>}
          {error && <p className="booklists-error" role="alert">{error}</p>}

          {loading ? (
            <div className="booklists-empty">Loading booklists...</div>
          ) : booklists.length === 0 ? (
            <div className="booklists-empty">
              <p>No booklists yet.</p>
              <Link href="/school/booklists/new" className="btn btn-primary">
                Create your first booklist
              </Link>
            </div>
          ) : (
            <div className="booklists-grid">
              {booklists.map((bl) => (
                <article key={bl.id} className="booklist-card">
                  <div className="booklist-card__head">
                    <span className="booklist-grade">{gradeMap.get(bl.grade) || `Grade ${bl.grade}`}</span>
                    <span className={`booklist-status ${STATUS_STYLE[bl.status]}`}>
                      {STATUS_LABEL[bl.status] || bl.status}
                    </span>
                  </div>
                  <h3 className="booklist-name">{bl.name}</h3>
                  <div className="booklist-meta">
                    <span>{yearMap.get(bl.academic_year) || `Year ${bl.academic_year}`}</span>
                    <span>v{bl.version}</span>
                    <span>{bl.school_name}</span>
                  </div>
                  <div className="booklist-stats">
                    <span>{bl.total_items} required item{bl.total_items === 1 ? '' : 's'}</span>
                    <span>KSh {Number(bl.total_required_price).toLocaleString('en-KE')}</span>
                  </div>
                  <div className="booklist-card__actions">
                    <Link href={`/school/booklists/${bl.id}`} className="btn btn-ghost">
                      Edit
                    </Link>
                    {bl.status === 'draft' && (
                      <button type="button" className="btn btn-primary" onClick={() => handlePublish(bl.id)}>
                        Publish
                      </button>
                    )}
                    {bl.status === 'published' && (
                      <button type="button" className="btn btn-ghost" onClick={() => handleArchive(bl.id)}>
                        Archive
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={deletingId === bl.id}
                      onClick={() => handleDelete(bl.id)}
                    >
                      {deletingId === bl.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <GlobalFooter />
    </>
  );
}
