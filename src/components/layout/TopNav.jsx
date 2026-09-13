import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query, limit, doc, updateDoc } from 'firebase/firestore';
import { Search, Bell, Menu } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

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

export default function TopNav({ onMenuClick }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!profile?.companyId) return;
    const q = query(
      collection(db, 'companies', profile.companyId, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    return onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [profile?.companyId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/leads?q=${encodeURIComponent(searchValue.trim())}`);
    }
  }

  async function handleNotificationClick(notification) {
    setShowNotifications(false);
    if (!notification.read) {
      await updateDoc(
        doc(db, 'companies', profile.companyId, 'notifications', notification.id),
        { read: true }
      );
    }
    if (notification.leadId) {
      navigate(`/leads/${notification.leadId}`);
    }
  }

  return (
    <header className="h-16 border-b border-border bg-panel px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="md:hidden shrink-0 p-2 rounded-lg hover:bg-raised transition-colors"
      >
        <Menu size={20} className="text-subtle" />
      </button>

      <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search leads…"
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-ink placeholder:text-subtle focus:border-brand outline-none"
          />
        </div>
      </form>

      <div className="relative">
        <button
          onClick={() => setShowNotifications((s) => !s)}
          className="relative p-2 rounded-lg hover:bg-raised transition-colors"
        >
          <Bell size={20} className="text-subtle" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] font-semibold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-card border border-border rounded-xl shadow-xl p-2 z-20 max-h-96 overflow-y-auto">
            <p className="text-xs text-subtle px-3 py-2 uppercase tracking-wide">Notifications</p>
            {notifications.length === 0 ? (
              <p className="text-sm text-subtle px-3 py-6 text-center">Nothing yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-raised transition-colors flex items-start gap-2"
                >
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />}
                  <div className={n.read ? 'pl-3.5' : ''}>
                    <p className="text-sm text-ink">{n.message}</p>
                    <p className="text-xs text-subtle mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </header>
  );
}
