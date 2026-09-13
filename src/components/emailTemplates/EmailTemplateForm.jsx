import { useState, useEffect } from 'react';
import { addDoc, updateDoc, doc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  'welcome', 'property_launch', 'newsletter', 'brochure', 'investment_tips',
  'testimonial', 'inspection_reminder', 'price_update', 'payment_reminder', 'birthday'
];

export default function EmailTemplateForm({ existingTemplate, onDone }) {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    name: '',
    category: 'welcome',
    subject: '',
    previewText: '',
    htmlBody: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingTemplate) {
      setForm({
        name: existingTemplate.name || '',
        category: existingTemplate.category || 'welcome',
        subject: existingTemplate.subject || '',
        previewText: existingTemplate.previewText || '',
        htmlBody: existingTemplate.htmlBody || ''
      });
    }
  }, [existingTemplate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!profile?.companyId) return;
    setSaving(true);

    if (existingTemplate) {
      await updateDoc(
        doc(db, 'companies', profile.companyId, 'emailTemplates', existingTemplate.id),
        { ...form, isCustom: true }
      );
    } else {
      await addDoc(collection(db, 'companies', profile.companyId, 'emailTemplates'), {
        ...form,
        isCustom: true,
        createdAt: serverTimestamp()
      });
    }

    setSaving(false);
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-card rounded-xl p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-subtle uppercase tracking-wide block mb-2">Template Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
            placeholder="Welcome Email"
          />
        </div>
        <div>
          <label className="text-xs text-subtle uppercase tracking-wide block mb-2">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none capitalize"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-subtle uppercase tracking-wide block mb-2">Subject Line</label>
        <input
          required
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
          placeholder="Welcome to LeadFlow, {{fullName}}!"
        />
      </div>

      <div>
        <label className="text-xs text-subtle uppercase tracking-wide block mb-2">Preview Text</label>
        <input
          value={form.previewText}
          onChange={(e) => setForm({ ...form, previewText: e.target.value })}
          className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
          placeholder="Shown as the inbox preview snippet"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-subtle uppercase tracking-wide">HTML Body</label>
          <span className="text-xs text-subtle">
            Placeholders: <code className="text-brand-light">{'{{fullName}}'}</code>{' '}
            <code className="text-brand-light">{'{{consultantName}}'}</code>
          </span>
        </div>
        <textarea
          required
          rows={8}
          value={form.htmlBody}
          onChange={(e) => setForm({ ...form, htmlBody: e.target.value })}
          className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none font-mono text-xs"
          placeholder="<p>Hi {{fullName}}, thanks for your interest...</p>"
        />
      </div>

      {form.htmlBody && (
        <div>
          <p className="text-xs text-subtle uppercase tracking-wide mb-2">Preview</p>
          <div
            className="border border-border rounded-lg p-4 bg-white text-black text-sm max-h-48 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: form.htmlBody }}
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-gradient text-white text-sm font-medium rounded-lg px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving…' : existingTemplate ? 'Save changes' : 'Create template'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-subtle hover:text-ink px-5 py-2.5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
