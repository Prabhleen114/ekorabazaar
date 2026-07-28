"use client";

import { OnboardingProvider, useOnboarding } from "./context/OnboardingContext";
import ProgressIndicator from "./components/ProgressIndicator";
import {
  StepPersonal,
  StepBusiness,
  StepAddress,
  StepGST,
  StepBank,
  StepIdentity,
  StepCatalogue,
  StepReview,
  StepPayment,
  SuccessPage
} from "./components/OnboardingSteps";

function OnboardingContent() {
  const { currentStep } = useOnboarding();

  return (
    <div className="w-full relative">
      {currentStep < 10 && <ProgressIndicator />}
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {currentStep === 1 && <StepPersonal />}
        {currentStep === 2 && <StepBusiness />}
        {currentStep === 3 && <StepAddress />}
        {currentStep === 4 && <StepGST />}
        {currentStep === 5 && <StepBank />}
        {currentStep === 6 && <StepIdentity />}
        {currentStep === 7 && <StepCatalogue />}
        {currentStep === 8 && <StepReview />}
        {currentStep === 9 && <StepPayment />}
        {currentStep === 10 && <SuccessPage />}
      </div>
    </div>
  );
}

export default function OnboardingContainer() {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
}
