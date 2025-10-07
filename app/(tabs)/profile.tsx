import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVerseStore } from '../../store/verseStore';
import { supabase } from '../../utils/supabase';
import { hapticsService } from '../../utils/haptics';
import { useTheme } from '../../contexts/ThemeContext';
import * as Sharing from 'expo-sharing';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  spiritual_level?: string;
  avatar_url?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  isEarned: boolean;
  progress: number;
  target: number;
}

const mockAchievements: Achievement[] = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Complete your first verse',
    icon: 'footsteps',
    isEarned: true,
    progress: 1,
    target: 1,
  },
  {
    id: '2',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: 'flame',
    isEarned: false,
    progress: 3,
    target: 7,
  },
  {
    id: '3',
    name: 'Chapter Explorer',
    description: 'Complete 5 chapters',
    icon: 'book',
    isEarned: false,
    progress: 2,
    target: 5,
  },
  {
    id: '4',
    name: 'Sanskrit Scholar',
    description: 'Read 50 verses with Sanskrit',
    icon: 'school',
    isEarned: false,
    progress: 12,
    target: 50,
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { userProgress } = useVerseStore();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        const userProfile: UserProfile = {
          id: authUser.id,
          email: authUser.email || '',
          username: authUser.user_metadata?.username || '',
          full_name: authUser.user_metadata?.full_name || '',
          spiritual_level: authUser.user_metadata?.spiritual_level || 'beginner',
        };
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    currentStreak: userProgress.currentStreak,
    longestStreak: userProgress.longestStreak,
    totalVerses: userProgress.totalVerses,
    totalChapters: userProgress.totalChapters,
    totalTime: userProgress.totalTime, // minutes
    averageTime: userProgress.totalTime > 0 ? (userProgress.totalTime / userProgress.totalVerses).toFixed(1) : 0, // minutes per session
  };

  const timeframes = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
  ];

  const getProgressPercentage = (progress: number, target: number) => {
    return Math.min((progress / target) * 100, 100);
  };

  const handleShareProgress = async () => {
    try {
      await hapticsService.buttonPress();
      const shareText = `My Bhagavad Gita Progress:\n\n🔥 ${stats.currentStreak} day streak\n📖 ${stats.totalVerses} verses completed\n📚 ${stats.totalChapters} chapters explored\n⏱️ ${stats.totalTime} minutes of spiritual study\n\nJoin me on Gitaverse - your daily spiritual companion! 📖✨\n\n#BhagavadGita #SpiritualJourney #Gitaverse`;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareText);
      } else {
        Alert.alert('Share Progress', shareText, [
          { text: 'Copy', onPress: () => console.log('Copied to clipboard') },
          { text: 'Cancel', style: 'cancel' }
        ]);
      }
    } catch (error) {
      console.error('Error sharing progress:', error);
      await hapticsService.errorAction();
    }
  };

  const handleShareApp = async () => {
    try {
      await hapticsService.buttonPress();
      const shareText = 'Check out Gitaverse - a beautiful Bhagavad Gita daily learning app! 📖✨\n\nDownload now and start your spiritual journey.';

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareText);
      } else {
        Alert.alert('Share App', shareText, [
          { text: 'Copy', onPress: () => console.log('Copied to clipboard') },
          { text: 'Cancel', style: 'cancel' }
        ]);
      }
    } catch (error) {
      console.error('Error sharing app:', error);
      await hapticsService.errorAction();
    }
  };

  const bgColor = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const cardBgColor = isDark ? 'bg-gray-800' : 'bg-white';

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

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* User Profile Header */}
        <View className={`rounded-2xl mb-2 pt-6`}>
          <View className="flex-row items-center mb-4">
            <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mr-4">
              <Ionicons name="person" size={32} color="#F97316" />
            </View>

            <View className="flex-1">
              <Text className={`text-xl font-bold ${textColor}`}>
                {user?.full_name || user?.username || 'User'}
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {user?.email}
              </Text>
              <View className="flex-row items-center mt-1">
                <View className="bg-orange-100 px-2 py-1 rounded-full mr-2">
                  <Text className="text-orange-600 text-xs font-medium capitalize">
                    {user?.spiritual_level || 'beginner'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                hapticsService.navigation();
                router.push('/edit-profile');
              }}
              className="p-2 rounded-full bg-gray-100"
            >
              <Ionicons name="create" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={() => {
                hapticsService.navigation();
                router.push('/(tabs)/settings');
              }}
              className="flex-1 bg-orange-500 py-3 rounded-lg"
            >
              <Text className="text-white text-center font-semibold">
                Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShareApp}
              className="bg-gray-100 py-3 px-4 rounded-lg"
            >
              <Ionicons name="share-social" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Streak Card */}
        <View className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl mb-2">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold">
              Current Streak
            </Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={handleShareProgress}
                className="mr-3 p-2 rounded-full bg-white bg-opacity-20"
              >
                <Ionicons name="share-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
              <Ionicons name="flame" size={24} color="#6B7280" />
            </View>
          </View>

          <View className="flex-row items-end mb-2">
            <Text className="text-4xl font-bold mr-2">
              {stats.currentStreak}
            </Text>
            <Text className=" text-lg mb-1">days</Text>
          </View>

          <Text className="text-orange-500 text-sm">
            Longest streak: {stats.longestStreak} days
          </Text>
        </View>

        {/* Stats Grid */}
        <View>
          <Text className={`text-lg font-semibold ${textColor} mb-4`}>
            Learning Stats
          </Text>

          <View className="grid grid-cols-2 gap-2">
            <View className="bg-gray-50 rounded-xl p-2">
              <View className="flex-row items-center mb-2">
                <Ionicons name="book" size={20} color="#F97316" />
                <Text className="text-gray-600 text-sm ml-2">Verses Read</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                {stats.totalVerses}
              </Text>
            </View>

            <View className="bg-gray-50 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="library" size={20} color="#F97316" />
                <Text className="text-gray-600 text-sm ml-2">Chapters</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                {stats.totalChapters}/18
              </Text>
            </View>

            <View className="bg-gray-50 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="time" size={20} color="#F97316" />
                <Text className="text-gray-600 text-sm ml-2">Total Time</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                {Math.floor(stats.totalTime / 60)}h {stats.totalTime % 60}m
              </Text>
            </View>

            <View className="bg-gray-50 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="timer" size={20} color="#F97316" />
                <Text className="text-gray-600 text-sm ml-2">Avg/Session</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                {stats.averageTime}m
              </Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View className={`${cardBgColor} rounded-2xl p-4 mb-2`}>
          <Text className={`text-lg font-semibold ${textColor} mb-4`}>
            Achievements
          </Text>

          <View className='flex flex-col gap-2'>
            {mockAchievements.map((achievement) => {
              const progressPercentage = getProgressPercentage(
                achievement.progress,
                achievement.target
              );

              return (
                <View key={achievement.id} className="mb-4 last:mb-0">
                  <View className="flex-row items-center mb-1">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${achievement.isEarned ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                      <Ionicons
                        name={achievement.icon as any}
                        size={20}
                        color={achievement.isEarned ? '#10B981' : '#6B7280'}
                      />
                    </View>

                    <View className="flex-1">
                      <Text className={`font-semibold ${achievement.isEarned ? 'text-green-600' : textColor
                        }`}>
                        {achievement.name}
                      </Text>
                      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {achievement.description}
                      </Text>
                    </View>

                    {achievement.isEarned && (
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    )}
                  </View>

                  {!achievement.isEarned && (
                    <View className="ml-12">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Progress</Text>
                        <Text className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {achievement.progress}/{achievement.target}
                        </Text>
                      </View>
                      <View className="bg-gray-200 rounded-full h-2">
                        <View
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Timeframe Selector */}
        <View className="bg-white rounded-2xl p-4 mb-2 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Activity
          </Text>

          <View className="flex-row gap-2 mb-4">
            {timeframes.map((timeframe) => (
              <TouchableOpacity
                key={timeframe.id}
                className={`px-4 py-2 rounded-full ${selectedTimeframe === timeframe.id
                  ? 'bg-orange-500'
                  : 'bg-gray-100'
                  }`}
                onPress={() => setSelectedTimeframe(timeframe.id)}
              >
                <Text
                  className={`text-sm font-medium ${selectedTimeframe === timeframe.id
                    ? 'text-white'
                    : 'text-gray-600'
                    }`}
                >
                  {timeframe.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Activity Chart Placeholder */}
          <View className="bg-gray-50 rounded-xl p-6 items-center">
            <Ionicons name="bar-chart" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-center mt-2">
              Activity chart will be displayed here
            </Text>
          </View>
        </View>

        {/* Bottom spacing for tab bar */}
        <View className="h-16" />
      </ScrollView>
    </SafeAreaView>
  );
} 