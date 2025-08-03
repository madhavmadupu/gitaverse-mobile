import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiService } from '../../utils/api';
import { useVerseStore } from '../../store/verseStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hapticsService } from '../../utils/haptics';
import { Chapter } from '../../types';

// Extended interface for library display with progress
interface ChapterWithProgress extends Chapter {
  completedVerses: number;
}

const mockChapters: ChapterWithProgress[] = [
  {
    id: 'mock-chapter-1',
    chapter_number: 1,
    title_english: 'Arjuna Vishada Yoga',
    title_sanskrit: 'अर्जुन विषाद योग',
    title_hindi: 'अर्जुन विषाद योग',
    description: 'The Yoga of Arjuna\'s Dejection',
    verse_count: 47,
    theme: 'The Yoga of Arjuna\'s Dejection',
    created_at: new Date().toISOString(),
    completedVerses: 12,
  },
  {
    id: 'mock-chapter-2',
    chapter_number: 2,
    title_english: 'Sankhya Yoga',
    title_sanskrit: 'सांख्य योग',
    title_hindi: 'सांख्य योग',
    description: 'Transcendental Knowledge',
    verse_count: 72,
    theme: 'Transcendental Knowledge',
    created_at: new Date().toISOString(),
    completedVerses: 25,
  },
  {
    id: 'mock-chapter-3',
    chapter_number: 3,
    title_english: 'Karma Yoga',
    title_sanskrit: 'कर्म योग',
    title_hindi: 'कर्म योग',
    description: 'The Eternal Duties of Human Beings',
    verse_count: 43,
    theme: 'The Eternal Duties of Human Beings',
    created_at: new Date().toISOString(),
    completedVerses: 8,
  },
  {
    id: 'mock-chapter-4',
    chapter_number: 4,
    title_english: 'Jnana Karma Sanyasa Yoga',
    title_sanskrit: 'ज्ञान कर्म संन्यास योग',
    title_hindi: 'ज्ञान कर्म संन्यास योग',
    description: 'The Eternal Duties of Human Beings',
    verse_count: 42,
    theme: 'The Eternal Duties of Human Beings',
    created_at: new Date().toISOString(),
    completedVerses: 15,
  },
  {
    id: 'mock-chapter-5',
    chapter_number: 5,
    title_english: 'Karma Sanyasa Yoga',
    title_sanskrit: 'कर्म संन्यास योग',
    title_hindi: 'कर्म संन्यास योग',
    description: 'Action in Krishna Consciousness',
    verse_count: 29,
    theme: 'Action in Krishna Consciousness',
    created_at: new Date().toISOString(),
    completedVerses: 5,
  },
];

type LoadingState = 'loading' | 'error' | 'success' | 'empty';

