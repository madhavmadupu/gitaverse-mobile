import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar, RefreshControl,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVerseStore } from '../../store/verseStore';
import { apiService } from '../../utils/api';
import { hapticsService } from '../../utils/haptics';
import { speechService } from '../../utils/speech';
import { notificationService } from '../../utils/notifications';
import VerseCard from '../../components/VerseCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

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
    syncProgressFromServer,
    loadCompletedVerses,
  } = useVerseStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);

  // Enhanced verse fetching with streak-based selection
  const fetchTodayVerse = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && todayVerse) return;

    setLoading(true);
    try {
      // Get dynamic verse based on user's streak and progress
      const verse = await apiService.getDynamicTodayVerse(userProgress.currentStreak);
      setTodayVerse(verse);

      // Schedule next day's notification if user has opened the app
      await scheduleNextDayNotification();

    } catch (error) {
      console.error('Failed to fetch today\'s verse:', error);
      // Fallback to mock data
      const verse = apiService.getMockTodayVerse();
      setTodayVerse(verse);
    } finally {
      setLoading(false);
    }
  }, [todayVerse, userProgress.currentStreak, setTodayVerse, setLoading]);

  // Schedule notification for next day
  const scheduleNextDayNotification = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0); // 8 AM

      await notificationService.scheduleDailyVerseNotification(tomorrow, {
        title: "🌟 Your Daily Verse Awaits",
        body: `Continue your ${userProgress.currentStreak + 1} day streak with today's wisdom`,
        data: { screen: 'today' }
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  // Handle notification tap
  const handleNotificationTap = useCallback(() => {
    // This will be called when user taps notification
    fetchTodayVerse(true);
  }, [fetchTodayVerse]);

  useEffect(() => {
    const initializeScreen = async () => {
      // Load completed verses first
      await loadCompletedVerses();
      
      // Sync progress from server
      await syncProgressFromServer();
      
      // Fetch today's verse
      await fetchTodayVerse();
    };

    initializeScreen();

    // Set up notification listener
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      if (response.notification.request.content.data?.screen === 'today') {
        handleNotificationTap();
      }
    });

    return () => subscription?.remove();
  }, [fetchTodayVerse, handleNotificationTap, loadCompletedVerses, syncProgressFromServer]);

  const handleMarkAsRead = async () => {
    if (todayVerse) {
      try {
        await hapticsService.verseCompletion();

        // Use the enhanced markAsRead from store (handles both Supabase and local state)
        await markAsRead(todayVerse.id, 300); // 5 minutes

        // Show streak animation
        setShowStreakAnimation(true);
        setTimeout(() => setShowStreakAnimation(false), 2000);

        // Schedule next notification
        await scheduleNextDayNotification();

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
        const shareText = `🔥 Day ${userProgress.currentStreak} of my Bhagavad Gita journey!\n\n"${todayVerse.english_translation}"\n\nChapter ${todayVerse.chapter?.chapter_number || 'Unknown'}, Verse ${todayVerse.verse_number}\n\nJoin me on Gitaverse - your daily spiritual companion! 📖✨\n\n#BhagavadGita #DailyWisdom #Streak${userProgress.currentStreak}`;

        await Share.share({
          message: shareText,
          title: 'Share Today\'s Verse',
          url: 'https://gitaverse.vercel.app',
        });
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

        const textToSpeak = `${todayVerse.sanskrit_text} ${todayVerse.english_translation}`;
        await speechService.speak(textToSpeak, {
          language: 'hi-IN',
          pitch: 1,
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
    setIsRefreshing(true);
    await fetchTodayVerse(true);
    setIsRefreshing(false);
  };

  const getStreakMessage = () => {
    if (userProgress.currentStreak === 0) return "Start your journey today!";
    if (userProgress.currentStreak === 1) return "Great start! Keep going!";
    if (userProgress.currentStreak < 7) return "Building momentum!";
    if (userProgress.currentStreak < 30) return "Consistency is key!";
    if (userProgress.currentStreak < 100) return "You're on fire!";
    return "Legendary dedication!";
  };

  const getStreakColor = () => {
    if (userProgress.currentStreak === 0) return "bg-gray-100";
    if (userProgress.currentStreak < 7) return "bg-orange-100";
    if (userProgress.currentStreak < 30) return "bg-red-100";
    if (userProgress.currentStreak < 100) return "bg-purple-100";
    return "bg-yellow-100";
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gradient-to-b from-orange-50 to-white">
        <StatusBar barStyle="dark-content" />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-orange-50 to-white">
      <StatusBar barStyle="dark-content" />

      {/* Enhanced Header */}
      <View className="px-4 py-6">
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-gray-900 mb-1">
              Today's Wisdom
            </Text>
            <Text className="text-lg text-gray-600">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/settings')}
            className="bg-white p-3 rounded-full shadow-sm"
          >
            <Ionicons name="settings-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Enhanced Streak Display */}
        <View className={`${getStreakColor()} rounded-2xl p-4 mb-4 shadow-sm`}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                🔥 {userProgress.currentStreak} Day{userProgress.currentStreak !== 1 ? 's' : ''} Streak
              </Text>
              <Text className="text-gray-600 font-medium">
                {getStreakMessage()}
              </Text>
              {userProgress.longestStreak > userProgress.currentStreak && (
                <Text className="text-sm text-gray-500 mt-1">
                  Longest: {userProgress.longestStreak} days
                </Text>
              )}
            </View>

            {showStreakAnimation && (
              <View className="animate-pulse">
                <Ionicons name="flame" size={40} color="#F97316" />
              </View>
            )}
          </View>
        </View>

        {/* Progress Summary */}
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900 mb-1">
                Your Journey
              </Text>
              <Text className="text-gray-600">
                {userProgress.totalVerses} verses completed
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/progress')}
              className="bg-orange-500 px-4 py-2 rounded-full"
            >
              <Text className="text-white font-semibold">View Progress</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#F97316']}
            tintColor="#F97316"
          />
        }
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Verse Card */}
        {todayVerse && (
          <View className="mb-6">
            <View className="bg-white rounded-3xl p-6 shadow-lg border border-orange-100">
              <View className="flex-row items-center justify-between mb-4">
                <View className="bg-orange-500 px-4 py-2 rounded-full">
                  <Text className="text-white font-bold text-sm">
                    Chapter {todayVerse.chapter?.chapter_number} • Verse {todayVerse.verse_number}
                  </Text>
                </View>
                {hasReadToday && (
                  <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-green-600 font-semibold text-sm">
                      ✓ Completed
                    </Text>
                  </View>
                )}
              </View>

              <VerseCard
                verse={todayVerse}
                onMarkAsRead={handleMarkAsRead}
                onFavorite={handleFavorite}
                onShare={handleShare}
                onPlayAudio={handlePlayAudio}
                hasRead={hasReadToday}
                isFavorite={userProgress.favoriteVerses.includes(todayVerse.id)}
              />
            </View>
          </View>
        )}

        {/* Enhanced AI Explanation */}
        <View className="bg-white rounded-3xl p-6 mb-6 shadow-lg border border-orange-100">
          <View className="flex-row items-center mb-4">
            <View className="bg-gradient-to-r from-orange-400 to-red-500 p-2 rounded-full mr-3">
              <Ionicons name="sparkles" size={20} color="white" />
            </View>
            <Text className="text-xl font-bold text-gray-900">
              Daily Insight
            </Text>
          </View>

          <Text className="text-gray-700 leading-7 text-base mb-4">
            {todayVerse?.explanation || "Today's verse offers profound wisdom for your spiritual journey. Take a moment to reflect on its meaning and how it applies to your life."}
          </Text>

          {/* Keywords */}
          <View className="flex-row flex-wrap">
            {(todayVerse?.keywords || ['wisdom', 'spirituality', 'growth']).map((keyword, index) => (
              <View key={index} className="bg-orange-50 px-4 py-2 rounded-full mr-2 mb-2 border border-orange-200">
                <Text className="text-orange-600 font-semibold text-sm">
                  #{keyword}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-3xl p-6 mb-6 shadow-lg border border-orange-100">
          <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/library')}
              className="bg-orange-500 flex-1 mr-3 py-4 rounded-2xl items-center"
            >
              <Ionicons name="library" size={24} color="white" />
              <Text className="text-white font-semibold mt-2">Library</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/progress')}
              className="bg-blue-500 flex-1 ml-3 py-4 rounded-2xl items-center"
            >
              <Ionicons name="trending-up" size={24} color="white" />
              <Text className="text-white font-semibold mt-2">Progress</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom spacing for tab bar */}
        <View className="h-16" />
      </ScrollView>
    </SafeAreaView>
  );
}
