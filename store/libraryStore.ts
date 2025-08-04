import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chapter, ProgressSummary } from '../types';
import { apiService } from '../utils/api';
import { performanceMonitor } from '../utils/performanceMonitor';

// Extended interface for library display with progress
export interface ChapterWithProgress extends Chapter {
  completedVerses: number;
  lastReadAt?: string;
  isFavorite?: boolean;
}

interface LibraryCache {
  chapters: ChapterWithProgress[];
  lastFetched: number;
  userProgress: ProgressSummary;
  searchCache: Map<string, ChapterWithProgress[]>;
  filterCache: Map<string, ChapterWithProgress[]>;
}

interface LibraryStore {
  // State
  cache: LibraryCache;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  searchQuery: string;
  selectedFilter: string;
  
  // Actions
  fetchChapters: (forceRefresh?: boolean) => Promise<void>;
  refreshChapters: () => Promise<void>;
  updateUserProgress: (progress: Partial<ProgressSummary>) => void;
  markChapterAsRead: (chapterId: string, verseId: string) => void;
  toggleChapterFavorite: (chapterId: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFilter: (filter: string) => void;
  clearCache: () => void;
  getFilteredChapters: () => ChapterWithProgress[];
  getCachedSearchResults: (query: string) => ChapterWithProgress[] | null;
  getCachedFilterResults: (filter: string) => ChapterWithProgress[] | null;
  setCachedSearchResults: (query: string, results: ChapterWithProgress[]) => void;
  setCachedFilterResults: (filter: string, results: ChapterWithProgress[]) => void;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const SEARCH_CACHE_SIZE = 50; // Maximum number of cached search results
const FILTER_CACHE_SIZE = 10; // Maximum number of cached filter results

const initialCache: LibraryCache = {
  chapters: [],
  lastFetched: 0,
  userProgress: {
    currentStreak: 0,
    longestStreak: 0,
    totalVerses: 0,
    totalChapters: 0,
    totalTime: 0,
    completedVerses: [],
    favoriteVerses: [],
  },
  searchCache: new Map(),
  filterCache: new Map(),
};

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      // Initial state
      cache: initialCache,
      isLoading: false,
      isRefreshing: false,
      error: null,
      searchQuery: '',
      selectedFilter: 'all',

      // Check if cache is still valid
      isCacheValid: () => {
        const { cache } = get();
        return Date.now() - cache.lastFetched < CACHE_DURATION;
      },

      // Fetch chapters with caching
      fetchChapters: async (forceRefresh = false) => {
        const { cache, isCacheValid } = get();
        
        // Return cached data if valid and not forcing refresh
        if (!forceRefresh && cache.chapters.length > 0 && isCacheValid()) {
          console.log('Using cached chapters data');
          performanceMonitor.recordCacheHit();
          return;
        }

        performanceMonitor.recordCacheMiss();
        performanceMonitor.recordApiCall();
        set({ isLoading: true, error: null });

        try {
          // Fetch chapters from API
          const chaptersData = await apiService.getChapters();
          
          if (chaptersData && chaptersData.length > 0) {
            // Get user progress to calculate real completion
            const userProgress = await apiService.getUserProgress();
            
            // Calculate completed verses for each chapter
            const chaptersWithProgress: ChapterWithProgress[] = await Promise.all(
              chaptersData.map(async (chapter) => {
                try {
                  // Get verses for this chapter to count completed ones
                  const chapterVerses = await apiService.getVersesByChapter(chapter.chapter_number);
                  const completedVerses = chapterVerses?.filter(verse => 
                    userProgress.completedVerses.includes(verse.id)
                  ).length || 0;
                  
                  return {
                    ...chapter,
                    completedVerses,
                    isFavorite: userProgress.favoriteVerses.includes(chapter.id),
                  };
                } catch (error) {
                  console.error(`Error getting progress for chapter ${chapter.chapter_number}:`, error);
                  return {
                    ...chapter,
                    completedVerses: 0,
                    isFavorite: false,
                  };
                }
              })
            );
            
            // Update cache
            set({
              cache: {
                ...cache,
                chapters: chaptersWithProgress,
                lastFetched: Date.now(),
                userProgress,
              },
              isLoading: false,
            });

            // Clear old caches when new data is fetched
            set({
              cache: {
                ...get().cache,
                searchCache: new Map(),
                filterCache: new Map(),
              }
            });
          } else {
            set({
              cache: { ...cache, chapters: [], lastFetched: Date.now() },
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Error fetching chapters:', error);
          set({ 
            error: 'Failed to load chapters. Please try again.',
            isLoading: false 
          });
        }
      },

      // Refresh chapters (for pull-to-refresh)
      refreshChapters: async () => {
        set({ isRefreshing: true });
        await get().fetchChapters(true);
        set({ isRefreshing: false });
      },

      // Update user progress
      updateUserProgress: (progress) => {
        const { cache } = get();
        set({
          cache: {
            ...cache,
            userProgress: { ...cache.userProgress, ...progress },
          }
        });
      },

      // Mark chapter as read (optimistic update)
      markChapterAsRead: (chapterId, verseId) => {
        const { cache } = get();
        const updatedChapters = cache.chapters.map(chapter => {
          if (chapter.id === chapterId) {
            return {
              ...chapter,
              completedVerses: chapter.completedVerses + 1,
            };
          }
          return chapter;
        });

        set({
          cache: {
            ...cache,
            chapters: updatedChapters,
            userProgress: {
              ...cache.userProgress,
              completedVerses: [...cache.userProgress.completedVerses, verseId],
              totalVerses: cache.userProgress.totalVerses + 1,
            },
          }
        });
      },

      // Toggle chapter favorite
      toggleChapterFavorite: (chapterId) => {
        const { cache } = get();
        const updatedChapters = cache.chapters.map(chapter => {
          if (chapter.id === chapterId) {
            return {
              ...chapter,
              isFavorite: !chapter.isFavorite,
            };
          }
          return chapter;
        });

        const isFavorite = cache.chapters.find(c => c.id === chapterId)?.isFavorite;
        const updatedFavorites = isFavorite
          ? cache.userProgress.favoriteVerses.filter(id => id !== chapterId)
          : [...cache.userProgress.favoriteVerses, chapterId];

        set({
          cache: {
            ...cache,
            chapters: updatedChapters,
            userProgress: {
              ...cache.userProgress,
              favoriteVerses: updatedFavorites,
            },
          }
        });
      },

      // Set search query
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      // Set selected filter
      setSelectedFilter: (filter) => {
        set({ selectedFilter: filter });
      },

      // Clear cache
      clearCache: () => {
        set({
          cache: {
            ...initialCache,
            lastFetched: 0,
          }
        });
      },

      // Get filtered chapters with memoization
      getFilteredChapters: () => {
        const { cache, searchQuery, selectedFilter } = get();
        let filtered = cache.chapters;

        // Apply search filter
        if (searchQuery.trim()) {
          filtered = filtered.filter(chapter =>
            chapter.title_english.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (chapter.theme?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            chapter.title_sanskrit.toLowerCase().includes(searchQuery.toLowerCase())
          );
          performanceMonitor.recordSearchQuery();
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
            filtered = filtered.filter(chapter => chapter.isFavorite);
            break;
          default:
            // 'all' - no additional filtering
            break;
        }

        performanceMonitor.recordFilterChange();
        return filtered;
      },

      // Cache management for search results
      getCachedSearchResults: (query) => {
        const { cache } = get();
        return cache.searchCache.get(query) || null;
      },

      getCachedFilterResults: (filter) => {
        const { cache } = get();
        return cache.filterCache.get(filter) || null;
      },

      setCachedSearchResults: (query, results) => {
        const { cache } = get();
        const newSearchCache = new Map(cache.searchCache);
        
        // Remove oldest entries if cache is full
        if (newSearchCache.size >= SEARCH_CACHE_SIZE) {
          const firstKey = newSearchCache.keys().next().value;
          newSearchCache.delete(firstKey);
        }
        
        newSearchCache.set(query, results);
        
        set({
          cache: {
            ...cache,
            searchCache: newSearchCache,
          }
        });
      },

      setCachedFilterResults: (filter, results) => {
        const { cache } = get();
        const newFilterCache = new Map(cache.filterCache);
        
        // Remove oldest entries if cache is full
        if (newFilterCache.size >= FILTER_CACHE_SIZE) {
          const firstKey = newFilterCache.keys().next().value;
          newFilterCache.delete(firstKey);
        }
        
        newFilterCache.set(filter, results);
        
        set({
          cache: {
            ...cache,
            filterCache: newFilterCache,
          }
        });
      },
    }),
    {
      name: 'library-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        ...state,
        cache: {
          ...state.cache,
          searchCache: Array.from(state.cache.searchCache.entries()),
          filterCache: Array.from(state.cache.filterCache.entries()),
        },
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert arrays back to Maps
          state.cache.searchCache = new Map(state.cache.searchCache || []);
          state.cache.filterCache = new Map(state.cache.filterCache || []);
        }
      },
    }
  )
); 