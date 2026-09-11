import { DndContext } from '@dnd-kit/core';
import { doc, addDoc, collection, updateDoc, serverTimestamp } from 'firebase/firestore';
import Topbar from '../layout/Topbar';
import PipelineColumn from './PipelineColumn';
import { useLeads } from '../../hooks/useLeads';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';

const STAGES = [
  { key: 'new', label: 'New Lead' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'interested', label: 'Interested' },
  { key: 'inspection_scheduled', label: 'Inspection Scheduled' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'closed', label: 'Closed' },
  { key: 'lost', label: 'Lost' }
];

export default function PipelineBoard() {
  const { leads } = useLeads();
  const { profile } = useAuth();

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || !profile?.companyId) return;

    const leadId = active.id;
    const newStatus = over.id;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    const previousStatus = lead.status;

    // The timeline event is written directly here (client-side) since we're
    // not running Cloud Functions — see README for the integrity tradeoff.
    await updateDoc(doc(db, 'companies', profile.companyId, 'leads', leadId), {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    await addDoc(
      collection(db, 'companies', profile.companyId, 'leads', leadId, 'timeline'),
      {
        type: 'status_changed',
        meta: { fromStatus: previousStatus, toStatus: newStatus },
        createdAt: serverTimestamp(),
        actorUserId: profile.userId
      }
    );
  }

  return (
    <div>
      <Topbar title="Pipeline" subtitle="Drag a lead to move it through the funnel" />
      <div className="p-8 overflow-x-auto">
        <DndContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4">
            {STAGES.map((stage) => (
              <PipelineColumn
                key={stage.key}
                stage={stage}
                leads={leads.filter((l) => l.status === stage.key)}
              />
            ))}
          </div>
        </DndContext>
      </div>
    </div>
  );
}
