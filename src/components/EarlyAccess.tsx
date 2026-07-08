import { CheckCircle2, Shield } from "lucide-react";
import Link from "next/link";

export default function EarlyAccess() {
  const benefits = [
    "Founding Creator Badge",
    "Priority Marketplace Visibility",
    "Dedicated Store Setup Support",
    "Early Access to Future Features",
  ];

  return (
    <section className="bg-brand-bg border-t border-brand-linen py-24" id="early-access">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-8 text-left">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold font-serif tracking-tight mb-4 text-brand-charcoal leading-tight">
                Become a Founding Creator.
              </h2>
              <p className="text-lg text-brand-charcoal/60 leading-relaxed max-w-lg">
                Ekora is launching soon. Secure your storefront today and get lifelong perks as one of our first 100 founding creators.
              </p>
            </div>

            <ul className="space-y-4">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-3 font-medium text-brand-charcoal/80">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 border border-brand-sage/20 flex items-center justify-center text-brand-sage flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="bg-white border border-brand-linen rounded-3xl p-10 shadow-xl shadow-brand-charcoal/5 flex flex-col items-center text-center">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-brand-charcoal mb-2 font-serif">One-Time Onboarding Fee</h3>
                <p className="text-sm font-medium text-brand-charcoal/50">Limited to First 100 Founding Creators</p>
              </div>

              <div className="flex items-end justify-center gap-3 mb-10">
                <div className="text-5xl font-bold text-brand-charcoal">₹199</div>
                <div className="text-xl font-medium text-brand-charcoal/40 line-through mb-1">₹299</div>
              </div>

              <Link
                href="/start-selling"
                className="w-full inline-flex items-center justify-center py-4 rounded-xl bg-brand-orange hover:bg-brand-terracotta text-white font-semibold text-lg transition-all duration-200 shadow-lg shadow-brand-orange/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                Apply for Early Access →
              </Link>

              <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-brand-charcoal/40">
                <Shield className="w-4 h-4 text-brand-sage" /> Secure processing. No hidden subscriptions.
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
