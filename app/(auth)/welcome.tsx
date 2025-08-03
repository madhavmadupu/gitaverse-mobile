import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="flex-1 justify-center items-center px-8">
        {/* App Logo/Icon */}
        <View className="w-24 h-24 bg-orange-100 rounded-full justify-center items-center mb-8">
          <Ionicons name="book" size={48} color="#F97316" />
        </View>
        
        {/* App Title */}
        <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
          Gitaverse
        </Text>
        <Text className="text-lg text-gray-600 text-center mb-8">
          Daily Bhagavad Gita Learning
        </Text>
        
        {/* Subtitle */}
        <Text className="text-base text-gray-500 text-center leading-6 mb-12">
          Discover timeless wisdom through daily verses.{'\n'}
          Start your spiritual journey today.
        </Text>
      </View>
      
      {/* Action Buttons */}
      <View className="px-8 pb-8">
        <TouchableOpacity
          className="bg-orange-500 rounded-xl py-4 mb-4"
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Get Started
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="border border-gray-300 rounded-xl py-4"
          onPress={() => router.push('/(auth)/signin')}
        >
          <Text className="text-gray-700 text-center font-semibold text-lg">
            I already have an account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
} 