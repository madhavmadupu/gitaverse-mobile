# Bhagavad Gita Daily Learning App - Product Requirements Document (Mobile)

## 1. Executive Summary

### 1.1 Product Vision
Create a daily spiritual learning companion that makes the timeless wisdom of the Bhagavad Gita accessible, engaging, and applicable to modern life through bite-sized daily verses with AI-powered explanations.

### 1.2 Product Mission
To help users develop a consistent spiritual practice by delivering one meaningful Gita verse daily with practical explanations, fostering personal growth and spiritual awareness.

### 1.3 Success Metrics
- **Primary**: Daily Active Users (DAU) retention > 40% after 30 days
- **Secondary**: Average session time > 3 minutes
- **Monetization**: 15% conversion to premium within 30 days
- **Engagement**: 70% of users complete daily verse reading
- **Retention**: 7-day streak completion rate > 60%

---

## 2. Product Overview

### 2.1 Target Audience

**Primary Audience:**
- Age: 25-55 years
- Demographics: Spiritual seekers, practicing Hindus, philosophy enthusiasts
- Behavior: Use meditation/spiritual apps, read spiritual content
- Pain Points: Lack of time for spiritual study, difficulty understanding ancient texts

**Secondary Audience:**
- Students studying Hindu philosophy
- Yoga practitioners seeking deeper spiritual understanding
- International users interested in Eastern philosophy

### 2.2 Value Proposition
- **Accessibility**: Complex Sanskrit verses made simple and practical
- **Consistency**: Daily habit formation through micro-learning (2-3 minutes)
- **Personalization**: AI-powered explanations tailored to user's spiritual level
- **Convenience**: Offline access, push notifications, mobile-first design

---

## 3. Technical Architecture

### 3.1 Technology Stack
- **Frontend**: Expo React Native 50+ with Expo Router
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand for global state
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Push Notifications**: Expo Notifications
- **Local Storage**: Expo SecureStore
- **Analytics**: Expo Analytics / PostHog
- **Deployment**: EAS Build for app stores

### 3.2 Database Schema

