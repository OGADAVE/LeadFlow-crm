import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

const EVENT_LABELS = {
  lead_created: 'Lead created',
  email_sent: 'Email sent',
  email_opened: 'Email opened',
  brochure_downloaded: 'Brochure downloaded',
  whatsapp_clicked: 'WhatsApp clicked',
  status_changed: 'Status changed',
  note_added: 'Note added',
  inspection_booked: 'Inspection booked'
};

export default function LeadTimeline({ leadId }) {
  const { profile } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!profile?.companyId || !leadId) return;
    const q = query(
      collection(db, 'companies', profile.companyId, 'leads', leadId, 'timeline'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [profile?.companyId, leadId]);

  if (events.length === 0) {
    return <p className="text-subtle text-sm">No activity recorded yet.</p>;
  }

  return (
    <div className="space-y-0">
      {events.map((event, idx) => (
        <div key={event.id} className="flex gap-4 py-3 border-b border-border/60 last:border-b-0">
          <span className="text-xs text-subtle uppercase tracking-wide shrink-0 pt-0.5">{String(events.length - idx).padStart(2, '0')}</span>
          <div>
            <p className="text-sm text-ink">{EVENT_LABELS[event.type] || event.type}</p>
            <p className="text-xs text-subtle mt-0.5">
              {event.createdAt?.toDate ? event.createdAt.toDate().toLocaleString() : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
