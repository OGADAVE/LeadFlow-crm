import { useState } from 'react';
import { updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Trash2, Pencil, Send, BellRing } from 'lucide-react';
import Topbar from '../layout/Topbar';
import SequenceForm from './SequenceForm';
import { useSequences } from '../../hooks/useSequences';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { callWorker } from '../../lib/api';

export default function SequenceList() {
  const { sequences, loading } = useSequences();
  const { templates } = useEmailTemplates();
  const { profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingSequence, setEditingSequence] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const isAdmin = profile?.role === 'admin';

  function templateName(templateId) {
    return templates.find((t) => t.id === templateId)?.name || 'Unknown template';
  }

  async function toggleActive(sequence) {
    await updateDoc(doc(db, 'companies', profile.companyId, 'sequences', sequence.id), {
      active: !sequence.active
    });
  }

  async function handleDelete(sequenceId) {
    if (!confirm('Delete this sequence? Leads already enrolled will stop receiving further steps.')) return;
    await deleteDoc(doc(db, 'companies', profile.companyId, 'sequences', sequenceId));
  }

  async function handleTriggerNow() {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const result = await callWorker('/api/trigger-sequences', {});
      setTriggerResult({ ok: true, processed: result.processed });
    } catch (err) {
      setTriggerResult({ ok: false, message: err.message });
    } finally {
      setTriggering(false);
    }
  }

  async function handleRunFollowUpScan() {
    setScanning(true);
    setScanResult(null);
    try {
      const result = await callWorker('/api/trigger-followup-scan', {});
      setScanResult({ ok: true, ...result });
    } catch (err) {
      setScanResult({ ok: false, message: err.message });
    } finally {
      setScanning(false);
    }
  }

  return (
    <div>
      <Topbar title="Email Automation" subtitle={`${sequences.length} sequences`} />
      <div className="p-4 sm:p-8">
        {isAdmin && (
          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                setEditingSequence(null);
                setShowForm((s) => !s);
              }}
              className="text-sm border border-brand text-brand rounded-lg px-4 py-2 hover:bg-brand-gradient hover:text-white transition-colors"
            >
              {showForm ? 'Cancel' : '+ New sequence'}
            </button>
            <button
              onClick={handleTriggerNow}
              disabled={triggering}
              className="flex items-center gap-1.5 text-sm border border-border text-subtle rounded-lg px-4 py-2 hover:bg-raised hover:text-ink transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {triggering ? 'Sending…' : 'Send due emails now'}
            </button>
            {triggerResult && (
              <span className={`text-xs ${triggerResult.ok ? 'text-success' : 'text-danger'}`}>
                {triggerResult.ok
                  ? `Processed ${triggerResult.processed} due enrollment${triggerResult.processed === 1 ? '' : 's'}.`
                  : `Failed: ${triggerResult.message}`}
              </span>
            )}
            <button
              onClick={handleRunFollowUpScan}
              disabled={scanning}
              className="flex items-center gap-1.5 text-sm border border-border text-subtle rounded-lg px-4 py-2 hover:bg-raised hover:text-ink transition-colors disabled:opacity-50"
            >
              <BellRing size={14} />
              {scanning ? 'Scanning…' : 'Run follow-up scan now'}
            </button>
            {scanResult && (
              <span className={`text-xs ${scanResult.ok ? 'text-success' : 'text-danger'}`}>
                {scanResult.ok
                  ? `${scanResult.totalDueLeads} lead${scanResult.totalDueLeads === 1 ? '' : 's'} due across ${scanResult.companiesNotified} compan${scanResult.companiesNotified === 1 ? 'y' : 'ies'}.`
                  : `Failed: ${scanResult.message}`}
              </span>
            )}
          </div>
        )}

        {showForm && (
          <div className="mb-6 max-w-2xl">
            <SequenceForm
              existingSequence={editingSequence}
              onDone={() => {
                setShowForm(false);
                setEditingSequence(null);
              }}
            />
          </div>
        )}

        {loading ? (
          <p className="text-subtle text-sm">Loading sequences…</p>
        ) : sequences.length === 0 ? (
          <div className="border border-border bg-card rounded-xl p-8 text-center">
            <p className="text-ink text-lg font-semibold">No sequences yet</p>
            <p className="text-subtle text-sm mt-1">
              {isAdmin ? 'Build a sequence to automatically nurture new leads by email.' : 'Check back once your admin sets one up.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sequences.map((sequence) => (
              <div key={sequence.id} className="border border-border bg-card rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-ink font-semibold">{sequence.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sequence.active ? 'bg-success/15 text-success' : 'bg-raised text-subtle'}`}>
                        {sequence.active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-xs text-subtle mt-1">
                      Triggers when a new lead is created · {sequence.steps?.length || 0} step{sequence.steps?.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(sequence)}
                        className="text-xs border border-border text-subtle rounded-lg px-3 py-1.5 hover:bg-raised hover:text-ink transition-colors"
                      >
                        {sequence.active ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingSequence(sequence);
                          setShowForm(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-raised text-subtle hover:text-brand-light transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(sequence.id)}
                        className="p-1.5 rounded-lg hover:bg-raised text-subtle hover:text-danger transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {sequence.steps?.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="bg-raised text-ink rounded-lg px-3 py-1.5">
                        Day {step.delayDays}: {templateName(step.templateId)}
                      </span>
                      {idx < sequence.steps.length - 1 && <span className="text-subtle">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
