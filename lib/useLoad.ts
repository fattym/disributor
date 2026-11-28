'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { parseApiError } from './apiError';

/** Runs `load` whenever `key` changes (or on reload). While the next result is on its way the old one stays. */
export function useLoad<T>(key: string, load: () => Promise<T>) {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState<{ stamp: string; data?: T; error?: string } | null>(null);
  const loader = useRef(load);
  useEffect(() => { loader.current = load; });
  const stamp = `${key}#${tick}`;
  useEffect(() => {
    let cancelled = false;
    loader.current()
      .then((data) => { if (!cancelled) setResult({ stamp, data }); })
      .catch((e) => { if (!cancelled) setResult({ stamp, error: parseApiError(e).message }); });
    return () => { cancelled = true; };
  }, [stamp]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data: result?.data, error: result?.stamp === stamp ? result.error : undefined, loading: result?.stamp !== stamp, reload };
}
