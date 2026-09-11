import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const SOURCE_COLORS = {
  facebook: '#3B82F6',
  instagram: '#EC4899',
  website: '#22D3EE',
  whatsapp: '#22C55E',
  referral: '#A855F7',
  walkin: '#F59E0B'
};

const SOURCE_LABELS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  website: 'Website',
  whatsapp: 'WhatsApp',
  referral: 'Referrals',
  walkin: 'Walk-in'
};

export default function LeadSources({ leads }) {
  const total = leads.length;
  const counts = {};
  leads.forEach((l) => {
    const source = l.source || 'unknown';
    counts[source] = (counts[source] || 0) + 1;
  });

  const data = Object.entries(counts)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="border border-border bg-card rounded-xl p-6">
      <h3 className="text-sm font-semibold text-ink mb-5">Lead Sources</h3>

      {total === 0 ? (
        <p className="text-sm text-subtle py-8 text-center">No leads yet.</p>
      ) : (
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="source"
                  innerRadius={38}
                  outerRadius={60}
                  paddingAngle={2}
                >
                  {data.map((entry) => (
                    <Cell key={entry.source} fill={SOURCE_COLORS[entry.source] || '#64748B'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-ink">{total}</span>
              <span className="text-[10px] text-subtle">Total Leads</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {data.map((entry) => (
              <div key={entry.source} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: SOURCE_COLORS[entry.source] || '#64748B' }}
                  />
                  <span className="text-subtle">{SOURCE_LABELS[entry.source] || entry.source}</span>
                </div>
                <span className="text-ink font-medium">
                  {Math.round((entry.count / total) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
