import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hapticsService } from '../../utils/haptics';
import { useLibraryStore } from '../../store/libraryStore';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import { backgroundRefreshService } from '../../utils/backgroundRefresh';
import ChapterList from '../../components/ChapterList';

const filters = [
  { id: 'all', label: 'All Chapters', icon: 'library' },
  { id: 'in-progress', label: 'In Progress', icon: 'play' },
  { id: 'completed', label: 'Completed', icon: 'checkmark-circle' },
  { id: 'favorites', label: 'Favorites', icon: 'heart' },
];

export default function LibraryScreen() {
  const router = useRouter();
  
  // Library store state and actions
  const {
    cache,
    isLoading,
    isRefreshing,
    error,
    searchQuery,
    selectedFilter,
    fetchChapters,
    refreshChapters,
    setSearchQuery,
    setSelectedFilter,
    toggleChapterFavorite,
    getFilteredChapters,
    getCachedSearchResults,
    getCachedFilterResults,
    setCachedSearchResults,
    setCachedFilterResults,
  } = useLibraryStore();

  // Debounced search hook
  const {
    searchQuery: debouncedSearchQuery,
    isSearching,
    updateSearchQuery,
    clearSearch,
  } = useDebouncedSearch({
    delay: 300,
    minLength: 2,
    onSearch: (query) => {
      setSearchQuery(query);
    },
  });

  // Memoized filtered chapters with caching
  const filteredChapters = useMemo(() => {
    const cacheKey = `${debouncedSearchQuery}-${selectedFilter}`;
    
    // Check if we have cached results
    const cachedResults = getCachedSearchResults(cacheKey);
    if (cachedResults) {
      return cachedResults;
    }

    // Get filtered chapters from store
    const chapters = getFilteredChapters();
    
    // Cache the results
    setCachedSearchResults(cacheKey, chapters);
    
    return chapters;
  }, [debouncedSearchQuery, selectedFilter, getFilteredChapters, getCachedSearchResults, setCachedSearchResults]);

  // Initialize data on mount
  useEffect(() => {
    const initializeLibrary = async () => {
      await fetchChapters();
    };

    initializeLibrary();

    // Register with background refresh service
    const refreshCallback = async () => {
      await fetchChapters(true);
    };
    
    backgroundRefreshService.registerRefreshCallback(refreshCallback);

    // Cleanup on unmount
    return () => {
      backgroundRefreshService.unregisterRefreshCallback(refreshCallback);
    };
  }, [fetchChapters]);

  // Handle chapter press
  const handleChapterPress = useCallback((chapterId: string) => {
    hapticsService.buttonPress();
    console.log('Navigate to chapter:', chapterId);
    router.push(`/modal?type=chapter&chapterId=${chapterId}`);
  }, [router]);

  // Handle continue reading
  const handleContinueReading = useCallback((chapterId: string) => {
    hapticsService.buttonPress();
    console.log('Continue reading chapter:', chapterId);
    router.push(`/modal?type=chapter&chapterId=${chapterId}`);
  }, [router]);

  // Handle bookmark chapter
  const handleBookmarkChapter = useCallback((chapterId: string) => {
    hapticsService.buttonPress();
    console.log('Bookmark chapter:', chapterId);
    toggleChapterFavorite(chapterId);
  }, [toggleChapterFavorite]);

  // Handle share chapter
  const handleShareChapter = useCallback((chapter: any) => {
    // This is handled in the ChapterList component
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refreshChapters();
  }, [refreshChapters]);

  // Handle filter change
  const handleFilterChange = useCallback((filterId: string) => {
    hapticsService.selection();
    setSelectedFilter(filterId);
  }, [setSelectedFilter]);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    hapticsService.buttonPress();
    clearSearch();
  }, [clearSearch]);

  // Handle retry
  const handleRetry = useCallback(() => {
    fetchChapters(true);
  }, [fetchChapters]);

  // Handle view all chapters
  const handleViewAllChapters = useCallback(() => {
    setSelectedFilter('all');
  }, [setSelectedFilter]);

  // Loading State
  if (isLoading) {
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
  if (error) {
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
            {error}
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
            value={debouncedSearchQuery}
            onChangeText={updateSearchQuery}
          />
          {debouncedSearchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View className="px-4 mb-4">
        <View className="flex-row flex-wrap gap-2">
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              className={`px-4 py-2 rounded-full flex-row items-center ${selectedFilter === filter.id
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
        </View>
      </View>

      {/* Results Count */}
      {debouncedSearchQuery.trim() && (
        <View className="px-4 mb-2">
          <Text className="text-sm text-gray-500">
            {filteredChapters.length} chapter{filteredChapters.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {/* Chapter List */}
      <ChapterList
        chapters={filteredChapters}
        onChapterPress={handleChapterPress}
        onContinueReading={handleContinueReading}
        onBookmarkChapter={handleBookmarkChapter}
        onShareChapter={handleShareChapter}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        searchQuery={debouncedSearchQuery}
        selectedFilter={selectedFilter}
        onClearSearch={handleClearSearch}
        onViewAllChapters={handleViewAllChapters}
        onRetry={handleRetry}
      />
    </SafeAreaView>
  );
} 