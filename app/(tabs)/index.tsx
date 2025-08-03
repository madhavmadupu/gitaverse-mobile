import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVerseStore } from '../../store/verseStore';
import { apiService } from '../../utils/api';
import VerseCard from '../../components/VerseCard';
import LoadingSpinner from '../../components/LoadingSpinner';

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
        // For development, use mock data
        const verse = apiService.getMockTodayVerse();
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

  const handleMarkAsRead = () => {
    if (todayVerse) {
      markAsRead(todayVerse.id);
    }
  };

  const handleShare = () => {
    // Implement sharing functionality
    console.log('Share verse');
  };

  const handleFavorite = () => {
    if (todayVerse) {
      toggleFavorite(todayVerse.id);
    }
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
      <View className="flex-row justify-between items-center px-6 py-4">
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
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Verse Card */}
        {todayVerse && (
          <VerseCard
            verse={todayVerse}
            onMarkAsRead={handleMarkAsRead}
            onFavorite={handleFavorite}
            onShare={handleShare}
            onPlayAudio={() => console.log('Play audio')}
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

        {/* Progress Indicator */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Your Progress
          </Text>
          
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-2xl font-bold text-gray-900">
                {userProgress.currentStreak}
              </Text>
              <Text className="text-sm text-gray-500">
                Day Streak
              </Text>
            </View>
            
            <View>
              <Text className="text-2xl font-bold text-gray-900">
                {hasReadToday ? '1' : '0'}
              </Text>
              <Text className="text-sm text-gray-500">
                Today's Goal
              </Text>
            </View>
            
            <View>
              <Text className="text-2xl font-bold text-gray-900">
                {userProgress.totalVerses}
              </Text>
              <Text className="text-sm text-gray-500">
                Total Verses
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom spacing for floating tab bar */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
