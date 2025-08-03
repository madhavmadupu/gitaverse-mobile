import * as Haptics from 'expo-haptics';
import { secureStorage } from './secureStorage';

class HapticsService {
  private static instance: HapticsService;
  private isEnabled = true;

  static getInstance(): HapticsService {
    if (!HapticsService.instance) {
      HapticsService.instance = new HapticsService();
    }
    return HapticsService.instance;
  }

  async initialize(): Promise<void> {
    try {
      const settings = await secureStorage.getUserPreferences();
      this.isEnabled = settings?.hapticEnabled !== false;
    } catch (error) {
      console.error('Error loading haptics settings:', error);
    }
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.isEnabled = enabled;
    try {
      const settings = await secureStorage.getUserPreferences() || {};
      settings.hapticEnabled = enabled;
      await secureStorage.setUserPreferences(settings);
    } catch (error) {
      console.error('Error saving haptics settings:', error);
    }
  }

  async light(): Promise<void> {
    if (!this.isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error triggering light haptic:', error);
    }
  }

  async medium(): Promise<void> {
    if (!this.isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error triggering medium haptic:', error);
    }
  }

  async heavy(): Promise<void> {
    if (!this.isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.error('Error triggering heavy haptic:', error);
    }
  }

  async success(): Promise<void> {
    if (!this.isEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error triggering success haptic:', error);
    }
  }

  async warning(): Promise<void> {
    if (!this.isEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.error('Error triggering warning haptic:', error);
    }
  }

  async error(): Promise<void> {
    if (!this.isEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.error('Error triggering error haptic:', error);
    }
  }

  async selection(): Promise<void> {
    if (!this.isEnabled) return;
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.error('Error triggering selection haptic:', error);
    }
  }

  // Custom haptic patterns for specific actions
  async buttonPress(): Promise<void> {
    await this.light();
  }

  async verseCompletion(): Promise<void> {
    await this.success();
  }

  async streakAchievement(): Promise<void> {
    await this.heavy();
  }

  async errorAction(): Promise<void> {
    await this.error();
  }

  async navigation(): Promise<void> {
    await this.selection();
  }
}

export const hapticsService = HapticsService.getInstance(); 