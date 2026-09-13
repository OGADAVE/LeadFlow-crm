import { useMemo } from 'react';
import Topbar from '../layout/Topbar';
import { useConsultants } from '../../hooks/useConsultants';
import { useLeads } from '../../hooks/useLeads';

export default function ConsultantList() {
  const { consultants, loading } = useConsultants();
  const { leads } = useLeads();

  const withMetrics = useMemo(() => {
    return consultants.map((c) => {
      const assigned = leads.filter((l) => l.assignedConsultantId === c.id);
      const closed = assigned.filter((l) => l.status === 'closed');
      const conversionRate = assigned.length ? Math.round((closed.length / assigned.length) * 100) : 0;
      return { ...c, assignedCount: assigned.length, conversionRate };
    });
  }, [consultants, leads]);

  return (
    <div>
      <Topbar title="Consultants" subtitle={`${consultants.length} on the team`} />
      <div className="p-4 sm:p-8">
        {loading ? (
          <p className="text-subtle text-sm">Loading roster…</p>
        ) : withMetrics.length === 0 ? (
          <div className="border border-border bg-card rounded-xl p-8 text-center">
            <p className="text-ink text-lg font-semibold">No consultants yet</p>
            <p className="text-subtle text-sm mt-1">Invite a consultant from the Invite Team screen to see them here.</p>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-x-auto bg-card">
            <div className="min-w-[480px]">
              <div className="text-xs text-subtle uppercase tracking-wide grid grid-cols-12 gap-4 px-4 py-3 border-b border-border">
                <span className="col-span-5">Name</span>
                <span className="col-span-3">Assigned Leads</span>
                <span className="col-span-4">Conversion Rate</span>
              </div>
              {withMetrics.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-border/60 last:border-b-0"
                >
                  <span className="col-span-5 text-sm text-ink flex items-center gap-3 truncate">
                    <span className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center text-xs font-semibold text-white shrink-0">
                      {c.name?.[0]?.toUpperCase() || '?'}
                    </span>
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="col-span-3 text-sm text-ink">{c.assignedCount}</span>
                  <span className="col-span-4 text-sm text-brand-light font-medium">{c.conversionRate}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
