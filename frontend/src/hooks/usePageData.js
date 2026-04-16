import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

/**
 * Hook central de carregamento de dados do Zellu.
 *
 * Regras:
 * - Aguarda pharmacyId antes de buscar
 * - Stale-while-revalidate: se ja tem dados, mostra enquanto rebusca
 * - NAO usa timeout agressivo (causa falsos "sessao expirada")
 * - Escuta zellu:refetch para rebuscar ao voltar para a aba
 * - Silencioso em erros de refetch quando ja tem dados
 */
export function usePageData(fetchFn, deps = []) {
  const { profile } = useAuthStore();
  const pharmacyId = profile?.pharmacy_id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const hasDataRef = useRef(false);
  const fetchingRef = useRef(false);

  const execute = useCallback(async (isRefetch = false) => {
    if (!mountedRef.current || !pharmacyId) {
      if (!pharmacyId) setLoading(false);
      return;
    }

    // Impede fetches simultaneos — mas NAO bloqueia refetch se o anterior travou
    if (fetchingRef.current && isRefetch) return;

    fetchingRef.current = true;

    // So mostra skeleton se NAO tem dados ainda (stale-while-revalidate)
    if (!hasDataRef.current) {
      setLoading(true);
    }

    try {
      // Verifica sessao — sem timeout, getSession le do cache local
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Tenta refresh uma vez antes de desistir
        const { data: { session: refreshed } } = await supabase.auth.refreshSession();
        if (!refreshed) {
          if (!isRefetch) setError('Sessao expirada. Faca login novamente.');
          setLoading(false);
          fetchingRef.current = false;
          return;
        }
      }

      if (!mountedRef.current) { fetchingRef.current = false; return; }

      // Executa a query
      const result = await fetchFn(pharmacyId);

      if (!mountedRef.current) { fetchingRef.current = false; return; }

      setData(result);
      hasDataRef.current = true;
      setError(null);
      setLoading(false);
    } catch (err) {
      if (!mountedRef.current) { fetchingRef.current = false; return; }

      // Se ja tem dados, engole o erro silenciosamente (stale data e melhor que erro)
      if (hasDataRef.current) {
        console.warn('[usePageData] Refetch falhou, mantendo dados anteriores:', err.message);
      } else {
        setError(err.message || 'Erro ao carregar dados');
      }
      setLoading(false);
    } finally {
      fetchingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId, ...deps]);

  // Carrega quando monta ou quando pharmacyId muda
  useEffect(() => {
    mountedRef.current = true;

    // Reset completo so se pharmacyId mudou (nao em re-mount da mesma pagina)
    if (!hasDataRef.current) {
      setLoading(true);
      setError(null);
      setData(null);
    }

    execute(false);

    return () => { mountedRef.current = false; };
  }, [execute]);

  // Escuta zellu:refetch (disparado pelo useSessionGuard apos token renovado)
  useEffect(() => {
    const handler = () => {
      if (pharmacyId && mountedRef.current) {
        execute(true); // isRefetch = true — nao mostra skeleton
      }
    };
    window.addEventListener('zellu:refetch', handler);
    return () => window.removeEventListener('zellu:refetch', handler);
  }, [pharmacyId, execute]);

  return { data, loading, error, refetch: () => execute(false), pharmacyId };
}
