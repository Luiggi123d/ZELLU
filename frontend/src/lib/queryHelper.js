import { supabase } from './supabase';

/**
 * Wrapper para queries do Supabase que trata erros de sessão expirada
 * e evita loading infinito.
 */
export async function safeQuery(queryFn) {
  try {
    // Verifica sessão antes de qualquer query
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/login';
      return { data: null, error: new Error('Sessão expirada') };
    }

    const result = await queryFn();

    // Se receber erro de autenticação, tenta renovar token
    if (result.error?.message?.includes('JWT') ||
        result.error?.message?.includes('token') ||
        result.error?.status === 401) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        window.location.href = '/login';
        return { data: null, error: refreshError };
      }
      // Retry após renovar
      return queryFn();
    }

    return result;
  } catch (err) {
    console.error('[safeQuery] erro:', err.message);
    return { data: null, error: err };
  }
}
