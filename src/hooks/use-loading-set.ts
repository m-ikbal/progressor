import { useCallback, useState } from 'react';

export function useLoadingSet<T extends string | number>() {
  const [loading, setLoading] = useState<Set<T>>(() => new Set());

  const start = useCallback((id: T) => {
    setLoading((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const stop = useCallback((id: T) => {
    setLoading((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setLoading(new Set());
  }, []);

  return { loading, start, stop, reset };
}


