import { useEffect, useRef } from 'react';

/**
 * Hook reutilizável para páginas que NÃO usam usePageData
 * (ex.: ConversationsPage com realtime próprio).
 *
 * Escuta visibilitychange, window focus e zellu:refetch,
 * chamando o callback com debounce de 300ms.
 */
export function useRefetchOnFocus(refetchFn, enabled = true) {
  const debounceRef = useRef(null);
  const fnRef = useRef(refetchFn);
  fnRef.current = refetchFn;

  useEffect(() => {
    if (!enabled) return;

    const debouncedCall = () => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fnRef.current(), 300);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') debouncedCall();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', debouncedCall);
    window.addEventListener('zellu:refetch', debouncedCall);

    return () => {
      clearTimeout(debounceRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', debouncedCall);
      window.removeEventListener('zellu:refetch', debouncedCall);
    };
  }, [enabled]);
}
