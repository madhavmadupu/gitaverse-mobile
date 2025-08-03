import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { speechService } from '../utils/speech';
import { hapticsService } from '../utils/haptics';

interface SpeechPlayerProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function SpeechPlayer({ isVisible, onClose }: SpeechPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    const checkSpeechStatus = () => {
      setIsPlaying(speechService.isCurrentlyPlaying());
      setCurrentText(speechService.getCurrentText());
    };

    // Check status immediately
    checkSpeechStatus();

    // Set up interval to check status
    const interval = setInterval(checkSpeechStatus, 500);

    return () => clearInterval(interval);
  }, []);

  const handlePlayPause = async () => {
    try {
      await hapticsService.buttonPress();
      if (isPlaying) {
        await speechService.pause();
      } else {
        await speechService.resume();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const handleStop = async () => {
    try {
      await hapticsService.buttonPress();
      await speechService.stop();
      setIsPlaying(false);
      onClose();
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <View className="absolute bottom-16 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-4">
          <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
            {currentText || 'Playing verse...'}
          </Text>
          <Text className="text-xs text-gray-500">
            {isPlaying ? 'Playing' : 'Paused'}
          </Text>
        </View>

        <View className="flex-row items-center space-x-2">
          <TouchableOpacity
            onPress={handlePlayPause}
            className="w-10 h-10 bg-orange-500 rounded-full items-center justify-center"
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleStop}
            className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center"
          >
            <Ionicons name="stop" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
} 