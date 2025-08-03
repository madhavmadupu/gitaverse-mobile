# Supabase Setup Guide for Gitaverse

This guide will help you set up the Supabase database for the Bhagavad Gita Daily Learning App.

## Prerequisites

1. A Supabase account (free tier is sufficient)
2. Access to your Supabase project dashboard

## Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `gitaverse-mobile`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

## Step 3: Update Environment Variables

1. In your project root, create or update `.env.local`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
GITAVERSE_API_BASE_URL=https://gitaverse.vercel.app/api/
```

## Step 4: Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

## Step 5: Verify the Setup

After running the schema, you should see:

### Tables Created:
- ✅ `users` - User profiles and preferences
- ✅ `chapters` - Bhagavad Gita chapters
- ✅ `verses` - Individual verses with translations
- ✅ `ai_explanations` - AI-generated explanations
- ✅ `user_progress` - User reading progress
- ✅ `daily_streaks` - Daily streak tracking
- ✅ `daily_verses` - Daily verse scheduling
- ✅ `achievements` - Achievement definitions
- ✅ `user_achievements` - User achievement tracking
- ✅ `user_favorites` - User favorite verses
- ✅ `user_settings` - User app settings

### Sample Data:
- ✅ 5 sample chapters (Chapters 1-5)
- ✅ 2 sample verses with explanations
- ✅ 4 sample achievements
- ✅ Today's daily verse

### Security:
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Proper policies for user data protection
- ✅ Public read access for content tables
- ✅ User-specific access for personal data

## Step 6: Test the Connection

1. Start your app: `npm start`
2. The app should now connect to Supabase
3. Check the console for any connection errors
4. Test the Today screen - it should fetch the daily verse from Supabase

## Database Schema Overview

### Core Tables

#### `users`
- Extends Supabase auth.users
- Stores user profile, preferences, and progress stats
- Auto-created when user signs up

#### `chapters`
- All 18 chapters of Bhagavad Gita
- Sanskrit and English titles
- Verse counts and themes

#### `verses`
- Individual verses with Sanskrit text and translations
- Keywords for search functionality
- Difficulty levels and explanations

#### `user_progress`
- Tracks which verses user has read
- Time spent, ratings, and personal notes
- Links to favorites system

### Features Supported

#### Daily Learning
- `daily_verses` table schedules content
- `daily_streaks` tracks consecutive days
- Automatic streak calculation

#### Progress Tracking
- Verse completion tracking
- Chapter progress
- Time spent statistics
- Achievement system

#### Personalization
- User settings and preferences
- Favorite verses
- Spiritual level tracking
- Notification preferences

#### Content Management
- AI explanations for different levels
- Multiple language support
- Audio content support
- Search functionality

## Troubleshooting

### Common Issues

#### 1. Connection Errors
```
Error: Invalid API key
```
**Solution**: Check your `.env.local` file and ensure the Supabase URL and key are correct.

#### 2. RLS Policy Errors
```
Error: new row violates row-level security policy
```
**Solution**: Ensure you're authenticated. The app should handle authentication automatically.

#### 3. Missing Tables
```
Error: relation "users" does not exist
```
**Solution**: Run the complete `supabase-schema.sql` file in the SQL editor.

#### 4. Sample Data Not Loading
If the app shows no content:
1. Check the `daily_verses` table has today's date
2. Verify `verses` table has sample data
3. Check console for API errors

### Testing the Setup

1. **Check Tables**: Go to **Table Editor** in Supabase dashboard
2. **Verify Sample Data**: Look for chapters and verses
3. **Test API**: Use the **API** section to test queries
4. **Check Logs**: Monitor **Logs** for any errors

## Next Steps

After successful setup:

1. **Add More Content**: Import full Bhagavad Gita verses
2. **Configure Authentication**: Set up email/password or social auth
3. **Add Push Notifications**: Configure notification settings
4. **Set Up Analytics**: Enable usage tracking
5. **Deploy**: Prepare for app store submission

## Support

If you encounter issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review the app console for error messages
3. Verify your environment variables
4. Test with the Supabase dashboard tools

The database is now ready to support your Bhagavad Gita daily learning app! 🕉️ 