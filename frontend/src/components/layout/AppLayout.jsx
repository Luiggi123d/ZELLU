import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import { useWhatsappStore } from '../../store/whatsappStore';

export default function AppLayout() {
  const { profile } = useAuthStore();
  const fetchStatus = useWhatsappStore((s) => s.fetchStatus);

  useEffect(() => {
    if (profile?.pharmacy_id) {
      fetchStatus(true);
    }
  }, [profile?.pharmacy_id, fetchStatus]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
