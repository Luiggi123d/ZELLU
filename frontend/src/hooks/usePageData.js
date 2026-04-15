// Hook que garante fetch sempre que o componente monta,
// independente de mudança de pharmacyId
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';

export function usePageData(fetchFn) {
  const { profile } = useAuthStore();
  const pharmacyId = profile?.pharmacy_id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    setError(null);

    if (!pharmacyId) {
      setLoading(false);
      return;
    }

    fetchFn(pharmacyId)
      .then((result) => {
        if (!mountedRef.current) return;
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { mountedRef.current = false; };
    // Roda sempre que o componente monta — dependência vazia intencional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, pharmacyId };
}
