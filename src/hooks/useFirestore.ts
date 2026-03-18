'use client';

import { useEffect, useState } from 'react';
import { Unsubscribe } from 'firebase/firestore';

/**
 * Generic hook for real-time Firestore subscriptions.
 *
 * Usage:
 *   const { data: jobs, loading } = useFirestore<Job>(onJobsSnapshot, SEED_JOBS);
 *   const { data: companies, loading } = useFirestore<CompanyRecord>(onCompaniesSnapshot, SEED_COMPANIES);
 *
 * @param subscribe  Function that takes a callback and returns an unsubscribe function
 * @param fallback   Seed data to use if the collection is empty
 */
export function useFirestore<T>(
  subscribe: (onData: (data: T[]) => void, onError?: (error: Error) => void) => Unsubscribe,
  fallback: T[] = []
): { data: T[]; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe(
      (items) => {
        setData(items.length > 0 ? items : fallback);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        setError(err);
        setData(fallback);
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error };
}