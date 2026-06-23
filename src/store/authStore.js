import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set) => ({
  user: null,
  role: null,
  loading: true,

  initializeAuth: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, name')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          set({ user: session.user, role: profile.role, loading: false });
          return;
        }
      }
      set({ user: null, role: null, loading: false });
    } catch (error) {
      console.error('Auth init error:', error);
      set({ user: null, role: null, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      set({ loading: false });
      throw authError;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      set({ loading: false });
      throw new Error('Staff profile nahi mili!');
    }

    set({ user: authData.user, role: profile.role, loading: false });
    return profile.role;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null, loading: false });
  },
}));