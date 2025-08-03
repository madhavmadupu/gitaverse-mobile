-- Bhagavad Gita Daily Learning App - Supabase Database Schema
-- Based on the Product Requirements Document

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'english',
  spiritual_level TEXT DEFAULT 'beginner' CHECK (spiritual_level IN ('beginner', 'intermediate', 'advanced')),
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
CREATE TABLE IF NOT EXISTS public.chapters (
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
CREATE TABLE IF NOT EXISTS public.verses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id INTEGER REFERENCES public.chapters(id),
  verse_number INTEGER NOT NULL,
  sanskrit_text TEXT NOT NULL,
  english_translation TEXT NOT NULL,
  hindi_translation TEXT,
  pronunciation_guide TEXT,
  audio_url TEXT,
  keywords TEXT[],
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  explanation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chapter_id, verse_number)
);

-- AI Explanations table
CREATE TABLE IF NOT EXISTS public.ai_explanations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verse_id UUID REFERENCES public.verses(id) ON DELETE CASCADE,
  explanation_type TEXT NOT NULL CHECK (explanation_type IN ('daily', 'detailed', 'practical', 'philosophical')),
  content TEXT NOT NULL,
  language TEXT DEFAULT 'english',
  spiritual_level TEXT DEFAULT 'beginner' CHECK (spiritual_level IN ('beginner', 'intermediate', 'advanced')),
  word_count INTEGER,
  generated_at TIMESTAMP DEFAULT NOW()
);

-- User Progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  verse_id UUID REFERENCES public.verses(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT NOW(),
  time_spent_seconds INTEGER,
  is_favorite BOOLEAN DEFAULT FALSE,
  personal_notes TEXT,
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  understanding_rating INTEGER CHECK (understanding_rating BETWEEN 1 AND 5),
  UNIQUE(user_id, verse_id)
);

-- Daily Streaks table
CREATE TABLE IF NOT EXISTS public.daily_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  verse_id UUID REFERENCES public.verses(id),
  completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Daily Verses table (for scheduling daily content)
CREATE TABLE IF NOT EXISTS public.daily_verses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  verse_id UUID REFERENCES public.verses(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('streak', 'chapters_completed', 'total_verses', 'favorites')),
  requirement_value INTEGER,
  reward_type TEXT CHECK (reward_type IN ('badge', 'premium_days', 'wallpaper')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Achievements junction table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- User Favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  verse_id UUID REFERENCES public.verses(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, verse_id)
);

-- User Settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  notification_enabled BOOLEAN DEFAULT TRUE,
  daily_reminder_time TIME DEFAULT '07:00',
  weekend_notifications BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  haptic_enabled BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Chapters policies (public read access)
CREATE POLICY "Anyone can view chapters" ON public.chapters
  FOR SELECT USING (true);

-- Verses policies (public read access)
CREATE POLICY "Anyone can view verses" ON public.verses
  FOR SELECT USING (true);

-- AI Explanations policies (public read access)
CREATE POLICY "Anyone can view ai_explanations" ON public.ai_explanations
  FOR SELECT USING (true);

-- User Progress policies
CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Daily Streaks policies
CREATE POLICY "Users can view own streaks" ON public.daily_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON public.daily_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily Verses policies (public read access)
CREATE POLICY "Anyone can view daily verses" ON public.daily_verses
  FOR SELECT USING (true);

-- Achievements policies (public read access)
CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT USING (true);

-- User Achievements policies
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Favorites policies
CREATE POLICY "Users can view own favorites" ON public.user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON public.user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON public.user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- User Settings policies
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions and Triggers

-- Function to update user's last_read_date and streak
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's last_read_date and streak
  UPDATE public.users 
  SET 
    last_read_date = NEW.completed_at::date,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user streak when progress is inserted
CREATE TRIGGER trigger_update_user_streak
  AFTER INSERT ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );
  
  -- Create default user settings
  INSERT INTO public.user_settings (user_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sample data insertion

-- Insert sample chapters
INSERT INTO public.chapters (id, chapter_number, title_sanskrit, title_english, description, verse_count, theme) VALUES
(1, 1, 'अर्जुन विषाद योग', 'Arjuna Vishada Yoga', 'The Yoga of Arjuna''s Dejection', 47, 'The Yoga of Arjuna''s Dejection'),
(2, 2, 'सांख्य योग', 'Sankhya Yoga', 'Transcendental Knowledge', 72, 'Transcendental Knowledge'),
(3, 3, 'कर्म योग', 'Karma Yoga', 'The Eternal Duties of Human Beings', 43, 'The Eternal Duties of Human Beings'),
(4, 4, 'ज्ञान कर्म संन्यास योग', 'Jnana Karma Sanyasa Yoga', 'The Yoga of Knowledge and the Disciplines of Action', 42, 'The Yoga of Knowledge and the Disciplines of Action'),
(5, 5, 'कर्म संन्यास योग', 'Karma Sanyasa Yoga', 'Action in Krishna Consciousness', 29, 'Action in Krishna Consciousness')
ON CONFLICT (id) DO NOTHING;

-- Insert sample verses
INSERT INTO public.verses (id, chapter_id, verse_number, sanskrit_text, english_translation, keywords, difficulty_level, explanation) VALUES
('1-1', 1, 1, 'धृतराष्ट्र उवाच | धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः | मामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय ||१||', 'Dhritarashtra said: O Sanjaya, what did my sons and the sons of Pandu do when they had assembled together, eager for battle, on the holy plain of Kurukshetra?', ARRAY['opening', 'battlefield', 'dharma'], 'beginner', 'The opening verse of the Bhagavad Gita introduces us to the battlefield of Kurukshetra, a sacred place where dharma (righteousness) was to be tested. Dhritarashtra, the blind king, represents ignorance and attachment, while his question to Sanjaya represents the human mind seeking understanding.'),
('2-47', 2, 47, 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥', 'You have the right to work only, but never to its fruits. Let not the fruits of action be your motive, nor let your attachment be to inaction.', ARRAY['karma', 'detachment', 'duty', 'selfless action'], 'beginner', 'This verse teaches us the principle of Karma Yoga - the yoga of selfless action. It reminds us to focus on our duties and responsibilities without being attached to the results. When we perform our actions with dedication but without expecting specific outcomes, we find inner peace and spiritual growth.')
ON CONFLICT (id) DO NOTHING;

-- Insert sample achievements
INSERT INTO public.achievements (id, name, description, icon_name, requirement_type, requirement_value, reward_type) VALUES
('first-verse', 'First Steps', 'Complete your first verse', 'footsteps', 'total_verses', 1, 'badge'),
('week-warrior', 'Week Warrior', 'Maintain a 7-day streak', 'flame', 'streak', 7, 'badge'),
('chapter-explorer', 'Chapter Explorer', 'Complete 5 chapters', 'book', 'chapters_completed', 5, 'badge'),
('sanskrit-scholar', 'Sanskrit Scholar', 'Read 50 verses with Sanskrit', 'school', 'total_verses', 50, 'badge')
ON CONFLICT (id) DO NOTHING;

-- Insert sample daily verse for today
INSERT INTO public.daily_verses (date, verse_id) VALUES
(CURRENT_DATE, '2-47')
ON CONFLICT (date) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_verse_id ON public.user_progress(verse_id);
CREATE INDEX IF NOT EXISTS idx_verses_chapter_id ON public.verses(chapter_id);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_user_date ON public.daily_streaks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_explanations_verse_id ON public.ai_explanations(verse_id); 