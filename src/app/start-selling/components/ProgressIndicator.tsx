"use client";

import { useOnboarding } from "../context/OnboardingContext";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { id: 1, label: "Personal" },
  { id: 2, label: "Business" },
  { id: 3, label: "Address" },
  { id: 4, label: "GST" },
  { id: 5, label: "Bank" },
  { id: 6, label: "Identity" },
  { id: 7, label: "Catalogue" },
  { id: 8, label: "Review" },
  { id: 9, label: "Payment" },
];

export default function ProgressIndicator() {
  const { currentStep } = useOnboarding();

  // Calculate progress percentage based on current step (1-9)
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full bg-white border-b border-brand-linen sticky top-0 z-40 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-brand-charcoal/60 uppercase tracking-wider">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm font-bold text-brand-charcoal">
            {steps.find(s => s.id === currentStep)?.label || "Complete"}
          </span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="w-full h-2 bg-brand-linen rounded-full overflow-hidden relative">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-brand-charcoal rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>

        {/* Desktop Step Dots */}
        <div className="hidden md:flex justify-between items-center mt-3 px-1">
          {steps.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <div key={step.id} className="flex flex-col items-center gap-1">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors duration-300
                  ${isCompleted ? 'bg-brand-charcoal text-white' : isCurrent ? 'border-2 border-brand-charcoal text-brand-charcoal bg-white' : 'bg-brand-linen text-brand-charcoal/40'}
                  `}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : step.id}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
