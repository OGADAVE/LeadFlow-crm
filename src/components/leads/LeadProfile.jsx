import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Topbar from '../layout/Topbar';
import LeadTimeline from './LeadTimeline';

export default function LeadProfile() {
  const { leadId } = useParams();
  const { profile } = useAuth();
  const [lead, setLead] = useState(null);

  useEffect(() => {
    if (!profile?.companyId || !leadId) return;
    return onSnapshot(doc(db, 'companies', profile.companyId, 'leads', leadId), (snap) => {
      setLead(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  }, [profile?.companyId, leadId]);

  if (!lead) return <div className="p-8 text-subtle text-sm">Loading…</div>;

  return (
    <div>
      <Topbar title={lead.fullName} subtitle={`Lead · ${lead.source}`} />
      <div className="p-8 grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <p className="text-xs text-subtle uppercase tracking-wide mb-3">Timeline</p>
          <div className="border border-border bg-card rounded-xl px-4">
            <LeadTimeline leadId={lead.id} />
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-xs text-subtle uppercase tracking-wide mb-3">Details</p>
            <div className="border border-border bg-card rounded-xl p-4 space-y-3 text-sm">
              <Field label="Email" value={lead.email} />
              <Field label="Phone" value={lead.phone} />
              <Field label="WhatsApp" value={lead.whatsapp} />
              <Field label="Budget" value={lead.budget ? `₦${lead.budget.toLocaleString()}` : '—'} />
              <Field label="Status" value={lead.status?.replace('_', ' ')} capitalize />
              <Field
                label="Last Contact"
                value={lead.lastContactDate?.toDate ? lead.lastContactDate.toDate().toLocaleDateString() : '—'}
              />
              <Field
                label="Next Follow-up"
                value={lead.nextFollowUpDate?.toDate ? lead.nextFollowUpDate.toDate().toLocaleDateString() : '—'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, capitalize }) {
  return (
    <div className="flex justify-between">
      <span className="text-subtle">{label}</span>
      <span className={`text-ink ${capitalize ? 'capitalize' : ''}`}>{value || '—'}</span>
    </div>
  );
}
