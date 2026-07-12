"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, ShieldCheck, Sparkles, Send, Loader2 } from "lucide-react";

export default function WhyEkoraPage() {
  const [email, setEmail] = useState("");
  const [isCreator, setIsCreator] = useState(true);
  const [isWholesale, setIsWholesale] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          isCreator,
          isWholesale,
          source: "why-ekora-page",
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSuccess(true);
    } catch {
      alert("Something went wrong. Please try again or message us on WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-brand-bg text-brand-charcoal">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 md:pt-28 pb-16 px-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 border border-brand-linen bg-white rounded-full px-3 py-1 text-xs font-semibold text-brand-charcoal/70 mb-8 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-brand-sage animate-pulse" />
          Early Access — First 100 Founding Creators
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif tracking-tight text-brand-charcoal mb-6 leading-tight">
          Why We Build Ekora Bazaar
        </h1>
        <p className="text-xl text-brand-charcoal/60 leading-relaxed max-w-2xl mx-auto mb-8">
          Our mission is to replace broken Instagram DM commerce with the professional, secure infrastructure that independent creators deserve.
        </p>
        <button
          onClick={() => scrollToSection("join-cohort")}
          className="bg-brand-orange hover:bg-brand-terracotta text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-all shadow-md shadow-brand-orange/15 hover:scale-[1.02] active:scale-[0.98]"
        >
          Join the Founding Cohort
        </button>
      </section>

      {/* Narrative Value Cards */}
      <section className="py-20 border-t border-brand-linen bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <span className="text-xs font-semibold tracking-widest uppercase text-brand-charcoal/50 mb-10 block text-center">
            The Blueprint
          </span>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Problem Card */}
            <div className="bg-brand-bg/40 border border-brand-linen rounded-3xl p-8 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-brand-linen/80">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 mb-4 block">01 / The Friction</span>
                <h3 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">Commerce on Instagram is broken.</h3>
                <p className="text-brand-charcoal/70 leading-relaxed text-sm">
                  Creators spend hours managing orders across disjointed DM threads, negotiating prices, and manually verifying UPI transfers. Buyers face friction, zero order tracking, and a massive trust deficit.
                </p>
              </div>
            </div>

            {/* Approach Card */}
            <div className="bg-brand-bg/40 border border-brand-linen rounded-3xl p-8 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-brand-linen/80">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-sage mb-4 block">02 / The Engine</span>
                <h3 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">Professional tools. One checkout.</h3>
                <p className="text-brand-charcoal/70 leading-relaxed text-sm">
                  We give creators elegant, standalone storefronts. We aggregate these into a unified marketplace where buyers can purchase from multiple independent creators in a single secure checkout with split escrow payouts.
                </p>
              </div>
            </div>

            {/* Why Now Card */}
            <div className="bg-brand-bg/40 border border-brand-linen rounded-3xl p-8 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-brand-linen/80">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-orange mb-4 block">03 / The Shift</span>
                <h3 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">Artisans are scaling up.</h3>
                <p className="text-brand-charcoal/70 leading-relaxed text-sm">
                  India is seeing a massive wave of independent creators building highly loyal audiences. However, their commerce tools are stuck in the last decade. It&apos;s time for infrastructure that matches their scale.
                </p>
              </div>
            </div>

            {/* Vision Card */}
            <div className="bg-brand-bg/40 border border-brand-linen rounded-3xl p-8 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-brand-linen/80">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/50 mb-4 block">04 / The Horizon</span>
                <h3 className="text-2xl font-bold font-serif text-brand-charcoal mb-4">Empowering a million makers.</h3>
                <p className="text-brand-charcoal/70 leading-relaxed text-sm">
                  By automating order logs, shipping manifests, and payment escrows, we reclaim administrative hours for art, enabling creators to build sustainable livelihoods across India.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Story Block */}
      <section className="py-20 border-t border-brand-linen bg-brand-bg/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-xs font-semibold tracking-widest uppercase text-brand-charcoal/50 mb-6 block">
            Behind the Mission
          </span>
          <blockquote className="text-2xl md:text-3xl font-serif italic text-brand-charcoal mb-10 leading-snug max-w-3xl mx-auto">
            &quot;We are building the commerce infrastructure that bridges the gap between social media discovery and real business, so creators can regain time for their craft.&quot;
          </blockquote>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6 max-w-2xl mx-auto">
            <div className="bg-white border border-brand-linen p-6 rounded-2xl flex-1 text-left shadow-sm">
              <h4 className="text-lg font-bold text-brand-charcoal">Prabhleen Kaur</h4>
              <p className="text-xs text-brand-charcoal/40 font-semibold mb-2">CO-FOUNDER</p>
              <p className="text-sm text-brand-charcoal/60 leading-relaxed">
                Empowering makers with clean tech and automated workflows to turn side-projects into professional brands.
              </p>
            </div>

            <div className="bg-white border border-brand-linen p-6 rounded-2xl flex-1 text-left shadow-sm">
              <h4 className="text-lg font-bold text-brand-charcoal">Kumar Aryan</h4>
              <p className="text-xs text-brand-charcoal/40 font-semibold mb-2">CO-FOUNDER</p>
              <p className="text-sm text-brand-charcoal/60 leading-relaxed">
                Building the secure checkout split escrows and logistics manifest automations that creators need to scale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Signup Form Section */}
      <section className="py-16 md:py-20 border-t border-brand-linen bg-white" id="join-cohort">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="text-left space-y-6">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-brand-orange/20 text-brand-orange rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Pre-Launch Cohort Active
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-brand-charcoal leading-tight">
              Secure Your Onboarding Credentials.
            </h2>
            <p className="text-brand-charcoal/60 text-base leading-relaxed">
              Reserve your founding key to join the first cohort of 100 creators on Ekora Bazaar. Lock in direct support, search priority, and our lifetime onboarding fee of ₹199.
            </p>
            <ul className="space-y-3 text-sm font-medium text-brand-charcoal/70">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Permanent Founding Creator Badge
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> First Priority Search Indexing
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Lifetime Onboarding Price Lock (₹199)
              </li>
            </ul>
          </div>

          <div className="bg-brand-bg/50 border border-brand-linen rounded-3xl p-8 shadow-lg">
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-charcoal/60 block">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="w-full bg-white border border-brand-linen rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-colors"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-brand-charcoal/60 block uppercase tracking-wider">I am registering as a:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Creator Card */}
                    <div 
                      onClick={() => setIsCreator(!isCreator)}
                      className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                        isCreator 
                          ? "border-brand-orange bg-brand-orange/5 text-brand-charcoal" 
                          : "border-brand-linen bg-white text-brand-charcoal/60 hover:border-brand-linen/80"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                        isCreator ? "bg-brand-orange border-brand-orange text-white" : "border-brand-linen bg-white"
                      }`}>
                        {isCreator && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-sm block">Supplier / Maker</span>
                        <span className="text-[10px] text-brand-charcoal/50">I sell raw inputs</span>
                      </div>
                    </div>

                    {/* Wholesale Buyer Card */}
                    <div 
                      onClick={() => setIsWholesale(!isWholesale)}
                      className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                        isWholesale 
                          ? "border-brand-orange bg-brand-orange/5 text-brand-charcoal" 
                          : "border-brand-linen bg-white text-brand-charcoal/60 hover:border-brand-linen/80"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                        isWholesale ? "bg-brand-orange border-brand-orange text-white" : "border-brand-linen bg-white"
                      }`}>
                        {isWholesale && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-sm block">Small Business</span>
                        <span className="text-[10px] text-brand-charcoal/50">I buy raw materials</span>
                      </div>
                    </div>

                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-orange hover:bg-brand-terracotta text-white py-3.5 rounded-xl font-semibold transition-all shadow-md shadow-brand-orange/15 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Secure My Storefront Key <Send className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-xs text-brand-charcoal/40 font-medium pt-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Onboarding lock at ₹199. No recurring fees.</span>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-brand-charcoal mb-2 font-serif">Credential Reserved!</h3>
                <p className="text-sm text-brand-charcoal/60 leading-relaxed mb-1">
                  We have saved your request for <strong>{email}</strong>.
                </p>
                <p className="text-xs text-brand-charcoal/40">
                  Our team will coordinate via WhatsApp/email for early setup.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
