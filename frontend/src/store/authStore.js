import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await api.get('/auth/me').catch(() => null);
      set({ user: session.user, profile, loading: false });
    } else {
      set({ loading: false });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await api.get('/auth/me').catch(() => null);
        set({ user: session.user, profile });
      } else {
        set({ user: null, profile: null });
      }
    });
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signUp: async ({ email, password, fullName, pharmacyName, pharmacyCnpj, pharmacyPhone }) => {
    const result = await api.post('/auth/signup', {
      email, password, fullName, pharmacyName, pharmacyCnpj, pharmacyPhone,
    });
    await supabase.auth.signInWithPassword({ email, password });
    return result;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
