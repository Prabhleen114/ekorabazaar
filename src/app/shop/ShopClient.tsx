"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Filter, ChevronDown, Tag, PackageSearch } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  bulkDiscountAvailable: boolean;
  maxDiscount: number;
  image: string;
};

export default function ShopClient({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products] = useState<Product[]>(initialProducts);
  const [sortBy, setSortBy] = useState("recommended");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      const dbCategories = Array.from(new Set(initialProducts.map((p) => p.category))).filter(Boolean) as string[];
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
  }, [searchParams, initialProducts]);

  const allCategories = Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort();

  const toggleCategory = (cat: string) => {
    const newCategories = selectedCategories.includes(cat) 
      ? selectedCategories.filter(c => c !== cat) 
      : [...selectedCategories, cat];
    
    // Update URL to maintain state (SEO best practice)
    const params = new URLSearchParams(searchParams.toString());
    if (newCategories.length > 0) {
      params.set("category", newCategories.join(","));
    } else {
      params.delete("category");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const filteredProducts = products.filter(p => {
    if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
    if (searchQuery) {
      const qLower = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(qLower) && !p.category.toLowerCase().includes(qLower)) {
        return false;
      }
    }
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "discount_desc") return b.maxDiscount - a.maxDiscount;
    return 0; // recommended
  });

  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="bg-white rounded-2xl p-6 border border-brand-linen sticky top-24">
          <div className="flex items-center gap-2 font-bold font-serif text-brand-charcoal mb-6 text-xl">
            <Filter className="w-5 h-5" /> Filters
          </div>

          <div className="space-y-6">
            {/* Category Filter */}
            <div>
              <h4 className="font-semibold text-brand-charcoal mb-3 text-sm">Category</h4>
              <div className="space-y-2 text-sm text-brand-charcoal/70 max-h-64 overflow-y-auto pr-2">
                {allCategories.map((cat, idx) => (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="rounded text-brand-orange focus:ring-brand-orange shrink-0" 
                    /> 
                    <span className="line-clamp-1 group-hover:text-brand-orange transition-colors" title={cat}>{cat}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Clear Filters Button (If active) */}
            {selectedCategories.length > 0 && (
              <button 
                onClick={() => router.push('?', { scroll: false })}
                className="text-xs text-brand-orange hover:underline font-semibold"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Bar: Sort & Results */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-brand-linen mb-6">
          <h1 className="text-sm text-brand-charcoal/60 font-medium mb-4 sm:mb-0">
            {searchQuery ? (
              <>Showing results for &quot;<strong className="font-bold text-brand-charcoal">{searchQuery}</strong>&quot; ({sortedProducts.length})</>
            ) : (
              <>Showing <strong>{sortedProducts.length}</strong> wholesale products</>
            )}
          </h1>
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
                <option value="discount_desc">Highest Wholesale Discount %</option>
              </select>
              <ChevronDown className="w-4 h-4 text-brand-charcoal/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Product Grid / Empty State */}
        {sortedProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-linen p-12 flex flex-col items-center justify-center text-center">
            <PackageSearch className="w-16 h-16 text-brand-charcoal/20 mb-4" />
            <h3 className="text-xl font-bold text-brand-charcoal mb-2">No products found</h3>
            <p className="text-brand-charcoal/60 mb-6">Try adjusting your filters or search query.</p>
            <button 
              onClick={() => router.push('?', { scroll: false })}
              className="bg-brand-orange text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`} className="group bg-white rounded-2xl overflow-hidden border border-brand-linen hover:border-brand-orange/40 hover:shadow-lg transition-all duration-300 flex flex-col">
                {/* Image (Optimized) */}
                <div className="aspect-square bg-brand-bg relative flex items-center justify-center overflow-hidden">
                  <Image 
                    src={product.image || "/og-image.jpg"} 
                    alt={product.name} 
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover" 
                  />
                  {product.bulkDiscountAvailable && (
                    <div className="absolute top-3 left-3 bg-brand-orange text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                      <Tag className="w-3 h-3" /> Bulk Discount
                    </div>
                  )}
                </div>
                {/* Product Info */}
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40 mb-1">{product.category}</span>
                  <h2 className="font-semibold text-brand-charcoal mb-2 line-clamp-2 text-base">{product.name}</h2>
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="font-bold text-lg text-brand-charcoal">₹{product.price}</span>
                    {product.maxDiscount > 0 && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Up to {product.maxDiscount}% off</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
