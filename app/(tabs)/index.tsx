import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
  Share,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVerseStore } from '../../store/verseStore';
import { apiService } from '../../utils/api';
import { hapticsService } from '../../utils/haptics';
import { speechService } from '../../utils/speech';
import VerseCard from '../../components/VerseCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TodayScreen() {
  const router = useRouter();
  const {
    todayVerse,
    isLoading,
    hasReadToday,
    userProgress,
    setTodayVerse,
    setLoading,
    markAsRead,
    toggleFavorite,
  } = useVerseStore();

  useEffect(() => {
    const fetchTodayVerse = async () => {
      setLoading(true);
      try {
        // Try to fetch from Supabase first
        const verse = await apiService.getTodayVerse();
        setTodayVerse(verse);
      } catch (error) {
        console.error('Failed to fetch today\'s verse:', error);
        // Fallback to mock data
        const verse = apiService.getMockTodayVerse();
        setTodayVerse(verse);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayVerse();
  }, [setTodayVerse, setLoading]);

  const handleMarkAsRead = async () => {
    if (todayVerse) {
      try {
        await hapticsService.verseCompletion();
        await apiService.markVerseAsRead(todayVerse.id, 300); // 5 minutes
        markAsRead(todayVerse.id);
      } catch (error) {
        console.error('Error marking verse as read:', error);
        await hapticsService.errorAction();
      }
    }
  };

  const handleShare = async () => {
    if (todayVerse) {
      try {
        await hapticsService.buttonPress();
        const shareText = `Today's Bhagavad Gita Verse:\n\n${todayVerse.sanskrit}\n\n"${todayVerse.translation}"\n\nChapter ${todayVerse.chapter}, Verse ${todayVerse.verse}\n\n#BhagavadGita #DailyWisdom`;

        await Share.share(
          {
            message: shareText,
            title: 'Share Today\'s Verse',
            url: 'https://gitaverse.vercel.app',
          }
        );
      } catch (error) {
        console.error('Error sharing verse:', error);
        await hapticsService.errorAction();
      }
    }
  };

  const handleFavorite = async () => {
    if (todayVerse) {
      try {
        await hapticsService.buttonPress();
        toggleFavorite(todayVerse.id);
      } catch (error) {
        console.error('Error toggling favorite:', error);
        await hapticsService.errorAction();
      }
    }
  };

  const handlePlayAudio = async () => {
    if (todayVerse) {
      try {
        await hapticsService.buttonPress();
        console.log('Playing TTS for verse:', todayVerse.id);

        // Use speech service for text-to-speech
        const textToSpeak = `${todayVerse.sanskrit} ${todayVerse.translation}`;
        await speechService.speak(textToSpeak, {
          language: 'hi-IN',
          pitch: 1,
          // rate: 0.8,
          onDone: () => console.log('TTS finished'),
          onError: (error) => console.error('TTS error:', error),
        });
      } catch (error) {
        console.error('Error playing audio:', error);
        await hapticsService.errorAction();
      }
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await apiService.getTodayVerse();
    setLoading(false);
  };


  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-4">
        <View>
          <Text className="text-2xl font-bold text-gray-900">
            Today's Verse
          </Text>
          <Text className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        <View className="flex-row items-center">
          <View className="bg-orange-100 px-3 py-1 rounded-full mr-2">
            <Text className="text-orange-600 font-semibold text-sm">
              🔥 {userProgress.currentStreak} day streak
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
            <Ionicons name="settings-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}>
        {/* Verse Card */}
        {todayVerse && (
          <VerseCard
            verse={todayVerse}
            onMarkAsRead={handleMarkAsRead}
            onFavorite={handleFavorite}
            onShare={handleShare}
            onPlayAudio={handlePlayAudio}
            hasRead={hasReadToday}
            isFavorite={userProgress.favoriteVerses.includes(todayVerse.id)}
          />
        )}

        {/* AI Explanation */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <View className="flex-row items-center mb-4">
            <Ionicons name="sparkles" size={20} color="#F97316" />
            <Text className="text-lg font-semibold text-gray-800 ml-2">
              Daily Insight
            </Text>
          </View>

          <Text className="text-gray-700 leading-6 mb-4">
            {todayVerse?.explanation}
          </Text>

          {/* Keywords */}
          <View className="flex-row flex-wrap">
            {todayVerse?.keywords.map((keyword, index) => (
              <View key={index} className="bg-orange-50 px-3 py-1 rounded-full mr-2 mb-2">
                <Text className="text-orange-600 text-sm font-medium">
                  #{keyword}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom spacing for tab bar */}
        <View className="h-16" />
      </ScrollView>
    </SafeAreaView>
  );
}
