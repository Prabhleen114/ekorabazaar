"use client";

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-5xl font-serif font-bold text-brand-charcoal mb-4">500</h1>
      <h2 className="text-2xl font-bold text-brand-charcoal mb-2">Something went wrong</h2>
      <p className="text-brand-charcoal/70 max-w-md mb-8">
        We encountered an unexpected error. Please try again or return home.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-brand-charcoal hover:bg-black text-white rounded-xl font-semibold transition-all shadow-md"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-brand-orange hover:bg-brand-terracotta text-white rounded-xl font-semibold transition-all shadow-md"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
