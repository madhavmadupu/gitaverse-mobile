import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Verse {
  id: string;
  chapter: number;
  verse: number;
  sanskrit: string;
  translation: string;
  explanation: string;
  keywords: string[];
  audioUrl?: string;
}

export interface UserProgress {
  currentStreak: number;
  longestStreak: number;
  totalVerses: number;
  totalChapters: number;
  totalTime: number; // in minutes
  lastReadDate?: string;
  completedVerses: string[]; // verse IDs
  favoriteVerses: string[]; // verse IDs
}

export interface UserSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  reminderTime: string; // HH:MM format
  language: 'english' | 'hindi';
  theme: 'light' | 'dark' | 'auto';
  spiritualLevel: 'beginner' | 'intermediate' | 'advanced';
}

interface VerseStore {
  // State
  todayVerse: Verse | null;
  isLoading: boolean;
  hasReadToday: boolean;
  userProgress: UserProgress;
  userSettings: UserSettings;
  
  // Actions
  setTodayVerse: (verse: Verse) => void;
  setLoading: (loading: boolean) => void;
  markAsRead: (verseId: string) => void;
  toggleFavorite: (verseId: string) => void;
  updateProgress: (progress: Partial<UserProgress>) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  resetProgress: () => void;
}

const initialProgress: UserProgress = {
  currentStreak: 0,
  longestStreak: 0,
  totalVerses: 0,
  totalChapters: 0,
  totalTime: 0,
  completedVerses: [],
  favoriteVerses: [],
};

const initialSettings: UserSettings = {
  notificationsEnabled: true,
  soundEnabled: true,
  hapticEnabled: true,
  reminderTime: '07:00',
  language: 'english',
  theme: 'light',
  spiritualLevel: 'beginner',
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
        const today = new Date().toISOString().split('T')[0];
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
        
        const updatedProgress: UserProgress = {
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
      partialize: (state) => ({
        userProgress: state.userProgress,
        userSettings: state.userSettings,
        hasReadToday: state.hasReadToday,
      }),
    }
  )
); 