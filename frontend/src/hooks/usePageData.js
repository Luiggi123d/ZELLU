import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

const QUERY_TIMEOUT = 10000;
const SESSION_TIMEOUT = 5000;

/**
 * Hook central de carregamento de dados do Zellu.
 *
 * Garante:
 * 1. Aguarda profile antes de buscar
 * 2. Valida sessao ANTES de cada query (evita query com token expirado)
 * 3. Stale-while-revalidate — mostra dados antigos enquanto rebusca
 * 4. Retry automatico — se a primeira tentativa falha, tenta de novo apos 2s
 * 5. Generation counter — refetches nunca sao bloqueados por queries travadas
 * 6. Escuta zellu:refetch (disparado pelo useSessionGuard APOS token renovado)
 */
export function usePageData(fetchFn, deps = []) {
  const { profile } = useAuthStore();
  const pharmacyId = profile?.pharmacy_id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const hasDataRef = useRef(false);
  const generationRef = useRef(0);

  const execute = useCallback(async () => {
    if (!mountedRef.current) return;

    if (!pharmacyId) {
      setLoading(false);
      return;
    }

    const generation = ++generationRef.current;

    if (!hasDataRef.current) {
      setLoading(true);
    }

    // Tenta ate 2 vezes (com retry apos falha)
    for (let attempt = 0; attempt < 2; attempt++) {
      if (generation !== generationRef.current || !mountedRef.current) return;

      try {
        // 1. Garante sessao valida ANTES de consultar dados
        const sessionTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('session_timeout')), SESSION_TIMEOUT)
        );
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          sessionTimeout,
        ]);

        if (!session) {
          window.location.href = '/login';
          return;
        }

        if (generation !== generationRef.current || !mountedRef.current) return;

        // 2. Executa query com timeout
        const queryTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('query_timeout')), QUERY_TIMEOUT)
        );
        const result = await Promise.race([fetchFn(pharmacyId), queryTimeout]);

        if (generation !== generationRef.current || !mountedRef.current) return;

        setData(result);
        hasDataRef.current = true;
        setError(null);
        setLoading(false);
        return; // Sucesso — sai do loop de retry
      } catch (err) {
        if (generation !== generationRef.current || !mountedRef.current) return;

        const isTimeout = err.message === 'query_timeout' || err.message === 'session_timeout';

        if (attempt === 0 && isTimeout) {
          // Primeira tentativa falhou por timeout — espera 2s e tenta de novo
          console.warn('[usePageData] Timeout na tentativa 1, retentando em 2s...');
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        // Ultima tentativa falhou
        if (hasDataRef.current) {
          console.warn('[usePageData] Refetch falhou, mantendo dados anteriores:', err.message);
        } else {
          setError(err.message === 'query_timeout'
            ? 'Consulta demorou demais. Atualize a pagina.'
            : err.message === 'session_timeout'
            ? 'Sessao expirada. Atualize a pagina.'
            : err.message || 'Erro ao carregar dados'
          );
        }
      }
    }

    if (generation === generationRef.current && mountedRef.current) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId, ...deps]);

  // Carrega quando monta E quando pharmacyId aparece
  useEffect(() => {
    mountedRef.current = true;
    hasDataRef.current = false;
    generationRef.current = 0;
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
