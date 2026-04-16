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

  // Auto-refresh quando fica inativo por mais de 5 minutos
  useEffect(() => {
    let lastActive = Date.now();

    const handleActivity = () => { lastActive = Date.now(); };
    const checkInactive = setInterval(() => {
      const inactive = Date.now() - lastActive;
      // Se ficou mais de 5min inativo e voltou ao foco, força reload suave
      if (inactive > 5 * 60 * 1000 && document.visibilityState === 'visible') {
        lastActive = Date.now();
        // Dispara evento customizado para as páginas rebuscarem dados
        window.dispatchEvent(new CustomEvent('zellu:refetch'));
      }
    }, 30000); // checa a cada 30s

    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('touchstart', handleActivity);

    return () => {
      clearInterval(checkInactive);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
