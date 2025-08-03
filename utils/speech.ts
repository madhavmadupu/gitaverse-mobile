import * as Speech from 'expo-speech';

export interface SpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  onDone?: () => void;
  onError?: (error: any) => void;
}

class SpeechService {
  private static instance: SpeechService;
  private isPlaying = false;
  private currentText = '';
  private currentOptions: SpeechOptions = {};

  static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService();
    }
    return SpeechService.instance;
  }

  async speak(text: string, options: SpeechOptions = {}): Promise<void> {
    try {
      this.currentText = text;
      this.currentOptions = {
        language: 'en-US',
        pitch: 1.0,
        rate: 1.0,
        onDone: () => {
          this.isPlaying = false;
          options.onDone?.();
        },
        onError: (error) => {
          this.isPlaying = false;
          options.onError?.(error);
        },
        ...options,
      };

      await Speech.speak(text, this.currentOptions);
      this.isPlaying = true;
    } catch (error) {
      console.error('Error speaking text:', error);
      this.isPlaying = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await Speech.stop();
      this.isPlaying = false;
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  async pause(): Promise<void> {
    try {
      await Speech.pause();
      this.isPlaying = false;
    } catch (error) {
      console.error('Error pausing speech:', error);
    }
  }

  async resume(): Promise<void> {
    try {
      await Speech.resume();
      this.isPlaying = true;
    } catch (error) {
      console.error('Error resuming speech:', error);
    }
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentText(): string {
    return this.currentText;
  }

  getCurrentOptions(): SpeechOptions {
    return this.currentOptions;
  }
}

export const speechService = SpeechService.getInstance(); 