import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { secureStorage } from './secureStorage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  time: string; // Format: "HH:MM"
  weekendNotifications: boolean;
  soundEnabled: boolean;
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return;
      }

      // Get push token (for future use with remote notifications)
      if (Device.isDevice) {
        try {
          const token = await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PROJECT_ID || 'your-expo-project-id',
          });
          console.log('Push token:', token.data);
        } catch (error) {
          console.log('Could not get push token (this is normal for development):', error);
        }
      }

      // Set notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily-verse', {
          name: 'Daily Verse',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  async scheduleDailyReminder(settings: NotificationSettings): Promise<void> {
    if (!settings.enabled) {
      await this.cancelAllNotifications();
      return;
    }

    try {
      // Cancel existing notifications
      await this.cancelAllNotifications();

      // Parse time
      const [hour, minute] = settings.time.split(':').map(Number);

      // Schedule daily notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🕉️ Your Daily Gita Verse',
          body: "Take a moment to reflect on today's spiritual wisdom",
          data: { type: 'daily-verse' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute,
          repeats: true,
        },
      });

      // Save settings
      await secureStorage.setNotificationSettings(settings);

      console.log('Daily reminder scheduled for', settings.time);
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
      throw error;
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      return await secureStorage.getNotificationSettings();
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  }

  async sendTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from Gitaverse',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  async sendVerseCompletionNotification(verseNumber: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✨ Verse Completed!',
          body: `Great job! You've completed verse ${verseNumber}. Keep up the spiritual practice!`,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        },
      });
    } catch (error) {
      console.error('Error sending completion notification:', error);
    }
  }

  async sendStreakNotification(streakCount: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Streak Achievement!',
          body: `Amazing! You've maintained a ${streakCount}-day streak. Your dedication is inspiring!`,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        },
      });
    } catch (error) {
      console.error('Error sending streak notification:', error);
    }
  }

  async scheduleDailyVerseNotification(
    date: Date,
    options: {
      title: string;
      body: string;
      data?: any;
    }
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          data: options.data || {},
        },
        trigger: {
          date,
          channelId: 'daily-verse',
        },
      });

      console.log('Daily verse notification scheduled for', date);
    } catch (error) {
      console.error('Error scheduling daily verse notification:', error);
      throw error;
    }
  }

  async cancelDailyVerseNotifications(): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const dailyVerseNotifications = scheduledNotifications.filter(
        (notification) => notification.content.data?.screen === 'today'
      );

      for (const notification of dailyVerseNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      console.log('Daily verse notifications cancelled');
    } catch (error) {
      console.error('Error cancelling daily verse notifications:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance();
