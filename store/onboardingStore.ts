import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../utils/api';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  spiritualLevel: string;
  dailyReminderTime: string;
  notificationsEnabled: boolean;
  isLoading: boolean;
  checkOnboardingStatus: () => Promise<void>;
  setOnboardingCompleted: (data: {
    spiritualLevel: string;
    dailyReminderTime: string;
    notificationsEnabled: boolean;
  }) => Promise<void>;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      spiritualLevel: '',
      dailyReminderTime: '07:00',
      notificationsEnabled: true,
      isLoading: false, // Start with false to prevent deadlock

      checkOnboardingStatus: async () => {
        // Don't set loading if already loading to prevent race conditions
        const currentState = get();
        if (currentState.isLoading) {
          console.log('Onboarding check already in progress, skipping...');
          return;
        }
        
        // If we already know the user has completed onboarding, don't check again
        if (currentState.hasCompletedOnboarding) {
          console.log('User already completed onboarding, skipping check...');
          return;
        }
        
        set({ isLoading: true });
        try {
          const hasCompleted = await apiService.hasCompletedOnboarding();
          console.log('Onboarding status check result:', hasCompleted);
          set({ hasCompletedOnboarding: hasCompleted });
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          set({ hasCompletedOnboarding: false });
        } finally {
          set({ isLoading: false });
        }
      },

      setOnboardingCompleted: async (data) => {
        set({ isLoading: true });
        try {
          console.log('Setting onboarding completed with data:', data);
          
          // Update user metadata with spiritual level
          const { error: userError } = await apiService.updateUserMetadata({
            spiritual_level: data.spiritualLevel,
          });

          if (userError) {
            throw userError;
          }

          // Save user settings
          await apiService.updateUserSettings({
            daily_reminder_time: data.dailyReminderTime,
            notification_enabled: data.notificationsEnabled,
          });

          // Update local state
          set({
            hasCompletedOnboarding: true,
            spiritualLevel: data.spiritualLevel,
            dailyReminderTime: data.dailyReminderTime,
            notificationsEnabled: data.notificationsEnabled,
          });

          console.log('Onboarding completed successfully');
        } catch (error) {
          console.error('Error setting onboarding completed:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      resetOnboarding: () => {
        set({
          hasCompletedOnboarding: false,
          spiritualLevel: '',
          dailyReminderTime: '07:00',
          notificationsEnabled: true,
        });
      },
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        spiritualLevel: state.spiritualLevel,
        dailyReminderTime: state.dailyReminderTime,
        notificationsEnabled: state.notificationsEnabled,
        // Don't persist isLoading to prevent deadlock
      }),
    }
  )
); 