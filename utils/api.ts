import { 
  Verse, 
  VerseWithChapter, 
  Chapter, 
  User, 
  UserProgress, 
  UserSettings,
  ProgressSummary,
  AppSettings,
  UUID,
  Timestamp,
  DateString,
  TimeString,
  SpiritualLevel,
  DifficultyLevel,
  Theme,
  FontSize,
  Language,
  ExplanationType,
  Achievement,
  UserAchievement,
  AIExplanation,
  DailyVerse,
  DailyStreak,
  UserFavorites,
  ChapterWithProgress,
  UserProfile,
  ApiResponse,
  PaginatedResponse,
  LoginForm,
  SignupForm,
  OnboardingForm,
  VerseRatingForm
} from '../types';
import { supabase } from './supabase';

const API_BASE_URL = process.env.GITAVERSE_API_BASE_URL || 'https://gitaverse.vercel.app/api/';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Helper method to check if a verse ID is a mock ID
  private isMockVerseId(verseId: string): boolean {
    // Mock verse IDs are in format "chapter-verse" (e.g., "2-47")
    // Real UUIDs contain curly braces or are in UUID format
    return verseId.includes('-') && !verseId.includes('{') && !verseId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
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
  async getTodayVerse(): Promise<VerseWithChapter> {
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
          // Get chapter information
          const { data: chapter } = await supabase
            .from('chapters')
            .select('*')
            .eq('id', verse.chapter_id)
            .single();
          
          return {
            ...verse,
            chapter,
            isCompleted: false,
            isFavorite: false,
          } as VerseWithChapter;
        }
      }

      // Fallback to mock data if no daily verse found
      const mockVerse = this.getMockTodayVerse();
      const mockChapter = this.getMockChapters().find(c => c.id === mockVerse.chapter_id);
      return {
        ...mockVerse,
        chapter: mockChapter,
        isCompleted: false,
        isFavorite: false,
      } as VerseWithChapter;
    } catch (error) {
      console.error("Error fetching today's verse:", error);
      const mockVerse = this.getMockTodayVerse();
      const mockChapter = this.getMockChapters().find(c => c.id === mockVerse.chapter_id);
      return {
        ...mockVerse,
        chapter: mockChapter,
        isCompleted: false,
        isFavorite: false,
      } as VerseWithChapter;
    }
  }

  // Get verse by ID
  async getVerse(verseId: string): Promise<Verse> {
    try {
      // Check if this is a mock verse ID (format: "chapter-verse")
      if (this.isMockVerseId(verseId)) {
        console.log('Skipping database call for mock verse ID:', verseId);
        throw new Error('Mock verse ID provided, cannot fetch from database');
      }

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
      const { data, error } = await supabase.from('chapters').select('*').order('chapter_number');

      if (error) {
        console.error('Error fetching chapters:', error);
        return this.getMockChapters();
      }
      
      // If no chapters found in database, return mock data
      if (!data || data.length === 0) {
        console.log('No chapters found in database, using mock data');
        return this.getMockChapters();
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return this.getMockChapters();
    }
  }

  // Get verses by chapter
  async getVersesByChapter(chapterId: number): Promise<Verse[]> {
    try {
      // First, get the chapter UUID by chapter_number
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .select('id')
        .eq('chapter_number', chapterId)
        .single();

      if (chapterError) {
        console.error('Error fetching chapter:', chapterError);
        // Return mock data for development
        return this.getMockVersesByChapter(chapterId);
      }

      if (!chapter) {
        console.log('Chapter not found, returning mock data');
        return this.getMockVersesByChapter(chapterId);
      }

      // Now get verses using the chapter UUID
      const { data: verses, error: versesError } = await supabase
        .from('verses')
        .select('*')
        .eq('chapter_id', chapter.id)
        .order('verse_number');

      if (versesError) {
        console.error('Error fetching verses:', versesError);
        return this.getMockVersesByChapter(chapterId);
      }

      return verses || [];
    } catch (error) {
      console.error('Error fetching verses by chapter:', error);
      // Return mock data for development
      return this.getMockVersesByChapter(chapterId);
    }
  }

  // Mark verse as read
  async markVerseAsRead(verseId: string, timeSpent: number) {
    try {
      // Check if this is a mock verse ID (format: "chapter-verse")
      if (this.isMockVerseId(verseId)) {
        console.log('Skipping database call for mock verse ID:', verseId);
        return; // Skip database call for mock data
      }

      const { error } = await supabase.from('user_progress').upsert({
        verse_id: verseId,
        time_spent_seconds: timeSpent,
        completed_at: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) {
        console.error('Supabase error marking verse as read:', error);
        throw error;
      }
      
      console.log('Successfully marked verse as read:', verseId);
    } catch (error) {
      console.error('Error marking verse as read:', error);
      throw error;
    }
  }

  // Get user progress
  async getUserProgress(): Promise<ProgressSummary> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          totalVerses: 0,
          totalChapters: 0,
          totalTime: 0,
          lastReadDate: undefined,
          completedVerses: [],
          favoriteVerses: [],
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
          ? new Date(Math.max(...data.map((d) => new Date(d.completed_at).getTime()))).toISOString().split('T')[0]
          : undefined;

      // Calculate streak (simplified)
      let currentStreak = 0;
      if (lastReadDate) {
        const today = new Date();
        const lastReadDateObj = new Date(lastReadDate);
        const diffTime = Math.abs(today.getTime() - lastReadDateObj.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        currentStreak = diffDays <= 1 ? 1 : 0;
      }

      return {
        currentStreak,
        longestStreak: currentStreak, // Simplified
        totalVerses,
        totalChapters: Math.floor(totalVerses / 10), // Simplified
        totalTime: totalVerses * 5, // 5 minutes per verse
        lastReadDate: lastReadDate || undefined,
        completedVerses: [],
        favoriteVerses: [],
      };
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalVerses: 0,
        totalChapters: 0,
        totalTime: 0,
        lastReadDate: undefined,
        completedVerses: [],
        favoriteVerses: [],
      };
    }
  }

  // Update user metadata
  async updateUserMetadata(metadata: any) {
    try {
      const { error } = await supabase.auth.updateUser({
        data: metadata
      });

      if (error) {
        console.error('Error updating user metadata:', error);
        throw error;
      }

      console.log('User metadata updated successfully');
      return { error: null };
    } catch (error) {
      console.error('Error updating user metadata:', error);
      return { error };
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

      console.log('Updating user settings for user:', user.id, 'Settings:', settings);

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
      const { data: existingSettings, error: settingsCheckError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      console.log('Existing settings check:', existingSettings, 'Error:', settingsCheckError);

      if (existingSettings) {
        // Update existing record
        const { error } = await supabase
          .from('user_settings')
          .update(settings)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating user settings:', error);
          throw error;
        }
        console.log('User settings updated successfully');
      } else {
        // Insert new record
        const { error } = await supabase.from('user_settings').insert({
          user_id: user.id,
          ...settings,
        });

        if (error) {
          console.error('Error inserting user settings:', error);
          throw error;
        }
        console.log('User settings inserted successfully');
      }

      // Verify the settings were saved by fetching them back
      const { data: verifyData, error: verifyError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (verifyError) {
        console.error('Error verifying user settings:', verifyError);
      } else {
        console.log('Verified user settings:', verifyData);
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
      // Check if this is a mock verse ID (format: "chapter-verse")
      if (this.isMockVerseId(verseId)) {
        console.log('Skipping database call for mock verse ID:', verseId);
        return 'No explanation available for mock verse.';
      }

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
        .select('daily_reminder_time, notification_enabled')
        .eq('user_id', user.id)
        .single();

      console.log('User settings data:', settingsData, 'Error:', settingsError);
      
      // If there's an error fetching settings, it might mean the user hasn't completed onboarding
      if (settingsError && settingsError.code !== 'PGRST116') {
        console.log('Error fetching user settings:', settingsError);
        return false;
      }
      
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
      
      // Additional validation: ensure the spiritual level is not empty
      if (hasCompleted && (!user.user_metadata?.spiritual_level || user.user_metadata.spiritual_level.trim() === '')) {
        console.log('Spiritual level is empty, considering onboarding incomplete');
        return false;
      }
      
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
      chapter_id: 'mock-chapter-2',
      verse_number: 47,
      sanskrit_text: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
      english_translation:
        'You have the right to work only, but never to its fruits. Let not the fruits of action be your motive, nor let your attachment be to inaction.',
      explanation:
        'This verse teaches us the principle of Karma Yoga - the yoga of selfless action. It reminds us to focus on our duties and responsibilities without being attached to the results. When we perform our actions with dedication but without expecting specific outcomes, we find inner peace and spiritual growth.',
      keywords: ['karma', 'detachment', 'duty', 'selfless action'],
      audio_url: 'https://example.com/audio/2-47.mp3',
      difficulty_level: 'intermediate',
      created_at: new Date().toISOString(),
    };
  }

  getMockChapters(): Chapter[] {
    return [
      {
        id: 'mock-chapter-1',
        chapter_number: 1,
        title_sanskrit: 'अर्जुन विषाद योग',
        title_english: 'Arjuna Vishada Yoga',
        title_hindi: 'अर्जुन विषाद योग',
        description: "The Yoga of Arjuna's Dejection",
        verse_count: 47,
        theme: "The Yoga of Arjuna's Dejection",
        created_at: new Date().toISOString(),
      },
      {
        id: 'mock-chapter-2',
        chapter_number: 2,
        title_sanskrit: 'सांख्य योग',
        title_english: 'Sankhya Yoga',
        title_hindi: 'सांख्य योग',
        description: 'Transcendental Knowledge',
        verse_count: 72,
        theme: 'Transcendental Knowledge',
        created_at: new Date().toISOString(),
      },
      {
        id: 'mock-chapter-3',
        chapter_number: 3,
        title_sanskrit: 'कर्म योग',
        title_english: 'Karma Yoga',
        title_hindi: 'कर्म योग',
        description: 'The Eternal Duties of Human Beings',
        verse_count: 43,
        theme: 'The Eternal Duties of Human Beings',
        created_at: new Date().toISOString(),
      },
      {
        id: 'mock-chapter-4',
        chapter_number: 4,
        title_sanskrit: 'ज्ञान कर्म संन्यास योग',
        title_english: 'Jnana Karma Sanyasa Yoga',
        title_hindi: 'ज्ञान कर्म संन्यास योग',
        description: 'The Eternal Duties of Human Beings',
        verse_count: 42,
        theme: 'The Eternal Duties of Human Beings',
        created_at: new Date().toISOString(),
      },
      {
        id: 'mock-chapter-5',
        chapter_number: 5,
        title_sanskrit: 'कर्म संन्यास योग',
        title_english: 'Karma Sanyasa Yoga',
        title_hindi: 'कर्म संन्यास योग',
        description: 'Action in Krishna Consciousness',
        verse_count: 29,
        theme: 'Action in Krishna Consciousness',
        created_at: new Date().toISOString(),
      },
    ];
  }

  getMockVersesByChapter(chapterId: number): Verse[] {
    const mockVerses: { [key: number]: Verse[] } = {
      1: [
        {
          id: '1-1',
          chapter_id: 'mock-chapter-1',
          verse_number: 1,
          sanskrit_text: 'धृतराष्ट्र उवाच | धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः | मामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय ||',
          english_translation: 'Dhritarashtra said: O Sanjaya, what did my sons and the sons of Pandu do when they had assembled together, eager for battle, on the holy plain of Kurukshetra?',
          hindi_translation: 'धृतराष्ट्र ने कहा: हे संजय, मेरे पुत्रों और पांडु के पुत्रों ने क्या किया जब वे युद्ध के लिए उत्सुक होकर कुरुक्षेत्र के पवित्र मैदान में एकत्र हुए?',
          difficulty_level: 'beginner',
          created_at: new Date().toISOString(),
        },
        {
          id: '1-2',
          chapter_id: 'mock-chapter-1',
          verse_number: 2,
          sanskrit_text: 'सञ्जय उवाच | दृष्ट्वा तु पाण्डवानीकं व्यूढं दुर्योधनस्तदा | आचार्यमुपसङ्गम्य राजा वचनमब्रवीत् ||',
          english_translation: 'Sanjaya said: Having seen the army of the Pandavas drawn up in battle array, King Duryodhana then approached his teacher (Drona) and spoke these words.',
          hindi_translation: 'संजय ने कहा: पांडवों की सेना को युद्ध के लिए तैयार देखकर, राजा दुर्योधन ने अपने गुरु (द्रोण) के पास जाकर ये शब्द कहे।',
          difficulty_level: 'beginner',
          created_at: new Date().toISOString(),
        },
      ],
      2: [
        {
          id: '2-47',
          chapter_id: 'mock-chapter-2',
          verse_number: 47,
          sanskrit_text: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
          english_translation: 'You have the right to work only, but never to its fruits. Let not the fruits of action be your motive, nor let your attachment be to inaction.',
          hindi_translation: 'तुम्हारा कर्म करने में ही अधिकार है, फल में कभी नहीं। कर्म के फल का हेतु मत बनो और कर्म न करने में भी आसक्ति मत रखो।',
          difficulty_level: 'intermediate',
          created_at: new Date().toISOString(),
        },
        {
          id: '2-48',
          chapter_id: 'mock-chapter-2',
          verse_number: 48,
          sanskrit_text: 'योग: कर्मसु कौशलम् |',
          english_translation: 'Yoga is skill in action.',
          hindi_translation: 'योग कर्म में कुशलता है।',
          difficulty_level: 'beginner',
          created_at: new Date().toISOString(),
        },
      ],
      3: [
        {
          id: '3-1',
          chapter_id: 'mock-chapter-3',
          verse_number: 1,
          sanskrit_text: 'अर्जुन उवाच | ज्यायसी चेत्कर्मणस्ते मता बुद्धिर्जनार्दन | तत्किं कर्मणि घोरे मां नियोजयसि केशव ||',
          english_translation: 'Arjuna said: O Janardana, if You consider that knowledge is superior to action, why do You urge me to this terrible action, O Kesava?',
          hindi_translation: 'अर्जुन ने कहा: हे जनार्दन, यदि आप ज्ञान को कर्म से श्रेष्ठ मानते हैं, तो हे केशव, आप मुझे इस भयंकर कर्म में क्यों प्रेरित कर रहे हैं?',
          difficulty_level: 'intermediate',
          created_at: new Date().toISOString(),
        },
      ],
    };

    return mockVerses[chapterId] || [];
  }
}

export const apiService = new ApiService();
