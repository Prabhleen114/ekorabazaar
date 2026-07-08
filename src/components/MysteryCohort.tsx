"use client";

import { motion } from "framer-motion";
import { Lock, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function MysteryCohort({ count = 84 }: { count?: number }) {
  const remaining = 100 - count;
  const percentage = (count / 100) * 100;

  const foundingPerks = [
    { title: "Lifetime Zero-Commission", desc: "Keep 100% of your earnings. Locked in forever." },
    { title: "Priority Sourcing Index", desc: "First priority placement when creators search for raw ingredients." },
    { title: "Custom Setup Concierge", desc: "Direct 1-on-1 support from our founding team to configure your catalog." },
  ];

  return (
    <section className="py-24 bg-white border-t border-brand-linen relative overflow-hidden">
      {/* Editorial Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#FAF8F5_1px,transparent_1px),linear-gradient(to_bottom,#FAF8F5_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-40 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: Premium Editorial Copy */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 border border-brand-sage/20 bg-brand-bg rounded-full px-3 py-1 text-xs font-semibold text-brand-sage uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Founding Supplier Circle
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif tracking-tight text-brand-charcoal leading-[1.1]">
              Built for Sourcing. <br />
              <span className="text-brand-orange">Shared by Invitation.</span>
            </h2>

            <p className="text-lg text-brand-charcoal/70 leading-relaxed max-w-xl">
              We aren&apos;t building a crowded directory. Ekora is a curated infrastructure for India&apos;s finest raw material creators and suppliers. We bypass social media chaos to link you directly with small craft brands.
            </p>

            <div className="space-y-4 pt-2">
              {foundingPerks.map((perk, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 border border-brand-sage/20 flex items-center justify-center text-brand-sage mt-1 flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-charcoal text-sm">{perk.title}</h4>
                    <p className="text-xs text-brand-charcoal/50">{perk.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link 
                href="/sell/start-selling"
                className="inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-terracotta text-white px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg shadow-brand-orange/20"
              >
                <Lock className="w-4 h-4" /> Secure Your Sourcing Storefront Key
              </Link>
            </div>
          </div>

          {/* Right Column: Editorial Minimalist Cohort Status Panel */}
          <div className="lg:col-span-5">
            <motion.div 
              className="bg-brand-bg border border-brand-linen rounded-3xl p-8 shadow-xl shadow-brand-charcoal/5 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="pb-6 border-b border-brand-linen mb-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/50 block mb-1">Founding Allocation Status</span>
                <h3 className="text-3xl font-serif text-brand-charcoal font-bold">{count}/100 slots</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-brand-charcoal/70">
                    <span>ONBOARDED COHORT</span>
                    <span className="text-brand-orange">{remaining} SPOTS REMAINING</span>
                  </div>
                  {/* Premium Flat Progress bar */}
                  <div className="w-full bg-brand-linen h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-orange h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${percentage}%` }} 
                    />
                  </div>
                </div>

                <div className="bg-white border border-brand-linen p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand-charcoal/50">Next Cohort Rate</span>
                    <span className="font-semibold text-brand-charcoal line-through">₹299 Setup</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-brand-linen/60 pt-3">
                    <span className="font-semibold text-brand-charcoal">Your Locked Fee</span>
                    <span className="text-lg font-bold text-brand-orange">₹199 / One-Time</span>
                  </div>
                </div>

                <div className="text-[11px] text-brand-charcoal/50 text-center leading-relaxed">
                  Join verified material suppliers sending wax, clay, pigments, and yarn across India daily.
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
