import { useEffect, useRef } from 'react';

/**
 * Hook para paginas que NAO usam usePageData (ex.: ConversationsPage).
 *
 * Escuta APENAS zellu:refetch — disparado pelo useSessionGuard
 * APOS o token ser renovado. Isso garante que a query nunca
 * roda com token expirado.
 */
export function useRefetchOnFocus(refetchFn, enabled = true) {
  const fnRef = useRef(refetchFn);
  fnRef.current = refetchFn;

  useEffect(() => {
    if (!enabled) return;

    const handler = () => fnRef.current();

    window.addEventListener('zellu:refetch', handler);
    return () => window.removeEventListener('zellu:refetch', handler);
  }, [enabled]);
}
