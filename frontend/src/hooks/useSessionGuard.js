import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Monitora a sessão e força reload dos dados quando a aba volta ao foco
 * depois de muito tempo inativa.
 */
export function useSessionGuard() {
  useEffect(() => {
    // Monitora mudanças de estado da autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('[session] Token renovado automaticamente');
      }
      if (event === 'SIGNED_OUT') {
        // Sessão expirou e não conseguiu renovar — redireciona para login
        window.location.href = '/login';
      }
    });

    // Quando a aba volta ao foco, força verificação da sessão
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
