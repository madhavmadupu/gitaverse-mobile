import React from 'react';
import { View, Text, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerseWithChapter } from '../types';

interface VerseCardProps {
  verse: VerseWithChapter;
  onMarkAsRead?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
  onPlayAudio?: () => void;
  hasRead?: boolean;
  isFavorite?: boolean;
  showActions?: boolean;
}

export default function VerseCard({
  verse,
  onMarkAsRead,
  onFavorite,
  onShare,
  onPlayAudio,
  hasRead = false,
  isFavorite = false,
  showActions = true,
}: VerseCardProps) {
  return (
    <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold text-gray-800">
          Chapter {verse.chapter?.chapter_number || 'Unknown'} • Verse {verse.verse_number}
        </Text>
        {onShare && (
          <TouchableOpacity onPress={onShare}>
            <Ionicons name="share-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Sanskrit Text */}
      <View className="mb-6">
        <Text className="text-lg text-center font-sanskrit mb-4 text-orange-600 leading-8">
          {verse.sanskrit_text}
        </Text>

        {/* Audio Button */}
        {onPlayAudio && (
          <TouchableOpacity className="bg-orange-50 rounded-lg py-3 mb-4" onPress={onPlayAudio}>
            <View className="flex-row justify-center items-center">
              <Ionicons name="play-circle" size={20} color="#F97316" />
              <Text className="text-orange-600 font-semibold ml-2">
                Listen to Pronunciation
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* English Translation */}
      <View className="mb-6">
        <Text className="text-base text-gray-700 leading-6">
          {verse.english_translation}
        </Text>
      </View>

      {/* Action Buttons */}
      {showActions && (
        <View className="flex-row space-x-3 gap-4">
          {onMarkAsRead && (
            <TouchableOpacity
              className={`flex-1 py-3 rounded-lg ${hasRead
                ? 'bg-green-100'
                : 'bg-orange-500'
                }`}
              onPress={onMarkAsRead}
              disabled={hasRead}
            >
              <Text className={`text-center font-semibold ${hasRead ? 'text-green-600' : 'text-white'
                }`}>
                {hasRead ? '✓ Completed' : 'Mark as Read'}
              </Text>
            </TouchableOpacity>
          )}

          {onFavorite && (
            <TouchableOpacity
              className="bg-gray-100 py-3 px-3 rounded-lg"
              onPress={onFavorite}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? "#EF4444" : "#6B7280"}
              />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
} 