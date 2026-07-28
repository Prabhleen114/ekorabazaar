import OnboardingContainer from "./OnboardingContainer";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function StartSellingPage() {
  return (
    <main className="min-h-screen bg-brand-bg text-brand-charcoal">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 md:pt-28 pb-12 px-6 text-center border-b border-brand-linen bg-brand-bg">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight text-brand-charcoal mb-4">
            Creator Onboarding
          </h1>
          <p className="text-lg md:text-xl text-brand-charcoal/60 leading-relaxed">
            Apply to become a Founding Creator. Your progress is saved automatically.
          </p>
        </div>
      </section>

      {/* Main Onboarding Flow */}
      <OnboardingContainer />
      
      <Footer />
    </main>
  );
}
