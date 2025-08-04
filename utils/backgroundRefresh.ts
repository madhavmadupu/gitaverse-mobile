import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';

interface BackgroundRefreshConfig {
  enabled: boolean;
  interval: number; // in milliseconds
  lastRefresh: number;
  refreshOnAppForeground: boolean;
}

class BackgroundRefreshService {
  private config: BackgroundRefreshConfig = {
    enabled: true,
    interval: 6 * 60 * 60 * 1000, // 6 hours
    lastRefresh: 0,
    refreshOnAppForeground: true,
  };

  private refreshCallbacks: Array<() => Promise<void>> = [];
  private isRefreshing = false;

  constructor() {
    this.loadConfig();
    this.setupAppStateListener();
  }

  private async loadConfig() {
    try {
      const configData = await AsyncStorage.getItem('background-refresh-config');
      if (configData) {
        this.config = { ...this.config, ...JSON.parse(configData) };
      }
    } catch (error) {
      console.error('Error loading background refresh config:', error);
    }
  }

  private async saveConfig() {
    try {
      await AsyncStorage.setItem('background-refresh-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving background refresh config:', error);
    }
  }

  private setupAppStateListener() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && this.config.refreshOnAppForeground) {
      await this.checkAndRefresh();
    }
  };

  // Register a refresh callback
  registerRefreshCallback(callback: () => Promise<void>) {
    this.refreshCallbacks.push(callback);
  }

  // Unregister a refresh callback
  unregisterRefreshCallback(callback: () => Promise<void>) {
    const index = this.refreshCallbacks.indexOf(callback);
    if (index > -1) {
      this.refreshCallbacks.splice(index, 1);
    }
  }

  // Check if refresh is needed and perform it
  async checkAndRefresh() {
    if (!this.config.enabled || this.isRefreshing) {
      return;
    }

    const now = Date.now();
    const timeSinceLastRefresh = now - this.config.lastRefresh;

    if (timeSinceLastRefresh >= this.config.interval) {
      await this.performRefresh();
    }
  }

  // Perform the actual refresh
  private async performRefresh() {
    if (this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;
    console.log('Starting background refresh...');

    try {
      // Execute all registered refresh callbacks
      const refreshPromises = this.refreshCallbacks.map(callback => 
        callback().catch(error => {
          console.error('Error in refresh callback:', error);
        })
      );

      await Promise.allSettled(refreshPromises);

      // Update last refresh time
      this.config.lastRefresh = Date.now();
      await this.saveConfig();

      console.log('Background refresh completed successfully');
    } catch (error) {
      console.error('Error during background refresh:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  // Force refresh regardless of timing
  async forceRefresh() {
    await this.performRefresh();
  }

  // Update configuration
  async updateConfig(updates: Partial<BackgroundRefreshConfig>) {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
  }

  // Get current configuration
  getConfig(): BackgroundRefreshConfig {
    return { ...this.config };
  }

  // Enable/disable background refresh
  async setEnabled(enabled: boolean) {
    await this.updateConfig({ enabled });
  }

  // Set refresh interval
  async setInterval(interval: number) {
    await this.updateConfig({ interval });
  }

  // Set whether to refresh on app foreground
  async setRefreshOnAppForeground(enabled: boolean) {
    await this.updateConfig({ refreshOnAppForeground: enabled });
  }

  // Cleanup
  cleanup() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }
}

// Create singleton instance
export const backgroundRefreshService = new BackgroundRefreshService();

// Cleanup on app unmount (React Native specific)
// Note: React Native doesn't have process.on, so we'll handle cleanup differently
// The service will be cleaned up when the app is destroyed naturally 