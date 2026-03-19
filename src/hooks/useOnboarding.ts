import { useState, useCallback } from 'react';

const STORAGE_KEY = 'onboarding-completed';

export interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
}

export const TOUR_STEPS: TourStep[] = [
  { target: 'sidebar-nav', title: 'onboarding.tour.sidebar', description: 'onboarding.tour.sidebarDesc' },
  { target: 'step-cover', title: 'onboarding.tour.cover', description: 'onboarding.tour.coverDesc' },
  { target: 'step-content', title: 'onboarding.tour.content', description: 'onboarding.tour.contentDesc' },
  { target: 'step-tables', title: 'onboarding.tour.tables', description: 'onboarding.tour.tablesDesc' },
  { target: 'step-preview', title: 'onboarding.tour.preview', description: 'onboarding.tour.previewDesc' },
  { target: 'split-preview-btn', title: 'onboarding.tour.splitPreview', description: 'onboarding.tour.splitPreviewDesc' },
  
  { target: 'language-switcher', title: 'onboarding.tour.language', description: 'onboarding.tour.languageDesc' },
];

export function useOnboarding() {
  const [isFirstVisit] = useState(() => !localStorage.getItem(STORAGE_KEY));
  const [showWelcome, setShowWelcome] = useState(isFirstVisit);
  const [showTour, setShowTour] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowWelcome(false);
  }, []);

  const startTour = useCallback(() => {
    setShowWelcome(false);
    setShowTour(true);
    setCurrentTourStep(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentTourStep < TOUR_STEPS.length - 1) {
      setCurrentTourStep(s => s + 1);
    } else {
      setShowTour(false);
      completeOnboarding();
    }
  }, [currentTourStep, completeOnboarding]);

  const prevStep = useCallback(() => {
    if (currentTourStep > 0) setCurrentTourStep(s => s - 1);
  }, [currentTourStep]);

  const skipTour = useCallback(() => {
    setShowTour(false);
    completeOnboarding();
  }, [completeOnboarding]);

  return {
    showWelcome,
    showTour,
    currentTourStep,
    totalSteps: TOUR_STEPS.length,
    currentStep: TOUR_STEPS[currentTourStep],
    completeOnboarding,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    setShowTour,
  };
}
