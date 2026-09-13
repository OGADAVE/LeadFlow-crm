import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { MessageCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { createNotification } from '../../lib/notifications';
import { useAuth } from '../../context/AuthContext';
import Topbar from '../layout/Topbar';
import LeadTimeline from './LeadTimeline';

export default function LeadProfile() {
  const { leadId } = useParams();
  const { profile } = useAuth();
  const [lead, setLead] = useState(null);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);

  useEffect(() => {
    if (!profile?.companyId || !leadId) return;
    return onSnapshot(doc(db, 'companies', profile.companyId, 'leads', leadId), (snap) => {
      setLead(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  }, [profile?.companyId, leadId]);

  if (!lead) return <div className="p-8 text-subtle text-sm">Loading…</div>;

  async function handleWhatsappClick() {
    if (!lead.whatsapp || !profile?.companyId) return;
    setSendingWhatsapp(true);

    // Strip anything that isn't a digit or leading + — wa.me needs the
    // number in international format with no spaces/dashes/parens.
    const cleanNumber = lead.whatsapp.replace(/[^\d+]/g, '').replace(/^\+/, '');
    const message = `Hi ${lead.fullName}, this is ${profile.role === 'admin' ? 'the team' : 'your consultant'} at LeadFlow following up on your interest in ${lead.interestedPropertyId ? 'your selected property' : 'our properties'}.`;

    try {
      await addDoc(collection(db, 'companies', profile.companyId, 'whatsappClicks'), {
        leadId: lead.id,
        clickedAt: serverTimestamp()
      });

      await addDoc(
        collection(db, 'companies', profile.companyId, 'leads', lead.id, 'timeline'),
        {
          type: 'whatsapp_clicked',
          meta: {},
          createdAt: serverTimestamp(),
          actorUserId: profile.userId
        }
      );

      await createNotification(profile.companyId, {
        type: 'whatsapp_clicked',
        message: `WhatsApp opened for ${lead.fullName}`,
        leadId: lead.id
      });
    } finally {
      setSendingWhatsapp(false);
      window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }
  }

  return (
    <div>
      <Topbar title={lead.fullName} subtitle={`Lead · ${lead.source}`} />
      <div className="p-4 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        <div className="col-span-2">
          <p className="text-xs text-subtle uppercase tracking-wide mb-3">Timeline</p>
          <div className="border border-border bg-card rounded-xl px-4">
            <LeadTimeline leadId={lead.id} />
          </div>
        </div>
        <div className="space-y-6">
          {lead.whatsapp && (
            <button
              onClick={handleWhatsappClick}
              disabled={sendingWhatsapp}
              className="w-full flex items-center justify-center gap-2 bg-success text-white text-sm font-medium rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <MessageCircle size={16} />
              {sendingWhatsapp ? 'Opening…' : 'Message on WhatsApp'}
            </button>
          )}
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
