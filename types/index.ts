// ============================================================================
// DATABASE TYPES (Matching Supabase Schema)
// ============================================================================

// Base types for common patterns
export type UUID = string;
export type Timestamp = string; // ISO string format
export type DateString = string; // YYYY-MM-DD format
export type TimeString = string; // HH:MM:SS format

// ============================================================================
// CORE ENTITY TYPES
// ============================================================================

export interface Verse {
  id: UUID;
  chapter_id: UUID;
  verse_number: number;
  sanskrit_text: string;
  english_translation: string;
  hindi_translation?: string;
  pronunciation_guide?: string;
  audio_url?: string;
  keywords?: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  explanation?: string;
  created_at: Timestamp;
}

export interface Chapter {
  id: UUID;
  chapter_number: number;
  title_sanskrit: string;
  title_english: string;
  title_hindi?: string;
  description?: string;
  verse_count?: number;
  theme?: string;
  created_at: Timestamp;
}

export interface User {
  id: UUID;
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferred_language: 'english' | 'hindi';
  spiritual_level: 'beginner' | 'intermediate' | 'advanced';
  notification_time: TimeString;
  timezone?: string;
  streak_count: number;
  longest_streak: number;
  last_read_date?: DateString;
  premium_until?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// USER PROGRESS & INTERACTION TYPES
// ============================================================================

export interface UserProgress {
  id: UUID;
  user_id: UUID;
  verse_id: UUID;
  completed_at: Timestamp;
  time_spent_seconds?: number;
  is_favorite: boolean;
  personal_notes?: string;
  difficulty_rating?: 1 | 2 | 3 | 4 | 5;
  understanding_rating?: 1 | 2 | 3 | 4 | 5;
}

export interface UserSettings {
  id: UUID;
  user_id: UUID;
  notification_enabled: boolean;
  daily_reminder_time: TimeString;
  weekend_notifications: boolean;
  sound_enabled: boolean;
  haptic_enabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  font_size: 'small' | 'medium' | 'large';
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface UserFavorites {
  id: UUID;
  user_id: UUID;
  verse_id: UUID;
  created_at: Timestamp;
}

export interface DailyStreak {
  id: UUID;
  user_id: UUID;
  date: DateString;
  verse_id: UUID;
  completed: boolean;
  created_at: Timestamp;
}

// ============================================================================
// ACHIEVEMENT SYSTEM TYPES
// ============================================================================

export interface Achievement {
  id: UUID;
  name: string;
  description?: string;
  icon_name?: string;
  requirement_type: 'streak' | 'chapters_completed' | 'total_verses' | 'favorites';
  requirement_value?: number;
  reward_type?: 'badge' | 'premium_days' | 'wallpaper';
  created_at: Timestamp;
}

export interface UserAchievement {
  id: UUID;
  user_id: UUID;
  achievement_id: UUID;
  earned_at: Timestamp;
}

// ============================================================================
// AI & CONTENT TYPES
// ============================================================================

export interface AIExplanation {
  id: UUID;
  verse_id: UUID;
  explanation_type: 'daily' | 'detailed' | 'practical' | 'philosophical';
  content: string;
  language: string;
  spiritual_level: 'beginner' | 'intermediate' | 'advanced';
  word_count?: number;
  generated_at: Timestamp;
}

export interface DailyVerse {
  id: UUID;
  date: DateString;
  verse_id: UUID;
  created_at: Timestamp;
}

// ============================================================================
// APP-SPECIFIC TYPES (For UI and State Management)
// ============================================================================

// Extended Verse type for UI with additional computed properties
export interface VerseWithChapter extends Verse {
  chapter?: Chapter;
  isCompleted?: boolean;
  isFavorite?: boolean;
  userProgress?: UserProgress;
}

// Extended Chapter type for UI with progress tracking
export interface ChapterWithProgress extends Chapter {
  completedVerses?: number;
  totalProgress?: number;
  verses?: Verse[];
}

// User profile with computed properties
export interface UserProfile extends User {
  settings?: UserSettings;
  achievements?: UserAchievement[];
  totalVersesRead?: number;
  totalChaptersCompleted?: number;
  currentStreak?: number;
  longestStreak?: number;
}

// Progress summary for dashboard
export interface ProgressSummary {
  currentStreak: number;
  longestStreak: number;
  totalVerses: number;
  totalChapters: number;
  totalTime: number; // in minutes
  lastReadDate?: DateString;
  completedVerses: UUID[];
  favoriteVerses: UUID[];
}

// Settings for UI state management
export interface AppSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  reminderTime: string; // HH:MM format
  language: 'english' | 'hindi';
  theme: 'light' | 'dark' | 'auto';
  spiritualLevel: 'beginner' | 'intermediate' | 'advanced';
  fontSize: 'small' | 'medium' | 'large';
  weekendNotifications: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// FORM & INPUT TYPES
// ============================================================================

export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  password: string;
  fullName: string;
  spiritualLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface OnboardingForm {
  fullName: string;
  spiritualLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguage: 'english' | 'hindi';
  reminderTime: string;
  notificationsEnabled: boolean;
}

export interface VerseRatingForm {
  difficultyRating: 1 | 2 | 3 | 4 | 5;
  understandingRating: 1 | 2 | 3 | 4 | 5;
  personalNotes?: string;
}

// ============================================================================
// ENUM TYPES
// ============================================================================

export const SPIRITUAL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export const THEMES = ['light', 'dark', 'auto'] as const;
export const FONT_SIZES = ['small', 'medium', 'large'] as const;
export const LANGUAGES = ['english', 'hindi'] as const;
export const EXPLANATION_TYPES = ['daily', 'detailed', 'practical', 'philosophical'] as const;
export const ACHIEVEMENT_TYPES = ['streak', 'chapters_completed', 'total_verses', 'favorites'] as const;
export const REWARD_TYPES = ['badge', 'premium_days', 'wallpaper'] as const;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type SpiritualLevel = typeof SPIRITUAL_LEVELS[number];
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];
export type Theme = typeof THEMES[number];
export type FontSize = typeof FONT_SIZES[number];
export type Language = typeof LANGUAGES[number];
export type ExplanationType = typeof EXPLANATION_TYPES[number];
export type AchievementType = typeof ACHIEVEMENT_TYPES[number];
export type RewardType = typeof REWARD_TYPES[number];

// ============================================================================
// STORE STATE TYPES
// ============================================================================

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface VerseState {
  todayVerse: VerseWithChapter | null;
  isLoading: boolean;
  hasReadToday: boolean;
  userProgress: ProgressSummary;
  userSettings: AppSettings;
}

export interface OnboardingState {
  isCompleted: boolean;
  currentStep: number;
  formData: Partial<OnboardingForm>;
  isLoading: boolean;
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

export type RootStackParamList = {
  '(tabs)': undefined;
  '(auth)': undefined;
  'onboarding': undefined;
  'edit-profile': undefined;
  'modal': undefined;
};

export type TabParamList = {
  index: undefined;
  library: undefined;
  progress: undefined;
  profile: undefined;
  settings: undefined;
};

export type AuthParamList = {
  welcome: undefined;
  signin: undefined;
  signup: undefined;
  onboarding: undefined;
}; 