import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticsService } from '../../utils/haptics';
import { notificationService, NotificationSettings } from '../../utils/notifications';
import { secureStorage } from '../../utils/secureStorage';
import { supabase } from '../../utils/supabase';
import { apiService } from '../../utils/api';
import * as Sharing from 'expo-sharing';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  spiritual_level?: string;
  avatar_url?: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: true,
    time: '07:00',
    weekendNotifications: true,
    soundEnabled: true,
  });
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    loadUserProfile();
  }, []);

  const loadSettings = async () => {
    try {
      // Load notification settings
      const notifSettings = await notificationService.getNotificationSettings();
      if (notifSettings) {
        setNotificationSettings(notifSettings);
      }

      // Load haptic settings
      const userPrefs = await secureStorage.getUserPreferences();
      if (userPrefs?.hapticEnabled !== undefined) {
        setHapticEnabled(userPrefs.hapticEnabled);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const userProfile: UserProfile = {
          id: authUser.id,
          email: authUser.email || '',
          username: authUser.user_metadata?.username || '',
          full_name: authUser.user_metadata?.full_name || '',
          spiritual_level: authUser.user_metadata?.spiritual_level || 'beginner',
        };
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    try {
      await hapticsService.buttonPress();
      const newSettings = { ...notificationSettings, enabled };
      setNotificationSettings(newSettings);
      
      if (enabled) {
        await notificationService.initialize();
      }
      
      await notificationService.scheduleDailyReminder(newSettings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    }
  };

  const handleHapticToggle = async (enabled: boolean) => {
    try {
      await hapticsService.buttonPress();
      setHapticEnabled(enabled);
      await hapticsService.setEnabled(enabled);
    } catch (error) {
      console.error('Error updating haptic settings:', error);
    }
  };

  const handleThemeChange = async (mode: 'light' | 'dark' | 'auto') => {
    try {
      await hapticsService.selection();
      await setThemeMode(mode);
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      await hapticsService.buttonPress();
      await notificationService.sendTestNotification();
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleTestHaptic = async () => {
    try {
      await hapticsService.buttonPress();
      Alert.alert('Success', 'Haptic feedback working!');
    } catch (error) {
      console.error('Error testing haptic:', error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await hapticsService.buttonPress();

              // Clear all secure storage
              await secureStorage.clearAll();

              // Sign out from Supabase
              await supabase.auth.signOut();

              // The root layout will handle the redirect to auth
            } catch (error) {
              console.error('Error signing out:', error);
              await hapticsService.errorAction();
            }
          },
        },
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      await hapticsService.buttonPress();
      const shareText = 'Check out Gitaverse - a beautiful Bhagavad Gita daily learning app! 📖✨\n\nDownload now and start your spiritual journey.';

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareText);
      } else {
        Alert.alert('Share App', shareText, [
          { text: 'Copy', onPress: () => console.log('Copied to clipboard') },
          { text: 'Cancel', style: 'cancel' }
        ]);
      }
    } catch (error) {
      console.error('Error sharing app:', error);
      await hapticsService.errorAction();
    }
  };

  const handleRateApp = async () => {
    try {
      await hapticsService.buttonPress();
      console.log('Rate app');
      // In a real app, you'd open the app store
      // Linking.openURL('https://apps.apple.com/app/your-app-id');
      Alert.alert('Rate App', 'This would open the app store rating page');
    } catch (error) {
      console.error('Error rating app:', error);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await hapticsService.warning();
              // Handle account deletion
              console.log('Delete account');
              Alert.alert('Delete Account', 'Account deletion would be processed here');
            } catch (error) {
              console.error('Error deleting account:', error);
            }
          },
        },
      ]
    );
  };

  const appearanceSettings: SettingItem[] = [
    {
      id: 'theme',
      title: 'Theme',
      subtitle: themeMode === 'auto' ? 'Auto' : themeMode === 'dark' ? 'Dark' : 'Light',
      icon: 'color-palette',
      type: 'action',
      onPress: () => {
        hapticsService.navigation();
        Alert.alert(
          'Choose Theme',
          'Select your preferred theme',
          [
            { text: 'Light', onPress: () => handleThemeChange('light') },
            { text: 'Dark', onPress: () => handleThemeChange('dark') },
            { text: 'Auto', onPress: () => handleThemeChange('auto') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      },
    },
  ];

  const notificationSettingsList: SettingItem[] = [
    {
      id: 'notifications',
      title: 'Push Notifications',
      subtitle: 'Daily verse reminders',
      icon: 'notifications',
      type: 'toggle',
      value: notificationSettings.enabled,
      onPress: () => handleNotificationToggle(!notificationSettings.enabled),
    },
    {
      id: 'test-notification',
      title: 'Test Notification',
      subtitle: 'Send a test notification',
      icon: 'send',
      type: 'action',
      onPress: handleTestNotification,
    },
  ];

  const hapticSettings: SettingItem[] = [
    {
      id: 'haptic',
      title: 'Haptic Feedback',
      subtitle: 'Vibration feedback',
      icon: 'phone-portrait',
      type: 'toggle',
      value: hapticEnabled,
      onPress: () => handleHapticToggle(!hapticEnabled),
    },
    {
      id: 'test-haptic',
      title: 'Test Haptic',
      subtitle: 'Test haptic feedback',
      icon: 'vibrate',
      type: 'action',
      onPress: handleTestHaptic,
    },
  ];

  const accountSettings: SettingItem[] = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      subtitle: 'Update your information',
      icon: 'person',
      type: 'action',
      onPress: () => {
        hapticsService.navigation();
        router.push('/edit-profile');
      },
    },
    {
      id: 'share-app',
      title: 'Share App',
      subtitle: 'Share with friends',
      icon: 'share-social',
      type: 'action',
      onPress: handleShareApp,
    },
    {
      id: 'rate-app',
      title: 'Rate App',
      subtitle: 'Rate us on App Store',
      icon: 'star',
      type: 'action',
      onPress: handleRateApp,
    },
  ];

  const dangerSettings: SettingItem[] = [
    {
      id: 'sign-out',
      title: 'Sign Out',
      subtitle: 'Sign out of your account',
      icon: 'log-out',
      type: 'action',
      onPress: handleSignOut,
    },
    {
      id: 'delete-account',
      title: 'Delete Account',
      subtitle: 'Permanently delete account',
      icon: 'trash',
      type: 'action',
      onPress: handleDeleteAccount,
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      className={`flex-row items-center justify-between p-4 border-b border-gray-100 ${isDark ? 'border-gray-800' : ''}`}
      onPress={item.onPress}
    >
      <View className="flex-row items-center flex-1">
        <View className={`w-10 h-10 rounded-full justify-center items-center mr-3 ${
          item.id === 'delete-account' ? 'bg-red-100' : 
          item.id === 'sign-out' ? 'bg-orange-100' : 
          'bg-gray-100'
        }`}>
          <Ionicons 
            name={item.icon as any} 
            size={20} 
            color={
              item.id === 'delete-account' ? '#EF4444' : 
              item.id === 'sign-out' ? '#F97316' : 
              '#6B7280'
            } 
          />
        </View>
        <View className="flex-1">
          <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {item.subtitle}
            </Text>
          )}
        </View>
      </View>
      
      {item.type === 'toggle' && (
        <Switch
          value={item.value}
          onValueChange={item.onPress}
          trackColor={{ false: '#E5E7EB', true: '#F97316' }}
          thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
        />
      )}
      
      {item.type === 'action' && (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={isDark ? '#9CA3AF' : '#6B7280'} 
        />
      )}
    </TouchableOpacity>
  );

  const renderSection = (title: string, items: SettingItem[]) => (
    <View className="mb-6">
      <Text className={`text-lg font-bold mb-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </Text>
      <View className={`bg-white rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : ''}`}>
        {items.map(renderSettingItem)}
      </View>
    </View>
  );

  const bgColor = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = isDark ? 'text-white' : 'text-gray-900';

  if (isLoading) {
    return (
      <SafeAreaView className={`flex-1 ${bgColor}`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 justify-center items-center">
          <Text className={`text-lg ${textColor}`}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <Text className={`text-xl font-bold ${textColor}`}>Settings</Text>
        
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View className="mb-6">
          <View className={`bg-white rounded-xl p-6 ${isDark ? 'bg-gray-800' : ''}`}>
            <View className="flex-row items-center mb-4">
              <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="person" size={32} color="#F97316" />
              </View>
              <View className="flex-1">
                <Text className={`text-lg font-bold ${textColor}`}>
                  {user?.full_name || user?.username || 'User'}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user?.email}
                </Text>
                <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Spiritual Level: {user?.spiritual_level || 'beginner'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              onPress={() => {
                hapticsService.navigation();
                router.push('/edit-profile');
              }}
              className="bg-orange-500 py-3 rounded-lg"
            >
              <Text className="text-white text-center font-semibold">
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Sections */}
        {renderSection('Appearance', appearanceSettings)}
        {renderSection('Notifications', notificationSettingsList)}
        {renderSection('Haptic Feedback', hapticSettings)}
        {renderSection('Account', accountSettings)}
        {renderSection('Danger Zone', dangerSettings)}

        {/* Bottom spacing */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
} 