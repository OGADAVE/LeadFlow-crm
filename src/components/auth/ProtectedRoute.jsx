import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-subtle text-sm">Loading…</div>;
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
