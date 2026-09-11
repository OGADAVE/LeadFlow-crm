import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';
import Dashboard from './components/dashboard/Dashboard';
import LeadList from './components/leads/LeadList';
import LeadProfile from './components/leads/LeadProfile';
import PipelineBoard from './components/pipeline/PipelineBoard';
import PropertyList from './components/properties/PropertyList';
import ConsultantList from './components/consultants/ConsultantList';
import ConsultantDashboard from './components/consultants/ConsultantDashboard';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import InviteUser from './components/auth/InviteUser';
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex bg-navy min-h-screen">
                <Sidebar />
                <main className="flex-1 min-h-screen">
                  <TopNav />
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/leads" element={<LeadList />} />
                    <Route path="/leads/:leadId" element={<LeadProfile />} />
                    <Route path="/pipeline" element={<PipelineBoard />} />
                    <Route path="/properties" element={<PropertyList />} />
                    <Route path="/consultants" element={<ConsultantList />} />
                    <Route path="/my-dashboard" element={<ConsultantDashboard />} />
                    <Route
                      path="/invite"
                      element={
                        <ProtectedRoute adminOnly>
                          <InviteUser />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
