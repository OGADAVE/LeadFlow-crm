import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import Topbar from '../layout/Topbar';
import LeadForm from './LeadForm';
import { useLeads } from '../../hooks/useLeads';

const STATUS_STYLES = {
  new: 'bg-brand/15 text-brand-light',
  contacted: 'bg-ink/10 text-ink',
  interested: 'bg-success/15 text-success',
  inspection_scheduled: 'bg-purple/15 text-purple',
  negotiation: 'bg-purple/15 text-purple',
  closed: 'bg-success/15 text-success',
  lost: 'bg-danger/15 text-danger'
};

export default function LeadList() {
  const { leads, loading } = useLeads();
  const [showForm, setShowForm] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    return leads.filter((l) => l.fullName?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [leads, searchQuery]);

  return (
    <div>
      <Topbar title="Leads" subtitle={`${leads.length} total leads`} />
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="text-sm border border-brand text-brand rounded-lg px-4 py-2 hover:bg-brand-gradient hover:text-white transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add lead'}
          </button>

          {searchQuery && (
            <div className="flex items-center gap-2 text-sm text-subtle bg-card border border-border rounded-lg px-3 py-2">
              <Search size={14} />
              Filtering by "{searchQuery}"
              <button
                onClick={() => setSearchParams({})}
                className="text-brand hover:underline ml-1"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {showForm && (
          <div className="mb-6 max-w-md">
            <LeadForm onDone={() => setShowForm(false)} />
          </div>
        )}

        {loading ? (
          <p className="text-subtle text-sm">Loading leads…</p>
        ) : filteredLeads.length === 0 ? (
          <div className="border border-border bg-card rounded-xl p-8 text-center">
            <p className="text-ink text-lg font-semibold">No leads found</p>
            <p className="text-subtle text-sm mt-1">
              {searchQuery
                ? 'Try a different search term.'
                : 'New leads from your capture channels will appear here as they come in.'}
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <div className="text-xs text-subtle uppercase tracking-wide grid grid-cols-12 gap-4 px-4 py-3 border-b border-border">
              <span className="col-span-3">Name</span>
              <span className="col-span-2">Source</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-2">Consultant</span>
              <span className="col-span-2">Next Follow-up</span>
            </div>
            {filteredLeads.map((lead) => (
              <Link
                key={lead.id}
                to={`/leads/${lead.id}`}
                className="grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-border/60 last:border-b-0 hover:bg-raised/50 transition-colors"
              >
                <span className="col-span-3 text-sm text-ink font-medium">{lead.fullName}</span>
                <span className="col-span-2 text-sm text-subtle capitalize">{lead.source}</span>
                <span className="col-span-2">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[lead.status] || 'bg-raised text-subtle'}`}>
                    {lead.status?.replace('_', ' ')}
                  </span>
                </span>
                <span className="col-span-2 text-sm text-subtle">
                  {lead.assignedConsultantId || '—'}
                </span>
                <span className="col-span-2 text-sm text-subtle">
                  {lead.nextFollowUpDate?.toDate
                    ? lead.nextFollowUpDate.toDate().toLocaleDateString()
                    : '—'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
