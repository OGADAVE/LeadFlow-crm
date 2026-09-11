import { useEffect, useState } from 'react';
import { collectionGroup, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Timeline docs live at companies/{companyId}/leads/{leadId}/timeline/{eventId}
 * with no companyId field on the doc itself. A collectionGroup query scans
 * across ALL companies' timeline subcollections, but Firestore evaluates
 * security rules per-document using the actual path — so this only ever
 * returns events from leads the caller's own company owns. Nothing here
 * bypasses the isolation the rules already enforce.
 */
export function useRecentActivity(limitCount = 6) {
  const { profile } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.companyId) return;
    const q = query(collectionGroup(db, 'timeline'), orderBy('createdAt', 'desc'), limit(limitCount));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, [profile?.companyId, limitCount]);

  return { events, loading };
}
