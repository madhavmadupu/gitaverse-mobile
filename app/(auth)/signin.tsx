import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';

export default function SignInScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSignIn = async () => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    if (!formData.password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        // Successfully signed in, router will automatically redirect to main app
        console.log('Signed in successfully:', data.user);
        // The root layout will handle the navigation based on onboarding status
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-8 pt-8 pb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center mb-6"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </Text>
          <Text className="text-gray-600">
            Sign in to continue your spiritual journey
          </Text>
        </View>
        
        {/* Form */}
        <View className="px-8 flex-1">
          {/* Email */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Email Address
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-base"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          {/* Password */}
          <View className="mb-8">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Password
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-base"
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
            />
          </View>
          
          {/* Sign In Button */}
          <TouchableOpacity
            className={`rounded-xl py-4 mb-6 ${isLoading ? 'bg-gray-400' : 'bg-orange-500'}`}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
          
          {/* Sign Up Link */}
          <View className="flex-row justify-center">
            <Text className="text-gray-600">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text className="text-orange-500 font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 