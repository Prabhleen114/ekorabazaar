"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Filter, ChevronDown, Tag, PackageSearch, Sparkles, Droplets, Leaf, Search, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type ProductFilters = {
  skinSafe?: boolean;
  cpStable?: boolean;
  candle?: boolean;
};

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  bulkDiscountAvailable: boolean;
  maxDiscount: number;
  image: string;
  filters?: ProductFilters;
  scentFamily?: string;
  noteLevel?: string;
  isBlend?: boolean;
  applications?: string[];
  scentCollection?: string;
};

export default function ShopClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("recommended");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Faceted Search State
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  
  // Collection & Blend State
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [blendFilter, setBlendFilter] = useState<"all" | "single" | "blend">("all");

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);

  // Prevent scroll when bottom sheets are open
  useEffect(() => {
    if (isMobileFilterOpen || isMobileSortOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileFilterOpen, isMobileSortOpen]);

  useEffect(() => {
    fetch(`/api/products?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
        const cat = searchParams.get("category");
        if (cat) {
          const dbCategories = Array.from(new Set(data.map((p: Product) => p.category))).filter(Boolean) as string[];
          const search = decodeURIComponent(cat).toLowerCase().trim();
          
          const matched: string[] = [];
          dbCategories.forEach((dbc: string) => {
            const dbcLower = dbc.toLowerCase();
            if (dbcLower === search) {
              matched.push(dbc);
            } else if (search === 'waxes' && dbcLower.includes('waxes')) {
              matched.push(dbc);
            } else if (search === 'resins' && (dbcLower.includes('resin') || dbcLower.includes('epoxy'))) {
              matched.push(dbc);
            } else if (search === 'fragrances' && (dbcLower.includes('fragrance') || dbcLower.includes('perfume'))) {
              matched.push(dbc);
            } else if (search === 'molds' && (dbcLower.includes('mold') || dbcLower.includes('mould'))) {
              matched.push(dbc);
            } else if (dbcLower.includes(search) || search.includes(dbcLower)) {
              matched.push(dbc);
            }
          });
          
          if (matched.length > 0) {
            setSelectedCategories(matched);
          } else {
            setSelectedCategories([cat]);
          }
        } else {
          setSelectedCategories([]);
        }
        
        const q = searchParams.get("q");
        if (q) {
          setSearchQuery(decodeURIComponent(q));
        } else {
          setSearchQuery("");
        }
      });
  }, [searchParams]);

  const allCategories = Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort();
  
  // Facet Options
  const FAMILIES = ["Floral", "Citrus", "Woody", "Spicy", "Aquatic", "Herbaceous"];
  const NOTES = ["Top Note", "Heart/Middle Note", "Base Note"];
  const APPLICATIONS = ["Cold Process Soap", "Soy Candles", "Lip Balms", "Reed Diffusers"];
  const COLLECTIONS = [
    { name: "The Botanical Garden", icon: <Leaf className="w-4 h-4" /> },
    { name: "The Apothecary", icon: <Droplets className="w-4 h-4" /> },
    { name: "The Woods & Resins", icon: <Sparkles className="w-4 h-4" /> }
  ];

  const toggleCategory = (cat: string) => {
    const newCategories = selectedCategories.includes(cat) 
      ? selectedCategories.filter(c => c !== cat) 
      : [...selectedCategories, cat];
    const params = new URLSearchParams(searchParams.toString());
    if (newCategories.length > 0) params.set("category", newCategories.join(","));
    else params.delete("category");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const toggleArrayItem = (setter: any, item: string) => {
    setter((prev: string[]) => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const clearAllFilters = () => {
    router.push('?', { scroll: false });
    setSelectedFamilies([]);
    setSelectedNotes([]);
    setSelectedApplications([]);
    setActiveCollection(null);
    setBlendFilter("all");
    setIsMobileFilterOpen(false);
  };

  const filteredProducts = products.filter(p => {
    if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
    
    if (searchQuery) {
      const qLower = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(qLower) && !p.category.toLowerCase().includes(qLower)) {
        return false;
      }
    }
    
    if (selectedFamilies.length > 0 && (!p.scentFamily || !selectedFamilies.includes(p.scentFamily))) return false;
    if (selectedNotes.length > 0 && (!p.noteLevel || !selectedNotes.includes(p.noteLevel))) return false;
    if (selectedApplications.length > 0 && (!p.applications || !selectedApplications.some(app => p.applications?.includes(app)))) return false;
    
    if (activeCollection && p.scentCollection !== activeCollection) return false;
    
    if (blendFilter === "single" && p.isBlend) return false;
    if (blendFilter === "blend" && !p.isBlend) return false;

    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "discount_desc") return b.maxDiscount - a.maxDiscount;
    return 0; // recommended
  });
  
  const activeFilterCount = selectedCategories.length + selectedFamilies.length + selectedNotes.length + selectedApplications.length;

  return (
    <div className="pt-20 md:pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-8">
      {/* Desktop Sidebar Filters */}
      <aside className="hidden md:block w-64 shrink-0">
        <div className="bg-white rounded-2xl p-6 border border-brand-linen sticky top-24 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 font-bold font-serif text-brand-charcoal mb-6 text-xl">
            <Filter className="w-5 h-5" /> Filters
          </div>

          <div className="space-y-8">
            {/* Category Filter */}
            <div>
              <h4 className="font-semibold text-brand-charcoal mb-3 text-sm border-b border-brand-linen pb-2">Product Category</h4>
              <div className="space-y-2 text-sm text-brand-charcoal/70">
                {allCategories.slice(0, 8).map((cat, idx) => (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={selectedCategories.includes(cat)} onChange={() => toggleCategory(cat)} className="rounded text-brand-orange focus:ring-brand-orange shrink-0" /> 
                    <span className="line-clamp-1 group-hover:text-brand-orange transition-colors" title={cat}>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Scent Family Filter */}
            <div>
              <h4 className="font-semibold text-brand-charcoal mb-3 text-sm border-b border-brand-linen pb-2">Scent Family</h4>
              <div className="space-y-2 text-sm text-brand-charcoal/70">
                {FAMILIES.map(family => (
                  <label key={family} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={selectedFamilies.includes(family)} onChange={() => toggleArrayItem(setSelectedFamilies, family)} className="rounded text-brand-orange focus:ring-brand-orange shrink-0" /> 
                    <span className="group-hover:text-brand-orange transition-colors">{family}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Note Level Filter */}
            <div>
              <h4 className="font-semibold text-brand-charcoal mb-3 text-sm border-b border-brand-linen pb-2">Note Level</h4>
              <div className="space-y-2 text-sm text-brand-charcoal/70">
                {NOTES.map(note => (
                  <label key={note} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={selectedNotes.includes(note)} onChange={() => toggleArrayItem(setSelectedNotes, note)} className="rounded text-brand-orange focus:ring-brand-orange shrink-0" /> 
                    <span className="group-hover:text-brand-orange transition-colors">{note}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Application Filter */}
            <div>
              <h4 className="font-semibold text-brand-charcoal mb-3 text-sm border-b border-brand-linen pb-2">Application (Safe For)</h4>
              <div className="space-y-2 text-sm text-brand-charcoal/70">
                {APPLICATIONS.map(app => (
                  <label key={app} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={selectedApplications.includes(app)} onChange={() => toggleArrayItem(setSelectedApplications, app)} className="rounded text-brand-orange focus:ring-brand-orange shrink-0" /> 
                    <span className="group-hover:text-brand-orange transition-colors">{app}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Clear Filters Button */}
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="text-xs text-brand-orange hover:underline font-semibold w-full text-center py-2 bg-orange-50 rounded-lg">
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 w-full min-w-0 flex flex-col gap-6">
        
        {/* Mobile: Persistent Search & Category Chips */}
        <div className="md:hidden flex flex-col gap-4">
          <form action="/shop" method="GET" className="relative w-full">
            <input 
              type="text" 
              name="q" 
              placeholder="Search products..." 
              defaultValue={searchQuery}
              className="w-full bg-stone-50 border border-brand-linen rounded-2xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-orange shadow-sm" 
            />
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-charcoal/40" />
          </form>
          
          <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-4 px-4 snap-x">
            <button
              onClick={() => {
                router.push('?', { scroll: false });
                clearAllFilters();
              }}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium border snap-start shrink-0 transition-colors ${
                selectedCategories.length === 0 ? "bg-brand-charcoal text-white border-brand-charcoal" : "bg-white text-brand-charcoal/70 border-brand-linen"
              }`}
            >
              All
            </button>
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium border snap-start shrink-0 transition-colors ${
                  selectedCategories.includes(cat) ? "bg-brand-charcoal text-white border-brand-charcoal" : "bg-white text-brand-charcoal/70 border-brand-linen"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Curated Collections Header - Render ONLY when fragrance-related category is selected */}
        {selectedCategories.some(c => c.toLowerCase().includes("fragrance") || c.toLowerCase().includes("scent") || c.toLowerCase().includes("essential")) && (
          <div className="bg-gradient-to-r from-brand-linen/40 to-orange-50/40 p-6 rounded-2xl border border-brand-linen">
            <h3 className="font-serif font-bold text-brand-charcoal text-lg mb-4">Curated Scent Collections</h3>
            <div className="flex flex-wrap gap-3">
              {COLLECTIONS.map(coll => (
                <button 
                  key={coll.name}
                  onClick={() => setActiveCollection(activeCollection === coll.name ? null : coll.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCollection === coll.name 
                    ? "bg-brand-charcoal text-white shadow-md" 
                    : "bg-white text-brand-charcoal border border-brand-linen hover:border-brand-charcoal"
                  }`}
                >
                  {coll.icon} {coll.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile: Sticky Filter + Sort Bar */}
        <div className="md:hidden sticky top-16 z-30 bg-white/95 backdrop-blur-md border-y border-brand-linen py-3 -mx-4 px-4 flex items-center justify-between shadow-sm">
          <button 
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 border-r border-brand-linen text-sm font-semibold text-brand-charcoal active:text-brand-orange"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filter
            {activeFilterCount > 0 && (
              <span className="bg-brand-orange text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setIsMobileSortOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-brand-charcoal active:text-brand-orange"
          >
            <ArrowUpDown className="w-4 h-4" /> Sort
          </button>
        </div>

        {/* Desktop: Top Bar (Blend Toggle & Sort) */}
        <div className="hidden md:flex flex-col lg:flex-row justify-between items-center bg-white p-4 rounded-xl border border-brand-linen gap-4">
          
          {/* Blend vs Single Toggle */}
          <div className="flex bg-brand-bg rounded-lg p-1">
            <button 
              onClick={() => setBlendFilter("all")}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${blendFilter === "all" ? "bg-white text-brand-charcoal shadow-sm" : "text-brand-charcoal/50 hover:text-brand-charcoal"}`}
            >All Oils</button>
            <button 
              onClick={() => setBlendFilter("single")}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${blendFilter === "single" ? "bg-white text-brand-charcoal shadow-sm" : "text-brand-charcoal/50 hover:text-brand-charcoal"}`}
            >Single Origin</button>
            <button 
              onClick={() => setBlendFilter("blend")}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${blendFilter === "blend" ? "bg-white text-brand-charcoal shadow-sm" : "text-brand-charcoal/50 hover:text-brand-charcoal"}`}
            >Artisan Blends</button>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-brand-charcoal/60 font-medium">Sort by:</span>
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-brand-bg border border-brand-linen rounded-lg pl-4 pr-10 py-2 font-medium text-brand-charcoal focus:outline-none focus:border-brand-orange"
              >
                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="discount_desc">Highest Discount %</option>
              </select>
              <ChevronDown className="w-4 h-4 text-brand-charcoal/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Product Grid / Empty State */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="bg-white rounded-2xl aspect-square border border-brand-linen" />
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-linen p-12 flex flex-col items-center justify-center text-center">
            <PackageSearch className="w-16 h-16 text-brand-charcoal/20 mb-4" />
            <h3 className="text-xl font-bold text-brand-charcoal mb-2">No products found</h3>
            <p className="text-brand-charcoal/60 mb-6">Try adjusting your faceted filters or search query.</p>
            <button onClick={clearAllFilters} className="bg-brand-orange text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {sortedProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`} className="group bg-white rounded-2xl overflow-hidden border border-brand-linen hover:border-brand-orange/40 hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="aspect-square bg-brand-bg relative flex items-center justify-center overflow-hidden">
                  <Image 
                    src={product.image || "/og-image.jpg"} 
                    alt={product.name} 
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover" 
                  />
                  {/* Tags */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.bulkDiscountAvailable && (
                      <div className="bg-brand-orange text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm w-max">
                        <Tag className="w-3 h-3" /> Bulk Discount
                      </div>
                    )}
                    {product.isBlend && !product.category.toLowerCase().includes("essential") && !product.name.toLowerCase().includes("essential oil") && (
                      <div className="bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm w-max">
                        Blend
                      </div>
                    )}
                  </div>
                </div>
                {/* Product Info */}
                <div className="p-3 md:p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40 line-clamp-1">{product.category}</span>
                    {product.scentFamily && <span className="text-[9px] md:text-[10px] font-medium text-brand-orange bg-orange-50 px-2 py-0.5 rounded-full">{product.scentFamily}</span>}
                  </div>
                  <h2 className="font-semibold text-brand-charcoal mb-1 md:mb-2 line-clamp-2 text-sm md:text-base leading-tight md:leading-snug group-hover:text-brand-orange transition-colors">{product.name}</h2>
                  <div className="mt-auto pt-2 md:pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 border-t border-brand-linen">
                    <span className="font-bold text-base md:text-lg text-brand-charcoal">₹{product.price}</span>
                    {product.maxDiscount > 0 && (
                      <span className="text-[10px] md:text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded self-start sm:self-auto">Up to {product.maxDiscount}%</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Modals/Sheets */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-charcoal/40 backdrop-blur-sm md:hidden flex flex-col justify-end"
            onClick={() => setIsMobileFilterOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col"
            >
              <div className="p-4 border-b border-brand-linen flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
                <h3 className="text-lg font-bold text-brand-charcoal">Filters</h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 -mr-2 text-brand-charcoal/50">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-8">
                
                {/* Mobile Categories inside Filter */}
                <div>
                  <h4 className="font-bold text-brand-charcoal mb-4">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                          selectedCategories.includes(cat) ? "bg-brand-orange text-white border-brand-orange" : "bg-stone-50 text-brand-charcoal border-brand-linen"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Scent Family */}
                <div>
                  <h4 className="font-bold text-brand-charcoal mb-4">Scent Family</h4>
                  <div className="flex flex-wrap gap-2">
                    {FAMILIES.map(family => (
                      <button
                        key={family}
                        onClick={() => toggleArrayItem(setSelectedFamilies, family)}
                        className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                          selectedFamilies.includes(family) ? "bg-brand-orange text-white border-brand-orange" : "bg-stone-50 text-brand-charcoal border-brand-linen"
                        }`}
                      >
                        {family}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Mobile Note Level */}
                <div>
                  <h4 className="font-bold text-brand-charcoal mb-4">Note Level</h4>
                  <div className="flex flex-wrap gap-2">
                    {NOTES.map(note => (
                      <button
                        key={note}
                        onClick={() => toggleArrayItem(setSelectedNotes, note)}
                        className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                          selectedNotes.includes(note) ? "bg-brand-orange text-white border-brand-orange" : "bg-stone-50 text-brand-charcoal border-brand-linen"
                        }`}
                      >
                        {note}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Application */}
                <div>
                  <h4 className="font-bold text-brand-charcoal mb-4">Application</h4>
                  <div className="flex flex-wrap gap-2">
                    {APPLICATIONS.map(app => (
                      <button
                        key={app}
                        onClick={() => toggleArrayItem(setSelectedApplications, app)}
                        className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                          selectedApplications.includes(app) ? "bg-brand-orange text-white border-brand-orange" : "bg-stone-50 text-brand-charcoal border-brand-linen"
                        }`}
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
              <div className="p-4 border-t border-brand-linen bg-white" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
                <div className="flex gap-3">
                  <button 
                    onClick={clearAllFilters}
                    className="flex-1 py-3.5 rounded-xl font-bold text-brand-charcoal bg-stone-100 active:scale-[0.98] transition-transform"
                  >
                    Clear All
                  </button>
                  <button 
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="flex-[2] py-3.5 rounded-xl font-bold text-white bg-brand-orange shadow-lg shadow-brand-orange/20 active:scale-[0.98] transition-transform"
                  >
                    Show Results
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isMobileSortOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-brand-charcoal/40 backdrop-blur-sm md:hidden flex flex-col justify-end"
            onClick={() => setIsMobileSortOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-t-3xl w-full overflow-hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="p-5 border-b border-brand-linen flex items-center justify-between">
                <h3 className="text-lg font-bold text-brand-charcoal">Sort by</h3>
                <button onClick={() => setIsMobileSortOpen(false)} className="p-2 -mr-2 text-brand-charcoal/50 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-2 pb-4">
                {[
                  { value: "recommended", label: "Recommended" },
                  { value: "price_asc", label: "Price: Low to High" },
                  { value: "discount_desc", label: "Highest Wholesale Discount %" }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setSortBy(option.value); setIsMobileSortOpen(false); }}
                    className={`w-full text-left px-5 py-4 font-medium flex items-center justify-between rounded-xl min-h-[56px] ${
                      sortBy === option.value ? "text-brand-orange bg-brand-orange/5" : "text-brand-charcoal"
                    }`}
                  >
                    {option.label}
                    {sortBy === option.value && <div className="w-2.5 h-2.5 rounded-full bg-brand-orange flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
