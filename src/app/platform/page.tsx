"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, ShieldCheck, Sparkles, Loader2 } from "lucide-react";

const personaCards = [
  {
    title: "Quality Buyer",
    label: "Verification priority",
    points: [
      "COA download credentials on raw batches",
      "Batch certification documentation",
      "Order mini trial samples first",
    ],
  },
  {
    title: "Craft Brand",
    label: "Aesthetic Sourcing",
    points: [
      "Custom sourcing catalog discovery",
      "Direct chat logs with raw material makers",
      "Low volume test runs for new launches",
    ],
  },
  {
    title: "Supplier Hub",
    label: "B2B volume scale",
    points: [
      "Dynamic volume price breaks",
      "Automated freight & package estimation",
      "Direct secure escrow settlements",
    ],
  },
];

export default function PlatformsPage() {
  const [selectedPersona, setSelectedPersona] = useState(personaCards[0].title);
  const activePersona = personaCards.find(
    (card) => card.title === selectedPersona
  ) ?? personaCards[0];

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
          source: "platform-page",
        }),
      });
      if (res.ok) setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-bg text-brand-charcoal">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6 text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">
            Platform Blueprint
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif leading-tight">
            Interactive sourcing for craft brands.
          </h1>
          <p className="text-lg text-brand-charcoal/60 leading-relaxed">
            Verify batches via instant COA logs, preview materials with custom sample packs, and unlock wholesale terms directly on Ekora Bazaar.
          </p>
        </div>

        <div className="bg-white border border-brand-linen rounded-3xl p-8 shadow-xl shadow-brand-charcoal/5 text-left">
          <span className="inline-flex bg-brand-orange/10 text-brand-orange font-bold text-xs rounded-full px-3 py-1 mb-4">
            Verify Raw Materials
          </span>
          <h2 className="text-2xl font-serif font-bold text-brand-charcoal mb-4">Sample Kits &amp; Certified Batches</h2>
          <p className="text-sm text-brand-charcoal/60 mb-6">
            Help small businesses bypass supply-chain friction. Setup verified ingredient storefronts.
          </p>
          <div className="space-y-3">
            {["Certified Batch Reports", "Chemical/COA Documentation", "Tactile Sample Trial Orders"].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm font-semibold">
                <div className="w-2 h-2 rounded-full bg-brand-sage" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Buyer Paths (Personas) */}
      <section className="py-20 border-t border-brand-linen bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">Buyer Paths</span>
            <h2 className="text-3xl md:text-4xl font-bold font-serif mt-2">Let creators choose their entry point</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {personaCards.map((card) => (
              <div 
                key={card.title} 
                onClick={() => setSelectedPersona(card.title)}
                className={`border rounded-3xl p-8 cursor-pointer transition-all duration-200 text-left ${
                  selectedPersona === card.title 
                    ? "border-brand-orange bg-brand-orange/5 shadow-md shadow-brand-orange/5" 
                    : "border-brand-linen bg-brand-bg/20 hover:border-brand-linen/80"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/55 block mb-2">{card.label}</span>
                <h3 className="text-xl font-bold text-brand-charcoal mb-4 font-serif">{card.title}</h3>
                <ul className="space-y-3 text-sm text-brand-charcoal/70">
                  {card.points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-2 flex-shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-white border-t border-brand-linen">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50 mb-4 block">
            Designed for Trust
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-serif mb-12">
            Verify batches. Secure wholesale terms.
          </h2>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { title: "Direct Trial Kits", desc: "Low commitment entry points that build artisan trust in your supplies." },
              { title: "Transparent Batching", desc: "COAs, origins, and ingredient metrics sit alongside every SKU page." },
              { title: "B2B Accounts", desc: "Unlock business-level pricing, freight terms, and forecast contracts." }
            ].map((feature, i) => (
              <div key={i} className="border border-brand-linen p-8 rounded-3xl bg-brand-bg/40">
                <div className="w-12 h-12 rounded-2xl bg-brand-linen flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6 text-brand-sage" />
                </div>
                <h3 className="text-lg font-bold text-brand-charcoal mb-2">{feature.title}</h3>
                <p className="text-sm text-brand-charcoal/60 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Urgency Form */}
      <section className="py-24 bg-brand-bg border-t border-brand-linen" id="early-access">
        <div className="max-w-5xl mx-auto px-6 bg-brand-charcoal text-white rounded-3xl p-12 relative overflow-hidden">
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left space-y-6">
              <div className="inline-flex items-center gap-2 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange rounded-full px-3 py-1 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Founding Slots Limited
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-serif leading-tight">
                Secure Your Onboarding Key
              </h2>
              <p className="text-white/70 text-sm leading-relaxed">
                Join our founding cohort. Secure priority search placement and lock in your permanent ₹199 setup rate.
              </p>
            </div>

            <div className="bg-white text-brand-charcoal p-8 rounded-2xl shadow-xl">
              {!success ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-brand-charcoal/50 block mb-1.5 text-left">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full bg-brand-bg border border-brand-linen rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-colors"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-2 text-left">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCreator}
                        onChange={(e) => setIsCreator(e.target.checked)}
                        className="w-4 h-4 accent-brand-orange"
                      />
                      <span>I am a raw material supplier / maker</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isWholesale}
                        onChange={(e) => setIsWholesale(e.target.checked)}
                        className="w-4 h-4 accent-brand-orange"
                      />
                      <span>I am looking to buy raw materials</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-orange hover:bg-brand-terracotta text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reserve Spot"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-xl font-serif font-bold text-brand-charcoal mb-2">Spot Secured!</h3>
                  <p className="text-xs text-brand-charcoal/60 leading-relaxed">
                    We registered <strong>{email}</strong>. Our team will coordinate your setup rate lock via WhatsApp.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
