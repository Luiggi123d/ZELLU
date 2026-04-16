import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';

export function usePageData(key, fetchFn) {
  const { profile } = useAuthStore();
  const pharmacyId = profile?.pharmacy_id;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [key, pharmacyId],
    queryFn: () => fetchFn(pharmacyId),
    enabled: !!pharmacyId,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 30_000,
  });

  return {
    data: data ?? null,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
    pharmacyId,
  };
}
