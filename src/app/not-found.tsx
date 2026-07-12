import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found — 404 | Ekora Bazaar',
  description: 'The page you are looking for does not exist on Ekora Bazaar.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-serif font-bold text-brand-charcoal mb-4">404</h1>
      <h2 className="text-2xl font-bold text-brand-charcoal mb-2">Page Not Found</h2>
      <p className="text-brand-charcoal/70 max-w-md mb-8">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-brand-orange hover:bg-brand-terracotta text-white rounded-xl font-semibold transition-all shadow-md"
      >
        Return Home
      </Link>
    </main>
  );
}
