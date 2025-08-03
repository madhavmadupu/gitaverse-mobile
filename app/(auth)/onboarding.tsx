import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../../utils/notifications';
import { hapticsService } from '../../utils/haptics';
import { useOnboardingStore } from '../../store/onboardingStore';

const spiritualLevels = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'New to spiritual study',
    icon: 'leaf',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Some experience with spiritual texts',
    icon: 'flower',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Experienced spiritual practitioner',
    icon: 'star',
  },
];

const notificationTimes = [
  { id: '06:00', label: '6:00 AM' },
  { id: '07:00', label: '7:00 AM' },
  { id: '08:00', label: '8:00 AM' },
  { id: '18:00', label: '6:00 PM' },
  { id: '19:00', label: '7:00 PM' },
  { id: '20:00', label: '8:00 PM' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedTime, setSelectedTime] = useState('07:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { hasCompletedOnboarding, setOnboardingCompleted, isLoading } = useOnboardingStore();

  // Check if user has already completed onboarding
  useEffect(() => {
    if (hasCompletedOnboarding) {
      console.log('User has already completed onboarding, redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [hasCompletedOnboarding, router]);

  const steps = [
    {
      title: 'What\'s your spiritual level?',
      subtitle: 'This helps us personalize your experience',
    },
    {
      title: 'When would you like to learn?',
      subtitle: 'Choose your preferred time for daily verses',
    },
    {
      title: 'You\'re all set!',
      subtitle: 'Let\'s start your spiritual journey',
    },
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      await hapticsService.selection();
    } else {
      // Complete onboarding
      try {
        await hapticsService.success();

        console.log('Completing onboarding with:', {
          spiritual_level: selectedLevel,
          daily_reminder_time: selectedTime,
          notification_enabled: notificationsEnabled
        });

        // Use the Zustand store to complete onboarding
        await setOnboardingCompleted({
          spiritualLevel: selectedLevel,
          dailyReminderTime: selectedTime,
          notificationsEnabled: notificationsEnabled,
        });

        // Setup notifications if enabled
        if (notificationsEnabled) {
          await notificationService.initialize();
          await notificationService.scheduleDailyReminder({
            enabled: notificationsEnabled,
            time: selectedTime,
            weekendNotifications: true,
            soundEnabled: true,
          });
        }

        console.log('Onboarding completed successfully, navigating to tabs');

        // Navigate to main app
        router.replace('/(tabs)');
      } catch (error: any) {
        console.error('Error saving onboarding data:', error);
        await hapticsService.errorAction();

        // Show user-friendly error message
        if (error.code === '23505') {
          Alert.alert(
            'Setup Complete',
            'Your profile has already been set up. You can modify these settings later in the app.',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
          );
        } else {
          Alert.alert(
            'Setup Error',
            'There was an issue saving your preferences. You can try again later in the settings.',
            [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
          );
        }
      }
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const renderStep1 = () => (
    <View className="flex-1">
      <View className="flex-1 justify-center">
        {spiritualLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            className={`p-6 rounded-xl mb-4 border-2 ${selectedLevel === level.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 bg-white'
              }`}
            onPress={async () => {
              setSelectedLevel(level.id);
              await hapticsService.selection();
            }}
          >
            <View className="flex-row items-center">
              <View className={`w-12 h-12 rounded-full justify-center items-center mr-4 ${selectedLevel === level.id ? 'bg-orange-500' : 'bg-gray-100'
                }`}>
                <Ionicons
                  name={level.icon as any}
                  size={24}
                  color={selectedLevel === level.id ? 'white' : '#6B7280'}
                />
              </View>
              <View className="flex-1">
                <Text className={`text-lg font-semibold ${selectedLevel === level.id ? 'text-orange-600' : 'text-gray-900'
                  }`}>
                  {level.title}
                </Text>
                <Text className="text-gray-600">{level.description}</Text>
              </View>
              {selectedLevel === level.id && (
                <Ionicons name="checkmark-circle" size={24} color="#F97316" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View className="flex-1">
      <View className="flex-1 justify-center">
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Daily Reminder Time
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {notificationTimes.map((time) => (
              <TouchableOpacity
                key={time.id}
                className={`w-[48%] p-4 rounded-xl mb-3 border-2 ${selectedTime === time.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white'
                  }`}
                onPress={async () => {
                  setSelectedTime(time.id);
                  await hapticsService.selection();
                }}
              >
                <Text className={`text-center font-semibold ${selectedTime === time.id ? 'text-orange-600' : 'text-gray-900'
                  }`}>
                  {time.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="bg-gray-50 rounded-xl p-6">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Notifications
          </Text>
          <Text className="text-gray-600 mb-4">
            Get daily reminders to read your verse
          </Text>
          <TouchableOpacity
            className={`w-12 h-8 rounded-full flex-row items-center ${notificationsEnabled ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            onPress={async () => {
              setNotificationsEnabled(!notificationsEnabled);
              await hapticsService.buttonPress();
            }}
          >
            <View className={`w-6 h-6 rounded-full bg-white ml-1 ${notificationsEnabled ? 'ml-5' : 'ml-1'
              }`} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View className="flex-1 justify-center items-center">
      <View className="w-24 h-24 bg-orange-100 rounded-full justify-center items-center mb-8">
        <Ionicons name="checkmark" size={48} color="#F97316" />
      </View>
      <Text className="text-2xl font-bold text-gray-900 text-center mb-4">
        Welcome to Gitaverse!
      </Text>
      <Text className="text-gray-600 text-center leading-6 px-8">
        Your spiritual journey begins now. You'll receive daily verses tailored to your level,
        helping you grow and find inner peace.
      </Text>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  // Show loading while checking onboarding status
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-gray-600">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="px-8 pt-8 pb-6">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : handleSkip()}
            className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          <View className="flex-row">
            {steps.map((_, index) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full mx-1 ${index <= currentStep ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleSkip}
            className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center"
          >
            <Text className="text-gray-600 font-medium">Skip</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-2xl font-bold text-gray-900 mb-2">
          {steps[currentStep].title}
        </Text>
        <Text className="text-gray-600">
          {steps[currentStep].subtitle}
        </Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {/* Footer */}
      <View className="px-8 pb-8">
        <TouchableOpacity
          className={`rounded-xl py-4 ${(currentStep === 0 && !selectedLevel) ||
              (currentStep === 1 && !selectedTime)
              ? 'bg-gray-300'
              : 'bg-orange-500'
            }`}
          onPress={handleNext}
          disabled={(currentStep === 0 && !selectedLevel) || (currentStep === 1 && !selectedTime)}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
} 