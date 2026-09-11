import { useNavigate } from 'react-router-dom';
import { UserPlus, Building2, Megaphone, Mail } from 'lucide-react';

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { label: 'Add Lead', icon: UserPlus, onClick: () => navigate('/leads') },
    { label: 'Add Property', icon: Building2, onClick: () => navigate('/properties') },
    { label: 'Create Campaign', icon: Megaphone, disabled: true },
    { label: 'Send Email', icon: Mail, disabled: true }
  ];

  return (
    <div className="border border-border bg-card rounded-xl p-6">
      <h3 className="text-sm font-semibold text-ink mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.disabled ? 'Coming soon' : undefined}
            className="flex items-center gap-2 border border-border rounded-lg px-3 py-3 text-sm text-ink hover:bg-raised transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <action.icon size={16} className="text-brand-light" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
