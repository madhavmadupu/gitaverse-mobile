import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({ 
  message = "Loading today's wisdom...", 
  size = 'medium' 
}: LoadingSpinnerProps) {
  const iconSize = size === 'small' ? 32 : size === 'medium' ? 48 : 64;
  const textSize = size === 'small' ? 'text-sm' : size === 'medium' ? 'text-lg' : 'text-xl';

  return (
    <View className="flex-1 justify-center items-center">
      <Ionicons name="leaf" size={iconSize} color="#F97316" />
      <Text className={`font-semibold text-gray-600 mt-4 ${textSize}`}>
        {message}
      </Text>
    </View>
  );
} 