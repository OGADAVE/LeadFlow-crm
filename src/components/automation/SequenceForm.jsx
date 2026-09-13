import { useState, useEffect } from 'react';
import { addDoc, updateDoc, doc, collection, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';

const TRIGGERS = [
  { value: 'lead_created', label: 'When a new lead is created' }
];

export default function SequenceForm({ existingSequence, onDone }) {
  const { profile } = useAuth();
  const { templates } = useEmailTemplates();
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('lead_created');
  const [active, setActive] = useState(true);
  const [steps, setSteps] = useState([{ order: 1, templateId: '', delayDays: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingSequence) {
      setName(existingSequence.name || '');
      setTrigger(existingSequence.trigger || 'lead_created');
      setActive(existingSequence.active ?? true);
      setSteps(existingSequence.steps?.length ? existingSequence.steps : [{ order: 1, templateId: '', delayDays: 0 }]);
    }
  }, [existingSequence]);

  function addStep() {
    setSteps([...steps, { order: steps.length + 1, templateId: '', delayDays: 3 }]);
  }

  function removeStep(idx) {
    const updated = steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 }));
    setSteps(updated.length ? updated : [{ order: 1, templateId: '', delayDays: 0 }]);
  }

  function updateStep(idx, field, value) {
    setSteps(steps.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!profile?.companyId) return;

    const incompleteStep = steps.find((s) => !s.templateId);
    if (incompleteStep) {
      alert('Every step needs a template selected.');
      return;
    }

    setSaving(true);

    const payload = {
      name,
      trigger,
      active,
      steps: steps.map((s) => ({ ...s, delayDays: Number(s.delayDays) || 0 }))
    };

    if (existingSequence) {
      await updateDoc(doc(db, 'companies', profile.companyId, 'sequences', existingSequence.id), payload);
    } else {
      await addDoc(collection(db, 'companies', profile.companyId, 'sequences'), {
        ...payload,
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
          <label className="text-xs text-subtle uppercase tracking-wide block mb-2">Sequence Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
            placeholder="New Lead Nurture"
          />
        </div>
        <div>
          <label className="text-xs text-subtle uppercase tracking-wide block mb-2">Trigger</label>
          <select
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            className="w-full bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
          >
            {TRIGGERS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-brand" />
        Active — new matching leads will be enrolled automatically
      </label>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-subtle uppercase tracking-wide">Steps</label>
          <button type="button" onClick={addStep} className="flex items-center gap-1 text-xs text-brand hover:underline">
            <Plus size={14} /> Add step
          </button>
        </div>

        {templates.length === 0 && (
          <p className="text-xs text-warning bg-warning/10 rounded-lg px-3 py-2 mb-3">
            You don't have any email templates yet — create one first, then come back to build this sequence.
          </p>
        )}

        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2 border border-border rounded-lg p-3">
              <span className="text-xs text-subtle w-6 shrink-0">#{step.order}</span>
              <select
                value={step.templateId}
                onChange={(e) => updateStep(idx, 'templateId', e.target.value)}
                className="flex-1 bg-navy border border-border rounded-lg px-3 py-2 text-sm text-ink focus:border-brand outline-none"
              >
                <option value="">Select a template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min="0"
                  value={step.delayDays}
                  onChange={(e) => updateStep(idx, 'delayDays', e.target.value)}
                  className="w-16 bg-navy border border-border rounded-lg px-2 py-2 text-sm text-ink focus:border-brand outline-none"
                />
                <span className="text-xs text-subtle whitespace-nowrap">
                  {idx === 0 ? 'days after trigger' : 'days after previous'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeStep(idx)}
                className="p-2 text-subtle hover:text-danger transition-colors shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-gradient text-white text-sm font-medium rounded-lg px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving…' : existingSequence ? 'Save changes' : 'Create sequence'}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-subtle hover:text-ink px-5 py-2.5">
          Cancel
        </button>
      </div>
    </form>
  );
}
