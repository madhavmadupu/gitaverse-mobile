import '../global.css';

import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';
import { apiService } from '../utils/api';
import { ThemeProvider } from '../contexts/ThemeContext';
import { notificationService } from '../utils/notifications';
import { hapticsService } from '../utils/haptics';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(auth)/welcome',
};

// Route guard hook
function useProtectedRoute(session: Session | null, hasCompletedOnboarding: boolean, loading: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Don't navigate while loading
    if (loading) {
      console.log('Still loading, skipping route guard...');
      return;
    }

    // Use setTimeout to ensure navigation happens after layout is mounted
    const timeoutId = setTimeout(() => {
      const inAuthGroup = segments[0] === '(auth)';
      const inTabsGroup = segments[0] === '(tabs)';

      console.log('Route guard check:', {
        session: !!session,
        hasCompletedOnboarding,
        inAuthGroup,
        inTabsGroup,
        segments
      });

      if (!session && !inAuthGroup) {
        // User is not authenticated and trying to access protected route
        console.log('Redirecting to auth - no session');
        router.replace('/(auth)/welcome' as any);
      } else if (session && inAuthGroup && segments[1] !== 'onboarding') {
        // User is authenticated but still in auth group (not in onboarding)
        if (hasCompletedOnboarding) {
          console.log('Redirecting to tabs - authenticated and onboarded');
          router.replace('/(tabs)/' as any);
        } else {
          console.log('Redirecting to onboarding - authenticated but not onboarded');
          router.replace('/(auth)/onboarding' as any);
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [session, hasCompletedOnboarding, segments, loading]);
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Use the route guard
  useProtectedRoute(session, hasCompletedOnboarding, loading);

  useEffect(() => {
    // Initialize services
    const initializeServices = async () => {
      try {
        await notificationService.initialize();
        await hapticsService.initialize();
      } catch (error) {
        console.error('Error initializing services:', error);
      }
    };

    initializeServices();

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);

      if (session) {
        // Check onboarding status
        try {
          const onboardingCompleted = await apiService.hasCompletedOnboarding();
          console.log('Onboarding completed:', onboardingCompleted);
          setHasCompletedOnboarding(onboardingCompleted);
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          setHasCompletedOnboarding(false);
        }
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);

      if (session && event === 'SIGNED_IN') {
        console.log('User signed in, checking onboarding status...');
        // Check onboarding status for newly signed in user
        try {
          const onboardingCompleted = await apiService.hasCompletedOnboarding();
          console.log('Onboarding completed after sign in:', onboardingCompleted);
          setHasCompletedOnboarding(onboardingCompleted);
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          setHasCompletedOnboarding(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setHasCompletedOnboarding(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <Text style={{ fontSize: 18, color: '#374151' }}>Loading Gitaverse...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth routes - accessible when not authenticated or during onboarding */}
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
          }}
        />

        {/* Onboarding route - accessible when authenticated but not onboarded */}
        <Stack.Screen
          name="(auth)/onboarding"
          options={{
            headerShown: false,
          }}
        />

        {/* Main app routes - accessible when authenticated and onboarded */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        {/* Modal route */}
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />

        {/* Settings routes */}
        <Stack.Screen
          name="edit-profile"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(tabs)/settings"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
