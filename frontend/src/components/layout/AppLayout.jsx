import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import { useWhatsappStore } from '../../store/whatsappStore';
import { useSessionGuard } from '../../hooks/useSessionGuard';

export default function AppLayout() {
  const { profile } = useAuthStore();
  const fetchStatus = useWhatsappStore((s) => s.fetchStatus);

  // Ponto central de sessao — detecta volta para aba e dispara zellu:refetch
  useSessionGuard();

  useEffect(() => {
    if (profile?.pharmacy_id) {
      fetchStatus(true);
    }
  }, [profile?.pharmacy_id]);

  // Removido: auto-refresh por inatividade. O useSessionGuard ja cobre
  // o caso de voltar para a aba apos inatividade via visibilitychange.

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
