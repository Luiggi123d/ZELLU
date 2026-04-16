import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * Hook central de carregamento de dados do Zellu.
 *
 * Garante:
 * 1. Aguarda profile antes de buscar
 * 2. Stale-while-revalidate — mostra dados antigos enquanto rebusca (sem skeleton)
 * 3. Rebusca em: visibilitychange, window focus, zellu:refetch, TOKEN_REFRESHED
 * 4. Debounce de 300ms entre refetches para evitar rajadas
 * 5. Timeout de segurança de 15s contra loading infinito
 */
export function usePageData(fetchFn, deps = []) {
  const { profile } = useAuthStore();
  const pharmacyId = profile?.pharmacy_id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const hasDataRef = useRef(false);
  const timeoutRef = useRef(null);
  const debounceRef = useRef(null);
  const fetchingRef = useRef(false);

  const execute = useCallback(async () => {
    if (!mountedRef.current) return;

    // Se profile ainda não carregou, sai do loading e aguarda
    if (!pharmacyId) {
      setLoading(false);
      return;
    }

    // Evita chamadas duplicadas simultâneas
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    // Stale-while-revalidate: só mostra skeleton no PRIMEIRO carregamento
    if (!hasDataRef.current) {
      setLoading(true);
    }
    setError(null);

    // Timeout de segurança — nunca fica em loading infinito
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
        setError('Tempo limite excedido. Tente recarregar a página.');
        fetchingRef.current = false;
      }
    }, 15000);

    try {
      const result = await fetchFn(pharmacyId);
      if (!mountedRef.current) return;
      setData(result);
      hasDataRef.current = true;
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      if (mountedRef.current) setLoading(false);
      clearTimeout(timeoutRef.current);
      fetchingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId, ...deps]);

  // Refetch com debounce — evita rajadas (visibility + focus + zellu:refetch)
  const debouncedRefetch = useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (pharmacyId && mountedRef.current) execute();
    }, 300);
  }, [pharmacyId, execute]);

  // 1. Carrega quando monta E quando pharmacyId aparece
  useEffect(() => {
    mountedRef.current = true;
    hasDataRef.current = false;
    fetchingRef.current = false;
    execute();
    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutRef.current);
      clearTimeout(debounceRef.current);
    };
  }, [execute]);

  // 2. Rebusca ao voltar para a aba (visibilitychange)
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') debouncedRefetch();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [debouncedRefetch]);

  // 3. Rebusca ao ganhar foco (window.focus — cobre alt+tab e clique na janela)
  useEffect(() => {
    const handler = () => debouncedRefetch();
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [debouncedRefetch]);

  // 4. Escuta evento zellu:refetch (TOKEN_REFRESHED, inatividade, etc.)
  useEffect(() => {
    const handler = () => debouncedRefetch();
    window.addEventListener('zellu:refetch', handler);
    return () => window.removeEventListener('zellu:refetch', handler);
  }, [debouncedRefetch]);

  return { data, loading, error, refetch: execute, pharmacyId };
}
