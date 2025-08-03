# Gitaverse - Bhagavad Gita Daily Learning App

A modern mobile app for daily spiritual learning through the timeless wisdom of the Bhagavad Gita.

## Features

### Core Features
- **Daily Verse Learning**: Get one meaningful verse daily with AI-powered explanations
- **Progress Tracking**: Monitor your spiritual journey with streaks and achievements
- **Verse Library**: Browse all 18 chapters with search and filtering
- **User Profile**: Manage settings, preferences, and account information
- **Floating Bottom Navigation**: Modern, accessible navigation design

### Technical Features
- **Offline Support**: Cache last 7 days of verses for offline reading
- **State Management**: Zustand for efficient global state management
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Optimized for all screen sizes
- **Accessibility**: WCAG 2.1 AA compliant

## Tech Stack

- **Framework**: Expo React Native 50+
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Language**: TypeScript

## Project Structure

```
gitaverse-mobile/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── index.tsx            # Today's verse screen
│   │   ├── library.tsx          # Chapter library screen
│   │   ├── progress.tsx         # Progress tracking screen
│   │   ├── profile.tsx          # User profile & settings
│   │   └── _layout.tsx          # Tab navigation layout
│   ├── _layout.tsx              # Root layout
│   └── modal.tsx                # Modal screens
├── components/                   # Reusable components
│   ├── VerseCard.tsx            # Verse display component
│   ├── LoadingSpinner.tsx       # Loading indicator
│   └── ...                      # Other components
├── store/                       # State management
│   └── verseStore.ts            # Zustand store for app state
├── utils/                       # Utilities and services
│   ├── api.ts                   # API service
│   └── supabase.ts              # Supabase client
├── assets/                      # Static assets
└── documents/                   # Project documentation
    └── PRD.md                   # Product Requirements Document
```

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gitaverse-mobile
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GITAVERSE_API_BASE_URL=https://gitaverse.vercel.app/api/
```

4. Start the development server:
```bash
npm start
```

5. Run on your preferred platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Key Components

### VerseCard Component
A reusable component for displaying verses with:
- Sanskrit text with beautiful typography
- English translation
- Audio playback functionality
- Action buttons (mark as read, favorite, share)
- Progress indicators

### Zustand Store
Centralized state management with:
- User progress tracking
- Verse data management
- Settings persistence
- Offline data caching

### API Service
RESTful API integration with:
- Verse fetching
- Progress synchronization
- User settings management
- Search functionality

## Navigation Structure

The app uses a floating bottom tab navigation with four main screens:

1. **Today** - Daily verse with AI explanation
2. **Library** - Browse chapters and search verses
3. **Progress** - Track learning progress and achievements
4. **Profile** - User settings and account management

## State Management

The app uses Zustand for state management with the following stores:

- **Verse Store**: Manages today's verse, user progress, and settings
- **Persistent Storage**: Automatically saves user progress and settings
- **Offline Support**: Caches data for offline access

## Styling

The app uses NativeWind (Tailwind CSS for React Native) with:
- Consistent color palette (saffron/orange theme)
- Responsive design patterns
- Accessibility-compliant components
- Dark mode support (planned)

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use functional components with hooks
- Implement proper error handling

### Component Structure
- Keep components small and focused
- Use proper TypeScript interfaces
- Implement proper prop validation
- Add loading and error states

### State Management
- Use Zustand for global state
- Keep local state in components when appropriate
- Implement proper data persistence
- Handle offline scenarios gracefully

## Testing

### Manual Testing Checklist
- [ ] Daily verse loads correctly
- [ ] Progress tracking works
- [ ] Settings persist across app restarts
- [ ] Offline functionality works
- [ ] Navigation flows properly
- [ ] Audio playback functions
- [ ] Search and filtering work

### Automated Testing (Planned)
- Unit tests for components
- Integration tests for API calls
- E2E tests for critical user flows

## Deployment

### Development Build
```bash
npm run build:dev
```

### Production Build
```bash
npm run build:prod
```

### App Store Deployment
1. Configure EAS Build
2. Submit to App Store Connect
3. Configure TestFlight for beta testing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/documents`
- Review the PRD for feature specifications

## Roadmap

### Phase 1 - MVP (Current)
- [x] Basic navigation structure
- [x] Daily verse display
- [x] Progress tracking
- [x] User settings
- [x] Floating bottom navigation

### Phase 2 - Enhanced Features
- [ ] Audio commentaries
- [ ] Advanced search
- [ ] Social sharing
- [ ] Achievement system
- [ ] Premium features

### Phase 3 - Advanced Features
- [ ] AI chat advisor
- [ ] Multi-language support
- [ ] Offline audio downloads
- [ ] Community features
- [ ] Advanced analytics 