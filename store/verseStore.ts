import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Verse,
  VerseWithChapter,
  ProgressSummary,
  AppSettings,
  UUID,
  DateString,
} from '../types';
import { apiService } from '../utils/api';
import { useLibraryStore } from './libraryStore';

interface VerseStore {
  // State
  todayVerse: VerseWithChapter | null;
  isLoading: boolean;
  hasReadToday: boolean;
  userProgress: ProgressSummary;
  userSettings: AppSettings;
  
  // Actions
  setTodayVerse: (verse: VerseWithChapter) => void;
  setLoading: (loading: boolean) => void;
  markAsRead: (verseId: UUID, timeSpent?: number) => Promise<void>;
  toggleFavorite: (verseId: UUID) => void;
  updateProgress: (progress: Partial<ProgressSummary>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetProgress: () => void;
  syncProgressFromServer: () => Promise<void>;
  loadCompletedVerses: () => Promise<void>;
}

const initialProgress: ProgressSummary = {
  currentStreak: 0,
  longestStreak: 0,
  totalVerses: 0,
  totalChapters: 0,
  totalTime: 0,
  completedVerses: [],
  favoriteVerses: [],
};

const initialSettings: AppSettings = {
  notificationsEnabled: true,
  soundEnabled: true,
  hapticEnabled: true,
  reminderTime: '07:00',
  language: 'english',
  theme: 'light',
  spiritualLevel: 'beginner',
  fontSize: 'medium',
  weekendNotifications: true,
};

export const useVerseStore = create<VerseStore>()(
  persist(
    (set, get) => ({
      // Initial state
      todayVerse: null,
      isLoading: false,
      hasReadToday: false,
      userProgress: initialProgress,
      userSettings: initialSettings,

      // Actions
      setTodayVerse: (verse) => set({ todayVerse: verse }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      markAsRead: async (verseId, timeSpent = 300) => {
        const { userProgress } = get();
        
        // Check if already completed
        if (userProgress.completedVerses.includes(verseId)) {
          console.log('Verse already marked as read:', verseId);
          return;
        }

        try {
          // Mark as read in Supabase first
          await apiService.markVerseAsRead(verseId, timeSpent);
          
          // Update local state optimistically
          const today = new Date().toISOString().split('T')[0] as DateString;
          const lastRead = userProgress.lastReadDate;
          
          let newStreak = userProgress.currentStreak;
          
          // Check if this is a consecutive day
          if (lastRead) {
            const lastReadDate = new Date(lastRead);
            const todayDate = new Date(today);
            const diffTime = todayDate.getTime() - lastReadDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              // Consecutive day
              newStreak = userProgress.currentStreak + 1;
            } else if (diffDays > 1) {
              // Break in streak
              newStreak = 1;
            }
            // If diffDays === 0, same day, don't change streak
          } else {
            // First time reading
            newStreak = 1;
          }
          
          const updatedProgress: ProgressSummary = {
            ...userProgress,
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, userProgress.longestStreak),
            totalVerses: userProgress.totalVerses + 1,
            lastReadDate: today,
            completedVerses: [...userProgress.completedVerses, verseId],
            totalTime: userProgress.totalTime + timeSpent,
          };
          
          set({
            userProgress: updatedProgress,
            hasReadToday: true,
          });
          
          // Sync with library store
          const libraryStore = useLibraryStore.getState();
          libraryStore.syncWithVerseStore(updatedProgress.completedVerses);
          
          console.log('Successfully marked verse as read:', verseId);
        } catch (error) {
          console.error('Error marking verse as read:', error);
          throw error;
        }
      },
      
      toggleFavorite: (verseId) => {
        const { userProgress } = get();
        const isFavorite = userProgress.favoriteVerses.includes(verseId);
        
        const updatedFavorites = isFavorite
          ? userProgress.favoriteVerses.filter(id => id !== verseId)
          : [...userProgress.favoriteVerses, verseId];
        
        set({
          userProgress: {
            ...userProgress,
            favoriteVerses: updatedFavorites,
          },
        });
      },
      
      updateProgress: (progress) => {
        const { userProgress } = get();
        set({
          userProgress: { ...userProgress, ...progress },
        });
      },
      
      updateSettings: (settings) => {
        const { userSettings } = get();
        set({
          userSettings: { ...userSettings, ...settings },
        });
      },
      
      resetProgress: () => {
        set({
          userProgress: initialProgress,
          hasReadToday: false,
        });
      },

      syncProgressFromServer: async () => {
        try {
          const serverProgress = await apiService.getUserProgress();
          set({
            userProgress: serverProgress,
            hasReadToday: serverProgress.lastReadDate === new Date().toISOString().split('T')[0],
          });
          console.log('Progress synced from server');
        } catch (error) {
          console.error('Error syncing progress from server:', error);
        }
      },

      loadCompletedVerses: async () => {
        try {
          const completedVerses = await apiService.getCompletedVerses();
          const { userProgress } = get();
          
          set({
            userProgress: {
              ...userProgress,
              completedVerses,
            },
          });
          console.log('Completed verses loaded:', completedVerses.length);
        } catch (error) {
          console.error('Error loading completed verses:', error);
        }
      },
    }),
    {
      name: 'verse-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 