export default function LibraryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [chapters, setChapters] = useState<ChapterWithProgress[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { userProgress } = useVerseStore();

  const fetchChapters = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoadingState('loading');
      }

      const chaptersData = await apiService.getChapters();

      if (chaptersData && chaptersData.length > 0) {
        // Add completedVerses property to each chapter
        const chaptersWithProgress: ChapterWithProgress[] = chaptersData.map(chapter => ({
          ...chapter,
          completedVerses: Math.floor(Math.random() * (chapter.verse_count || 0)), // Mock progress for now
        }));
        setChapters(chaptersWithProgress);
        setLoadingState('success');
      } else {
        setChapters([]);
        setLoadingState('empty');
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
      setChapters(mockChapters);
      setLoadingState('success');
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchChapters();
  }, []);

  const filters = [
    { id: 'all', label: 'All Chapters', icon: 'library' },
    { id: 'in-progress', label: 'In Progress', icon: 'play' },
    { id: 'completed', label: 'Completed', icon: 'checkmark-circle' },
    { id: 'favorites', label: 'Favorites', icon: 'heart' },
  ];

  const getFilteredChapters = () => {
    let filtered = chapters;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(chapter =>
        chapter.title_english.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chapter.theme?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        chapter.title_sanskrit.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (selectedFilter) {
      case 'in-progress':
        filtered = filtered.filter(chapter =>
          chapter.completedVerses > 0 && chapter.completedVerses < (chapter.verse_count || 0)
        );
        break;
      case 'completed':
        filtered = filtered.filter(chapter =>
          chapter.completedVerses === (chapter.verse_count || 0)
        );
        break;
      case 'favorites':
        // For now, show chapters with high completion as "favorites"
        filtered = filtered.filter(chapter =>
          chapter.completedVerses > (chapter.verse_count || 0) * 0.5
        );
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return filtered;
  };

  const filteredChapters = getFilteredChapters();

  const handleChapterPress = (chapterId: string) => {
    hapticsService.buttonPress();
    console.log('Navigate to chapter:', chapterId);
    router.push(`/modal?type=chapter&chapterId=${chapterId}`);
  };

  const handleContinueReading = (chapterId: string) => {
    hapticsService.buttonPress();
    console.log('Continue reading chapter:', chapterId);
    router.push(`/modal?type=chapter&chapterId=${chapterId}`);
  };

  const handleBookmarkChapter = (chapterId: string) => {
    hapticsService.buttonPress();
    console.log('Bookmark chapter:', chapterId);
    // In a real app, you'd save this to Supabase
  };

  const handleShareChapter = async (chapter: ChapterWithProgress) => {
    try {
      await hapticsService.buttonPress();
      const shareText = `Bhagavad Gita Chapter ${chapter.chapter_number}: ${chapter.title_english}\n\nTheme: ${chapter.theme || chapter.description}\n\nExplore this chapter in Gitaverse - your daily spiritual companion! 📖✨\n\n#BhagavadGita #Chapter${chapter.chapter_number}`;

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchChapters(true);
  };

  const handleRetry = () => {
    fetchChapters();
  };

  const handleFilterChange = (filterId: string) => {
    hapticsService.selection();
    setSelectedFilter(filterId);
  };

  const clearSearch = () => {
    hapticsService.buttonPress();
    setSearchQuery('');
  };

  // Loading State
  if (loadingState === 'loading') {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View className="px-4 py-4">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Library
          </Text>
          <Text className="text-sm text-gray-500">
            Explore all 18 chapters of the Bhagavad Gita
          </Text>
        </View>

        {/* Loading Content */}
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="text-gray-600 mt-4 text-lg">Loading chapters...</Text>
          <Text className="text-gray-400 mt-2 text-sm">Please wait while we fetch your library</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error State
  if (loadingState === 'error') {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View className="px-4 py-4">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Library
          </Text>
          <Text className="text-sm text-gray-500">
            Explore all 18 chapters of the Bhagavad Gita
          </Text>
        </View>

        {/* Error Content */}
        <View className="flex-1 justify-center items-center px-8">
          <View className="bg-red-100 w-20 h-20 rounded-full items-center justify-center mb-6">
            <Ionicons name="alert-circle" size={40} color="#EF4444" />
          </View>
          <Text className="text-gray-900 text-xl font-semibold mb-2">Oops! Something went wrong</Text>
          <Text className="text-gray-600 text-center mb-8">
            We couldn't load your library. Please check your connection and try again.
          </Text>
          <TouchableOpacity
            className="bg-orange-500 px-8 py-4 rounded-xl"
            onPress={handleRetry}
          >
            <Text className="text-white font-semibold text-lg">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="px-4 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Library
        </Text>
        <Text className="text-sm text-gray-500">
          Explore all 18 chapters of the Bhagavad Gita
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-4 mb-4">
        <View className="bg-white rounded-xl flex-row items-center px-4 shadow-sm">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 text-gray-900 text-base"
            placeholder="Search chapters or themes..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View className="px-4 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${selectedFilter === filter.id
                ? 'bg-orange-500'
                : 'bg-white'
                }`}
              onPress={() => handleFilterChange(filter.id)}
            >
              <Ionicons
                name={filter.icon as any}
                size={16}
                color={selectedFilter === filter.id ? 'white' : '#6B7280'}
                style={{ marginRight: 4 }}
              />
              <Text
                className={`text-sm font-medium ${selectedFilter === filter.id
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

      {/* Results Count */}
      {searchQuery.trim() && (
        <View className="px-4 mb-2">
          <Text className="text-sm text-gray-500">
            {filteredChapters.length} chapter{filteredChapters.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

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
        {/* Empty State */}
        {filteredChapters.length === 0 && (
          <View className="flex-1 justify-center items-center py-16">
            {searchQuery.trim() ? (
              // Search empty state
              <>
                <View className="bg-gray-100 w-20 h-20 rounded-full items-center justify-center mb-6">
                  <Ionicons name="search" size={40} color="#9CA3AF" />
                </View>
                <Text className="text-gray-900 text-xl font-semibold mb-2">No chapters found</Text>
                <Text className="text-gray-600 text-center mb-4">
                  No chapters match "{searchQuery}". Try a different search term.
                </Text>
                <TouchableOpacity
                  className="bg-orange-500 px-6 py-3 rounded-xl"
                  onPress={() => setSearchQuery('')}
                >
                  <Text className="text-white font-semibold">Clear Search</Text>
                </TouchableOpacity>
              </>
            ) : selectedFilter !== 'all' ? (
              // Filter empty state
              <>
                <View className="bg-gray-100 w-20 h-20 rounded-full items-center justify-center mb-6">
                  <Ionicons name="filter" size={40} color="#9CA3AF" />
                </View>
                <Text className="text-gray-900 text-xl font-semibold mb-2">No chapters in this category</Text>
                <Text className="text-gray-600 text-center mb-4">
                  You haven't {selectedFilter === 'completed' ? 'completed' :
                    selectedFilter === 'in-progress' ? 'started' : 'favorited'} any chapters yet.
                </Text>
                <TouchableOpacity
                  className="bg-orange-500 px-6 py-3 rounded-xl"
                  onPress={() => setSelectedFilter('all')}
                >
                  <Text className="text-white font-semibold">View All Chapters</Text>
                </TouchableOpacity>
              </>
            ) : (
              // General empty state
              <>
                <View className="bg-gray-100 w-20 h-20 rounded-full items-center justify-center mb-6">
                  <Ionicons name="library" size={40} color="#9CA3AF" />
                </View>
                <Text className="text-gray-900 text-xl font-semibold mb-2">Library is empty</Text>
                <Text className="text-gray-600 text-center mb-4">
                  We couldn't load any chapters. Please check your connection and try again.
                </Text>
                <TouchableOpacity
                  className="bg-orange-500 px-6 py-3 rounded-xl"
                  onPress={handleRetry}
                >
                  <Text className="text-white font-semibold">Refresh Library</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Chapters List */}
        {filteredChapters.map((chapter) => {
          const progressPercentage = getProgressPercentage(
            chapter.completedVerses,
            chapter.verse_count || 0
          );

          return (
            <TouchableOpacity
              key={chapter.id}
              className="bg-white rounded-2xl p-6 mb-4 shadow-sm"
              onPress={() => handleChapterPress(chapter.chapter_number.toString())}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">
                    Chapter {chapter.chapter_number}
                  </Text>
                  <Text className="text-base text-gray-700 mb-1">
                    {chapter.title_english}
                  </Text>
                  <Text className="text-sm text-orange-600 font-medium">
                    {chapter.title_sanskrit}
                  </Text>
                </View>

                <View className="bg-orange-100 px-3 py-1 rounded-full">
                  <Text className="text-orange-600 font-semibold text-sm">
                    {chapter.completedVerses}/{chapter.verse_count || 0}
                  </Text>
                </View>
              </View>

              <Text className="text-sm text-gray-600 mb-4">
                {chapter.theme || chapter.description}
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
                  onPress={() => handleContinueReading(chapter.chapter_number.toString())}
                >
                  <Text className="text-white text-center font-semibold">
                    {chapter.completedVerses === 0 ? 'Start Reading' : 'Continue Reading'}
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