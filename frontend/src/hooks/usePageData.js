import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * Hook central de carregamento de dados do Zellu.
 *
 * Simplificado: sem verificacao manual de sessao.
 * O Supabase client ja faz auto-refresh de token.
 * Se o token expirou e o refresh falha, o onAuthStateChange
 * no useSessionGuard redireciona para /login.
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
    if (!pharmacyId) {
      setLoading(false);
      return;
    }

    // Skip concurrent refetch — but allow initial fetch
    if (fetchingRef.current && isRefetch) return;
    fetchingRef.current = true;

    // Only show skeleton if we don't have data yet
    if (!hasDataRef.current && !isRefetch) {
      setLoading(true);
    }

    try {
      const result = await fetchFn(pharmacyId);

      if (!mountedRef.current) { fetchingRef.current = false; return; }

      setData(result);
      hasDataRef.current = true;
      setError(null);
    } catch (err) {
      if (!mountedRef.current) { fetchingRef.current = false; return; }

      if (hasDataRef.current) {
        // Stale-while-revalidate: keep old data on refetch error
        console.warn('[usePageData] Refetch failed, keeping stale data:', err.message);
      } else {
        setError(err.message || 'Erro ao carregar dados');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
      fetchingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId, ...deps]);

  const pharmacyIdRef = useRef(pharmacyId);
  useEffect(() => { pharmacyIdRef.current = pharmacyId; }, [pharmacyId]);

  // Initial fetch — só roda quando pharmacyId muda de verdade (undefined → valor)
  const prevPharmacyIdRef = useRef(null);
  useEffect(() => {
    if (!pharmacyId) { setLoading(false); return; }
    if (prevPharmacyIdRef.current === pharmacyId) return; // não re-executa se já carregou
    prevPharmacyIdRef.current = pharmacyId;

    mountedRef.current = true;
    hasDataRef.current = false;
    setData(null);
    setLoading(true);
    setError(null);
    execute(false);

    return () => { mountedRef.current = false; };
  }, [pharmacyId, execute]);

  // Listen for zellu:refetch (tab visibility change)
  useEffect(() => {
    const handler = () => {
      if (pharmacyId && mountedRef.current) execute(true);
    };
    window.addEventListener('zellu:refetch', handler);
    return () => window.removeEventListener('zellu:refetch', handler);
  }, [pharmacyId, execute]);

  return { data, loading, error, refetch: () => execute(false), pharmacyId };
}
