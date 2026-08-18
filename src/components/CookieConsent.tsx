"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      // eslint-disable-next-line
      setShowConsent(true);
    }
  }, []);

  const acceptConsent = () => {
    localStorage.setItem("cookieConsent", "true");
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-brand-charcoal text-white p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/10">
      <div className="text-sm text-brand-linen/80 max-w-4xl">
        <p>
          We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies as outlined in our <Link href="/privacy" className="underline hover:text-white">Privacy Policy</Link>.
        </p>
      </div>
      <div className="flex gap-4 shrink-0">
        <button 
          onClick={acceptConsent}
          className="bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold py-2 px-6 rounded-xl text-sm transition-colors"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
