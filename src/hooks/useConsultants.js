import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export function useConsultants() {
  const { profile } = useAuth();
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.companyId) return;
    const unsubscribe = onSnapshot(
      collection(db, 'companies', profile.companyId, 'consultants'),
      (snap) => {
        setConsultants(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [profile?.companyId]);

  return { consultants, loading };
}
