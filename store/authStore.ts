import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '../types';
import { supabase } from '../utils/supabase';

interface AuthStore extends AuthState {
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  initializeAuth: () => void;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
      setUser: (user: User | null) =>
        set({
          user,
          isAuthenticated: !!user,
          error: null,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Error signing out:', error);
        }
        set(initialState);
      },

      initializeAuth: () => {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.id);
            
            if (event === 'SIGNED_IN' && session?.user) {
              // Convert Supabase user to our User type
              const user: User = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name,
                avatar_url: session.user.user_metadata?.avatar_url,
                preferred_language: session.user.user_metadata?.preferred_language || 'english',
                spiritual_level: session.user.user_metadata?.spiritual_level || 'beginner',
                notification_time: session.user.user_metadata?.notification_time || '07:00:00',
                timezone: session.user.user_metadata?.timezone,
                streak_count: session.user.user_metadata?.streak_count || 0,
                longest_streak: session.user.user_metadata?.longest_streak || 0,
                last_read_date: session.user.user_metadata?.last_read_date,
                premium_until: session.user.user_metadata?.premium_until,
                created_at: session.user.created_at,
                updated_at: session.user.updated_at || session.user.created_at,
              };
              
              get().setUser(user);
            } else if (event === 'SIGNED_OUT') {
              get().setUser(null);
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
              // Update user data on token refresh
              const user: User = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name,
                avatar_url: session.user.user_metadata?.avatar_url,
                preferred_language: session.user.user_metadata?.preferred_language || 'english',
                spiritual_level: session.user.user_metadata?.spiritual_level || 'beginner',
                notification_time: session.user.user_metadata?.notification_time || '07:00:00',
                timezone: session.user.user_metadata?.timezone,
                streak_count: session.user.user_metadata?.streak_count || 0,
                longest_streak: session.user.user_metadata?.longest_streak || 0,
                last_read_date: session.user.user_metadata?.last_read_date,
                premium_until: session.user.user_metadata?.premium_until,
                created_at: session.user.created_at,
                updated_at: session.user.updated_at || session.user.created_at,
              };
              
              get().setUser(user);
            }
          }
        );

        // Check initial auth state
        const checkInitialAuth = async () => {
          try {
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error) {
              console.error('Error getting user:', error);
              get().setError(error.message);
              return;
            }

            if (user) {
              // Convert Supabase user to our User type
              const userData: User = {
                id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name,
                avatar_url: user.user_metadata?.avatar_url,
                preferred_language: user.user_metadata?.preferred_language || 'english',
                spiritual_level: user.user_metadata?.spiritual_level || 'beginner',
                notification_time: user.user_metadata?.notification_time || '07:00:00',
                timezone: user.user_metadata?.timezone,
                streak_count: user.user_metadata?.streak_count || 0,
                longest_streak: user.user_metadata?.longest_streak || 0,
                last_read_date: user.user_metadata?.last_read_date,
                premium_until: user.user_metadata?.premium_until,
                created_at: user.created_at,
                updated_at: user.updated_at || user.created_at,
              };
              
              get().setUser(userData);
            } else {
              get().setUser(null);
            }
          } catch (error) {
            console.error('Error checking initial auth state:', error);
            get().setError('Failed to check authentication state');
          }
        };

        checkInitialAuth();
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 