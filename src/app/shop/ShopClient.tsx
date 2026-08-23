"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Filter, ChevronDown, Tag, PackageSearch, Search, X, SlidersHorizontal, ArrowUpDown, Check, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  bulkDiscountAvailable: boolean;
  maxDiscount: number;
  image: string;
  inStock?: boolean;
};

const ProductCard = React.memo(
  React.forwardRef<HTMLAnchorElement, { product: Product; index: number }>(
    ({ product, index }, ref) => {
      const isExternalImage = Boolean(product.image && product.image.startsWith("http"));

      return (
        <Link
          key={product.id}
          href={`/products/${product.id}`}
          ref={ref}
          className="group bg-white rounded-2xl overflow-hidden border border-brand-linen hover:border-brand-orange/40 hover:shadow-xl transition-all duration-300 flex flex-col"
        >
          <div className="aspect-square bg-brand-bg relative flex items-center justify-center overflow-hidden">
            <Image
              src={product.image || "/og-image.jpg"}
              alt={product.name}
              fill
              unoptimized={isExternalImage}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              loading={index < 8 ? "eager" : "lazy"}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loop
                target.src = "/og-image.jpg";
                target.srcset = "";
              }}
            />
            {product.bulkDiscountAvailable && (
              <div className="absolute top-3 left-3 bg-brand-orange text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                <Tag className="w-3 h-3" /> Bulk Discount
              </div>
            )}
          </div>
          <div className="p-3 md:p-5 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40 line-clamp-1">
                {product.category}
              </span>
              {product.inStock === false && (
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                  Sold Out
                </span>
              )}
            </div>
            <h2 className="font-semibold text-brand-charcoal mb-1 md:mb-2 line-clamp-2 text-sm md:text-base leading-tight md:leading-snug group-hover:text-brand-orange transition-colors">
              {product.name}
            </h2>
            <div className="mt-auto pt-2 md:pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 border-t border-brand-linen">
              <span className="font-bold text-base md:text-lg text-brand-charcoal">₹{product.price}</span>
              {product.maxDiscount > 0 && (
                <span className="text-[10px] md:text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded self-start sm:self-auto">
                  Up to {product.maxDiscount}%
                </span>
              )}
            </div>
          </div>
        </Link>
      );
    }
  )
);
ProductCard.displayName = "ProductCard";

type PriceOption = "all" | "under_500" | "500_1500" | "1500_3000" | "over_3000" | "custom";

