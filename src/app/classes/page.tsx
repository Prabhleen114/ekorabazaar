import BuyerNavbar from "@/components/BuyerNavbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Package, Sparkles } from "lucide-react";

export const metadata = {
  title: "Luxury Candle-Making Classes | Ekora Bazaar",
  description: "Join Ekora's candle-making classes. Learn slow craft, thoughtful design, and professional techniques from beginner foundations to advanced themes like Bakery and Indian Festivities.",
};

const classesData = [
  {
    level: "Level 1",
    title: "Foundations / Beginner",
    fees: "RS 1800",
    includes: [
      "Materials & tools guide",
      "Wax types & fragrance ratios",
      "Wick sizing basics",
      "Temperature control",
      "Pouring techniques",
      "Curing & burn testing",
      "Packaging basics"
    ],
    structure: "Practical session (2hrs) + guided theory (approx. 1.5 to 2 hrs)",
    designs: [
      "Marble Jar Candle",
      "Skull Candle",
      "Shaded flowers",
      "Cloud Design Candle",
      "Diffuser melts"
    ]
  },
  {
    level: "Level 2",
    title: "Intermediate - Bakery",
    fees: "RS 3200",
    includes: [
      "Colour blending and wax colour theory",
      "Flash points and fragrance pairing",
      "Layering techniques",
      "Aesthetic balance",
      "Finishing food-style candles"
    ],
    structure: "Guided Theory (2 - 3 hrs) + Practical Session (4-5 hrs)",
    designs: [
      "Cake with Icing and Toppings",
      "Croissant Candle",
      "Tiramisu candle",
      "Bread Loaf"
    ]
  },
  {
    level: "Level 2",
    title: "Intermediate - Drinks",
    fees: "RS 3400",
    includes: [
      "Advanced layering for liquid effects",
      "Gel wax manipulation",
      "Aesthetic balance & presentation",
      "Flash points and fragrance pairing"
    ],
    structure: "Guided Theory (2 - 3 hrs) + Practical Session (4-5 hrs)",
    designs: [
      "Strawberry chocolate Candle",
      "Mango Iced Matcha",
      "Iced Coffee capuccino",
      "Champagne Style Candle",
      "Thandai"
    ]
  },
  {
    level: "Level 2",
    title: "Intermediate - Indian Festives",
    fees: "RS 2200",
    includes: [
      "Festive colour blending",
      "Gold leafing & embellishments",
      "Intricate mould pouring",
      "Traditional scent pairing"
    ],
    structure: "Guided Theory (2 - 3 hrs) + Practical Session (3-4 hrs)",
    designs: [
      "Thandai",
      "Roshgulla",
      "Parle G in Chai",
      "Mithai Series: Ladoo, Kaju katli, Jalebi",
      "Urli mithai plate"
    ]
  }
];

const kitsData = [
  {
    title: "Kit Level 1",
    fees: "RS 3400",
    items: [
      "1 KG SOY WAX", "1 KG PARAFFIN WAX", "Wicks as per design", "Wick sticker", 
      "Colour packets - 7 pack", "Coffee fragrance - 30 ml", "Wick insertion tool", 
      "Thermometer", "Stirrer", "Paper cups", "Skull mould", "Hearts mould", 
      "Flower mould - 3", "Yankee jar - 1", "Glass jar - 1"
    ]
  },
  {
    title: "Kit Level 2 - Bakery",
    fees: "RS 3400",
    items: [
      "1 KG SOY WAX", "1 KG PARAFFIN WAX", "Wicks as per design", "Wick sticker", 
      "Colour packets - 5 pack", "Coffee fragrance - 30 ml", "Wick Insertion tool", 
      "Thermometer", "Dropper", "Stirrer", "Paper cups", "Paint brush - 2", 
      "Croissant mould", "Cake mould", "Strawberry mould", "Piping bag", "Chemical for Bread texture"
    ]
  },
  {
    title: "Kit Level 2 - Drinks",
    fees: "RS 3400",
    items: [
      "1 KG SOY WAX", "500 GM PARAFFIN WAX", "500 GM GEL WAX", "Wicks as per design", 
      "Wick sticker", "Colour packets - 5 pack", "Coffee fragrance - 30 ml", "Wick Insertion tool", 
      "Thermometer", "Dropper", "Stirrer", "Paper cups", "Champagne glass - 1", "Mitti Kulhad - 1", 
      "Strawberry Mould", "Long glass jar - 1", "Coffee Glass - 2"
    ]
  },
  {
    title: "Kit Level 2 - Indian Festivities",
    fees: "RS 3400",
    items: [
      "1 KG SOY WAX", "500 GM PARAFFIN WAX", "250 GM GEL WAX", "Wicks as per design", 
      "Wick sticker", "Colour packets - 5 pack", "Coffee fragrance - 30 ml", "Wick Insertion tool", 
      "Thermometer", "Dropper", "Stirrer", "Paper cups", "24K Gold leafs", "Golden Urli - 1", 
      "Mitti Kulhad - 1", "Glass Katori - 1", "Parle G mould", "Mitchoor Ladoo Mould", 
      "Jalebi Mould", "Kaju Katli Mould"
    ]
  }
];

