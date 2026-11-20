'use client';

/** Shown when an admin request fails. Never substitute sample data for this. */
export function errorMessage(error: unknown): string {
  const e = error as { response?: { status?: number; data?: { detail?: string } }; message?: string } | undefined;
  if (e?.response?.status) {
    const detail = e.response.data?.detail;
    return `The server answered ${e.response.status}${detail ? `: ${detail}` : ''}.`;
  }
  return e?.message === 'Network Error' ? 'Could not reach the server.' : e?.message || 'Something went wrong.';
}

export default function LoadError({
  what,
  error,
  onRetry,
}: {
  what: string;
  error: unknown;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="p-4 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 text-sm text-red-700 dark:text-red-400"
    >
      <p className="font-medium">Could not load {what}.</p>
      <p className="mt-1">{errorMessage(error)}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function ActionError({ message }: { message: string }) {
  return (
    <div role="alert" className="p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
      {message}
    </div>
  );
}
