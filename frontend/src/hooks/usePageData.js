import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * Hook que garante:
 * 1. Aguarda o profile estar disponível antes de buscar
 * 2. Rebusca quando pharmacyId aparece (profile carregou depois do mount)
 * 3. Nunca fica em loading infinito — tem timeout de segurança de 15s
 * 4. Rebusca quando a aba volta ao foco após inatividade
 * 5. Escuta evento zellu:refetch para auto-refresh por inatividade
 */
export function usePageData(fetchFn, deps = []) {
  const { profile } = useAuthStore();
  const pharmacyId = profile?.pharmacy_id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const timeoutRef = useRef(null);

  const execute = useCallback(async () => {
    if (!mountedRef.current) return;

    // Se profile ainda não carregou, aguarda
    if (!pharmacyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Timeout de segurança — nunca fica em loading infinito
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
        setError('Tempo limite excedido. Tente recarregar a página.');
      }
    }, 15000);

    try {
      const result = await fetchFn(pharmacyId);
      if (!mountedRef.current) return;
      setData(result);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      if (mountedRef.current) setLoading(false);
      clearTimeout(timeoutRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId, ...deps]);

  // Roda quando monta E quando pharmacyId aparece (perfil carregou depois)
  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutRef.current);
    };
  }, [execute]);

  // Rebusca quando a aba volta ao foco
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && pharmacyId) {
        execute();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pharmacyId, execute]);

  // Escuta evento zellu:refetch (auto-refresh por inatividade no AppLayout)
  useEffect(() => {
    const handleRefetch = () => { if (pharmacyId) execute(); };
    window.addEventListener('zellu:refetch', handleRefetch);
    return () => window.removeEventListener('zellu:refetch', handleRefetch);
  }, [pharmacyId, execute]);

  return { data, loading, error, refetch: execute, pharmacyId };
}
