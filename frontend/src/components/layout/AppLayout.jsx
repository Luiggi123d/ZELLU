import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import { useWhatsappStore } from '../../store/whatsappStore';
import { useSessionGuard } from '../../hooks/useSessionGuard';

export default function AppLayout() {
  const { profile } = useAuthStore();
  const fetchStatus = useWhatsappStore((s) => s.fetchStatus);

  // Protege a sessão e detecta expiração
  useSessionGuard();

  useEffect(() => {
    if (profile?.pharmacy_id) {
      fetchStatus(true);
    }
  }, [profile?.pharmacy_id]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
