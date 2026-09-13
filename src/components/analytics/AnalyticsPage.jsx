import { useMemo } from 'react';
import Papa from 'papaparse';
import { Download, Mail, MousePointerClick, Send } from 'lucide-react';
import Topbar from '../layout/Topbar';
import { useLeads } from '../../hooks/useLeads';
import { useConsultants } from '../../hooks/useConsultants';
import { useEmailPerformance } from '../../hooks/useEmailPerformance';

const SOURCE_LABELS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  website: 'Website',
  whatsapp: 'WhatsApp',
  referral: 'Referrals',
  walkin: 'Walk-in'
};

export default function AnalyticsPage() {
  const { leads, loading: leadsLoading } = useLeads();
  const { consultants, loading: consultantsLoading } = useConsultants();
  const { counts: emailCounts, loading: emailLoading } = useEmailPerformance();

  const sourcePerformance = useMemo(() => {
    const bySource = {};
    leads.forEach((lead) => {
      const source = lead.source || 'unknown';
      if (!bySource[source]) bySource[source] = { total: 0, closed: 0 };
      bySource[source].total += 1;
      if (lead.status === 'closed') bySource[source].closed += 1;
    });
    return Object.entries(bySource)
      .map(([source, data]) => ({
        source,
        total: data.total,
        closed: data.closed,
        conversionRate: data.total ? Math.round((data.closed / data.total) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [leads]);

  const consultantPerformance = useMemo(() => {
    return consultants
      .map((c) => {
        const assigned = leads.filter((l) => l.assignedConsultantId === c.id);
        const closed = assigned.filter((l) => l.status === 'closed');
        return {
          name: c.name,
          assigned: assigned.length,
          closed: closed.length,
          conversionRate: assigned.length ? Math.round((closed.length / assigned.length) * 100) : 0
        };
      })
      .sort((a, b) => b.assigned - a.assigned);
  }, [consultants, leads]);

  const openRate = emailCounts.sent ? Math.round((emailCounts.opened / emailCounts.sent) * 100) : 0;
  const clickRate = emailCounts.sent ? Math.round((emailCounts.clicked / emailCounts.sent) * 100) : 0;

  function handleExportCSV() {
    const rows = [
      { section: 'Email Performance', metric: 'Sent', value: emailCounts.sent },
      { section: 'Email Performance', metric: 'Opened', value: emailCounts.opened },
      { section: 'Email Performance', metric: 'Clicked', value: emailCounts.clicked },
      { section: 'Email Performance', metric: 'Open Rate %', value: openRate },
      { section: 'Email Performance', metric: 'Click Rate %', value: clickRate },
      ...sourcePerformance.map((s) => ({
        section: 'Lead Source Performance',
        metric: SOURCE_LABELS[s.source] || s.source,
        value: `${s.total} leads, ${s.closed} closed, ${s.conversionRate}% conversion`
      })),
      ...consultantPerformance.map((c) => ({
        section: 'Consultant Performance',
        metric: c.name,
        value: `${c.assigned} assigned, ${c.closed} closed, ${c.conversionRate}% conversion`
      }))
    ];
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leadflow-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const loading = leadsLoading || consultantsLoading || emailLoading;

  return (
    <div>
      <Topbar title="Analytics" subtitle="Performance across email, sources, and your team" />
      <div className="p-4 sm:p-8 space-y-6">
        <div className="flex justify-end">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-sm border border-brand text-brand rounded-lg px-4 py-2 hover:bg-brand-gradient hover:text-white transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>

        {loading ? (
          <p className="text-subtle text-sm">Loading analytics…</p>
        ) : (
          <>
            {/* Email Performance */}
            <div className="border border-border bg-card rounded-xl p-6">
              <h3 className="text-sm font-semibold text-ink mb-4">Email Performance</h3>
              <p className="text-xs text-subtle mb-4">
                Based on the last 1,000 timeline events — sequence emails sent through Automation only.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricTile icon={Send} label="Sent" value={emailCounts.sent} color="#3B82F6" />
                <MetricTile icon={Mail} label="Opened" value={emailCounts.opened} color="#22C55E" />
                <MetricTile icon={MousePointerClick} label="Clicked" value={emailCounts.clicked} color="#A855F7" />
                <MetricTile icon={Mail} label="Open / Click Rate" value={`${openRate}% / ${clickRate}%`} color="#F59E0B" />
              </div>
            </div>

            {/* Lead Source Performance */}
            <div className="border border-border bg-card rounded-xl p-6">
              <h3 className="text-sm font-semibold text-ink mb-4">Lead Source Performance</h3>
              {sourcePerformance.length === 0 ? (
                <p className="text-sm text-subtle">No leads yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead>
                      <tr className="text-xs text-subtle uppercase tracking-wide border-b border-border">
                        <th className="text-left py-2">Source</th>
                        <th className="text-left py-2">Leads</th>
                        <th className="text-left py-2">Closed</th>
                        <th className="text-left py-2">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sourcePerformance.map((s) => (
                        <tr key={s.source} className="border-b border-border/60 last:border-b-0">
                          <td className="py-2 text-ink capitalize">{SOURCE_LABELS[s.source] || s.source}</td>
                          <td className="py-2 text-ink">{s.total}</td>
                          <td className="py-2 text-ink">{s.closed}</td>
                          <td className="py-2 text-brand-light font-medium">{s.conversionRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Consultant Performance */}
            <div className="border border-border bg-card rounded-xl p-6">
              <h3 className="text-sm font-semibold text-ink mb-4">Consultant Performance</h3>
              {consultantPerformance.length === 0 ? (
                <p className="text-sm text-subtle">No consultants yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead>
                      <tr className="text-xs text-subtle uppercase tracking-wide border-b border-border">
                        <th className="text-left py-2">Consultant</th>
                        <th className="text-left py-2">Assigned</th>
                        <th className="text-left py-2">Closed</th>
                        <th className="text-left py-2">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultantPerformance.map((c) => (
                        <tr key={c.name} className="border-b border-border/60 last:border-b-0">
                          <td className="py-2 text-ink">{c.name}</td>
                          <td className="py-2 text-ink">{c.assigned}</td>
                          <td className="py-2 text-ink">{c.closed}</td>
                          <td className="py-2 text-brand-light font-medium">{c.conversionRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricTile({ icon: Icon, label, value, color }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="icon-tile w-8 h-8 mb-2" style={{ backgroundColor: `${color}22` }}>
        <Icon size={16} color={color} />
      </div>
      <p className="text-xl font-bold text-ink">{value}</p>
      <p className="text-xs text-subtle mt-0.5">{label}</p>
    </div>
  );
}
