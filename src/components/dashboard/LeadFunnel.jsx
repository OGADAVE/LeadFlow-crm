const STAGES = [
  { key: 'new', label: 'New Leads', color: '#3B82F6' },
  { key: 'contacted', label: 'Contacted', color: '#22D3EE' },
  { key: 'interested', label: 'Interested', color: '#14B8A6' },
  { key: 'inspection_scheduled', label: 'Inspection Scheduled', color: '#F59E0B' },
  { key: 'negotiation', label: 'Negotiation', color: '#A855F7' },
  { key: 'closed', label: 'Closed', color: '#22C55E' }
];

export default function LeadFunnel({ leads }) {
  const total = leads.length || 1;

  // Funnel is cumulative — each stage shows leads currently AT or PAST that
  // point in the pipeline, since a real funnel narrows as prospects convert.
  const stageOrder = STAGES.map((s) => s.key);
  const counts = STAGES.map((stage, idx) => {
    const stagesFromHere = stageOrder.slice(idx);
    return leads.filter((l) => stagesFromHere.includes(l.status)).length;
  });

  return (
    <div className="border border-border bg-card rounded-xl p-6">
      <h3 className="text-sm font-semibold text-ink mb-5">Lead Conversion Funnel</h3>
      <div className="space-y-3">
        {STAGES.map((stage, idx) => {
          const count = counts[idx];
          const pct = Math.round((count / total) * 100);
          return (
            <div key={stage.key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-subtle">{stage.label}</span>
                <span className="text-ink font-medium">{count} · {pct}%</span>
              </div>
              <div className="h-2.5 bg-raised rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: stage.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
