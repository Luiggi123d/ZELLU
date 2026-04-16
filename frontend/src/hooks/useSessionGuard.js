import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Monitora a sessão Supabase e dispara eventos globais:
 * - TOKEN_REFRESHED → dispara zellu:refetch para todas as páginas rebuscarem
 * - SIGNED_OUT → redireciona para login
 * - visibilitychange → verifica se sessão ainda existe
 */
export function useSessionGuard() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('[session] Token renovado — disparando refetch global');
        window.dispatchEvent(new CustomEvent('zellu:refetch'));
      }
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login';
      }
    });

    // Quando a aba volta ao foco, verifica se a sessão ainda é válida
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            window.location.href = '/login';
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
