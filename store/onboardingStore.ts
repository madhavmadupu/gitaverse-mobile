import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingState, OnboardingForm } from '../types';

interface OnboardingStore extends OnboardingState {
  // Actions
  setCompleted: (completed: boolean) => void;
  setCurrentStep: (step: number) => void;
  updateFormData: (data: Partial<OnboardingForm>) => void;
  setLoading: (loading: boolean) => void;
  resetOnboarding: () => void;
}

const initialState: OnboardingState = {
  isCompleted: false,
  currentStep: 0,
  formData: {},
  isLoading: false,
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Actions
      setCompleted: (isCompleted) => set({ isCompleted }),

      setCurrentStep: (currentStep) => set({ currentStep }),

      updateFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),

      setLoading: (isLoading) => set({ isLoading }),

      resetOnboarding: () => set(initialState),
    }),
    {
      name: 'onboarding-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 