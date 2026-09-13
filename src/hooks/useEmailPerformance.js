import { useEffect, useState } from 'react';
import { collectionGroup, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Reuses the same collectionGroup query pattern as the Dashboard's Recent
 * Activity feed (Firestore rules already scope results to the caller's own
 * company per-document, even in a collectionGroup query), just with a much
 * higher limit and no display — purely for counting event types.
 */
export function useEmailPerformance() {
  const { profile } = useAuth();
  const [counts, setCounts] = useState({ sent: 0, opened: 0, clicked: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.companyId) return;
    const q = query(collectionGroup(db, 'timeline'), orderBy('createdAt', 'desc'), limit(1000));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const next = { sent: 0, opened: 0, clicked: 0 };
        snap.docs.forEach((d) => {
          const type = d.data().type;
          if (type === 'email_sent') next.sent += 1;
          if (type === 'email_opened') next.opened += 1;
          if (type === 'email_clicked') next.clicked += 1;
        });
        setCounts(next);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, [profile?.companyId]);

  return { counts, loading };
}
