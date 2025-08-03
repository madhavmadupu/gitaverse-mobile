import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { apiService } from '../utils/api';
import { hapticsService } from '../utils/haptics';
import { useTheme } from '../contexts/ThemeContext';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  spiritual_level?: string;
  avatar_url?: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    spiritualLevel: 'beginner',
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const userProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || '',
          full_name: user.user_metadata?.full_name || '',
          spiritual_level: user.user_metadata?.spiritual_level || 'beginner',
        };

        setProfile(userProfile);
        setFormData({
          username: userProfile.username,
          fullName: userProfile.full_name || '',
          spiritualLevel: userProfile.spiritual_level || 'beginner',
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    // Validation
    if (!formData.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    if (formData.username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return;
    }

    try {
      setIsSaving(true);
      await hapticsService.buttonPress();

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          username: formData.username.trim(),
          full_name: formData.fullName.trim(),
          spiritual_level: formData.spiritualLevel,
        }
      });

      if (error) {
        throw error;
      }

      await hapticsService.success();
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      await hapticsService.errorAction();
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const spiritualLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  const bgColor = isDark ? 'bg-gray-900' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-300';
  const inputBgColor = isDark ? 'bg-gray-800' : 'bg-gray-50';

  if (isLoading) {
    return (
      <SafeAreaView className={`flex-1 ${bgColor}`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="flex-1 justify-center items-center">
          <Text className={`text-lg ${textColor}`}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          
          <Text className={`text-xl font-bold ${textColor}`}>Edit Profile</Text>
          
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg ${isSaving ? 'bg-gray-400' : 'bg-orange-500'}`}
          >
            <Text className="text-white font-semibold">
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
          {/* Profile Picture Section */}
          <View className="items-center mb-8">
            <View className="w-24 h-24 bg-orange-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="person" size={48} color="#F97316" />
            </View>
            <TouchableOpacity className="bg-orange-500 px-4 py-2 rounded-lg">
              <Text className="text-white font-semibold">Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View className="space-y-6">
            {/* Email (Read-only) */}
            <View>
              <Text className={`text-sm font-medium mb-2 ${textColor}`}>
                Email Address
              </Text>
              <TextInput
                className={`px-4 py-3 rounded-xl border ${borderColor} ${inputBgColor} ${textColor}`}
                value={profile?.email || ''}
                editable={false}
                placeholder="Email address"
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
              />
              <Text className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </Text>
            </View>

            {/* Username */}
            <View>
              <Text className={`text-sm font-medium mb-2 ${textColor}`}>
                Username *
              </Text>
              <TextInput
                className={`px-4 py-3 rounded-xl border ${borderColor} ${inputBgColor} ${textColor}`}
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
                placeholder="Enter username"
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Full Name */}
            <View>
              <Text className={`text-sm font-medium mb-2 ${textColor}`}>
                Full Name
              </Text>
              <TextInput
                className={`px-4 py-3 rounded-xl border ${borderColor} ${inputBgColor} ${textColor}`}
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                placeholder="Enter your full name"
                placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                autoCapitalize="words"
              />
            </View>

            {/* Spiritual Level */}
            <View>
              <Text className={`text-sm font-medium mb-2 ${textColor}`}>
                Spiritual Level
              </Text>
              <View className={`border ${borderColor} rounded-xl overflow-hidden`}>
                {spiritualLevels.map((level, index) => (
                  <TouchableOpacity
                    key={level.value}
                    onPress={() => {
                      setFormData({ ...formData, spiritualLevel: level.value });
                      hapticsService.selection();
                    }}
                    className={`px-4 py-3 border-b border-gray-200 last:border-b-0 ${
                      formData.spiritualLevel === level.value
                        ? 'bg-orange-50 border-orange-200'
                        : inputBgColor
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className={`font-medium ${textColor}`}>
                        {level.label}
                      </Text>
                      {formData.spiritualLevel === level.value && (
                        <Ionicons name="checkmark-circle" size={20} color="#F97316" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Delete Account Section */}
          <View className="mt-12 pt-8 border-t border-gray-200">
            <Text className={`text-lg font-semibold mb-4 ${textColor}`}>
              Danger Zone
            </Text>
            <TouchableOpacity
              onPress={() => {
                hapticsService.warning();
                Alert.alert(
                  'Delete Account',
                  'Are you sure you want to delete your account? This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive',
                      onPress: () => {
                        // Handle account deletion
                        console.log('Delete account');
                      }
                    }
                  ]
                );
              }}
              className="bg-red-50 py-4 rounded-xl border border-red-200"
            >
              <Text className="text-red-600 text-center font-semibold">
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom spacing */}
          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 