import { NavLink } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Users, KanbanSquare, Building2, UserCog, UserPlus, LogOut } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Logo from './Logo';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/properties', label: 'Properties', icon: Building2 },
  { to: '/consultants', label: 'Consultants', icon: UserCog }
];

export default function Sidebar() {
  const { profile, user } = useAuth();
  const isAdmin = profile?.role === 'admin';

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-panel h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-6">
        <Logo />
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {profile?.role === 'consultant' && (
          <SidebarLink to="/my-dashboard" label="My Dashboard" icon={LayoutDashboard} />
        )}
        {links.map((link) => (
          <SidebarLink key={link.to} to={link.to} label={link.label} icon={link.icon} end={link.to === '/'} />
        ))}
        {isAdmin && <SidebarLink to="/invite" label="Invite Team" icon={UserPlus} />}
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
  );
}

function SidebarLink({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
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
