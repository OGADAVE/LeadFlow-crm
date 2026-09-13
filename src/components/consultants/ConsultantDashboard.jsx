import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Topbar from '../layout/Topbar';
import { useLeads } from '../../hooks/useLeads';
import { useAuth } from '../../context/AuthContext';

function isToday(date) {
  if (!date) return false;
  const d = date.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function ConsultantDashboard() {
  const { user } = useAuth();
  const { leads, loading } = useLeads();

  const myLeads = useMemo(
    () => leads.filter((l) => l.assignedConsultantId === user?.uid),
    [leads, user]
  );

  const todaysFollowUps = useMemo(
    () => myLeads.filter((l) => isToday(l.nextFollowUpDate)),
    [myLeads]
  );

  const upcomingInspections = useMemo(
    () => myLeads.filter((l) => l.status === 'inspection_scheduled'),
    [myLeads]
  );

  return (
    <div>
      <Topbar title="My Dashboard" subtitle="Your assigned leads and today's priorities" />
      <div className="p-4 sm:p-8 space-y-8">
        {loading ? (
          <p className="text-subtle text-sm">Loading…</p>
        ) : (
          <>
            <Section title="Today's Follow-ups" leads={todaysFollowUps} empty="Nothing due today." />
            <Section title="Upcoming Inspections" leads={upcomingInspections} empty="No inspections scheduled." />
            <Section title="All Assigned Leads" leads={myLeads} empty="No leads assigned to you yet." showStatus />
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, leads, empty, showStatus }) {
  return (
    <div>
      <p className="text-xs text-subtle uppercase tracking-wide mb-3">{title}</p>
      {leads.length === 0 ? (
        <p className="text-subtle text-sm">{empty}</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              to={`/leads/${lead.id}`}
              className="flex justify-between items-center px-4 py-3 border-b border-border/60 last:border-b-0 hover:bg-raised/50 transition-colors"
            >
              <span className="text-sm text-ink">{lead.fullName}</span>
              {showStatus && (
                <span className="text-xs text-subtle capitalize">{lead.status?.replace('_', ' ')}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
