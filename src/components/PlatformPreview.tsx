import { Search, Store, ShoppingCart, BarChart3, ShieldCheck, ChevronRight, TrendingUp, DollarSign } from "lucide-react";
import Image from "next/image";

export default function PlatformPreview() {
  const mockups = [
    {
      title: "Sourcing Directory Search",
      icon: Search,
      content: (
        <div className="flex flex-col gap-3 mt-4 h-[250px] overflow-hidden">
          <div className="w-full relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              readOnly 
              value="Organic Pigments" 
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-10 pr-4 py-2 text-sm font-medium text-zinc-900 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-white rounded-lg border border-zinc-200 p-2 shadow-sm">
              <div className="relative aspect-square rounded bg-zinc-100 mb-2 overflow-hidden">
                <Image src="/images/resin_art.png" alt="Pigment" fill className="object-cover" />
              </div>
              <h4 className="text-xs font-semibold text-zinc-900 truncate">Mica Powder Pigment (1kg)</h4>
              <div className="text-[10px] text-zinc-500 mt-1">₹1,200</div>
            </div>
            <div className="bg-white rounded-lg border border-zinc-200 p-2 shadow-sm">
              <div className="relative aspect-square rounded bg-zinc-100 mb-2 overflow-hidden">
                <Image src="/images/home_decor.png" alt="Wood" fill className="object-cover" />
              </div>
              <h4 className="text-xs font-semibold text-zinc-900 truncate">Pine Wood blocks (50pcs)</h4>
              <div className="text-[10px] text-zinc-500 mt-1">₹3,400</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Supplier Storefront Dashboard",
      icon: Store,
      content: (
        <div className="flex flex-col gap-3 mt-4 h-[250px] overflow-hidden">
          <div className="bg-zinc-900 rounded-t-lg h-16 w-full relative">
            <div className="absolute -bottom-5 left-4 w-10 h-10 rounded-full border-2 border-white bg-white flex items-center justify-center font-bold text-zinc-900 text-sm shadow-sm">
              A
            </div>
          </div>
          <div className="px-4 mt-5">
            <div className="flex items-center gap-1.5">
              <h4 className="font-semibold text-zinc-900 text-sm">Anika&apos;s Craft Oils</h4>
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">Therapeutic-grade raw essential oils for makers.</p>
          </div>
          <div className="px-4 mt-2">
            <div className="bg-white rounded-lg border border-zinc-200 p-2 shadow-sm flex gap-3 items-center">
              <div className="relative w-12 h-12 rounded bg-zinc-100 overflow-hidden flex-shrink-0">
                 <Image src="/images/candles.png" alt="Oils" fill className="object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-zinc-900">Lavender Essential Oil (1L)</h4>
                <div className="text-[10px] text-zinc-500">₹4,200</div>
              </div>
              <button className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-[10px] font-semibold px-2 py-1 rounded">Add</button>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Unified Sourcing Cart",
      icon: ShoppingCart,
      content: (
        <div className="flex flex-col gap-2 mt-4 h-[250px] overflow-hidden bg-zinc-50/50 p-2 rounded-xl border border-zinc-100">
          <div className="bg-white rounded-lg border border-zinc-200 p-3 shadow-sm flex justify-between items-center">
             <div className="flex gap-3 items-center">
               <div className="relative w-10 h-10 rounded bg-zinc-100 overflow-hidden">
                 <Image src="/images/candles.png" alt="Wax" fill className="object-cover" />
               </div>
               <div>
                 <h4 className="text-xs font-semibold text-zinc-900">Soy Wax Flakes (10kg)</h4>
                 <div className="text-[10px] text-zinc-500">from Earthy Supplies</div>
               </div>
             </div>
             <div className="text-xs font-bold text-zinc-900">₹2,450</div>
          </div>
          
          <div className="bg-white rounded-lg border border-zinc-200 p-3 shadow-sm flex justify-between items-center">
             <div className="flex gap-3 items-center">
               <div className="relative w-10 h-10 rounded bg-zinc-100 overflow-hidden">
                 <Image src="/images/jewelry.png" alt="Beads" fill className="object-cover" />
               </div>
               <div>
                 <h4 className="text-xs font-semibold text-zinc-900">Brass Earring Hooks (500pcs)</h4>
                 <div className="text-[10px] text-zinc-500">from Aura Findings</div>
               </div>
             </div>
             <div className="text-xs font-bold text-zinc-900">₹1,150</div>
          </div>

          <div className="mt-auto">
            <div className="flex justify-between items-center px-1 mb-2">
              <span className="text-xs font-medium text-zinc-500">Subtotal</span>
              <span className="text-sm font-bold text-zinc-900">₹3,600</span>
            </div>
            <button className="w-full bg-zinc-900 text-white text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1 hover:bg-zinc-800">
              Proceed to Checkout <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      ),
    },
    {
      title: "Supplier Analytics Dashboard",
      icon: BarChart3,
      content: (
        <div className="flex flex-col gap-3 mt-4 h-[250px] overflow-hidden">
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white rounded-lg border border-zinc-200 p-3 shadow-sm">
                 <div className="flex items-center gap-1.5 mb-2 text-zinc-500">
                   <DollarSign className="w-3.5 h-3.5" />
                   <span className="text-[10px] font-medium uppercase tracking-wider">Gross Sales</span>
                 </div>
                 <div className="text-lg font-bold text-zinc-900 mb-1">₹84.2K</div>
                 <div className="text-[10px] font-semibold text-green-600">+15% this week</div>
             </div>
             <div className="bg-white rounded-lg border border-zinc-200 p-3 shadow-sm">
                 <div className="flex items-center gap-1.5 mb-2 text-zinc-500">
                   <ShoppingCart className="w-3.5 h-3.5" />
                   <span className="text-[10px] font-medium uppercase tracking-wider">Wholesale Leads</span>
                 </div>
                 <div className="text-lg font-bold text-zinc-900 mb-1">42</div>
                 <div className="text-[10px] font-semibold text-green-600">+10% this week</div>
             </div>
          </div>
          
          <div className="bg-white rounded-lg border border-zinc-200 p-4 shadow-sm flex-1 flex flex-col justify-end relative overflow-hidden">
            <div className="absolute top-3 left-3 flex items-center gap-1.5 text-zinc-500">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Store Traffic</span>
            </div>
            {/* Fake Chart bars */}
            <div className="flex items-end justify-between gap-1 h-16 mt-6">
              {[40, 60, 30, 80, 50, 90, 70].map((height, i) => (
                <div key={i} className="w-full bg-zinc-100 rounded-t-sm relative group">
                  <div 
                    className="absolute bottom-0 w-full bg-zinc-900 rounded-t-sm transition-all duration-500"
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="bg-zinc-50 border-t border-zinc-200 py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4 block">
            Platform Preview
          </span>
          <h2 className="text-4xl md:text-5xl font-bold font-serif tracking-tight text-zinc-900 mb-4">
            See what&apos;s coming.
          </h2>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            We are building the complete commerce infrastructure for independent suppliers. Here is a sneak peek at the experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {mockups.map((item, index) => (
            <div key={index} className="bg-white border border-zinc-200 rounded-2xl p-8 relative group overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-8 right-8 text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded-full border border-zinc-200">
                Concept
              </div>
              <div className="flex items-center gap-3 mb-2">
                <item.icon className="w-6 h-6 text-zinc-900" />
                <h3 className="font-semibold text-zinc-900 text-xl">{item.title}</h3>
              </div>
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
