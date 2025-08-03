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
  markAsRead: (verseId: UUID) => void;
  toggleFavorite: (verseId: UUID) => void;
  updateProgress: (progress: Partial<ProgressSummary>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetProgress: () => void;
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
      
      markAsRead: (verseId) => {
        const { userProgress } = get();
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
        };
        
        set({
          userProgress: updatedProgress,
          hasReadToday: true,
        });
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
    }),
    {
      name: 'verse-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 