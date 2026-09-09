"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Filter, 
  ChevronDown, 
  Tag, 
  PackageSearch, 
  Search, 
  X, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Check, 
  Sparkles,
  ChevronRight,
  FolderOpen
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DEPARTMENTS, DISCIPLINE_HUBS, DisciplineConfig, getDepartmentForCategory } from "@/lib/taxonomy";

type Product = {
  id: string;
  name: string;
  department?: string;
  category: string;
  disciplines?: string[];
  price: number;
  bulkDiscountAvailable: boolean;
  maxDiscount: number;
  image: string;
  inStock?: boolean;
  isQuoteOnly?: boolean;
  scentFamily?: string;
  noteLevel?: string;
  isBlend?: boolean;
  applications?: string[];
  scentCollection?: string;
};

type PriceOption = "all" | "under_500" | "500_1500" | "1500_3000" | "over_3000" | "custom";

export default function ShopClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [facets, setFacets] = useState<{
    departments: Record<string, number>;
    categories: Record<string, number>;
    disciplines: Record<string, number>;
  } | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [sortBy, setSortBy] = useState("recommended");
  
  // Primary Taxonomy Filters
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Expanded department accordions in sidebar
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

  // Price & Stock
  const [priceOption, setPriceOption] = useState<PriceOption>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Mobile Modals
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);

  useEffect(() => {
    if (isMobileFilterOpen || isMobileSortOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileFilterOpen, isMobileSortOpen]);

  // Sync state from URL params
  useEffect(() => {
    const discParam = searchParams.get("discipline");
    const deptParam = searchParams.get("department");
    const catParam = searchParams.get("category");
    const qParam = searchParams.get("q");

    setSelectedDiscipline(discParam || null);
    setSelectedDepartment(deptParam ? decodeURIComponent(deptParam) : null);
    setSelectedCategory(catParam ? decodeURIComponent(catParam) : null);
    setSearchQuery(qParam ? decodeURIComponent(qParam) : "");

    if (deptParam) {
      setExpandedDepts(prev => ({ ...prev, [decodeURIComponent(deptParam)]: true }));
    } else if (catParam) {
      const decodedCat = decodeURIComponent(catParam);
      const parentDept = DEPARTMENTS.find(d => d.subcategories.includes(decodedCat));
      if (parentDept) {
        setExpandedDepts(prev => ({ ...prev, [parentDept.name]: true }));
      }
    }
  }, [searchParams]);

  // Progressive Chunk Loading (Infinite Scroll)
  const loadProducts = useCallback(async (pageToLoad: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      params.set("page", String(pageToLoad));
      params.set("limit", "48");

      if (selectedDiscipline) params.set("discipline", selectedDiscipline);
      if (selectedDepartment) params.set("department", selectedDepartment);
      if (selectedCategory) params.set("category", selectedCategory);
      if (searchQuery) params.set("q", searchQuery);
      if (priceOption !== "all") params.set("priceOption", priceOption);
      if (priceOption === "custom") {
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);
      }
      if (inStockOnly) params.set("inStockOnly", "true");
      if (sortBy) params.set("sortBy", sortBy);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      const newItems: Product[] = data.items || data.products || [];

      if (append) {
        setProducts(prev => [...prev, ...newItems]);
      } else {
        setProducts(newItems);
      }

      setTotalProducts(data.total ?? data.pagination?.total ?? newItems.length);
      setHasMore(data.pagination?.hasMore ?? (data.pagination?.hasNextPage ?? false));
      if (data.facets) {
        setFacets(data.facets);
      }
    } catch (err) {
      console.error("Failed to load products chunk:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedDiscipline, selectedDepartment, selectedCategory, searchQuery, priceOption, minPrice, maxPrice, inStockOnly, sortBy]);

  // Refetch page 1 on filter changes
  useEffect(() => {
    setPage(1);
    loadProducts(1, false);
  }, [loadProducts]);

  // IntersectionObserver for Infinite Scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
        setPage(prevPage => {
          const nextPage = prevPage + 1;
          loadProducts(nextPage, true);
          return nextPage;
        });
      }
    }, { rootMargin: "400px" });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadProducts]);

  // Dynamic Facets & Taxonomy Counts
  const taxonomyCounts = useMemo(() => {
    if (facets) {
      return {
        deptCounts: facets.departments || {},
        catCounts: facets.categories || {},
        discCounts: facets.disciplines || {}
      };
    }

    const deptCounts: Record<string, number> = {};
    const catCounts: Record<string, number> = {};
    const discCounts: Record<string, number> = {};

    products.forEach(p => {
      const dept = p.department || getDepartmentForCategory(p.category);
      if (dept) deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      if (p.category) catCounts[p.category] = (catCounts[p.category] || 0) + 1;
      if (p.disciplines) {
        p.disciplines.forEach(d => {
          discCounts[d] = (discCounts[d] || 0) + 1;
        });
      }
    });

    return { deptCounts, catCounts, discCounts };
  }, [facets, products]);

  // Active discipline object
  const activeDisciplineInfo: DisciplineConfig | undefined = useMemo(() => {
    return DISCIPLINE_HUBS.find(hub => hub.id === selectedDiscipline);
  }, [selectedDiscipline]);

  // Filter Handler Functions
  const setDiscipline = (id: string | null) => {
    setSelectedDiscipline(id);
    const params = new URLSearchParams(window.location.search);
    if (id) params.set("discipline", id);
    else params.delete("discipline");
    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  const setDepartment = (name: string | null) => {
    setSelectedDepartment(name);
    setSelectedCategory(null); // reset category when department changes
    const params = new URLSearchParams(window.location.search);
    if (name) {
      params.set("department", name);
      params.delete("category");
    } else {
      params.delete("department");
    }
    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  const setCategory = (name: string | null, parentDept?: string) => {
    setSelectedCategory(name);
    if (parentDept) setSelectedDepartment(parentDept);
    const params = new URLSearchParams(window.location.search);
    if (name) {
      params.set("category", name);
      if (parentDept) params.set("department", parentDept);
    } else {
      params.delete("category");
    }
    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  const toggleDeptExpand = (deptName: string) => {
    setExpandedDepts(prev => ({ ...prev, [deptName]: !prev[deptName] }));
  };

  const clearAllFilters = () => {
    setSelectedDiscipline(null);
    setSelectedDepartment(null);
    setSelectedCategory(null);
    setSearchQuery("");
    setPriceOption("all");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setIsMobileFilterOpen(false);
    router.push("/shop", { scroll: false });
  };

  // Products are already multi-axis filtered and sorted server-side
  const sortedProducts = products;

  const activeFilterCount = 
    (selectedDiscipline ? 1 : 0) +
    (selectedDepartment ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (priceOption !== "all" ? 1 : 0) + 
    (inStockOnly ? 1 : 0) +
    (searchQuery ? 1 : 0);

  // Active Page Title
  const activeTitle = useMemo(() => {
    if (activeDisciplineInfo) return activeDisciplineInfo.name;
    if (selectedCategory) return selectedCategory;
    if (selectedDepartment) return selectedDepartment;
    if (searchQuery) return `Search: "${searchQuery}"`;
    return "All Wholesale Products";
  }, [activeDisciplineInfo, selectedCategory, selectedDepartment, searchQuery]);

  return (
    <div className="pt-6 md:pt-8 pb-16 px-4 md:px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
      
      {/* Top Craft Discipline Switcher Bar */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-brand-linen shadow-sm">
        <div className="flex items-center gap-2 mb-2 px-1">
          <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal/60">
            Shop by Craft Discipline
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setDiscipline(null)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              selectedDiscipline === null
                ? "bg-brand-charcoal text-white shadow-sm"
                : "bg-brand-bg text-brand-charcoal/70 hover:text-brand-charcoal hover:bg-stone-100"
            }`}
          >
            All Disciplines
          </button>
          {DISCIPLINE_HUBS.map(hub => {
            const isSelected = selectedDiscipline === hub.id;
            return (
              <button
                key={hub.id}
                onClick={() => setDiscipline(isSelected ? null : hub.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? "bg-brand-orange text-white border-brand-orange shadow-md shadow-brand-orange/20"
                    : "bg-white text-brand-charcoal/80 border-brand-linen hover:border-brand-orange/40 hover:text-brand-charcoal"
                }`}
              >
                <span>{hub.icon}</span>
                <span>{hub.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-brand-bg text-brand-charcoal/50"}`}>
                  {taxonomyCounts.discCounts[hub.id] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Discipline Hero Banner (Only shown when a studio is selected) */}
      {activeDisciplineInfo && (
        <div className={`p-6 md:p-8 rounded-3xl border ${activeDisciplineInfo.badgeBg} ${activeDisciplineInfo.borderCol} relative overflow-hidden transition-all`}>
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{activeDisciplineInfo.icon}</span>
              <span className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border bg-white ${activeDisciplineInfo.badgeText} ${activeDisciplineInfo.borderCol}`}>
                Curated Studio
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-brand-charcoal mb-2">
              {activeDisciplineInfo.name}
            </h2>
            <p className="text-sm font-semibold text-brand-charcoal/70 mb-2">
              {activeDisciplineInfo.tagline}
            </p>
            <p className="text-xs md:text-sm text-brand-charcoal/60 leading-relaxed">
              {activeDisciplineInfo.description}
            </p>
          </div>
          <button 
            onClick={() => setDiscipline(null)}
            className="absolute top-4 right-4 text-xs font-semibold text-brand-charcoal/50 hover:text-brand-charcoal flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-brand-linen"
          >
            Exit Studio <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Content Layout: Sidebar + Product Grid */}
      <div className="flex flex-col md:flex-row gap-8 w-full">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block w-68 shrink-0">
          <div className="bg-white rounded-2xl p-5 border border-brand-linen sticky top-24 shadow-sm space-y-6 max-h-[calc(100vh-7rem)] overflow-y-auto">
            
            {/* Filter Header */}
            <div className="flex items-center justify-between pb-3 border-b border-brand-linen">
              <div className="flex items-center gap-2 font-bold font-serif text-brand-charcoal text-base">
                <Filter className="w-4 h-4 text-brand-orange" /> Filters
              </div>
              {activeFilterCount > 0 && (
                <button 
                  onClick={clearAllFilters} 
                  className="text-xs font-semibold text-brand-orange hover:underline"
                >
                  Clear All ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Active Filters Pill List */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-3 border-b border-brand-linen">
                {selectedDiscipline && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-brand-orange/10 text-brand-orange px-2 py-1 rounded-lg">
                    {activeDisciplineInfo?.name}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setDiscipline(null)} />
                  </span>
                )}
                {selectedDepartment && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-brand-bg text-brand-charcoal px-2 py-1 rounded-lg border border-brand-linen">
                    Dept: {selectedDepartment}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setDepartment(null)} />
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-900 px-2 py-1 rounded-lg border border-amber-200">
                    {selectedCategory}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setCategory(null)} />
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-brand-bg text-brand-charcoal px-2 py-1 rounded-lg border border-brand-linen">
                    &ldquo;{searchQuery}&rdquo;
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                  </span>
                )}
              </div>
            )}

            {/* Departments & Sub-categories Accordion */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-brand-charcoal/60">
                  Departments
                </h4>
                {selectedDepartment && (
                  <button 
                    onClick={() => setDepartment(null)}
                    className="text-[10px] text-brand-orange hover:underline font-semibold"
                  >
                    View All
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                {DEPARTMENTS.map((dept) => {
                  const isDeptSelected = selectedDepartment === dept.name;
                  const isExpanded = expandedDepts[dept.name] ?? isDeptSelected;
                  const count = taxonomyCounts.deptCounts[dept.name] || 0;

                  return (
                    <div key={dept.name} className="rounded-xl border border-brand-linen/70 overflow-hidden bg-brand-bg/30">
                      <div 
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                          isDeptSelected 
                            ? "bg-brand-charcoal text-white font-bold" 
                            : "text-brand-charcoal hover:bg-brand-bg"
                        }`}
                        onClick={() => toggleDeptExpand(dept.name)}
                      >
                        <span 
                          className="flex-1 text-left truncate mr-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDepartment(isDeptSelected ? null : dept.name);
                          }}
                        >
                          {dept.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isDeptSelected ? "bg-white/20 text-white" : "bg-white text-brand-charcoal/50"}`}>
                            {count}
                          </span>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </div>

                      {/* Sub-categories */}
                      {isExpanded && (
                        <div className="py-1 px-2 space-y-0.5 bg-white border-t border-brand-linen/40">
                          {dept.subcategories.map(sub => {
                            const isSubSelected = selectedCategory === sub;
                            const subCount = taxonomyCounts.catCounts[sub] || 0;
                            return (
                              <button
                                key={sub}
                                onClick={() => setCategory(isSubSelected ? null : sub, dept.name)}
                                className={`w-full flex items-center justify-between px-2 py-1 rounded-lg text-left text-[11px] transition-colors ${
                                  isSubSelected
                                    ? "bg-brand-orange/10 text-brand-orange font-bold"
                                    : "text-brand-charcoal/70 hover:text-brand-charcoal hover:bg-brand-bg"
                                }`}
                              >
                                <span className="truncate mr-1">{sub}</span>
                                <span className="text-[10px] text-brand-charcoal/40 shrink-0">
                                  {subCount}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price Filter Brackets */}
            <div className="pt-4 border-t border-brand-linen/60">
              <h4 className="font-bold text-xs uppercase tracking-wider text-brand-charcoal/60 mb-3">
                Price Range
              </h4>
              <div className="space-y-1.5 text-xs text-brand-charcoal">
                {[
                  { id: "all", label: "All Prices" },
                  { id: "under_500", label: "Under ₹500" },
                  { id: "500_1500", label: "₹500 – ₹1,500" },
                  { id: "1500_3000", label: "₹1,500 – ₹3,000" },
                  { id: "over_3000", label: "₹3,000+" },
                  { id: "custom", label: "Custom Range" },
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 cursor-pointer group py-0.5">
                    <input 
                      type="radio" 
                      name="priceOption" 
                      checked={priceOption === opt.id} 
                      onChange={() => setPriceOption(opt.id as PriceOption)} 
                      className="text-brand-orange focus:ring-brand-orange accent-brand-orange shrink-0 cursor-pointer" 
                    /> 
                    <span className={`transition-colors ${priceOption === opt.id ? "font-bold text-brand-charcoal" : "text-brand-charcoal/70 group-hover:text-brand-charcoal"}`}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Custom Min/Max Inputs */}
              {priceOption === "custom" && (
                <div className="mt-3 pt-3 border-t border-brand-linen/60 flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase text-brand-charcoal/50 block mb-1">Min ₹</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={minPrice} 
                      onChange={(e) => setMinPrice(e.target.value)} 
                      className="w-full bg-brand-bg border border-brand-linen rounded-lg px-2 py-1 text-xs font-semibold text-brand-charcoal focus:outline-none focus:border-brand-orange" 
                    />
                  </div>
                  <span className="text-brand-charcoal/40 text-xs mt-4">–</span>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase text-brand-charcoal/50 block mb-1">Max ₹</label>
                    <input 
                      type="number" 
                      placeholder="5000" 
                      value={maxPrice} 
                      onChange={(e) => setMaxPrice(e.target.value)} 
                      className="w-full bg-brand-bg border border-brand-linen rounded-lg px-2 py-1 text-xs font-semibold text-brand-charcoal focus:outline-none focus:border-brand-orange" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Availability Filter */}
            <div className="pt-4 border-t border-brand-linen/60">
              <h4 className="font-bold text-xs uppercase tracking-wider text-brand-charcoal/60 mb-2">
                Availability
              </h4>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={inStockOnly} 
                  onChange={(e) => setInStockOnly(e.target.checked)} 
                  className="rounded text-brand-orange focus:ring-brand-orange accent-brand-orange shrink-0 cursor-pointer" 
                /> 
                <span className="text-xs font-medium text-brand-charcoal/80 group-hover:text-brand-charcoal transition-colors">
                  In Stock Only
                </span>
              </label>
            </div>

          </div>
        </aside>

        {/* Main Product Grid Area */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-6">
          
          {/* Mobile Filter & Search Header */}
          <div className="md:hidden flex flex-col gap-3">
            <form action="/shop" method="GET" className="relative w-full">
              <input 
                type="text" 
                name="q" 
                placeholder="Search raw materials, moulds..." 
                defaultValue={searchQuery}
                className="w-full bg-white border border-brand-linen rounded-2xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-orange shadow-sm" 
              />
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-charcoal/40" />
            </form>

            {/* Sticky Mobile Filter & Sort Bar */}
            <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-y border-brand-linen py-3 -mx-4 px-4 flex items-center justify-between shadow-sm">
              <button 
                onClick={() => setIsMobileFilterOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 border-r border-brand-linen text-sm font-semibold text-brand-charcoal active:text-brand-orange"
              >
                <SlidersHorizontal className="w-4 h-4" /> Filter
                {activeFilterCount > 0 && (
                  <span className="bg-brand-orange text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
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
          </div>

          {/* Desktop Header Bar (Title & Sort Dropdown) */}
          <div className="hidden md:flex justify-between items-center bg-white p-4 px-6 rounded-2xl border border-brand-linen gap-4 shadow-sm">
            <div>
              <h1 className="text-xl font-bold font-serif text-brand-charcoal">
                {activeTitle}
              </h1>
              <p className="text-xs text-brand-charcoal/50 font-medium mt-0.5">
                {loading ? "Searching..." : (
                  <>
                    {totalProducts.toLocaleString()} product{totalProducts !== 1 ? "s" : ""}
                    {searchQuery && <> for &ldquo;{searchQuery}&rdquo;</>}
                    {selectedDepartment && !selectedCategory && !searchQuery && ` in ${selectedDepartment}`}
                  </>
                )}
              </p>
            </div>

            {/* Sort By Dropdown */}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-brand-charcoal/60 font-medium text-xs uppercase tracking-wider">Sort by:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-brand-bg border border-brand-linen rounded-xl pl-4 pr-10 py-2 text-sm font-semibold text-brand-charcoal focus:outline-none focus:border-brand-orange cursor-pointer shadow-sm"
                >
                  {searchQuery
                    ? <option value="recommended">Relevance</option>
                    : <option value="recommended">Featured / Bestselling</option>
                  }
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="discount_desc">Highest Discount %</option>
                </select>
                <ChevronDown className="w-4 h-4 text-brand-charcoal/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-brand-linen animate-pulse h-72" />
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-linen p-12 flex flex-col items-center justify-center text-center shadow-sm">
              <PackageSearch className="w-16 h-16 text-brand-charcoal/20 mb-4" />
              {searchQuery ? (
                <>
                  <h3 className="text-xl font-bold text-brand-charcoal mb-2 font-serif">
                    No results for &ldquo;{searchQuery}&rdquo;
                  </h3>
                  <p className="text-brand-charcoal/60 mb-2 text-sm max-w-sm">
                    Check your spelling, try a more general term, or browse by category below.
                  </p>
                  <p className="text-brand-charcoal/40 mb-6 text-xs max-w-sm">
                    Tip: try &ldquo;fragrance oil&rdquo;, &ldquo;silicone mould&rdquo;, or &ldquo;candle wax&rdquo;
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-brand-charcoal mb-2 font-serif">No products match your filters</h3>
                  <p className="text-brand-charcoal/60 mb-6 text-sm">Try choosing another craft studio, broadening your price range, or clearing active filters.</p>
                </>
              )}
              <button
                onClick={clearAllFilters}
                className="bg-brand-orange text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-terracotta transition-colors shadow-md shadow-brand-orange/20 text-sm"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {sortedProducts.map((product) => (
                  <Link 
                    key={product.id} 
                    href={`/products/${product.id}`} 
                    className="group bg-white rounded-2xl overflow-hidden border border-brand-linen hover:border-brand-orange/40 hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    <div className="aspect-square bg-brand-bg relative flex items-center justify-center overflow-hidden">
                      <Image 
                        src={product.image || "/og-image.jpg"} 
                        alt={product.name} 
                        fill 
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      {product.isQuoteOnly || product.price === 0 ? (
                        <div className="absolute top-3 left-3 bg-amber-700/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                          Quote Only
                        </div>
                      ) : product.bulkDiscountAvailable ? (
                        <div className="absolute top-3 left-3 bg-brand-orange text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                          <Tag className="w-3 h-3" /> Bulk Tier
                        </div>
                      ) : null}
                    </div>

                    <div className="p-3 md:p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-brand-orange line-clamp-1">
                          {product.category}
                        </span>
                      </div>
                      <h2 className="font-semibold text-brand-charcoal mb-1 md:mb-2 line-clamp-2 text-sm md:text-base leading-tight md:leading-snug group-hover:text-brand-orange transition-colors">
                        {product.name}
                      </h2>
                      <div className="mt-auto pt-2 md:pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 border-t border-brand-linen">
                        {product.isQuoteOnly || product.price === 0 ? (
                          <span className="font-semibold text-xs md:text-sm text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                            Quote on Request
                          </span>
                        ) : (
                          <>
                            <span className="font-bold text-base md:text-lg text-brand-charcoal">₹{product.price}</span>
                            {product.maxDiscount > 0 && (
                              <span className="text-[10px] md:text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded self-start sm:self-auto">
                                Up to {product.maxDiscount}% off
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Infinite Scroll Sentinel & Progressive Chunk Loader */}
              <div ref={sentinelRef} className="w-full py-8 flex flex-col items-center justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-brand-charcoal/70 bg-white px-5 py-2.5 rounded-full border border-brand-linen shadow-sm">
                    <div className="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                    Loading more craft supplies...
                  </div>
                )}
                {!hasMore && sortedProducts.length > 0 && (
                  <div className="text-xs font-semibold text-brand-charcoal/40 bg-brand-linen/30 px-4 py-1.5 rounded-full">
                    ✓ You&apos;ve viewed all {totalProducts} products
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer Modals */}
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
              <div className="p-4 px-6 border-b border-brand-linen flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
                <h3 className="text-lg font-bold font-serif text-brand-charcoal">Filter Catalog</h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 -mr-2 text-brand-charcoal/50 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* Craft Studios Mobile */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-brand-charcoal/60 mb-3">Craft Studio</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {DISCIPLINE_HUBS.map(hub => (
                      <button
                        key={hub.id}
                        onClick={() => {
                          setDiscipline(selectedDiscipline === hub.id ? null : hub.id);
                        }}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-colors ${
                          selectedDiscipline === hub.id
                            ? "border-brand-orange bg-orange-50 text-brand-orange font-bold"
                            : "border-brand-linen text-brand-charcoal"
                        }`}
                      >
                        <span className="text-xl">{hub.icon}</span>
                        <span className="text-xs font-semibold">{hub.shortName}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Departments Mobile */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-brand-charcoal/60 mb-3">Departments</h4>
                  <div className="space-y-1.5">
                    {DEPARTMENTS.map(dept => (
                      <button
                        key={dept.name}
                        onClick={() => {
                          setDepartment(selectedDepartment === dept.name ? null : dept.name);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                          selectedDepartment === dept.name
                            ? "border-brand-charcoal bg-brand-charcoal text-white font-bold"
                            : "border-brand-linen text-brand-charcoal"
                        }`}
                      >
                        <span>{dept.name}</span>
                        <span>{taxonomyCounts.deptCounts[dept.name] || 0}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Brackets Mobile */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-brand-charcoal/60 mb-3">Price Range</h4>
                  <div className="space-y-2">
                    {[
                      { id: "all", label: "All Prices" },
                      { id: "under_500", label: "Under ₹500" },
                      { id: "500_1500", label: "₹500 – ₹1,500" },
                      { id: "1500_3000", label: "₹1,500 – ₹3,000" },
                      { id: "over_3000", label: "₹3,000+" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setPriceOption(opt.id as PriceOption)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium flex items-center justify-between min-h-[48px] ${
                          priceOption === opt.id ? "border-brand-orange bg-orange-50 text-brand-orange font-bold" : "border-brand-linen text-brand-charcoal"
                        }`}
                      >
                        {opt.label}
                        {priceOption === opt.id && <Check className="w-4 h-4 text-brand-orange" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Mobile */}
                <div className="pt-4 border-t border-brand-linen">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-brand-charcoal/60 mb-3">Availability</h4>
                  <label className="flex items-center gap-3 p-3 border border-brand-linen rounded-xl cursor-pointer min-h-[48px]">
                    <input 
                      type="checkbox" 
                      checked={inStockOnly} 
                      onChange={(e) => setInStockOnly(e.target.checked)} 
                      className="rounded text-brand-orange accent-brand-orange w-5 h-5 shrink-0" 
                    /> 
                    <span className="text-sm font-semibold text-brand-charcoal">In Stock Only</span>
                  </label>
                </div>

              </div>

              <div className="p-4 px-6 border-t border-brand-linen bg-white" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
                <div className="flex gap-3">
                  <button 
                    onClick={clearAllFilters}
                    className="flex-1 py-3.5 rounded-xl font-bold text-brand-charcoal bg-stone-100 min-h-[50px] active:scale-[0.98] transition-transform"
                  >
                    Clear All
                  </button>
                  <button 
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="flex-[2] py-3.5 rounded-xl font-bold text-white bg-brand-orange shadow-lg shadow-brand-orange/20 min-h-[50px] active:scale-[0.98] transition-transform"
                  >
                    Show Results ({totalProducts})
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
                <h3 className="text-lg font-bold font-serif text-brand-charcoal">Sort By</h3>
                <button onClick={() => setIsMobileSortOpen(false)} className="p-2 -mr-2 text-brand-charcoal/50 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-2 pb-4">
                {[
                  { value: "recommended", label: "Featured / Bestselling" },
                  { value: "price_asc", label: "Price: Low to High" },
                  { value: "price_desc", label: "Price: High to Low" },
                  { value: "newest", label: "Newest Arrivals" },
                  { value: "discount_desc", label: "Highest Wholesale Discount %" }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setSortBy(option.value); setIsMobileSortOpen(false); }}
                    className={`w-full text-left px-5 py-4 font-medium flex items-center justify-between rounded-xl min-h-[56px] ${
                      sortBy === option.value ? "text-brand-orange bg-brand-orange/5 font-bold" : "text-brand-charcoal"
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
