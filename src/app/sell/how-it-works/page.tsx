import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { 
  FileText, 
  ShieldCheck, 
  ShoppingBag, 
  Camera, 
  Bell, 
  Package, 
  DollarSign, 
  Headphones 
} from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works — Ekora Seller Journey",
  description:
    "Your journey from Instagram creator to Ekora seller. Learn how we handle storefront setup, payments, and fulfillment.",
  keywords: [
    "how to sell on Ekora",
    "Instagram seller onboarding India",
    "creator commerce process",
  ],
  alternates: {
    canonical: "/sell/how-it-works",
  },
  openGraph: {
    title: "How It Works — Ekora Seller Journey",
    description: "Your journey from Instagram creator to Ekora seller.",
    url: "https://www.ekorabazaar.in/sell/how-it-works",
    siteName: "Ekora Bazaar",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How It Works — Ekora Seller Journey",
    description: "Your journey from Instagram creator to Ekora seller.",
  },
};

export default function HowItWorksPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.ekorabazaar.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Sell on Ekora",
        item: "https://www.ekorabazaar.in/sell",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "How It Works",
        item: "https://www.ekorabazaar.in/sell/how-it-works",
      },
    ],
  };
  const steps = [
    {
      icon: FileText,
      title: "1. Apply",
      desc: "Share your Instagram page and basic details. It takes only 2 minutes.",
    },
    {
      icon: ShieldCheck,
      title: "2. Get Approved",
      desc: "We check your page and products. Most sellers are approved within 2 days.",
    },
    {
      icon: ShoppingBag,
      title: "3. Buy the Starter Kit (₹199)",
      desc: "Receive Ekora branded packaging and everything you need to start selling.",
    },
    {
      icon: Camera,
      title: "4. Add Your Products",
      desc: "Upload your product photos and tell us your selling price. We handle the rest.",
    },
    {
      icon: Bell,
      title: "5. Receive Orders",
      desc: "When someone orders, we'll send you all the customer details.",
    },
    {
      icon: Package,
      title: "6. Pack & Ship",
      desc: "Pack the order in Ekora packaging and send it through our shipping partner.",
    },
    {
      icon: DollarSign,
      title: "7. Get Paid",
      desc: "",
      bullets: [
        "Receive 30% payment after you share the shipment proof.",
        "Get the remaining 70% once the customer receives the order."
      ]
    },
    {
      icon: Headphones,
      title: "8. We Handle Customer Support",
      desc: "No return headaches. If a product is damaged during delivery, we manage the exchange and support the customer.",
    },
  ];

  return (
    <main className="min-h-screen bg-brand-bg text-brand-charcoal">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 md:pt-28 pb-16 px-6 text-center bg-brand-bg border-b border-brand-linen">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-semibold tracking-widest uppercase text-brand-charcoal/50 mb-4 block">
            Selling on Ekora
          </span>
          <h1 className="text-5xl md:text-6xl font-bold font-serif tracking-tight text-brand-charcoal mb-6 leading-tight">
            How It Works
          </h1>
          <p className="text-xl text-brand-charcoal/60 leading-relaxed max-w-xl mx-auto">
            Your journey from Instagram creator to professional Ekora seller. Simple, transparent, and built for growth.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 md:py-20 bg-brand-bg relative overflow-hidden">
        {/* Grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#EADED2_1px,transparent_1px),linear-gradient(to_bottom,#EADED2_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 md:left-1/2 top-4 bottom-4 w-0.5 bg-brand-linen md:-translate-x-1/2" />

            <div className="space-y-16">
              {steps.map((step, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div key={index} className={`flex flex-col md:flex-row items-start md:items-center gap-8 ${isEven ? 'md:flex-row-reverse' : ''} relative`}>
                    
                    {/* Empty space for alternating layout on desktop */}
                    <div className="hidden md:block md:flex-1" />

                    {/* Icon Circle */}
                    <div className="w-16 h-16 rounded-full bg-brand-charcoal text-white flex flex-col items-center justify-center flex-shrink-0 shadow-md border-4 border-brand-bg relative z-20 transition-transform duration-300 hover:scale-105">
                      <step.icon className="w-6 h-6 mb-0.5 text-brand-orange" />
                      <span className="text-[10px] font-bold text-white/70">{index + 1}</span>
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 bg-white border border-brand-linen p-8 rounded-3xl shadow-xl shadow-brand-charcoal/5 relative text-left">
                      <h3 className="text-xl font-bold text-brand-charcoal mb-3 font-serif">{step.title}</h3>
                      {step.title === "7. Get Paid" ? (
                        <div className="space-y-4 mt-4">
                          <div className="flex items-start gap-4 p-4 bg-brand-bg rounded-2xl border border-brand-linen">
                            <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center flex-shrink-0 text-brand-orange font-bold text-sm">30%</div>
                            <div>
                              <p className="font-semibold text-brand-charcoal text-sm">On Shipment Confirmation</p>
                              <p className="text-brand-charcoal/60 text-sm mt-0.5">Released instantly when you upload shipment tracking proof. No delays.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4 p-4 bg-brand-bg rounded-2xl border border-brand-linen">
                            <div className="w-10 h-10 rounded-full bg-brand-sage/10 flex items-center justify-center flex-shrink-0 text-brand-sage font-bold text-sm">70%</div>
                            <div>
                              <p className="font-semibold text-brand-charcoal text-sm">On Delivery Confirmation</p>
                              <p className="text-brand-charcoal/60 text-sm mt-0.5">Settled to your account within 48 hours of the customer receiving the order.</p>
                            </div>
                          </div>
                          <p className="text-xs text-brand-charcoal/40 flex items-center gap-1.5 pt-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-brand-sage flex-shrink-0" />
                            All payments are secured in split escrows. Creator rights are protected.
                          </p>
                        </div>
                      ) : step.bullets ? (
                        <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-brand-charcoal/60 leading-relaxed">
                          {step.bullets.map((bullet, bIdx) => (
                            <li key={bIdx}>
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {step.desc && <p className="text-brand-charcoal/60 leading-relaxed">{step.desc}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-brand-bg border-t border-brand-linen text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-orange/5 blur-3xl pointer-events-none" />
        <div className="max-w-2xl mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-charcoal mb-8 font-serif">
            Ready to build your storefront?
          </h2>
          <Link
            href="/start-selling"
            className="inline-flex items-center justify-center bg-brand-orange hover:bg-brand-terracotta text-white px-8 py-4 rounded-xl text-base font-semibold transition-all duration-200 shadow-lg shadow-brand-orange/20 hover:scale-[1.02]"
          >
            Apply for Early Access
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
