"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type OnboardingData = {
  // Step 1: Personal
  fullName: string;
  email: string;
  mobile: string;
  whatsapp: string;

  // Step 2: Business
  brandName: string;
  instagram: string;
  category: string;
  description: string;
  website: string;
  yearsInBusiness: string;
  monthlyOrders: string;

  // Step 3: Address
  address: string;
  landmark: string;
  city: string;
  state: string;
  pinCode: string;

  // Step 4: GST
  hasGST: "yes" | "no" | "";
  gstNumber: string;
  gstCertificateUrl: string; // From Firebase

  // Step 5: Bank
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  upiId: string;

  // Step 6: Identity
  panCardUrl: string;
  aadhaarCardUrl: string;
  businessLogoUrl: string;
  profilePhotoUrl: string;

  // Step 7: Catalogue
  catalogueUrl: string;
  driveLink: string;
  dropboxLink: string;
  otherLink: string;
};

const defaultData: OnboardingData = {
  fullName: "",
  email: "",
  mobile: "",
  whatsapp: "",
  brandName: "",
  instagram: "",
  category: "",
  description: "",
  website: "",
  yearsInBusiness: "",
  monthlyOrders: "",
  address: "",
  landmark: "",
  city: "",
  state: "",
  pinCode: "",
  hasGST: "",
  gstNumber: "",
  gstCertificateUrl: "",
  accountHolder: "",
  bankName: "",
  accountNumber: "",
  confirmAccountNumber: "",
  ifscCode: "",
  upiId: "",
  panCardUrl: "",
  aadhaarCardUrl: "",
  businessLogoUrl: "",
  profilePhotoUrl: "",
  catalogueUrl: "",
  driveLink: "",
  dropboxLink: "",
  otherLink: "",
};

type OnboardingContextType = {
  data: OnboardingData;
  updateData: (fields: Partial<OnboardingData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  resetOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("ekoraOnboardingData");
    const savedStep = localStorage.getItem("ekoraOnboardingStep");
    
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to parse onboarding data from localStorage");
      }
    }
    
    if (savedStep) {
      setCurrentStep(parseInt(savedStep, 10));
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when data or step changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("ekoraOnboardingData", JSON.stringify(data));
      localStorage.setItem("ekoraOnboardingStep", currentStep.toString());
    }
  }, [data, currentStep, isLoaded]);

  const updateData = (fields: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  };

  const resetOnboarding = () => {
    setData(defaultData);
    setCurrentStep(1);
    localStorage.removeItem("ekoraOnboardingData");
    localStorage.removeItem("ekoraOnboardingStep");
  };

  if (!isLoaded) return null; // Prevent hydration mismatch

  return (
    <OnboardingContext.Provider value={{ data, updateData, currentStep, setCurrentStep, resetOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
