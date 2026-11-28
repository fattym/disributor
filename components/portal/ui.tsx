/** Small shared pieces for the school, catalogue and request screens. */
import type { ReactNode } from 'react';

export const btn = 'inline-flex items-center justify-center min-h-11 rounded-xl px-4 text-sm font-semibold no-underline disabled:opacity-50 disabled:cursor-not-allowed';
export const primary = `${btn} bg-[#E63B00] !text-white hover:bg-[#c93400]`;
export const secondary = `${btn} border border-[#0B1F3A] bg-white !text-[#0B1F3A] hover:bg-[#F1F3F8]`;
export const quiet = `${btn} bg-transparent !text-[#0B1F3A] underline underline-offset-4`;
export const input = 'w-full min-h-11 rounded-lg border border-[#C6CDDB] bg-white px-3 text-base text-[#16213B] disabled:bg-[#F1F3F8]';
export const card = 'rounded-2xl border border-[#DDE2EC] bg-white p-4 text-[#16213B]';

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-[#0B1F3A]">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-[#566079]">{hint}</span>}
      {error && <span role="alert" className="text-xs font-semibold text-red-700">{error}</span>}
    </label>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'ok' | 'error'; children: ReactNode }) {
  const colour = tone === 'error' ? 'bg-red-50 text-red-800 border-red-200' : tone === 'ok' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-[#EEF1F8] text-[#0B1F3A] border-[#DDE2EC]';
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${colour}`}>{children}</div>;
}

export function Badge({ status }: { status: string }) {
  const colour: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800', published: 'bg-emerald-100 text-emerald-800', applied: 'bg-emerald-100 text-emerald-800', approved: 'bg-emerald-100 text-emerald-800',
    draft: 'bg-amber-100 text-amber-800', pending: 'bg-amber-100 text-amber-800', previewed: 'bg-amber-100 text-amber-800',
    rejected: 'bg-red-100 text-red-800', error: 'bg-red-100 text-red-800',
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${colour[status] || 'bg-zinc-200 text-zinc-700'}`}>{status}</span>;
}

export function Pager({ page, count, size = 50, onPage }: { page: number; count: number; size?: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(count / size));
  if (pages === 1) return null;
  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3">
      <button type="button" className={secondary} disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span className="text-sm">Page {page} of {pages}</span>
      <button type="button" className={secondary} disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </nav>
  );
}

export function Title({ children, sub, actions }: { children: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="m-0 !text-2xl font-extrabold !text-[#0B1F3A]">{children}</h1>
        {sub && <p className="mt-1 text-sm text-[#566079]">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
