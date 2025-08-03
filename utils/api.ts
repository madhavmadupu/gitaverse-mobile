import { Verse } from '../store/verseStore';
import { supabase } from './supabase';

const API_BASE_URL = process.env.GITAVERSE_API_BASE_URL || 'https://gitaverse.vercel.app/api/';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get today's verse
  async getTodayVerse(): Promise<Verse> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // First try to get from daily_verses table
      const { data: dailyVerse, error: dailyError } = await supabase
        .from('daily_verses')
        .select('*')
        .eq('date', today)
        .single();

      if (dailyVerse) {
        // Get the full verse details
        const { data: verse, error: verseError } = await supabase
          .from('verses')
          .select('*')
          .eq('id', dailyVerse.verse_id)
          .single();

        if (verse) {
          return verse as Verse;
        }
      }

      // Fallback to mock data if no daily verse found
      return this.getMockTodayVerse();
    } catch (error) {
      console.error("Error fetching today's verse:", error);
      return this.getMockTodayVerse();
    }
  }

  // Get verse by ID
  async getVerse(verseId: string): Promise<Verse> {
    try {
      const { data, error } = await supabase.from('verses').select('*').eq('id', verseId).single();

      if (error) throw error;
      return data as Verse;
    } catch (error) {
      console.error('Error fetching verse:', error);
      throw error;
    }
  }

  // Get all chapters
  async getChapters() {
    try {
      const { data, error } = await supabase.from('chapters').select('*').order('id');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return this.getMockChapters();
    }
  }

  // Get verses by chapter
  async getVersesByChapter(chapterId: number) {
    return this.request(`chapters/${chapterId}/verses`);
  }

  // Mark verse as read
  async markVerseAsRead(verseId: string, timeSpent: number) {
    try {
      const { error } = await supabase.from('user_progress').upsert({
        verse_id: verseId,
        time_spent_seconds: timeSpent,
        completed_at: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking verse as read:', error);
      throw error;
    }
  }

  // Get user progress
  async getUserProgress() {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          totalVerses: 0,
          totalChapters: 0,
          totalTime: 0,
          lastReadDate: null,
        };
      }

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Calculate progress from data
      const totalVerses = data?.length || 0;
      const lastReadDate =
        data?.length > 0
          ? new Date(Math.max(...data.map((d) => new Date(d.read_at).getTime())))
          : null;

      // Calculate streak (simplified)
      let currentStreak = 0;
      if (lastReadDate) {
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastReadDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        currentStreak = diffDays <= 1 ? 1 : 0;
      }

      return {
        currentStreak,
        longestStreak: currentStreak, // Simplified
        totalVerses,
        totalChapters: Math.floor(totalVerses / 10), // Simplified
        totalTime: totalVerses * 5, // 5 minutes per verse
        lastReadDate,
      };
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalVerses: 0,
        totalChapters: 0,
        totalTime: 0,
        lastReadDate: null,
      };
    }
  }

  // Update user settings
  async updateUserSettings(settings: any) {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Ensure user record exists in users table
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingUser) {
        // Create user record if it doesn't exist
        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name,
          spiritual_level: user.user_metadata?.spiritual_level || 'beginner',
        });

        if (insertError) {
          console.error('Error creating user record:', insertError);
          throw new Error(`Failed to create user record: ${insertError.message}`);
        }

        console.log('User record created successfully');
      }

      // First check if user_settings record exists
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingSettings) {
        // Update existing record
        const { error } = await supabase
          .from('user_settings')
          .update(settings)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase.from('user_settings').insert({
          user_id: user.id,
          ...settings,
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  // Search verses
  async searchVerses(query: string) {
    try {
      const { data, error } = await supabase
        .from('verses')
        .select('*')
        .or(`sanskrit.ilike.%${query}%,english.ilike.%${query}%,meaning.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching verses:', error);
      throw error;
    }
  }

  // Get AI explanation for verse
  async getVerseExplanation(verseId: string, level: string = 'beginner') {
    try {
      const { data, error } = await supabase
        .from('verses')
        .select('explanation')
        .eq('id', verseId)
        .single();

      if (error) throw error;
      return data.explanation || 'No explanation available.';
    } catch (error) {
      console.error('Error fetching verse explanation:', error);
      return 'No explanation available.';
    }
  }

  // Check if user has completed onboarding
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      console.log('Checking onboarding for user:', user?.id);
      if (!user) return false;

      // Check if user has spiritual_level in metadata
      const hasSpiritualLevel = !!user.user_metadata?.spiritual_level;
      console.log(
        'Has spiritual level:',
        hasSpiritualLevel,
        'Value:',
        user.user_metadata?.spiritual_level
      );

      // Check if user has daily reminder time in user_settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('daily_reminder_time')
        .eq('user_id', user.id)
        .single();

      console.log('User settings data:', settingsData, 'Error:', settingsError);
      const hasReminderTime = !!settingsData?.daily_reminder_time;
      console.log(
        'Has reminder time:',
        hasReminderTime,
        'Value:',
        settingsData?.daily_reminder_time
      );

      // Check if user has set their spiritual level and daily reminder time
      const hasCompleted = hasSpiritualLevel && hasReminderTime;
      console.log('Onboarding completed:', hasCompleted);
      return hasCompleted;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  // Create user record in users table
  async createUserRecord(userId: string, email: string, metadata: any = {}) {
    try {
      console.log('Creating user record for:', userId, email);

      const { error } = await supabase.from('users').insert({
        id: userId,
        email: email,
        full_name: metadata.full_name || metadata.username,
        spiritual_level: metadata.spiritual_level || 'beginner',
      });

      if (error) {
        console.error('Error creating user record:', error);
        // Check if it's a duplicate key error
        if (error.code === '23505') {
          console.log('User record already exists, skipping creation');
          return;
        }
        throw error;
      }

      console.log('User record created successfully');
    } catch (error) {
      console.error('Error creating user record:', error);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // Mock data for development
  getMockTodayVerse(): Verse {
    return {
      id: '2-47',
      chapter: 2,
      verse: 47,
      sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
      translation:
        'You have the right to work only, but never to its fruits. Let not the fruits of action be your motive, nor let your attachment be to inaction.',
      explanation:
        'This verse teaches us the principle of Karma Yoga - the yoga of selfless action. It reminds us to focus on our duties and responsibilities without being attached to the results. When we perform our actions with dedication but without expecting specific outcomes, we find inner peace and spiritual growth.',
      keywords: ['karma', 'detachment', 'duty', 'selfless action'],
      audioUrl: 'https://example.com/audio/2-47.mp3',
    };
  }

  getMockChapters() {
    return [
      {
        id: 1,
        number: 1,
        title: 'Arjuna Vishada Yoga',
        titleSanskrit: 'अर्जुन विषाद योग',
        verseCount: 47,
        completedVerses: 12,
        theme: "The Yoga of Arjuna's Dejection",
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
  }
}

export const apiService = new ApiService();
