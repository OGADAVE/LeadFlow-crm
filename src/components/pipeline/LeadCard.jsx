import { useDraggable } from '@dnd-kit/core';
import { Link } from 'react-router-dom';

export default function LeadCard({ lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`border border-border bg-card rounded-xl p-3 mb-2 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <p className="text-sm text-ink">{lead.fullName}</p>
      <p className="text-xs text-subtle mt-1 capitalize">{lead.source}</p>
      {lead.budget && (
        <p className=" text-xs text-brand-light mt-1">₦{lead.budget.toLocaleString()}</p>
      )}
      <Link
        to={`/leads/${lead.id}`}
        onClick={(e) => e.stopPropagation()}
        className="text-xs text-brand hover:underline mt-2 inline-block"
      >
        View profile →
      </Link>
    </div>
  );
}
