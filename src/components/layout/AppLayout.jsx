import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import Dashboard from '../dashboard/Dashboard';
import LeadList from '../leads/LeadList';
import LeadProfile from '../leads/LeadProfile';
import PipelineBoard from '../pipeline/PipelineBoard';
import PropertyList from '../properties/PropertyList';
import ConsultantList from '../consultants/ConsultantList';
import ConsultantDashboard from '../consultants/ConsultantDashboard';
import EmailTemplateList from '../emailTemplates/EmailTemplateList';
import SequenceList from '../automation/SequenceList';
import AnalyticsPage from '../analytics/AnalyticsPage';
import InviteUser from '../auth/InviteUser';
import ProtectedRoute from '../auth/ProtectedRoute';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-navy min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 min-h-screen min-w-0">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<LeadList />} />
          <Route path="/leads/:leadId" element={<LeadProfile />} />
          <Route path="/pipeline" element={<PipelineBoard />} />
          <Route path="/properties" element={<PropertyList />} />
          <Route path="/consultants" element={<ConsultantList />} />
          <Route path="/my-dashboard" element={<ConsultantDashboard />} />
          <Route path="/email-templates" element={<EmailTemplateList />} />
          <Route path="/automation" element={<SequenceList />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
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
  );
}