export default function ShopClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  const [sortBy, setSortBy] = useState("recommended");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Luxury Filter States
  const [priceOption, setPriceOption] = useState<PriceOption>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductElementRef = useCallback((node: HTMLAnchorElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    }, { rootMargin: "200px" });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  useEffect(() => {
    if (isMobileFilterOpen || isMobileSortOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileFilterOpen, isMobileSortOpen]);

  // Initial Fetch & Filter changes (Reset to Page 1)
  useEffect(() => {
    let ignore = false;
    const fetchProducts = async () => {
      setLoading(true);
      setPage(1);
      
      const cat = searchParams.get("category");
      setSelectedCategory(cat || null);
      const q = searchParams.get("q");
      setSearchQuery(q ? decodeURIComponent(q) : "");

      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("limit", "24");
      if (cat) params.append("category", decodeURIComponent(cat));
      if (q) params.append("q", decodeURIComponent(q));
      params.append("sortBy", sortBy);
      if (inStockOnly) params.append("inStockOnly", "true");
      if (priceOption !== "all") params.append("priceOption", priceOption);
      if (priceOption === "custom") {
        if (minPrice) params.append("minPrice", minPrice);
        if (maxPrice) params.append("maxPrice", maxPrice);
      }

      try {
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        if (!ignore && data.products) {
          setProducts(data.products);
          setHasMore(data.pagination.hasNextPage);
          setTotalProducts(data.pagination.totalProducts);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchProducts();
    return () => { ignore = true; };
  }, [searchParams, sortBy, inStockOnly, priceOption, minPrice, maxPrice]);

  // Load More Pages
  useEffect(() => {
    if (page === 1) return; // handled by initial fetch
    let ignore = false;

    const loadMoreProducts = async () => {
      setLoadingMore(true);
      
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "24");
      
      const cat = searchParams.get("category");
      if (cat) params.append("category", decodeURIComponent(cat));
      const q = searchParams.get("q");
      if (q) params.append("q", decodeURIComponent(q));
      
      params.append("sortBy", sortBy);
      if (inStockOnly) params.append("inStockOnly", "true");
      if (priceOption !== "all") params.append("priceOption", priceOption);
      if (priceOption === "custom") {
        if (minPrice) params.append("minPrice", minPrice);
        if (maxPrice) params.append("maxPrice", maxPrice);
      }

      try {
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        if (!ignore && data.products) {
          setProducts(prev => {
            // Prevent duplicate appending
            const existingIds = new Set(prev.map(p => p.id));
            const newProducts = data.products.filter((p: Product) => !existingIds.has(p.id));
            return [...prev, ...newProducts];
          });
          setHasMore(data.pagination.hasNextPage);
        }
      } catch (err) {
        console.error("Failed to fetch more products:", err);
      } finally {
        if (!ignore) setLoadingMore(false);
      }
    };

    loadMoreProducts();
    return () => { ignore = true; };
  }, [page, searchParams, sortBy, inStockOnly, priceOption, minPrice, maxPrice]);

  const clearAllFilters = () => {
    setPriceOption("all");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setIsMobileFilterOpen(false);
  };
  
  const activeFilterCount = (priceOption !== "all" ? 1 : 0) + (inStockOnly ? 1 : 0);
  const activeCategoryTitle = selectedCategory ? decodeURIComponent(selectedCategory) : "All Products";

  return (
    <div className="pt-6 md:pt-8 pb-16 px-4 md:px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-8">
      
      {/* Desktop Sidebar Filters */}
      <aside className="hidden md:block w-64 shrink-0">
        <div className="bg-white rounded-2xl p-6 border border-brand-linen sticky top-24 shadow-sm">
          
          <div className="flex items-center justify-between pb-4 border-b border-brand-linen mb-6">
            <div className="flex items-center gap-2 font-bold font-serif text-brand-charcoal text-lg">
              <Filter className="w-4 h-4 text-brand-orange" /> Filters
            </div>
            {activeFilterCount > 0 && (
              <button 
                onClick={clearAllFilters} 
                className="text-xs font-semibold text-brand-orange hover:underline"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Price Filter Brackets */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-brand-charcoal/60 mb-3">
                Price Range
              </h4>
              <div className="space-y-2 text-sm text-brand-charcoal">
                {[
                  { id: "all", label: "All Prices" },
                  { id: "under_500", label: "Under ₹500" },
                  { id: "500_1500", label: "₹500 – ₹1,500" },
                  { id: "1500_3000", label: "₹1,500 – ₹3,000" },
                  { id: "over_3000", label: "₹3,000+" },
                  { id: "custom", label: "Custom Range" },
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer group py-1">
                    <input 
                      type="radio" 
                      name="priceOption" 
                      checked={priceOption === opt.id} 
                      onChange={() => setPriceOption(opt.id as PriceOption)} 
                      className="text-brand-orange focus:ring-brand-orange accent-brand-orange shrink-0 cursor-pointer" 
                    /> 
                    <span className={`text-sm transition-colors ${priceOption === opt.id ? "font-bold text-brand-charcoal" : "text-brand-charcoal/70 group-hover:text-brand-charcoal"}`}>
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
                      className="w-full bg-brand-bg border border-brand-linen rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-charcoal focus:outline-none focus:border-brand-orange" 
                    />
                  </div>
                  <span className="text-brand-charcoal/40 text-xs mt-4">-</span>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase text-brand-charcoal/50 block mb-1">Max ₹</label>
                    <input 
                      type="number" 
                      placeholder="5000" 
                      value={maxPrice} 
                      onChange={(e) => setMaxPrice(e.target.value)} 
                      className="w-full bg-brand-bg border border-brand-linen rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-charcoal focus:outline-none focus:border-brand-orange" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Availability Filter */}
            <div className="pt-4 border-t border-brand-linen/60">
              <h4 className="font-bold text-xs uppercase tracking-wider text-brand-charcoal/60 mb-3">
                Availability
              </h4>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={inStockOnly} 
                  onChange={(e) => setInStockOnly(e.target.checked)} 
                  className="rounded text-brand-orange focus:ring-brand-orange accent-brand-orange shrink-0 cursor-pointer" 
                /> 
                <span className="text-sm font-medium text-brand-charcoal/80 group-hover:text-brand-charcoal transition-colors">
                  In Stock Only
                </span>
              </label>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Product Area */}
      <div className="flex-1 w-full min-w-0 flex flex-col gap-6">
        {/* Mobile Filter & Search Header */}
        <div className="md:hidden flex flex-col gap-3">
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

        {/* Desktop Header Bar (Category Title & Sort Dropdown) */}
        <div className="hidden md:flex justify-between items-center bg-white p-4 px-6 rounded-2xl border border-brand-linen gap-4 shadow-sm">
          <div>
            <h1 className="text-xl font-bold font-serif text-brand-charcoal">
              {activeCategoryTitle}
            </h1>
            <p className="text-xs text-brand-charcoal/50 font-medium mt-0.5">
              Showing {totalProducts} wholesale products
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
                <option value="recommended">Featured / Bestselling</option>
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
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-linen p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <PackageSearch className="w-16 h-16 text-brand-charcoal/20 mb-4" />
            <h3 className="text-xl font-bold text-brand-charcoal mb-2 font-serif">No products match your filters</h3>
            <p className="text-brand-charcoal/60 mb-6 text-sm">Try broadening your price range or clearing active filters.</p>
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
              {products.map((product, index) => {
                const isLast = index === products.length - 1;
                return (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    index={index} 
                    ref={isLast ? lastProductElementRef : null} 
                  />
                );
              })}
            </div>
            
            {loadingMore && (
              <div className="flex justify-center items-center py-6 w-full">
                <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
              </div>
            )}
            
            {!hasMore && products.length > 0 && (
              <div className="text-center py-6 text-brand-charcoal/40 text-sm font-medium">
                You've reached the end of the catalog.
              </div>
            )}
          </>
        )}
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
                <h3 className="text-lg font-bold font-serif text-brand-charcoal">Filter Products</h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 -mr-2 text-brand-charcoal/50 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
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