export default function ClassesPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-charcoal selection:bg-brand-orange/20">
      <BuyerNavbar />

      {/* HERO SECTION (Attention) */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-bg via-brand-bg/95 to-brand-bg/50 z-10" />
          <Image 
            src="https://images.unsplash.com/photo-1602874801007-bd458cb6c4f0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Candle Making Background" 
            fill 
            className="object-cover object-center opacity-30"
          />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative z-20">
          <div className="max-w-2xl animate-fade-in-up">
            <h4 className="text-brand-orange font-bold uppercase tracking-[0.2em] mb-4 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> The Ekora Studio
            </h4>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-brand-charcoal leading-[1.1] mb-6">
              Luxury Candles & <br />
              <span className="text-brand-charcoal/70">Making Classes</span>
            </h1>
            <p className="text-lg text-brand-charcoal/70 mb-10 leading-relaxed max-w-xl">
              Immerse yourself in the art of candle making. Discover thoughtfully crafted courses designed to resonate with your personal vibe, from beginner foundations to exquisite thematic designs.
            </p>
            <Link 
              href="#courses"
              className="inline-flex items-center justify-center bg-brand-charcoal hover:bg-brand-orange text-white rounded-full px-8 py-4 text-base font-bold transition-all shadow-xl hover:shadow-brand-orange/20"
            >
              Explore Our Classes
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION (Interest) */}
      <section className="py-24 bg-white border-y border-brand-linen">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
              <Image 
                src="https://images.unsplash.com/photo-1603006905003-be475563bc59?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Hand pouring a candle" 
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-4xl font-serif font-bold text-brand-charcoal mb-8">Who We Are</h2>
              <div className="space-y-6 text-brand-charcoal/70 text-lg leading-relaxed">
                <p>
                  We are a candle studio rooted in slow craft and thoughtful design. Each candle is hand-poured using a carefully balanced blend of natural soy wax and beeswax, chosen for its clean burn, soft glow, and gentle presence in a space.
                </p>
                <p>
                  Our process is intentional—from sourcing materials to finishing each piece by hand—ensuring every candle feels refined, warm, and long-lasting. We work exclusively with premium fragrance compositions and high-quality essential oils, selected for depth, balance, and sophistication rather than overpowering scent.
                </p>
                <p className="font-medium text-brand-charcoal">
                  The result is a collection of candles designed not just to be lit, but to elevate everyday moments, quiet evenings, meaningful celebrations, and spaces that deserve a touch of calm luxury.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COURSES SECTION (Desire) */}
      <section id="courses" className="py-24 bg-brand-bg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-charcoal mb-4">Masterclass Collection</h2>
            <p className="text-brand-charcoal/60 text-lg max-w-2xl mx-auto">
              Our courses are thoughtfully crafted around various themes, allowing you to choose one that resonates with your creative spirit.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {classesData.map((cls, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 border border-brand-linen shadow-xl hover:shadow-2xl transition-shadow flex flex-col h-full group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-brand-orange/10 text-brand-orange font-bold text-xs uppercase tracking-wider rounded-full mb-3">
                      {cls.level}
                    </span>
                    <h3 className="text-2xl font-serif font-bold text-brand-charcoal">{cls.title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-brand-charcoal/50 uppercase tracking-widest font-bold block mb-1">Fees</span>
                    <span className="text-2xl font-bold text-brand-orange">{cls.fees}</span>
                  </div>
                </div>

                <div className="mb-6 pb-6 border-b border-brand-linen">
                  <h4 className="font-bold text-brand-charcoal text-sm uppercase tracking-wider mb-2">Class Structure</h4>
                  <p className="text-brand-charcoal/70 text-sm">{cls.structure}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-8 flex-1">
                  <div>
                    <h4 className="font-bold text-brand-charcoal text-sm uppercase tracking-wider mb-4">Course Includes</h4>
                    <ul className="space-y-3">
                      {cls.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-brand-charcoal/70">
                          <CheckCircle2 className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-charcoal text-sm uppercase tracking-wider mb-4">Designs Included</h4>
                    <ul className="space-y-3">
                      {cls.designs.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-brand-charcoal/70 font-medium">
                          <span className="text-brand-orange font-bold">{i + 1}.</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KITS SECTION (Desire/Action) */}
      <section className="py-24 bg-white border-t border-brand-linen">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-charcoal mb-4">Professional Supply Kits</h2>
            <p className="text-brand-charcoal/60 text-lg max-w-2xl mx-auto">
              Everything you need to create your masterpieces at home. Each kit is perfectly curated to match its corresponding masterclass.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kitsData.map((kit, idx) => (
              <div key={idx} className="bg-brand-bg rounded-2xl p-6 border border-brand-linen flex flex-col hover:border-brand-orange/50 transition-colors">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-brand-charcoal/10">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-orange shrink-0">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-charcoal text-lg">{kit.title}</h3>
                    <p className="text-brand-orange font-bold">{kit.fees}</p>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-bold text-brand-charcoal/60 text-xs uppercase tracking-wider mb-4">Kit Contents</h4>
                  <ul className="space-y-2 text-sm text-brand-charcoal/80 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {kit.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-brand-charcoal/30"></span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION (Action) */}
      <section className="py-24 bg-brand-charcoal text-white text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-[50%] -left-[10%] w-[70%] h-[200%] bg-brand-orange rounded-full blur-[120px] mix-blend-screen" />
        </div>
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-brand-linen/80 text-lg mb-10">
            Secure your spot in our upcoming masterclasses or order your professional supply kit today. Elevate your craft with Ekora.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/contact"
              className="bg-brand-orange hover:bg-brand-orange/90 text-white rounded-full px-8 py-4 text-base font-bold transition-all shadow-lg hover:shadow-brand-orange/20"
            >
              Enroll in a Class
            </Link>
            <Link 
              href="/shop"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full px-8 py-4 text-base font-bold transition-all"
            >
              Shop Raw Materials
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
