import { useDroppable } from '@dnd-kit/core';
import LeadCard from './LeadCard';

export default function PipelineColumn({ stage, leads }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });

  return (
    <div
      ref={setNodeRef}
      className={`w-64 shrink-0 border border-border bg-card/50 rounded-xl flex flex-col ${
        isOver ? 'border-brand' : ''
      }`}
    >
      <div className="px-3 py-3 border-b border-border">
        <p className="text-sm text-ink">{stage.label}</p>
        <p className="text-xs text-subtle uppercase tracking-wide mt-0.5">{leads.length} LEAD{leads.length === 1 ? '' : 'S'}</p>
      </div>
      <div className="p-2 flex-1 min-h-[200px] overflow-y-auto">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}
