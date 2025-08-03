import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVerseStore } from '../../store/verseStore';

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

export default function ProgressScreen() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const { userProgress } = useVerseStore();
  
  const timeframes = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
  ];

  const stats = {
    currentStreak: userProgress.currentStreak,
    longestStreak: userProgress.longestStreak,
    totalVerses: userProgress.totalVerses,
    totalChapters: userProgress.totalChapters,
    totalTime: userProgress.totalTime, // minutes
    averageTime: userProgress.totalTime > 0 ? (userProgress.totalTime / userProgress.totalVerses).toFixed(1) : 0, // minutes per session
  };

  const getProgressPercentage = (progress: number, target: number) => {
    return Math.min((progress / target) * 100, 100);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Your Progress
        </Text>
        <Text className="text-sm text-gray-500">
          Track your spiritual journey
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Streak Card */}
        <View className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-semibold">
              Current Streak
            </Text>
            <Ionicons name="flame" size={24} color="#FFFFFF" />
          </View>
          
          <View className="flex-row items-end mb-2">
            <Text className="text-4xl font-bold text-white mr-2">
              {stats.currentStreak}
            </Text>
            <Text className="text-white text-lg mb-1">days</Text>
          </View>
          
          <Text className="text-orange-100 text-sm">
            Longest streak: {stats.longestStreak} days
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Learning Stats
          </Text>
          
          <View className="grid grid-cols-2 gap-4">
            <View className="bg-gray-50 rounded-xl p-4">
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

        {/* Timeframe Selector */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Activity
          </Text>
          
          <View className="flex-row space-x-3 mb-4">
            {timeframes.map((timeframe) => (
              <TouchableOpacity
                key={timeframe.id}
                className={`px-4 py-2 rounded-full ${
                  selectedTimeframe === timeframe.id
                    ? 'bg-orange-500'
                    : 'bg-gray-100'
                }`}
                onPress={() => setSelectedTimeframe(timeframe.id)}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedTimeframe === timeframe.id
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

        {/* Achievements */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Achievements
          </Text>
          
          {mockAchievements.map((achievement) => {
            const progressPercentage = getProgressPercentage(
              achievement.progress,
              achievement.target
            );
            
            return (
              <View key={achievement.id} className="mb-4 last:mb-0">
                <View className="flex-row items-center mb-2">
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    achievement.isEarned ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Ionicons
                      name={achievement.icon as any}
                      size={20}
                      color={achievement.isEarned ? '#10B981' : '#6B7280'}
                    />
                  </View>
                  
                  <View className="flex-1">
                    <Text className={`font-semibold ${
                      achievement.isEarned ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {achievement.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
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
                      <Text className="text-sm text-gray-500">Progress</Text>
                      <Text className="text-sm font-semibold text-gray-700">
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

        {/* Recent Activity */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </Text>
          
          {[1, 2, 3].map((item) => (
            <View key={item} className="flex-row items-center mb-4 last:mb-0">
              <View className="w-8 h-8 bg-orange-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="book" size={16} color="#F97316" />
              </View>
              
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">
                  Completed Chapter 2, Verse {47 - item}
                </Text>
                <Text className="text-sm text-gray-500">
                  {item} day{item !== 1 ? 's' : ''} ago
                </Text>
              </View>
              
              <Text className="text-sm text-gray-500">
                {3 + item}m
              </Text>
            </View>
          ))}
        </View>

        {/* Bottom spacing for tab bar */}
        <View className="h-16" />
      </ScrollView>
    </SafeAreaView>
  );
} 