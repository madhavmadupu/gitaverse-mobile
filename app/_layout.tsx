import '../global.css';

import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { ThemeProvider } from '../contexts/ThemeContext';
import { notificationService } from '../utils/notifications';
import { hapticsService } from '../utils/haptics';
import { useAuthStore } from '../store/authStore';
import { useOnboardingStore } from '../store/onboardingStore';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(auth)/welcome',
};

// Route guard hook
function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingStore();

  useEffect(() => {
    // Don't navigate while loading
    if (authLoading || onboardingLoading) {
      console.log('Still loading, skipping route guard...');
      return;
    }

    // Use setTimeout to ensure navigation happens after layout is mounted
    const timeoutId = setTimeout(() => {
      const inAuthGroup = segments[0] === '(auth)';
      const inTabsGroup = segments[0] === '(tabs)';
      const isOnboarding = segments[1] === 'onboarding';

      console.log('Route guard check:', {
        isAuthenticated,
        isCompleted,
        inAuthGroup,
        inTabsGroup,
        isOnboarding,
        segments
      });

      if (!isAuthenticated && !inAuthGroup) {
        // User is not authenticated and trying to access protected route
        console.log('Redirecting to auth - not authenticated');
        router.replace('/(auth)/welcome' as any);
      } else if (isAuthenticated && inAuthGroup && !isOnboarding) {
        // User is authenticated but still in auth group (not in onboarding)
        if (isCompleted) {
          console.log('Redirecting to tabs - authenticated and onboarded');
          router.replace('/(tabs)/' as any);
        } else {
          console.log('Redirecting to onboarding - authenticated but not onboarded');
          router.replace('/(auth)/onboarding' as any);
        }
      } else if (isAuthenticated && isOnboarding && isCompleted) {
        // User is on onboarding screen but has already completed onboarding
        console.log('User already completed onboarding, redirecting to tabs');
        router.replace('/(tabs)/' as any);
      }
    }, 200); // Increased delay to reduce frequency

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, isCompleted, segments, authLoading, onboardingLoading]);
}

export default function RootLayout() {
  const { isLoading: authLoading, initializeAuth } = useAuthStore();
  const { isLoading: onboardingLoading } = useOnboardingStore();

  // Use the route guard
  useProtectedRoute();

  useEffect(() => {
    // Initialize auth
    initializeAuth();

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
  }, []); // Remove initializeAuth from dependencies to avoid re-initialization

  // Add a timeout to prevent infinite loading
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('Loading timeout reached, forcing app to continue...');
      setLoadingTimeout(true);
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, []);

  if ((authLoading || onboardingLoading) && !loadingTimeout) {
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
      </Stack>
    </ThemeProvider>
  );
}
