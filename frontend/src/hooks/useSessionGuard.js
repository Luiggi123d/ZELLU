import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Ponto central de controle de sessao do Zellu.
 *
 * Fluxo ao voltar para a aba:
 * 1. visibilitychange / focus dispara
 * 2. Primeiro renova o token (await getSession)
 * 3. So DEPOIS dispara zellu:refetch para as paginas rebuscarem
 *
 * Isso elimina a race condition onde queries rodavam com token expirado.
 */
export function useSessionGuard() {
  useEffect(() => {
    // Monitora mudancas de autenticacao
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('[session] Token renovado — disparando refetch global');
        window.dispatchEvent(new CustomEvent('zellu:refetch'));
      }
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login';
      }
    });

    // Funcao central: renova sessao, depois avisa as paginas
    let debounceTimer;
    let refreshing = false;

    const refreshAndNotify = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        if (refreshing) return;
        refreshing = true;

        try {
          // 1. Renova o token PRIMEIRO
          const { data: { session } } = await supabase.auth.getSession();

          if (!session) {
            window.location.href = '/login';
            return;
          }

          // 2. Token fresco — agora sim avisa as paginas para rebuscar
          window.dispatchEvent(new CustomEvent('zellu:refetch'));
        } catch (err) {
          console.warn('[session] Erro ao renovar sessao:', err);
        } finally {
          refreshing = false;
        }
      }, 200);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshAndNotify();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', refreshAndNotify);

    return () => {
      subscription.unsubscribe();
      clearTimeout(debounceTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', refreshAndNotify);
    };
  }, []);
}
