import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ToastContainer } from './components/ui/Toast';
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ContactsPage from './pages/contacts/ContactsPage';
import ContactDetailPage from './pages/contacts/ContactDetailPage';
import RadarPage from './pages/radar/RadarPage';
import ConversationsPage from './pages/conversations/ConversationsPage';
import CampaignsPage from './pages/campaigns/CampaignsPage';
import SettingsPage from './pages/settings/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/:id" element={<ContactDetailPage />} />
          <Route path="/radar" element={<RadarPage />} />
          <Route path="/conversas" element={<ConversationsPage />} />
          <Route path="/campanhas" element={<CampaignsPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}
