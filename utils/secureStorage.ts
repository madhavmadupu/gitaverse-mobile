import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME_MODE: 'theme_mode',
  NOTIFICATION_SETTINGS: 'notification_settings',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;

class SecureStorageService {
  // Store a value securely
  async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await SecureStore.setItemAsync(key, jsonValue);
    } catch (error) {
      console.error('Error storing item:', error);
      throw error;
    }
  }

  // Retrieve a value securely
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await SecureStore.getItemAsync(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error retrieving item:', error);
      return null;
    }
  }

  // Remove a value
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing item:', error);
      throw error;
    }
  }

  // Clear all stored data
  async clearAll(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await Promise.all(keys.map(key => this.removeItem(key)));
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  // Auth token methods
  async setAuthToken(token: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async getAuthToken(): Promise<string | null> {
    return this.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
  }

  async removeAuthToken(): Promise<void> {
    return this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // User preferences methods
  async setUserPreferences(preferences: any): Promise<void> {
    return this.setItem(STORAGE_KEYS.USER_PREFERENCES, preferences);
  }

  async getUserPreferences(): Promise<any | null> {
    return this.getItem(STORAGE_KEYS.USER_PREFERENCES);
  }

  // Theme methods
  async setThemeMode(mode: 'light' | 'dark' | 'auto'): Promise<void> {
    return this.setItem(STORAGE_KEYS.THEME_MODE, mode);
  }

  async getThemeMode(): Promise<'light' | 'dark' | 'auto' | null> {
    return this.getItem<'light' | 'dark' | 'auto'>(STORAGE_KEYS.THEME_MODE);
  }

  // Notification settings methods
  async setNotificationSettings(settings: any): Promise<void> {
    return this.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, settings);
  }

  async getNotificationSettings(): Promise<any | null> {
    return this.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
  }

  // Onboarding status methods
  async setOnboardingCompleted(completed: boolean): Promise<void> {
    return this.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
  }

  async getOnboardingCompleted(): Promise<boolean | null> {
    return this.getItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED);
  }
}

export const secureStorage = new SecureStorageService();
export { STORAGE_KEYS }; 