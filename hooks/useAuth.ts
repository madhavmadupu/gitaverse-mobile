import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { apiService } from '../utils/api';
import { supabase } from '../utils/supabase';

export function useAuth() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Not authenticated, redirect to auth
          router.replace('/(auth)/welcome');
          return;
        }

        // User is authenticated, check onboarding status
        const hasCompletedOnboarding = await apiService.hasCompletedOnboarding();
        
        if (!hasCompletedOnboarding) {
          // Not completed onboarding, redirect to onboarding
          router.replace('/(auth)/onboarding');
        } else {
          // Completed onboarding, redirect to main app
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        router.replace('/(auth)/welcome');
      }
    };

    checkAuthAndOnboarding();
  }, [segments]);

  const checkOnboardingStatus = async () => {
    try {
      const hasCompleted = await apiService.hasCompletedOnboarding();
      return hasCompleted;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  };

  return {
    checkOnboardingStatus,
  };
} 