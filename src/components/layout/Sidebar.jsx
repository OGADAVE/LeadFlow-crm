import { NavLink } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Users, KanbanSquare, Building2, UserCog, UserPlus, LogOut, X, Mail, Zap, BarChart3 } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Logo from './Logo';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/properties', label: 'Properties', icon: Building2 },
  { to: '/consultants', label: 'Consultants', icon: UserCog },
  { to: '/email-templates', label: 'Email Templates', icon: Mail },
  { to: '/automation', label: 'Automation', icon: Zap },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 }
];

export default function Sidebar({ open, onClose }) {
  const { profile, user } = useAuth();
  const isAdmin = profile?.role === 'admin';

  return (
    <>
      {/* Overlay — only shown on small screens when the sidebar is open */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}

      <aside
        className={`w-64 shrink-0 border-r border-border bg-panel h-screen flex flex-col
          fixed top-0 left-0 z-40 transition-transform duration-200
          md:sticky md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="px-5 py-6 flex items-center justify-between">
          <Logo />
          <button onClick={onClose} className="md:hidden text-subtle hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {profile?.role === 'consultant' && (
            <SidebarLink to="/my-dashboard" label="My Dashboard" icon={LayoutDashboard} onNavigate={onClose} />
          )}
          {links.map((link) => (
            <SidebarLink
              key={link.to}
              to={link.to}
              label={link.label}
              icon={link.icon}
              end={link.to === '/'}
              onNavigate={onClose}
            />
          ))}
          {isAdmin && <SidebarLink to="/invite" label="Invite Team" icon={UserPlus} onNavigate={onClose} />}
        </nav>

        <div className="border-t border-border px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-sm font-semibold text-white shrink-0">
              {(user?.email || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-ink truncate">{user?.email}</p>
              <p className="text-xs text-subtle capitalize">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 text-xs text-subtle hover:text-ink transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({ to, label, icon: Icon, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-brand-gradient text-white font-medium'
            : 'text-subtle hover:text-ink hover:bg-raised'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}
