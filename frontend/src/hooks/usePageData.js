import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

const QUERY_TIMEOUT = 12000; // 12s — timeout real da query

/**
 * Hook central de carregamento de dados do Zellu.
 *
 * Garante:
 * 1. Aguarda profile antes de buscar
 * 2. Stale-while-revalidate — mostra dados antigos enquanto rebusca
 * 3. Refetch silencioso — se ja tem dados e o refetch falha, mantem dados antigos
 * 4. Escuta zellu:refetch (disparado pelo useSessionGuard APOS token renovado)
 * 5. NAO escuta visibilitychange/focus diretamente (evita race condition com token)
 * 6. Promise.race com timeout de 12s nas queries
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

  const execute = useCallback(async () => {
    if (!mountedRef.current) return;

    // Se profile ainda nao carregou, sai do loading
    if (!pharmacyId) {
      setLoading(false);
      return;
    }

    // Evita chamadas duplicadas simultaneas
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    // Stale-while-revalidate: so mostra skeleton no PRIMEIRO carregamento
    if (!hasDataRef.current) {
      setLoading(true);
    }

    try {
      // Query com timeout real via Promise.race
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Consulta demorou demais. Verifique sua conexao.')), QUERY_TIMEOUT)
      );

      const result = await Promise.race([fetchFn(pharmacyId), timeoutPromise]);

      if (!mountedRef.current) return;
      setData(result);
      hasDataRef.current = true;
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;

      // Se ja tem dados carregados, mantem eles (refetch silencioso)
      if (hasDataRef.current) {
        console.warn('[usePageData] Refetch falhou, mantendo dados anteriores:', err.message);
        // Nao mostra erro — dados antigos continuam visiveis
      } else {
        // Primeiro carregamento falhou — mostra erro
        setError(err.message || 'Erro ao carregar dados');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
      fetchingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId, ...deps]);

  // Carrega quando monta E quando pharmacyId aparece
  useEffect(() => {
    mountedRef.current = true;
    hasDataRef.current = false;
    fetchingRef.current = false;
    execute();
    return () => {
      mountedRef.current = false;
    };
  }, [execute]);

  // Escuta zellu:refetch (disparado pelo useSessionGuard APOS renovar token)
  useEffect(() => {
    const handler = () => {
      if (pharmacyId && mountedRef.current) execute();
    };
    window.addEventListener('zellu:refetch', handler);
    return () => window.removeEventListener('zellu:refetch', handler);
  }, [pharmacyId, execute]);

  return { data, loading, error, refetch: execute, pharmacyId };
}
