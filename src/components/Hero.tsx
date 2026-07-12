import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, ShoppingBag, TrendingUp, DollarSign } from "lucide-react";
import Image from "next/image";

export default function Hero({ count = 84 }: { count?: number }) {
  return (
    <section className="bg-brand-bg pt-24 md:pt-28 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-8 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Column: Copy & CTAs */}
        <div className="flex flex-col items-start text-left relative z-10">
          <div className="inline-flex items-center gap-2 border border-brand-linen bg-white rounded-full px-3 py-1 text-xs font-semibold text-brand-charcoal/70 mb-4 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-brand-sage animate-pulse" />
            Early Access — First 100 Founding Creators
          </div>

          {/* Micro social proof stack */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex -space-x-2">
              {["RM", "SK", "AS", "PK", "KA"].map((initials, i) => (
                <div key={i}
                  className="w-7 h-7 rounded-full border border-brand-bg bg-brand-linen flex items-center justify-center text-[8px] font-bold text-brand-charcoal"
                  style={{ zIndex: 5 - i }}>
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-xs font-semibold text-brand-charcoal/60">
              <span className="text-brand-orange font-bold">{count} creators</span> have secured their key
            </p>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-serif tracking-tight text-brand-charcoal mb-6 leading-[1.1]">
            India&apos;s First Creator Commerce Platform.
          </h1>

          <p className="text-xl text-brand-charcoal/60 mb-10 max-w-lg leading-relaxed">
            Helping Instagram creators build real businesses beyond DMs. One
            professional storefront. One secure checkout.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
            <Link
              href="/sell/start-selling"
              className="w-full sm:w-auto bg-brand-orange text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-brand-terracotta hover:scale-[1.02] active:scale-[0.98] transition-all text-center shadow-lg shadow-brand-orange/20"
            >
              Sell with us
            </Link>
            <Link
              href="/sell/platform"
              className="group flex items-center justify-center gap-2 text-brand-charcoal/60 hover:text-brand-charcoal font-medium transition-all duration-200"
            >
              See the platform
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Column: High-Fidelity UI Mockups */}
        <div className="relative h-[600px] w-full hidden lg:block">
          
          {/* Main Browser Window Mockup */}
          <div className="absolute top-0 right-0 w-[550px] bg-white rounded-2xl shadow-2xl shadow-zinc-200/50 border border-zinc-200 overflow-hidden transform translate-x-12 translate-y-4">
            {/* Browser Chrome */}
            <div className="h-10 border-b border-zinc-100 bg-zinc-50 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-zinc-300" />
                <div className="w-3 h-3 rounded-full bg-zinc-300" />
                <div className="w-3 h-3 rounded-full bg-zinc-300" />
              </div>
              <div className="mx-auto bg-white border border-zinc-200 rounded-md h-6 w-48 text-[10px] text-zinc-400 flex items-center justify-center font-medium">
                ekora.in/search
              </div>
            </div>

            {/* App UI Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="font-semibold text-zinc-900">Ekora</div>
              <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                <span>Discover</span>
                <span>Creators</span>
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-zinc-900" />
                </div>
              </div>
            </div>

            {/* App UI Body */}
            <div className="p-6 bg-zinc-50/50 h-[450px]">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input 
                  type="text"
                  readOnly
                  value="Hand-poured soy candles"
                  className="w-full bg-white border border-zinc-200 rounded-lg pl-10 pr-4 py-2 text-sm font-medium text-zinc-900 shadow-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Product Card 1 */}
                <div className="bg-white p-3 rounded-xl border border-zinc-100 shadow-sm text-left">
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-zinc-100">
                     <Image src="/images/candles.png" alt="Soy Wax Flakes" fill className="object-cover" />
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-4 h-4 rounded-full bg-zinc-200 text-[8px] flex items-center justify-center font-bold">E</div>
                    <span className="text-[10px] font-medium text-zinc-500">Earthy Supplies Co.</span>
                    <ShieldCheck className="w-3 h-3 text-green-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-900 leading-tight mb-2">Premium Soy Wax Flakes (10kg)</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-900">₹2,450</span>
                    <button className="bg-zinc-900 text-white text-[10px] font-semibold px-3 py-1.5 rounded-md">Order</button>
                  </div>
                </div>

                {/* Product Card 2 */}
                <div className="bg-white p-3 rounded-xl border border-zinc-100 shadow-sm text-left">
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-zinc-100">
                     <Image src="/images/pottery.png" alt="Stoneware Clay" fill className="object-cover" />
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-4 h-4 rounded-full bg-zinc-200 text-[8px] flex items-center justify-center font-bold">I</div>
                    <span className="text-[10px] font-medium text-zinc-500">Indus Clay Suppliers</span>
                    <ShieldCheck className="w-3 h-3 text-green-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-900 leading-tight mb-2">Fine Stoneware Ceramic Clay (25kg)</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-900">₹890</span>
                    <button className="bg-zinc-900 text-white text-[10px] font-semibold px-3 py-1.5 rounded-md">Order</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Analytics Card (Foreground) */}
          <div className="absolute bottom-12 left-0 w-64 bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-zinc-200 p-5 transform -translate-x-4 z-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Today&apos;s Sales</div>
                <div className="text-lg font-bold text-zinc-900">₹12,450</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> Revenue</span>
                <span className="font-semibold text-green-600">+24%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 flex items-center gap-1.5"><ShoppingBag className="w-4 h-4" /> Orders</span>
                <span className="font-semibold text-zinc-900">32</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
