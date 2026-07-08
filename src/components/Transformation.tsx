"use client";

import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Clock, 
  Smartphone, 
  XCircle, 
  Search, 
  Compass, 
  ShoppingCart, 
  CheckCircle, 
  ShieldCheck, 
  ArrowRight, 
  Package
} from "lucide-react";

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export default function Transformation() {
  const withoutEkoraSteps = [
    {
      icon: Instagram,
      title: "Search Instagram",
      desc: "Find products through hashtags"
    },
    {
      icon: MessageSquare,
      title: "Send DM",
      desc: "Ask for price and catalog"
    },
    {
      icon: Clock,
      title: "Wait for Reply",
      desc: "Hours or days of waiting"
    },
    {
      icon: Smartphone,
      title: "Pay via UPI",
      desc: "Manual transfer & send screenshot"
    },
    {
      icon: XCircle,
      title: "No Tracking",
      desc: "Keep asking 'when will it ship?'"
    }
  ];

  const withEkoraSteps = [
    {
      icon: Search,
      title: "Search",
      desc: "Find exactly what you want"
    },
    {
      icon: Compass,
      title: "Discover",
      desc: "Browse creator stores"
    },
    {
      icon: ShoppingCart,
      title: "One Cart",
      desc: "Add items from multiple creators"
    },
    {
      icon: ShieldCheck,
      title: "Checkout",
      desc: "Secure 1-click payment"
    },
    {
      icon: Package,
      title: "Track",
      desc: "Real-time order updates"
    }
  ];

  return (
    <section className="py-24 bg-brand-bg border-t border-brand-linen relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#EADED2_1px,transparent_1px),linear-gradient(to_bottom,#EADED2_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 border border-brand-linen bg-white rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-charcoal/70 shadow-sm mb-6">
            The Transformation
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif tracking-tight text-brand-charcoal mb-4">
            Stop Dming. Start Shopping.
          </h2>
          <p className="text-lg text-brand-charcoal/60 max-w-2xl mx-auto">
            We&apos;ve taken the friction out of buying from Instagram creators.
          </p>
        </div>

        <div className="grid lg:grid-cols-11 gap-8 items-center">
          {/* Card 1: Without Ekora */}
          <motion.div 
            className="lg:col-span-5 bg-white border border-red-100 rounded-3xl p-8 md:p-10 shadow-xl shadow-red-50/10 relative overflow-hidden"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Background Icon Watermark */}
            <XCircle className="absolute -right-10 -top-10 w-44 h-44 text-red-500/5 stroke-[0.5]" />
            
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100">
              <h3 className="text-2xl font-bold text-red-600 font-serif">Without Ekora</h3>
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <XCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-8 relative">
              {/* Connecting Line for Timeline */}
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-red-100" />
              
              {withoutEkoraSteps.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start relative z-10 group">
                  <div className="w-12 h-12 rounded-full border-2 border-red-100 bg-white text-red-500 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-charcoal text-base">{step.title}</h4>
                    <p className="text-sm text-brand-charcoal/60 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Central Arrow */}
          <div className="lg:col-span-1 flex justify-center">
            <div className="w-12 h-12 rounded-full bg-brand-linen flex items-center justify-center text-brand-charcoal shadow-sm border border-white">
              <ArrowRight className="w-5 h-5 transform rotate-90 lg:rotate-0" />
            </div>
          </div>

          {/* Card 2: With Ekora */}
          <motion.div 
            className="lg:col-span-5 bg-white border border-brand-sage/20 rounded-3xl p-8 md:p-10 shadow-xl shadow-brand-sage/5 relative overflow-hidden"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Background Icon Watermark */}
            <CheckCircle className="absolute -right-10 -top-10 w-44 h-44 text-brand-sage/5 stroke-[0.5]" />
            
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100">
              <h3 className="text-2xl font-bold text-brand-sage font-serif">With Ekora</h3>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-brand-sage">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-8 relative">
              {/* Connecting Line for Timeline */}
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-emerald-100" />
              
              {withEkoraSteps.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start relative z-10 group">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-100 bg-white text-brand-sage flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm shadow-emerald-100/50">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-charcoal text-base">{step.title}</h4>
                    <p className="text-sm text-brand-charcoal/60 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
