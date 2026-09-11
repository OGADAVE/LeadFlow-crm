import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useConsultants } from '../../hooks/useConsultants';

const SOURCES = ['facebook', 'instagram', 'website', 'referral', 'walkin', 'whatsapp'];

export default function LeadForm({ onDone }) {
  const { profile } = useAuth();
  const { consultants } = useConsultants();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    source: 'referral',
    budget: '',
    assignedConsultantId: ''
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!profile?.companyId) return;
    setSaving(true);

    // The timeline event is written directly here (client-side) since we're
    // not running Cloud Functions — see README for the integrity tradeoff.
    const leadRef = await addDoc(collection(db, 'companies', profile.companyId, 'leads'), {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      whatsapp: form.whatsapp,
      source: form.source,
      budget: form.budget ? Number(form.budget) : null,
      assignedConsultantId: form.assignedConsultantId || null,
      interestedPropertyId: null,
      status: 'new',
      lastContactDate: null,
      nextFollowUpDate: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      tags: []
    });

    await addDoc(
      collection(db, 'companies', profile.companyId, 'leads', leadRef.id, 'timeline'),
      {
        type: 'lead_created',
        meta: { source: form.source },
        createdAt: serverTimestamp(),
        actorUserId: profile.userId
      }
    );

    setSaving(false);
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-card rounded-xl p-6 space-y-4">
      <div>
        <label className="text-xs text-subtle uppercase tracking-wide block mb-2">FULL NAME</label>
        <input
          required
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-subtle uppercase tracking-wide block mb-2">EMAIL</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-subtle uppercase tracking-wide block mb-2">PHONE</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-subtle uppercase tracking-wide block mb-2">WHATSAPP</label>
          <input
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
            placeholder="+234…"
          />
        </div>
        <div>
          <label className="text-xs text-subtle uppercase tracking-wide block mb-2">BUDGET (₦)</label>
          <input
            type="number"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-subtle uppercase tracking-wide block mb-2">SOURCE</label>
          <select
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none capitalize"
          >
            {SOURCES.map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-subtle uppercase tracking-wide block mb-2">ASSIGN TO</label>
          <select
            value={form.assignedConsultantId}
            onChange={(e) => setForm({ ...form, assignedConsultantId: e.target.value })}
            className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
          >
            <option value="">Unassigned</option>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-brand-gradient text-white text-sm py-2.5 rounded-lg font-medium mt-2 hover:opacity-90 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Add lead'}
      </button>
    </form>
  );
}
