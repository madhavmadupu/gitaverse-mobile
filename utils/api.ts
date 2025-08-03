import { Verse } from '../store/verseStore';

const API_BASE_URL = process.env.GITAVERSE_API_BASE_URL || 'https://gitaverse.vercel.app/api/';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
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
    return this.request<Verse>('verses/today');
  }

  // Get verse by ID
  async getVerse(verseId: string): Promise<Verse> {
    return this.request<Verse>(`verses/${verseId}`);
  }

  // Get all chapters
  async getChapters() {
    return this.request('chapters');
  }

  // Get verses by chapter
  async getVersesByChapter(chapterId: number) {
    return this.request(`chapters/${chapterId}/verses`);
  }

  // Mark verse as read
  async markVerseAsRead(verseId: string, timeSpent: number) {
    return this.request('progress/mark-read', {
      method: 'POST',
      body: JSON.stringify({
        verseId,
        timeSpent,
        completedAt: new Date().toISOString(),
      }),
    });
  }

  // Get user progress
  async getUserProgress() {
    return this.request('progress/user');
  }

  // Update user settings
  async updateUserSettings(settings: any) {
    return this.request('user/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Search verses
  async searchVerses(query: string) {
    return this.request(`verses/search?q=${encodeURIComponent(query)}`);
  }

  // Get AI explanation for verse
  async getVerseExplanation(verseId: string, level: string = 'beginner') {
    return this.request(`verses/${verseId}/explanation`, {
      method: 'POST',
      body: JSON.stringify({ level }),
    });
  }

  // Mock data for development
  getMockTodayVerse(): Verse {
    return {
      id: '2-47',
      chapter: 2,
      verse: 47,
      sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
      translation: 'You have the right to work only, but never to its fruits. Let not the fruits of action be your motive, nor let your attachment be to inaction.',
      explanation: 'This verse teaches us the principle of Karma Yoga - the yoga of selfless action. It reminds us to focus on our duties and responsibilities without being attached to the results. When we perform our actions with dedication but without expecting specific outcomes, we find inner peace and spiritual growth.',
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
        theme: 'The Yoga of Arjuna\'s Dejection',
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