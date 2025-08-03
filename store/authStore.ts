import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  initializeAuth: () => Promise<void>;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  cleanup: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: false, // Start with false to prevent deadlock

      initializeAuth: async () => {
        // Don't initialize if already loading to prevent race conditions
        const currentState = get();
        if (currentState.isLoading) {
          console.log('Auth initialization already in progress, skipping...');
          return;
        }
        
        set({ isLoading: true });
        try {
          // Get initial session
          const { data: { session } } = await supabase.auth.getSession();
          console.log('Initial session check:', session?.user?.email);
          set({ session });

          // Set up auth state change listener
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('Auth state changed:', event, session?.user?.email);
              set({ session });
            }
          );

          // Store subscription for cleanup
          (global as any).authSubscription = subscription;
        } catch (error) {
          console.error('Error initializing auth:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      setSession: (session: Session | null) => {
        set({ session });
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut();
          set({ session: null });
          
          // Reset onboarding state when user signs out
          // We'll handle this in the layout instead to avoid circular imports
        } catch (error) {
          console.error('Error signing out:', error);
        }
      },

      cleanup: () => {
        const subscription = (global as any).authSubscription;
        if (subscription) {
          subscription.unsubscribe();
          (global as any).authSubscription = null;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        session: state.session,
        // Don't persist isLoading to prevent deadlock
      }),
    }
  )
); 