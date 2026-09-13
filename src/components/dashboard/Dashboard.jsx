import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus2, Flame, CalendarClock, CheckCircle2 } from 'lucide-react';
import KPICard from './KPICard';
import LeadFunnel from './LeadFunnel';
import LeadSources from './LeadSources';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import { useLeads } from '../../hooks/useLeads';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { leads, loading } = useLeads();
  const { user } = useAuth();

  const counts = useMemo(() => {
    const base = { total: leads.length, new: 0, followUpDue: 0, closed: 0 };
    const now = Date.now();
    leads.forEach((lead) => {
      if (lead.status === 'new') base.new += 1;
      if (lead.status === 'closed') base.closed += 1;
      if (lead.nextFollowUpDate?.toMillis && lead.nextFollowUpDate.toMillis() <= now) {
        base.followUpDue += 1;
      }
    });
    return base;
  }, [leads]);

  const firstName = user?.email?.split('@')[0] || 'there';

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">
          Good day, <span className="brand-text capitalize">{firstName}</span> 👋
        </h1>
        <p className="text-sm text-subtle mt-1">Here's what's happening with your leads today.</p>
      </div>

      {loading ? (
        <p className="text-subtle text-sm">Loading dashboard…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KPICard
              label="Total Leads"
              value={counts.total}
              icon={Users}
              iconBg="#3B82F622"
              iconColor="#3B82F6"
            />
            <KPICard
              label="New Leads"
              value={counts.new}
              icon={UserPlus2}
              iconBg="#22C55E22"
              iconColor="#22C55E"
            />
            <KPICard
              label="Follow-ups Due"
              value={counts.followUpDue}
              icon={CalendarClock}
              iconBg="#F59E0B22"
              iconColor="#F59E0B"
            />
            <KPICard
              label="Closed Sales"
              value={counts.closed}
              icon={CheckCircle2}
              iconBg="#A855F722"
              iconColor="#A855F7"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <LeadFunnel leads={leads} />
            <LeadSources leads={leads} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity />
            <QuickActions />
          </div>

          {leads.length === 0 && (
            <p className="text-xs text-subtle mt-6 text-center">
              Charts and activity will fill in as leads come through — try{' '}
              <Link to="/leads" className="text-brand hover:underline">adding your first lead</Link>.
            </p>
          )}
        </>
      )}
    </div>
  );
}
