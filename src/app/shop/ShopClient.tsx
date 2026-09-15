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
  FolderOpen,
  Columns2,
  Columns3,
  Columns4,
  LayoutGrid
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
  
  // Grid Density / Products per row (Default 4)
  const [gridCols, setGridCols] = useState<number>(4);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ekora_shop_grid_cols");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if ([2, 3, 4, 5].includes(parsed)) setGridCols(parsed);
      }
    } catch (e) {}
  }, []);

  const handleSetGridCols = (cols: number) => {
    setGridCols(cols);
    try {
      localStorage.setItem("ekora_shop_grid_cols", String(cols));
    } catch (e) {}
  };

  // Primary Taxonomy Filters — initialized from URL immediately to avoid a double-fetch
  // on first page load (reading searchParams in useState initializer prevents the race
  // condition where loadProducts fires before the sync useEffect sets state).
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>(
    () => searchParams.get("discipline") || null
  );
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    () => searchParams.get("department") ? decodeURIComponent(searchParams.get("department")!) : null
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    () => searchParams.get("category") ? decodeURIComponent(searchParams.get("category")!) : null
  );
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q") ? decodeURIComponent(searchParams.get("q")!) : ""
  );
  
  // Expanded department accordions in filter drawer
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>(() => {
    const deptParam = searchParams.get("department");
    const catParam = searchParams.get("category");
    if (deptParam) return { [decodeURIComponent(deptParam)]: true };
    if (catParam) {
      const decodedCat = decodeURIComponent(catParam);
      const parentDept = DEPARTMENTS.find(d => d.subcategories.includes(decodedCat));
      if (parentDept) return { [parentDept.name]: true };
    }
    return {};
  });

  // Price & Stock
  const [priceOption, setPriceOption] = useState<PriceOption>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Concise Filter Drawer State (Expands on click)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);

  useEffect(() => {
    if (isFilterDrawerOpen || isMobileSortOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isFilterDrawerOpen, isMobileSortOpen]);

  // Keep state in sync when URL changes (e.g. browser back/forward or programmatic navigation)
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
      if (data.facets) setFacets(data.facets);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedDiscipline, selectedDepartment, selectedCategory, searchQuery, priceOption, minPrice, maxPrice, inStockOnly, sortBy]);

  // Reset pagination on filter or sort change
  useEffect(() => {
    setPage(1);
    loadProducts(1, false);
  }, [loadProducts]);

  // Infinite Scroll Trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setPage(prev => {
            const next = prev + 1;
            loadProducts(next, true);
            return next;
          });
        }
      },
      { threshold: 0.1, rootMargin: "300px" }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [hasMore, loading, loadingMore, loadProducts]);

  // Dynamic Facet Counts
  const taxonomyCounts = useMemo(() => {
    const discCounts: Record<string, number> = facets?.disciplines || {};
    const deptCounts: Record<string, number> = facets?.departments || {};
    const catCounts: Record<string, number> = facets?.categories || {};

    if (!facets) {
      products.forEach(p => {
        if (p.disciplines) {
          p.disciplines.forEach(d => {
            discCounts[d] = (discCounts[d] || 0) + 1;
          });
        }
        if (p.department) {
          deptCounts[p.department] = (deptCounts[p.department] || 0) + 1;
        }
        if (p.category) {
          catCounts[p.category] = (catCounts[p.category] || 0) + 1;
        }
      });
    }

    return { discCounts, deptCounts, catCounts };
  }, [products, facets]);

  const activeDisciplineInfo = useMemo(() => {
    if (!selectedDiscipline) return null;
    return DISCIPLINE_HUBS.find(h => h.id === selectedDiscipline) || null;
  }, [selectedDiscipline]);

  // URL State Mutators
  const setDiscipline = (discId: string | null) => {
    setSelectedDiscipline(discId);
    const params = new URLSearchParams(window.location.search);
    if (discId) {
      params.set("discipline", discId);
    } else {
      params.delete("discipline");
    }
    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  const setDepartment = (deptName: string | null) => {
    setSelectedDepartment(deptName);
    setSelectedCategory(null);
    const params = new URLSearchParams(window.location.search);
    if (deptName) {
      params.set("department", encodeURIComponent(deptName));
      params.delete("category");
    } else {
      params.delete("department");
      params.delete("category");
    }
    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  const setCategory = (catName: string | null) => {
    setSelectedCategory(catName);
    const params = new URLSearchParams(window.location.search);
    if (catName) {
      params.set("category", encodeURIComponent(catName));
    } else {
      params.delete("category");
    }
    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  const setSearch = (term: string) => {
    setSearchQuery(term);
    const params = new URLSearchParams(window.location.search);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
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
    setIsFilterDrawerOpen(false);
    router.push("/shop", { scroll: false });
  };

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

  // Dynamic Grid Class generator based on column selection
  const getGridColsClass = () => {
    switch (gridCols) {
      case 2:
        return "grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6";
      case 3:
        return "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6";
      case 5:
        return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5";
      case 4:
      default:
        return "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6";
    }
  };

  return (
    <div className="pt-4 md:pt-6 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-5">
      
      {/* ========================================================================= */}
      {/* CONCISE TOP TOOLBAR: TITLE, FILTERS BUTTON, SEARCH, SORT & ROW SELECTOR */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-stone-200/80">
          
          {/* Left: Title & Product Count */}
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl md:text-2xl font-bold font-serif text-stone-900 tracking-tight">
              {activeTitle}
            </h1>
            <span className="text-xs md:text-sm font-medium text-stone-500">
              {loading ? (
                "Searching..."
              ) : (
                `${totalProducts.toLocaleString()} product${totalProducts !== 1 ? "s" : ""}`
              )}
            </span>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 ml-auto flex-wrap">
            
            {/* In-Shop Search Input */}
            <div className="w-48 sm:w-60 md:w-68">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const input = form.elements.namedItem("shop-search") as HTMLInputElement;
                  if (input) {
                    setSearch(input.value.trim());
                  }
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  name="shop-search"
                  defaultValue={searchQuery}
                  key={searchQuery}
                  placeholder="Search products..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-7 py-2 text-xs font-medium focus:outline-none focus:border-amber-600 focus:bg-white transition-all shadow-2xs"
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 text-stone-400" />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 text-stone-400 hover:text-stone-700 p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : null}
              </form>
            </div>

            {/* 1. Concise Filter Button (Expands on click) */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                activeFilterCount > 0
                  ? "bg-amber-50 border-amber-300 text-amber-900 shadow-xs"
                  : "bg-white border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50 shadow-2xs"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* 2. Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
                className="appearance-none bg-white border border-stone-200 hover:border-stone-400 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-stone-800 focus:outline-none focus:border-amber-600 cursor-pointer transition-colors shadow-2xs"
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
              <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 3. Products Per Row Switcher */}
            <div className="hidden sm:flex items-center gap-0.5 bg-stone-100 p-0.5 rounded-xl border border-stone-200/80">
              <button
                type="button"
                onClick={() => handleSetGridCols(2)}
                title="2 products per row"
                aria-label="2 products per row"
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  gridCols === 2 ? "bg-white text-stone-900 shadow-xs" : "text-stone-400 hover:text-stone-700"
                }`}
              >
                <Columns2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleSetGridCols(3)}
                title="3 products per row"
                aria-label="3 products per row"
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  gridCols === 3 ? "bg-white text-stone-900 shadow-xs" : "text-stone-400 hover:text-stone-700"
                }`}
              >
                <Columns3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleSetGridCols(4)}
                title="4 products per row"
                aria-label="4 products per row"
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  gridCols === 4 ? "bg-white text-stone-900 shadow-xs" : "text-stone-400 hover:text-stone-700"
                }`}
              >
                <Columns4 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleSetGridCols(5)}
                title="5 products per row"
                aria-label="5 products per row"
                className={`hidden xl:block p-1.5 rounded-lg text-xs transition-all ${
                  gridCols === 5 ? "bg-white text-stone-900 shadow-xs" : "text-stone-400 hover:text-stone-700"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Active Filter Pills Bar (Compact & Sleek) */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Active:</span>
            {selectedDiscipline && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                <span>{activeDisciplineInfo?.name || selectedDiscipline}</span>
                <button type="button" onClick={() => setDiscipline(null)} className="hover:text-amber-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedDepartment && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200 px-2.5 py-1 rounded-lg">
                <span>Dept: {selectedDepartment}</span>
                <button type="button" onClick={() => setDepartment(null)} className="hover:text-stone-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200 px-2.5 py-1 rounded-lg">
                <span>{selectedCategory}</span>
                <button type="button" onClick={() => setCategory(null)} className="hover:text-stone-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {priceOption !== "all" && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200 px-2.5 py-1 rounded-lg">
                <span>Price: {priceOption.replace('_', ' ')}</span>
                <button type="button" onClick={() => setPriceOption("all")} className="hover:text-stone-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200 px-2.5 py-1 rounded-lg">
                <span>In Stock Only</span>
                <button type="button" onClick={() => setInStockOnly(false)} className="hover:text-stone-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200 px-2.5 py-1 rounded-lg">
                <span>&ldquo;{searchQuery}&rdquo;</span>
                <button type="button" onClick={() => setSearch("")} className="hover:text-stone-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button 
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline ml-1"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MAIN FULL-WIDTH PRODUCT GRID (NO CLUTTER, EXPANSIVE 100% WIDTH) */}
      {/* ========================================================================= */}
      <div className="w-full">
        {loading ? (
          <div className={getGridColsClass()}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-stone-200 animate-pulse h-72" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <PackageSearch className="w-16 h-16 text-stone-300 mb-4" />
            {searchQuery ? (
              <>
                <h3 className="text-xl font-bold text-stone-900 mb-2 font-serif">
                  No results for &ldquo;{searchQuery}&rdquo;
                </h3>
                <p className="text-stone-600 mb-2 text-sm max-w-sm">
                  Check your spelling, try a more general term, or browse by category.
                </p>
                <p className="text-stone-400 mb-6 text-xs max-w-sm">
                  Tip: try &ldquo;fragrance oil&rdquo;, &ldquo;silicone mould&rdquo;, or &ldquo;candle wax&rdquo;
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-stone-900 mb-2 font-serif">No products match your filters</h3>
                <p className="text-stone-600 mb-6 text-sm">Try choosing another craft studio, broadening your price range, or clearing active filters.</p>
              </>
            )}
            <button
              onClick={clearAllFilters}
              className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors shadow-md text-sm"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className={getGridColsClass()}>
              {products.map((product) => (
                <Link 
                  key={product.id} 
                  href={`/products/${product.id}`} 
                  className="group bg-white rounded-2xl overflow-hidden border border-stone-200/90 hover:border-amber-600/50 hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div className="aspect-square bg-[#fbfaf8] relative flex items-center justify-center p-3 overflow-hidden">
                    <Image 
                      src={product.image || "/og-image.jpg"} 
                      alt={product.name} 
                      fill 
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300" 
                    />
                    {product.isQuoteOnly || product.price === 0 ? (
                      <div className="absolute top-3 left-3 bg-stone-800/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                        Quote Only
                      </div>
                    ) : product.bulkDiscountAvailable ? (
                      <div className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                        <Tag className="w-3 h-3" /> Bulk Tier
                      </div>
                    ) : null}
                  </div>

                  <div className="p-4 md:p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-amber-700 line-clamp-1">
                        {product.category}
                      </span>
                    </div>
                    <h2 className="font-semibold text-stone-900 mb-1 md:mb-2 line-clamp-2 text-sm md:text-base leading-tight md:leading-snug group-hover:text-amber-700 transition-colors">
                      {product.name}
                    </h2>
                    <div className="mt-auto pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 border-t border-stone-100">
                      {product.isQuoteOnly || product.price === 0 ? (
                        <span className="font-semibold text-xs md:text-sm text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                          Quote on Request
                        </span>
                      ) : (
                        <>
                          <span className="font-bold text-base md:text-lg text-stone-900">₹{product.price}</span>
                          {product.maxDiscount > 0 && (
                            <span className="text-[10px] md:text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md self-start sm:self-auto">
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

            {/* Infinite Scroll Sentinel */}
            <div ref={sentinelRef} className="w-full py-10 flex flex-col items-center justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2.5 text-sm font-semibold text-stone-700 bg-white px-5 py-2.5 rounded-full border border-stone-200 shadow-sm">
                  <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  Loading more craft supplies...
                </div>
              )}
              {!hasMore && products.length > 0 && (
                <div className="text-xs font-semibold text-stone-400 bg-stone-100 px-4 py-1.5 rounded-full">
                  ✓ You&apos;ve viewed all {totalProducts} products
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SLIDE-OVER FILTER DRAWER (EXPANDS ONLY ON CLICKING 'FILTERS') */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex justify-end"
            onClick={() => setIsFilterDrawerOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-5 px-6 border-b border-stone-200 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                  <h3 className="text-lg font-bold font-serif text-stone-900">Filter Catalog</h3>
                  {activeFilterCount > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && (
                    <button 
                      type="button"
                      onClick={clearAllFilters}
                      className="text-xs font-semibold text-stone-500 hover:text-amber-700 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => setIsFilterDrawerOpen(false)} 
                    className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                    aria-label="Close filter drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Filter Controls */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* 1. Craft Studios */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">
                      Craft Studio
                    </h4>
                    {selectedDiscipline && (
                      <button 
                        onClick={() => setDiscipline(null)}
                        className="text-[11px] text-amber-700 hover:underline font-semibold"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {DISCIPLINE_HUBS.map(hub => {
                      const isSelected = selectedDiscipline === hub.id;
                      return (
                        <button
                          key={hub.id}
                          onClick={() => setDiscipline(isSelected ? null : hub.id)}
                          className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                            isSelected
                              ? "border-amber-600 bg-amber-50/70 text-amber-900 font-bold shadow-xs"
                              : "border-stone-200 hover:border-stone-300 text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          <span className="text-xl">{hub.icon}</span>
                          <span className="text-xs font-semibold leading-snug">{hub.shortName}</span>
                          <span className="text-[10px] text-stone-400 font-normal">
                            {taxonomyCounts.discCounts[hub.id] || 0} products
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Departments & Subcategories */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">
                      Departments
                    </h4>
                    {selectedDepartment && (
                      <button 
                        onClick={() => setDepartment(null)}
                        className="text-[10px] text-amber-700 hover:underline font-semibold"
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
                        <div key={dept.name} className="border border-stone-200/80 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleDeptExpand(dept.name)}
                            className={`w-full p-2.5 px-3 flex items-center justify-between text-left text-xs font-semibold transition-colors ${
                              isDeptSelected ? "bg-stone-100 text-stone-950" : "hover:bg-stone-50 text-stone-700"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <ChevronRight className={`w-3.5 h-3.5 text-stone-400 transition-transform ${isExpanded ? "rotate-90 text-amber-600" : ""}`} />
                              <span className="truncate">{dept.name}</span>
                            </span>
                            <span className="text-[10px] text-stone-400 font-normal shrink-0 ml-1">
                              {count}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="bg-stone-50/60 p-2.5 pl-6 border-t border-stone-100 space-y-1">
                              <button
                                type="button"
                                onClick={() => setDepartment(dept.name)}
                                className={`block w-full text-left text-xs py-1 transition-colors ${
                                  isDeptSelected && !selectedCategory ? "text-amber-700 font-bold" : "text-stone-600 hover:text-stone-900"
                                }`}
                              >
                                All in {dept.name}
                              </button>
                              {dept.subcategories.map(sub => {
                                const isCatSelected = selectedCategory === sub;
                                const subCount = taxonomyCounts.catCounts[sub] || 0;
                                return (
                                  <button
                                    key={sub}
                                    type="button"
                                    onClick={() => {
                                      setSelectedDepartment(dept.name);
                                      setCategory(isCatSelected ? null : sub);
                                    }}
                                    className={`flex items-center justify-between w-full text-left text-xs py-1 transition-colors ${
                                      isCatSelected ? "text-amber-700 font-bold" : "text-stone-500 hover:text-stone-900"
                                    }`}
                                  >
                                    <span className="truncate">{sub}</span>
                                    {subCount > 0 && (
                                      <span className="text-[10px] text-stone-400 shrink-0 ml-1">
                                        {subCount}
                                      </span>
                                    )}
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

                {/* 3. Price Range */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 mb-3">
                    Price Range
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      { id: "all", label: "All Prices" },
                      { id: "under_500", label: "Under ₹500" },
                      { id: "500_1500", label: "₹500 – ₹1,500" },
                      { id: "1500_3000", label: "₹1,500 – ₹3,000" },
                      { id: "over_3000", label: "₹3,000+" },
                      { id: "custom", label: "Custom Range" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPriceOption(opt.id as PriceOption)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors ${
                          priceOption === opt.id 
                            ? "border-amber-600 bg-amber-50 text-amber-900 font-bold" 
                            : "border-stone-200 text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {priceOption === opt.id && <Check className="w-4 h-4 text-amber-600" />}
                      </button>
                    ))}
                  </div>

                  {priceOption === "custom" && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-200/80">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold uppercase text-stone-400 block mb-1">Min ₹</label>
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={minPrice} 
                          onChange={(e) => setMinPrice(e.target.value)} 
                          className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-amber-600" 
                        />
                      </div>
                      <span className="text-stone-400 text-xs mt-4">–</span>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold uppercase text-stone-400 block mb-1">Max ₹</label>
                        <input 
                          type="number" 
                          placeholder="5000" 
                          value={maxPrice} 
                          onChange={(e) => setMaxPrice(e.target.value)} 
                          className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-amber-600" 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Availability */}
                <div className="pt-4 border-t border-stone-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 mb-2.5">
                    Availability
                  </h4>
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={inStockOnly} 
                      onChange={(e) => setInStockOnly(e.target.checked)} 
                      className="rounded text-amber-600 accent-amber-600 w-4 h-4 shrink-0 cursor-pointer" 
                    /> 
                    <span className="text-xs font-semibold text-stone-800">
                      In Stock Only
                    </span>
                  </label>
                </div>

              </div>

              {/* Drawer Sticky Action Footer */}
              <div className="p-4 px-6 border-t border-stone-200 bg-stone-50 shrink-0">
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={clearAllFilters}
                    className="flex-1 py-3 rounded-xl font-bold text-xs text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 transition-colors shadow-2xs"
                  >
                    Reset All
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsFilterDrawerOpen(false)}
                    className="flex-[2] py-3 rounded-xl font-bold text-xs text-white bg-stone-900 hover:bg-black transition-colors shadow-sm"
                  >
                    View {totalProducts} Products
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