```sql
-- Users table
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'english',
  spiritual_level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  notification_time TIME DEFAULT '07:00',
  timezone TEXT,
  streak_count INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_read_date DATE,
  premium_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chapters table
chapters (
  id INTEGER PRIMARY KEY,
  chapter_number INTEGER UNIQUE NOT NULL,
  title_sanskrit TEXT NOT NULL,
  title_english TEXT NOT NULL,
  title_hindi TEXT,
  description TEXT,
  verse_count INTEGER,
  theme TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Verses table
verses (
  id UUID PRIMARY KEY,
  chapter_id INTEGER REFERENCES chapters(id),
  verse_number INTEGER NOT NULL,
  sanskrit_text TEXT NOT NULL,
  english_translation TEXT NOT NULL,
  hindi_translation TEXT,
  pronunciation_guide TEXT,
  audio_url TEXT,
  keywords TEXT[],
  difficulty_level TEXT DEFAULT 'beginner',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chapter_id, verse_number)
);

-- AI Explanations table
ai_explanations (
  id UUID PRIMARY KEY,
  verse_id UUID REFERENCES verses(id),
  explanation_type TEXT NOT NULL, -- daily, detailed, practical, philosophical
  content TEXT NOT NULL,
  language TEXT DEFAULT 'english',
  spiritual_level TEXT DEFAULT 'beginner',
  word_count INTEGER,
  generated_at TIMESTAMP DEFAULT NOW()
);

-- User Progress table
user_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  verse_id UUID REFERENCES verses(id),
  completed_at TIMESTAMP DEFAULT NOW(),
  time_spent_seconds INTEGER,
  is_favorite BOOLEAN DEFAULT FALSE,
  personal_notes TEXT,
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  understanding_rating INTEGER CHECK (understanding_rating BETWEEN 1 AND 5),
  UNIQUE(user_id, verse_id)
);

-- Daily Streaks table
daily_streaks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  verse_id UUID REFERENCES verses(id),
  completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- User Achievements table
achievements (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  requirement_type TEXT NOT NULL, -- streak, chapters_completed, total_verses
  requirement_value INTEGER,
  reward_type TEXT, -- badge, premium_days, wallpaper
  created_at TIMESTAMP DEFAULT NOW()
);

user_achievements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Favorites table
user_favorites (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  verse_id UUID REFERENCES verses(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, verse_id)
);

-- Settings table
user_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  notification_enabled BOOLEAN DEFAULT TRUE,
  daily_reminder_time TIME DEFAULT '07:00',
  weekend_notifications BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  haptic_enabled BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'light', -- light, dark, auto
  font_size TEXT DEFAULT 'medium', -- small, medium, large
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

---

## 4. Feature Specifications

### 4.1 Core Features (MVP)

#### 4.1.1 User Onboarding
**Screens**: Welcome, Sign Up/Login, Spiritual Level Selection, Notification Setup, Goal Setting

**User Flow:**
1. Welcome screen with app benefits
2. Authentication (email/phone + OTP)
3. Spiritual level assessment (3-4 questions)
4. Notification time preference
5. Set daily learning goal
6. Tutorial overlay on first verse

**Requirements:**
- Social login options (Google, Apple)
- Skip option for spiritual level (defaults to beginner)
- Timezone auto-detection
- Accessibility compliance (screen readers)

#### 4.1.2 Daily Verse Learning
**Primary Screen**: Today's Verse

**Components:**
- **Header**: Date, streak counter, settings icon
- **Verse Card**: 
  - Sanskrit text (beautiful typography)
  - English translation
  - Audio play button
  - Share button
- **AI Explanation**: Collapsible section with practical meaning
- **Action Buttons**: Mark as read, Add to favorites, Add notes
- **Progress Indicator**: Show daily completion status

**State Management (Zustand):**
```javascript
const useVerseStore = create((set, get) => ({
  todayVerse: null,
  isLoading: false,
  hasReadToday: false,
  streak: 0,
  
  fetchTodayVerse: async () => {
    set({ isLoading: true });
    // Fetch today's verse logic
    set({ todayVerse: verse, isLoading: false });
  },
  
  markAsRead: async (verseId) => {
    // Update user progress
    set({ hasReadToday: true, streak: get().streak + 1 });
  },
}));
```

**Technical Requirements:**
- Offline caching for last 7 days of verses
- Text-to-speech for Sanskrit pronunciation
- Smooth animations for card interactions
- Pull-to-refresh functionality

#### 4.1.3 Progress Tracking
**Screens**: Progress Dashboard, Streak Calendar, Achievements

**Progress Dashboard:**
- Current streak with flame animation
- Total verses completed
- Favorite verses count
- This week's progress chart
- Achievement badges grid

**Streak Calendar:**
- Monthly calendar view
- Green dots for completed days
- Streak milestone celebrations
- Share streak achievements

#### 4.1.4 Verse Library
**Screens**: Chapter List, Chapter Detail, Verse Detail

**Features:**
- Browse all 18 chapters
- Search verses by keywords
- Filter by difficulty level
- Recently read verses
- Bookmarked verses
- Chapter-wise progress tracking

#### 4.1.5 User Profile & Settings
**Screens**: Profile, Settings, About

**Profile Features:**
- User stats (total verses, streak, join date)
- Achievement showcase
- Learning goals progress
- Premium status indicator

**Settings:**
- Notification preferences
- Language selection
- Audio settings
- Theme selection (light/dark)
- Font size adjustment
- Data sync status

### 4.2 Premium Features

#### 4.2.1 Enhanced Learning
- **Multiple Explanation Styles**: Practical, philosophical, historical context
- **Audio Commentaries**: Professional narrations
- **Verse Connections**: Related verses and cross-references
- **Advanced Search**: Full-text search across explanations
- **Custom Study Plans**: Personalized learning paths

#### 4.2.2 Personalization
- **AI Tutor Chat**: Ask questions about any verse
- **Personal Insights**: AI-generated weekly spiritual insights
- **Custom Notifications**: Personalized reminder messages
- **Verse Recommendations**: Based on current life situations

#### 4.2.3 Content & Media
- **HD Wallpapers**: Verse-based spiritual wallpapers
- **Quote Cards**: Shareable social media cards
- **Offline Audio**: Download audio for offline listening
- **Extended Library**: Additional spiritual texts

---

## 5. User Experience Design

### 5.1 Design Principles
- **Spiritual Aesthetic**: Saffron/gold accents, clean typography, calming colors
- **Minimalist**: Focus on content, minimal distractions
- **Accessible**: Large text options, high contrast, screen reader support
- **Culturally Respectful**: Appropriate use of Sanskrit, spiritual symbols

### 5.2 Color Palette
```javascript
const colors = {
  primary: {
    50: '#FFF7ED',
    500: '#F97316', // Saffron
    600: '#EA580C',
    900: '#9A3412'
  },
  gold: {
    400: '#FACC15',
    500: '#EAB308'
  },
  spiritual: {
    cream: '#FDF4E3',
    lotus: '#E5B8F4',
    sacred: '#4F46E5'
  }
}
```

### 5.3 Typography
- **Primary Font**: Inter (clean, readable)
- **Sanskrit Font**: Noto Sans Devanagari
- **Accent Font**: Crimson Text (for quotes)

### 5.4 Component Library (NativeWind)

```javascript
// Verse Card Component
const VerseCard = ({ verse, explanation }) => (
  <View className="bg-white dark:bg-gray-800 rounded-xl p-6 mx-4 shadow-lg">
    <Text className="text-lg font-semibold text-center text-gray-800 dark:text-gray-200 mb-4">
      Chapter {verse.chapter} • Verse {verse.number}
    </Text>
    
    <Text className="text-base text-center font-sanskrit mb-4 text-orange-600">
      {verse.sanskrit}
    </Text>
    
    <Text className="text-base text-center text-gray-700 dark:text-gray-300 leading-6">
      {verse.translation}
    </Text>
    
    <TouchableOpacity className="mt-4 bg-orange-500 rounded-lg py-3">
      <Text className="text-white text-center font-semibold">
        Listen to Pronunciation
      </Text>
    </TouchableOpacity>
  </View>
);
```

---

## 6. User Flows

### 6.1 Daily Learning Flow
```
App Open → Check Notification Permission → 
Load Today's Verse → Display Verse Card → 
User Reads → Audio Playback (Optional) → 
View Explanation → Mark as Complete → 
Streak Update → Share Option → 
Tomorrow's Preview
```

### 6.2 New User Onboarding
```
Welcome Screen → Sign Up → Spiritual Level Quiz → 
Notification Setup → Goal Setting → 
First Verse Tutorial → Profile Setup Complete
```

### 6.3 Premium Upgrade Flow
```
Feature Lock Screen → Benefits Overview → 
Pricing Plans → Payment → Account Upgrade → 
Premium Welcome → Feature Unlock
```

---

## 7. Technical Requirements

### 7.1 Performance Requirements
- **App Launch**: < 2 seconds cold start
- **Verse Loading**: < 1 second
- **Offline Mode**: Last 7 verses cached
- **Battery Usage**: < 2% per daily session
- **Memory Usage**: < 100MB average

### 7.2 Platform Requirements
- **iOS**: 13.0+ (supports 98% of active devices)
- **Android**: API Level 21+ (Android 5.0)
- **Screen Sizes**: 4.7" to 6.7" phones, tablet responsive
- **Accessibility**: WCAG 2.1 AA compliance

### 7.3 Security Requirements
- **Data Encryption**: All API calls over HTTPS
- **Local Storage**: Sensitive data in SecureStore
- **Authentication**: JWT tokens with refresh mechanism
- **Privacy**: No tracking without consent, GDPR compliant

### 7.4 Integration Requirements

```javascript
// Supabase Integration
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Push Notifications
const scheduleDailyNotification = async (time) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🕉️ Today's Gita Wisdom",
      body: "Your daily verse is ready to inspire you",
    },
    trigger: {
      hour: time.hour,
      minute: time.minute,
      repeats: true,
    },
  });
};

