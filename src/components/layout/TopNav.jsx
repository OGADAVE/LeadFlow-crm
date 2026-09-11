import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { Search, Bell } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

export default function TopNav() {
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

  return (
    <header className="h-16 border-b border-border bg-panel px-6 flex items-center justify-between gap-4 sticky top-0 z-10">
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search leads by name…"
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
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger" />
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl p-2 z-20">
            <p className="text-xs text-subtle px-3 py-2 uppercase tracking-wide">Notifications</p>
            {notifications.length === 0 ? (
              <p className="text-sm text-subtle px-3 py-6 text-center">Nothing yet.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="px-3 py-2 rounded-lg hover:bg-raised text-sm text-ink">
                  {n.message}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </header>
  );
}
