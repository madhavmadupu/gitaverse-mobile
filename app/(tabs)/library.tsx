import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiService } from '../../utils/api';
import { useVerseStore } from '../../store/verseStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hapticsService } from '../../utils/haptics';

interface Chapter {
  id: number;
  number: number;
  title: string;
  titleSanskrit: string;
  verseCount: number;
  completedVerses: number;
  theme: string;
}

const mockChapters: Chapter[] = [
  {
    id: 1,
    number: 1,
    title: 'Arjuna Vishada Yoga',
    titleSanskrit: 'अर्जुन विषाद योग',
    verseCount: 47,
    completedVerses: 12,
    theme: 'The Yoga of Arjuna\'s Dejection',
  },
  {
    id: 2,
    number: 2,
    title: 'Sankhya Yoga',
    titleSanskrit: 'सांख्य योग',
    verseCount: 72,
    completedVerses: 25,
    theme: 'Transcendental Knowledge',
  },
  {
    id: 3,
    number: 3,
    title: 'Karma Yoga',
    titleSanskrit: 'कर्म योग',
    verseCount: 43,
    completedVerses: 8,
    theme: 'The Eternal Duties of Human Beings',
  },
  {
    id: 4,
    number: 4,
    title: 'Jnana Karma Sanyasa Yoga',
    titleSanskrit: 'ज्ञान कर्म संन्यास योग',
    verseCount: 42,
    completedVerses: 15,
    theme: 'The Eternal Duties of Human Beings',
  },
  {
    id: 5,
    number: 5,
    title: 'Karma Sanyasa Yoga',
    titleSanskrit: 'कर्म संन्यास योग',
    verseCount: 29,
    completedVerses: 5,
    theme: 'Action in Krishna Consciousness',
  },
];

export default function LibraryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userProgress } = useVerseStore();

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const chaptersData = await apiService.getChapters();
        setChapters(chaptersData);
      } catch (error) {
        console.error('Error fetching chapters:', error);
        setChapters(mockChapters);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChapters();
  }, []);

  const filters = [
    { id: 'all', label: 'All Chapters' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'favorites', label: 'Favorites' },
  ];

  const filteredChapters = chapters.filter(chapter => {
    if (searchQuery) {
      return chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             chapter.theme.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const handleChapterPress = (chapterId: number) => {
    // For now, navigate to a placeholder screen
    console.log('Navigate to chapter:', chapterId);
    // router.push(`/chapter/${chapterId}`);
  };

  const handleContinueReading = (chapterId: number) => {
    console.log('Continue reading chapter:', chapterId);
    // router.push(`/chapter/${chapterId}`);
  };

  const handleBookmarkChapter = (chapterId: number) => {
    console.log('Bookmark chapter:', chapterId);
    // In a real app, you'd save this to Supabase
  };

  const handleShareChapter = async (chapter: Chapter) => {
    try {
      await hapticsService.buttonPress();
      const shareText = `Bhagavad Gita Chapter ${chapter.number}: ${chapter.title}\n\nTheme: ${chapter.theme}\n\nExplore this chapter in Gitaverse - your daily spiritual companion! 📖✨\n\n#BhagavadGita #Chapter${chapter.number}`;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareText);
      } else {
        Alert.alert('Share Chapter', shareText, [
          { text: 'Copy', onPress: () => console.log('Copied to clipboard') },
          { text: 'Cancel', style: 'cancel' }
        ]);
      }
    } catch (error) {
      console.error('Error sharing chapter:', error);
      await hapticsService.errorAction();
    }
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return Math.round((completed / total) * 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Library
        </Text>
        <Text className="text-sm text-gray-500">
          Explore all 18 chapters of the Bhagavad Gita
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-4">
        <View className="bg-white rounded-xl flex-row items-center px-4 py-3 shadow-sm">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 text-gray-900"
            placeholder="Search chapters or themes..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View className="px-6 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              className={`px-4 py-2 rounded-full mr-3 ${
                selectedFilter === filter.id
                  ? 'bg-orange-500'
                  : 'bg-white'
              }`}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedFilter === filter.id
                    ? 'text-white'
                    : 'text-gray-600'
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {filteredChapters.map((chapter) => {
          const progressPercentage = getProgressPercentage(
            chapter.completedVerses,
            chapter.verseCount
          );
          
          return (
            <TouchableOpacity
              key={chapter.id}
              className="bg-white rounded-2xl p-6 mb-4 shadow-sm"
              onPress={() => handleChapterPress(chapter.id)}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">
                    Chapter {chapter.number}
                  </Text>
                  <Text className="text-base text-gray-700 mb-1">
                    {chapter.title}
                  </Text>
                  <Text className="text-sm text-orange-600 font-medium">
                    {chapter.titleSanskrit}
                  </Text>
                </View>
                
                <View className="bg-orange-100 px-3 py-1 rounded-full">
                  <Text className="text-orange-600 font-semibold text-sm">
                    {chapter.completedVerses}/{chapter.verseCount}
                  </Text>
                </View>
              </View>

              <Text className="text-sm text-gray-600 mb-4">
                {chapter.theme}
              </Text>

              {/* Progress Bar */}
              <View className="mb-3">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-gray-500">Progress</Text>
                  <Text className="text-sm font-semibold text-gray-700">
                    {progressPercentage}%
                  </Text>
                </View>
                <View className="bg-gray-200 rounded-full h-2">
                  <View
                    className={`h-2 rounded-full ${getProgressColor(
                      progressPercentage
                    )}`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  className="flex-1 bg-orange-500 py-3 rounded-lg"
                  onPress={() => handleContinueReading(chapter.id)}
                >
                  <Text className="text-white text-center font-semibold">
                    Continue Reading
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-gray-100 py-3 px-4 rounded-lg"
                  onPress={() => handleBookmarkChapter(chapter.id)}
                >
                  <Ionicons name="bookmark-outline" size={20} color="#6B7280" />
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-gray-100 py-3 px-4 rounded-lg"
                  onPress={() => handleShareChapter(chapter)}
                >
                  <Ionicons name="share-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Bottom spacing for tab bar */}
        <View className="h-16" />
      </ScrollView>
    </SafeAreaView>
  );
} 