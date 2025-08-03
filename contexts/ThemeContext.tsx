import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { secureStorage } from '../utils/secureStorage';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load saved theme mode on app start
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedThemeMode = await secureStorage.getThemeMode();
        if (savedThemeMode) {
          setThemeModeState(savedThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
      }
    };

    loadThemeMode();
  }, []);

  // Update theme based on theme mode and system preference
  useEffect(() => {
    let newTheme: 'light' | 'dark' = 'light';

    if (themeMode === 'auto') {
      newTheme = systemColorScheme || 'light';
    } else {
      newTheme = themeMode;
    }

    setTheme(newTheme);
  }, [themeMode, systemColorScheme]);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await secureStorage.setThemeMode(mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const toggleTheme = async () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    await setThemeMode(newMode);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
    isDark: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 