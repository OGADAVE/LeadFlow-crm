import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

export default function PropertyForm({ onDone }) {
  const { profile } = useAuth();
  const [form, setForm] = useState({ name: '', location: '', priceFrom: '', priceTo: '', brochureUrl: '' });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!profile?.companyId) return;
    setSaving(true);

    await addDoc(collection(db, 'companies', profile.companyId, 'properties'), {
      name: form.name,
      location: form.location,
      priceFrom: form.priceFrom ? Number(form.priceFrom) : null,
      priceTo: form.priceTo ? Number(form.priceTo) : null,
      brochureUrl: form.brochureUrl,
      imageUrls: [],
      status: 'available',
      createdAt: serverTimestamp()
    });

    setSaving(false);
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-card rounded-xl p-6 space-y-4">
      <div>
        <label className="text-xs text-subtle uppercase tracking-wide block mb-2">PROPERTY NAME</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
          placeholder="Everstead Estate II"
        />
      </div>
      <div>
        <label className="text-xs text-subtle uppercase tracking-wide block mb-2">LOCATION</label>
        <input
          required
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
          placeholder="Gwarinpa, Abuja"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-subtle uppercase tracking-wide block mb-2">PRICE FROM (₦)</label>
          <input
            type="number"
            value={form.priceFrom}
            onChange={(e) => setForm({ ...form, priceFrom: e.target.value })}
            className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-subtle uppercase tracking-wide block mb-2">PRICE TO (₦)</label>
          <input
            type="number"
            value={form.priceTo}
            onChange={(e) => setForm({ ...form, priceTo: e.target.value })}
            className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-subtle uppercase tracking-wide block mb-2">BROCHURE URL</label>
        <input
          value={form.brochureUrl}
          onChange={(e) => setForm({ ...form, brochureUrl: e.target.value })}
          className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
          placeholder="Cloudinary link"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-brand-gradient text-white text-sm py-2.5 rounded-lg font-medium mt-2 hover:opacity-90 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Add property'}
      </button>
    </form>
  );
}