// Analytics Events
const trackVerseCompletion = (verseId, timeSpent) => {
  Analytics.track('verse_completed', {
    verse_id: verseId,
    time_spent_seconds: timeSpent,
    user_level: userStore.spiritualLevel,
    date: new Date().toISOString(),
  });
};
```

---

## 8. Content Strategy

### 8.1 Content Structure
- **Total Verses**: 700 verses across 18 chapters
- **Daily Content**: 1 verse + explanation + audio
- **Content Types**: 
  - Sanskrit original
  - English translation
  - AI-generated explanation (3 difficulty levels)
  - Pronunciation guide
  - Related keywords

### 8.2 AI Content Generation
```javascript
const generateExplanation = async (verse, userLevel) => {
  const prompt = `
    Explain Bhagavad Gita Chapter ${verse.chapter}, Verse ${verse.number} 
    for a ${userLevel} spiritual seeker. 
    
    Verse: "${verse.translation}"
    
    Requirements:
    - 2-3 sentences for daily explanation
    - Practical application for modern life
    - Avoid complex philosophical jargon
    - Include one actionable insight
    
    Format: Simple, inspiring, accessible
  `;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 150,
    temperature: 0.7,
  });
  
  return response.choices[0].message.content;
};
```

### 8.3 Content Caching Strategy
- **Pre-generate**: First 30 days of explanations
- **Batch Processing**: Generate weekly batches
- **Quality Control**: Human review for cultural sensitivity
- **Localization**: Hindi translations for Indian market

---

## 9. Monetization Strategy

### 9.1 Freemium Model
**Free Tier (Daily Seeker):**
- Daily verse with basic explanation
- 7-day streak tracking
- Basic progress dashboard
- Limited favorites (10 verses)

**Premium Tier (Spiritual Scholar) - ₹199/month or ₹1999/year:**
- All verses library access
- Multiple explanation styles
- Audio commentaries
- Advanced search and filtering
- Unlimited favorites
- AI spiritual advisor chat
- Custom study plans
- HD wallpapers and quote cards
- Offline content download
- Priority customer support

### 9.2 Revenue Projections (Year 1)
- **Target Users**: 50,000 downloads
- **Premium Conversion**: 15% (7,500 users)
- **Monthly Revenue**: ₹14,92,500
- **Annual Revenue**: ₹1,79,10,000

### 9.3 Marketing Strategy
- **Organic**: SEO-optimized verse pages
- **Social**: Daily verse sharing on Instagram/Twitter
- **Partnerships**: Yoga studios, spiritual centers
- **Influencer**: Spiritual teachers and life coaches
- **ASO**: App Store Optimization for spiritual keywords

---

## 10. Development Roadmap

### 10.1 Phase 1 - MVP (8 weeks)
**Week 1-2: Project Setup**
- Expo project initialization
- Supabase setup and database schema
- Authentication flow
- Basic navigation structure

**Week 3-4: Core Features**
- Daily verse display
- User progress tracking
- Basic settings
- Push notifications

**Week 5-6: Content & Polish**
- AI explanation integration
- Audio playback
- Offline caching
- UI/UX refinements

**Week 7-8: Testing & Launch**
- Beta testing with 50 users
- Bug fixes and performance optimization
- App store submission
- Launch preparation

### 10.2 Phase 2 - Enhanced Features (6 weeks)
- Verse library and search
- Achievement system
- Social sharing features
- Premium subscription integration

### 10.3 Phase 3 - Premium Features (8 weeks)
- AI chat advisor
- Audio commentaries
- Advanced analytics
- Wallpapers and media content

---

## 11. Success Metrics & KPIs

### 11.1 User Acquisition
- **Downloads**: 10,000 in first month
- **Registration Rate**: 70% of downloads
- **Activation Rate**: 60% complete onboarding

### 11.2 Engagement
- **Daily Active Users**: 40% of registered users
- **Session Length**: Average 3+ minutes
- **Streak Completion**: 60% complete 7-day streak
- **Monthly Retention**: 45% at 30 days

### 11.3 Monetization
- **Premium Conversion**: 15% within 30 days
- **Revenue per User**: ₹150 average
- **Churn Rate**: <5% monthly for premium users

### 11.4 Content
- **Verse Completion Rate**: 85% daily
- **Audio Usage**: 60% play audio
- **Sharing Rate**: 25% share verses
- **Favorites**: Average 15 verses per user

---

## 12. Risk Assessment & Mitigation

### 12.1 Technical Risks
**Risk**: Poor app performance
**Mitigation**: Performance monitoring, optimization sprints

**Risk**: Supabase downtime
**Mitigation**: Offline mode, data caching, backup plans

### 12.2 Content Risks
**Risk**: AI-generated content accuracy
**Mitigation**: Human review process, scholarly validation

**Risk**: Cultural sensitivity issues
**Mitigation**: Cultural advisory board, community feedback

### 12.3 Business Risks
**Risk**: Low user retention
**Mitigation**: Engagement features, personalization, community building

**Risk**: Premium conversion challenges
**Mitigation**: Value demonstration, free trials, feature gates

---

## 13. Post-Launch Strategy

### 13.1 User Feedback Integration
- In-app feedback system
- Regular user surveys
- Community Discord/Telegram
- App store review monitoring

### 13.2 Content Expansion
- Additional spiritual texts (Upanishads, Ramayana)
- Multi-language support (Hindi, Tamil, Bengali)
- Guru commentary integration
- Community-contributed insights

### 13.3 Platform Expansion
- Web app for desktop users
- iPad-optimized version
- Apple Watch complications
- Smart speaker integration

---

## 14. Conclusion

This Bhagavad Gita daily learning app addresses the growing need for accessible spiritual education in our fast-paced world. By combining ancient wisdom with modern technology, we create a unique value proposition that serves both traditional spiritual seekers and contemporary users interested in personal growth.

The technical architecture leveraging Expo React Native, Supabase, and AI ensures scalability while maintaining development efficiency. The freemium monetization model provides clear revenue paths while keeping core spiritual content accessible.

Success depends on consistent content quality, engaging user experience, and building a community of dedicated spiritual learners. With proper execution, this app can become the leading digital platform for Bhagavad Gita study and daily spiritual practice.