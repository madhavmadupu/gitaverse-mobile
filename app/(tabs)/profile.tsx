import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVerseStore } from '../../store/verseStore';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
}

const mockUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: null,
  joinDate: '2024-01-15',
  spiritualLevel: 'beginner',
  premium: false,
};

export default function ProfileScreen() {
  const router = useRouter();
  const { userSettings, updateSettings } = useVerseStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(userSettings.notificationsEnabled);
  const [soundEnabled, setSoundEnabled] = useState(userSettings.soundEnabled);
  const [hapticEnabled, setHapticEnabled] = useState(userSettings.hapticEnabled);

  const settings: SettingItem[] = [
    {
      id: 'notifications',
      title: 'Push Notifications',
      subtitle: 'Daily verse reminders',
      icon: 'notifications',
      type: 'toggle',
      value: notificationsEnabled,
      onPress: () => {
        const newValue = !notificationsEnabled;
        setNotificationsEnabled(newValue);
        updateSettings({ notificationsEnabled: newValue });
      },
    },
    {
      id: 'sound',
      title: 'Sound Effects',
      subtitle: 'Audio feedback',
      icon: 'volume-high',
      type: 'toggle',
      value: soundEnabled,
      onPress: () => {
        const newValue = !soundEnabled;
        setSoundEnabled(newValue);
        updateSettings({ soundEnabled: newValue });
      },
    },
    {
      id: 'haptic',
      title: 'Haptic Feedback',
      subtitle: 'Vibration feedback',
      icon: 'phone-portrait',
      type: 'toggle',
      value: hapticEnabled,
      onPress: () => {
        const newValue = !hapticEnabled;
        setHapticEnabled(newValue);
        updateSettings({ hapticEnabled: newValue });
      },
    },
    {
      id: 'reminder',
      title: 'Daily Reminder',
      subtitle: 'Set reminder time',
      icon: 'time',
      type: 'navigation',
      onPress: () => router.push('/reminder-settings'),
    },
    {
      id: 'language',
      title: 'Language',
      subtitle: 'English',
      icon: 'language',
      type: 'navigation',
      onPress: () => router.push('/language-settings'),
    },
    {
      id: 'theme',
      title: 'Theme',
      subtitle: 'Light',
      icon: 'color-palette',
      type: 'navigation',
      onPress: () => router.push('/theme-settings'),
    },
  ];

  const accountSettings: SettingItem[] = [
    {
      id: 'profile',
      title: 'Edit Profile',
      subtitle: 'Update your information',
      icon: 'person',
      type: 'navigation',
      onPress: () => router.push('/edit-profile'),
    },
    {
      id: 'subscription',
      title: 'Subscription',
      subtitle: mockUser.premium ? 'Premium Active' : 'Upgrade to Premium',
      icon: 'diamond',
      type: 'navigation',
      onPress: () => router.push('/subscription'),
    },
    {
      id: 'data',
      title: 'Data & Privacy',
      subtitle: 'Manage your data',
      icon: 'shield-checkmark',
      type: 'navigation',
      onPress: () => router.push('/privacy'),
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact us',
      icon: 'help-circle',
      type: 'navigation',
      onPress: () => router.push('/help'),
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      subtitle: 'Share your thoughts',
      icon: 'chatbubble',
      type: 'navigation',
      onPress: () => router.push('/feedback'),
    },
    {
      id: 'rate',
      title: 'Rate App',
      subtitle: 'Rate us on App Store',
      icon: 'star',
      type: 'action',
      onPress: () => console.log('Rate app'),
    },
    {
      id: 'share',
      title: 'Share App',
      subtitle: 'Share with friends',
      icon: 'share-social',
      type: 'action',
      onPress: () => console.log('Share app'),
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      className="flex-row items-center py-4 border-b border-gray-100 last:border-b-0"
      onPress={item.onPress}
    >
      <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-4">
        <Ionicons name={item.icon as any} size={20} color="#F97316" />
      </View>
      
      <View className="flex-1">
        <Text className="text-gray-900 font-medium">{item.title}</Text>
        {item.subtitle && (
          <Text className="text-sm text-gray-500">{item.subtitle}</Text>
        )}
      </View>
      
      {item.type === 'toggle' ? (
        <Switch
          value={item.value}
          onValueChange={item.onPress}
          trackColor={{ false: '#E5E7EB', true: '#F97316' }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="bg-white px-6 py-6 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mr-4">
              <Ionicons name="person" size={32} color="#F97316" />
            </View>
            
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">
                {mockUser.name}
              </Text>
              <Text className="text-gray-500">{mockUser.email}</Text>
              <View className="flex-row items-center mt-1">
                <View className="bg-orange-100 px-2 py-1 rounded-full mr-2">
                  <Text className="text-orange-600 text-xs font-medium capitalize">
                    {mockUser.spiritualLevel}
                  </Text>
                </View>
                {mockUser.premium && (
                  <View className="bg-yellow-100 px-2 py-1 rounded-full">
                    <Text className="text-yellow-600 text-xs font-medium">
                      Premium
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <TouchableOpacity onPress={() => router.push('/edit-profile')}>
              <Ionicons name="create" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-sm text-gray-500">
            Member since {new Date(mockUser.joinDate).toLocaleDateString()}
          </Text>
        </View>

        {/* Settings Sections */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            App Settings
          </Text>
          
          <View className="bg-white rounded-2xl shadow-sm">
            {settings.map(renderSettingItem)}
          </View>
        </View>

        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Account
          </Text>
          
          <View className="bg-white rounded-2xl shadow-sm">
            {accountSettings.map(renderSettingItem)}
          </View>
        </View>

        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Support
          </Text>
          
          <View className="bg-white rounded-2xl shadow-sm">
            {supportSettings.map(renderSettingItem)}
          </View>
        </View>

        {/* App Info */}
        <View className="px-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="flex-row items-center mb-4">
              <Ionicons name="leaf" size={24} color="#F97316" />
              <Text className="text-lg font-semibold text-gray-900 ml-3">
                Gitaverse
              </Text>
            </View>
            
            <Text className="text-sm text-gray-500 mb-2">
              Version 1.0.0
            </Text>
            <Text className="text-sm text-gray-500">
              Bhagavad Gita Daily Learning App
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <View className="px-6 mb-6">
          <TouchableOpacity className="bg-red-50 py-4 rounded-2xl">
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-out" size={20} color="#EF4444" />
              <Text className="text-red-600 font-semibold ml-2">
                Sign Out
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing for floating tab bar */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
} 