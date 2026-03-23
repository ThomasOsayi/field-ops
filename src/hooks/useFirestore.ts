'use client';

import { useEffect, useState } from 'react';
import { Unsubscribe } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

export function useFirestore<T>(
  subscribe: (onData: (data: T[]) => void, onError?: (error: Error) => void) => Unsubscribe,
  fallback: T[] = []
): { data: T[]; loading: boolean; error: Error | null } {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setData(fallback);
      setLoading(false);
      return;
    }

    setLoading(true);
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
  }, [user?.uid]);

  return { data, loading, error };
}