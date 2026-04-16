import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Ponto central de controle de sessao do Zellu.
 *
 * Quando o usuario volta para a aba:
 * 1. visibilitychange dispara
 * 2. Debounce de 500ms (evita multiplos disparos)
 * 3. Dispara zellu:refetch para as paginas rebuscarem
 *
 * NAO faz getSession() aqui — o Supabase auto-refresh ja cuida disso.
 * O usePageData faz getSession() antes de cada query individual.
 *
 * O evento TOKEN_REFRESHED NAO dispara zellu:refetch para evitar
 * double-fetch (visibility ja dispara).
 */
export function useSessionGuard() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login';
      }
      // TOKEN_REFRESHED: nao faz nada — o refetch vem do visibilitychange
    });

    let debounceTimer = null;

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;

      // Debounce 500ms — evita multiplos disparos (visibility + focus)
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('zellu:refetch'));
      }, 1500);
    };

    document.addEventListener('visibilitychange', onVisibility);

    // NAO escuta 'focus' separadamente — visibilitychange ja cobre esse caso
    // Escutar ambos causa double-fetch

    return () => {
      subscription.unsubscribe();
      clearTimeout(debounceTimer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
