import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { hapticsService } from '../utils/haptics';
import { ChapterWithProgress } from '../store/libraryStore';

interface ChapterListProps {
  chapters: ChapterWithProgress[];
  onChapterPress: (chapterId: string) => void;
  onContinueReading: (chapterId: string) => void;
  onBookmarkChapter: (chapterId: string) => void;
  onShareChapter: (chapter: ChapterWithProgress) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  searchQuery: string;
  selectedFilter: string;
  onClearSearch: () => void;
  onViewAllChapters: () => void;
  onRetry: () => void;
}

// Memoized individual chapter item
const ChapterItem = memo(({
  chapter,
  onChapterPress,
  onContinueReading,
  onBookmarkChapter,
  onShareChapter,
}: {
  chapter: ChapterWithProgress;
  onChapterPress: (chapterId: string) => void;
  onContinueReading: (chapterId: string) => void;
  onBookmarkChapter: (chapterId: string) => void;
  onShareChapter: (chapter: ChapterWithProgress) => void;
}) => {
  const progressPercentage = useMemo(() => {
    return Math.round((chapter.completedVerses / (chapter.verse_count || 1)) * 100);
  }, [chapter.completedVerses, chapter.verse_count]);

  const progressColor = useMemo(() => {
    if (progressPercentage >= 80) return 'bg-green-500';
    if (progressPercentage >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  }, [progressPercentage]);

  const handleChapterPress = useCallback(() => {
    onChapterPress(chapter.chapter_number.toString());
  }, [chapter.chapter_number, onChapterPress]);

  const handleContinueReading = useCallback(() => {
    onContinueReading(chapter.chapter_number.toString());
  }, [chapter.chapter_number, onContinueReading]);

  const handleBookmarkChapter = useCallback(() => {
    onBookmarkChapter(chapter.id);
  }, [chapter.id, onBookmarkChapter]);

  const handleShareChapter = useCallback(async () => {
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
  }, [chapter, onShareChapter]);

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-2 mb-2 shadow-sm"
      onPress={handleChapterPress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            {chapter.title_english}
          </Text>
          <Text className="text-base text-gray-700 mb-1">
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
            className={`h-2 rounded-full ${progressColor}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="flex-1 bg-orange-500 py-3 rounded-lg"
          onPress={handleContinueReading}
        >
          <Text className="text-white text-center font-semibold">
            {chapter.completedVerses === 0 ? 'Start Reading' : 'Continue Reading'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-100 py-3 px-4 rounded-lg"
          onPress={handleBookmarkChapter}
        >
          <Ionicons 
            name={chapter.isFavorite ? "bookmark" : "bookmark-outline"} 
            size={20} 
            color={chapter.isFavorite ? "#F97316" : "#6B7280"} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-100 py-3 px-4 rounded-lg"
          onPress={handleShareChapter}
        >
          <Ionicons name="share-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

ChapterItem.displayName = 'ChapterItem';

// Memoized empty state component
const EmptyState = memo(({
  searchQuery,
  selectedFilter,
  onClearSearch,
  onViewAllChapters,
  onRetry,
}: {
  searchQuery: string;
  selectedFilter: string;
  onClearSearch: () => void;
  onViewAllChapters: () => void;
  onRetry: () => void;
}) => {
  if (searchQuery.trim()) {
    return (
      <View className="flex-1 justify-center items-center py-16">
        <View className="bg-gray-100 w-20 h-20 rounded-full items-center justify-center mb-6">
          <Ionicons name="search" size={40} color="#9CA3AF" />
        </View>
        <Text className="text-gray-900 text-xl font-semibold mb-2">No chapters found</Text>
        <Text className="text-gray-600 text-center mb-4">
          No chapters match "{searchQuery}". Try a different search term.
        </Text>
        <TouchableOpacity
          className="bg-orange-500 px-6 py-3 rounded-xl"
          onPress={onClearSearch}
        >
          <Text className="text-white font-semibold">Clear Search</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (selectedFilter !== 'all') {
    return (
      <View className="flex-1 justify-center items-center py-16">
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
          onPress={onViewAllChapters}
        >
          <Text className="text-white font-semibold">View All Chapters</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center py-16">
      <View className="bg-gray-100 w-20 h-20 rounded-full items-center justify-center mb-6">
        <Ionicons name="library" size={40} color="#9CA3AF" />
      </View>
      <Text className="text-gray-900 text-xl font-semibold mb-2">Library is empty</Text>
      <Text className="text-gray-600 text-center mb-4">
        We couldn't load any chapters. Please check your connection and try again.
      </Text>
      <TouchableOpacity
        className="bg-orange-500 px-6 py-3 rounded-xl"
        onPress={onRetry}
      >
        <Text className="text-white font-semibold">Refresh Library</Text>
      </TouchableOpacity>
    </View>
  );
});

EmptyState.displayName = 'EmptyState';

// Main ChapterList component
const ChapterList = memo(({
  chapters,
  onChapterPress,
  onContinueReading,
  onBookmarkChapter,
  onShareChapter,
  isRefreshing,
  onRefresh,
  searchQuery,
  selectedFilter,
  onClearSearch,
  onViewAllChapters,
  onRetry,
}: ChapterListProps) => {
  const handleClearSearch = useCallback(() => {
    onClearSearch?.();
  }, [onClearSearch]);

  const handleViewAllChapters = useCallback(() => {
    onViewAllChapters?.();
  }, [onViewAllChapters]);

  const handleRetry = useCallback(() => {
    onRetry?.() || onRefresh();
  }, [onRetry, onRefresh]);

  if (chapters.length === 0) {
    return (
      <EmptyState
        searchQuery={searchQuery}
        selectedFilter={selectedFilter}
        onClearSearch={handleClearSearch}
        onViewAllChapters={handleViewAllChapters}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={['#F97316']}
          tintColor="#F97316"
        />
      }
      className="flex-1 px-4"
      showsVerticalScrollIndicator={false}
    >
      {chapters.map((chapter) => (
        <ChapterItem
          key={chapter.id}
          chapter={chapter}
          onChapterPress={onChapterPress}
          onContinueReading={onContinueReading}
          onBookmarkChapter={onBookmarkChapter}
          onShareChapter={onShareChapter}
        />
      ))}
      
      {/* Bottom spacing for tab bar */}
      <View className="h-16" />
    </ScrollView>
  );
});

ChapterList.displayName = 'ChapterList';

export default ChapterList; 