import { Facebook, Mail, MessageCircle, CalendarCheck, ArrowRightLeft, Sparkles } from 'lucide-react';
import { useRecentActivity } from '../../hooks/useRecentActivity';

const EVENT_META = {
  lead_created: { label: 'New lead created', icon: Sparkles, color: '#3B82F6' },
  email_sent: { label: 'Email sent', icon: Mail, color: '#22D3EE' },
  email_opened: { label: 'Email opened', icon: Mail, color: '#22C55E' },
  brochure_downloaded: { label: 'Brochure downloaded', icon: Mail, color: '#F59E0B' },
  whatsapp_clicked: { label: 'WhatsApp clicked', icon: MessageCircle, color: '#22C55E' },
  status_changed: { label: 'Lead status updated', icon: ArrowRightLeft, color: '#A855F7' },
  inspection_booked: { label: 'Inspection booked', icon: CalendarCheck, color: '#F59E0B' }
};

function timeAgo(date) {
  if (!date?.toDate) return '';
  const diffMs = Date.now() - date.toDate().getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function RecentActivity() {
  const { events, loading } = useRecentActivity();

  return (
    <div className="border border-border bg-card rounded-xl p-6">
      <h3 className="text-sm font-semibold text-ink mb-4">Recent Activity</h3>
      {loading ? (
        <p className="text-sm text-subtle">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-subtle py-4">No activity recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const meta = EVENT_META[event.type] || { label: event.type, icon: Sparkles, color: '#64748B' };
            const Icon = meta.icon;
            return (
              <div key={event.id} className="flex items-start gap-3">
                <div
                  className="icon-tile w-8 h-8 shrink-0"
                  style={{ backgroundColor: `${meta.color}22` }}
                >
                  <Icon size={14} color={meta.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{meta.label}</p>
                </div>
                <span className="text-xs text-subtle shrink-0">{timeAgo(event.createdAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
