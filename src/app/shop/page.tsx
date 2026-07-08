"use client";

import { useState, useEffect } from "react";
import BuyerNavbar from "@/components/BuyerNavbar";
import BuyerFooter from "@/components/BuyerFooter";
import Link from "next/link";
import { Filter, ChevronDown, Tag } from "lucide-react";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  bulkDiscountAvailable: boolean;
  maxDiscount: number;
  image: string;
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("recommended");

  useEffect(() => {
    // Fetch mock products
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "discount_desc") return b.maxDiscount - a.maxDiscount;
    return 0; // recommended
  });

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <BuyerNavbar />
      
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
                <div className="space-y-2 text-sm text-brand-charcoal/70">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-brand-orange focus:ring-brand-orange" /> Fragrances
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-brand-orange focus:ring-brand-orange" /> Resins
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-brand-orange focus:ring-brand-orange" /> Waxes
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-brand-orange focus:ring-brand-orange" /> Molds
                  </label>
                </div>
              </div>

              {/* Art Type Filter */}
              <div>
                <h4 className="font-semibold text-brand-charcoal mb-3 text-sm">Art Type</h4>
                <div className="space-y-2 text-sm text-brand-charcoal/70">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-brand-orange focus:ring-brand-orange" /> Candle Making
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-brand-orange focus:ring-brand-orange" /> Resin Geode
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-brand-orange focus:ring-brand-orange" /> Perfumery
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-brand-orange focus:ring-brand-orange" /> Soap Making
                  </label>
                </div>
              </div>

              {/* Stock Status */}
              <div>
                <h4 className="font-semibold text-brand-charcoal mb-3 text-sm">Stock Status</h4>
                <div className="space-y-2 text-sm text-brand-charcoal/70">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-brand-orange focus:ring-brand-orange" defaultChecked /> In Stock
                  </label>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Bar: Sort & Results */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-brand-linen mb-6">
            <p className="text-sm text-brand-charcoal/60 font-medium mb-4 sm:mb-0">
              Showing {products.length} products
            </p>
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

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="bg-white rounded-2xl h-80 border border-brand-linen"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`} className="group bg-white rounded-2xl overflow-hidden border border-brand-linen hover:border-brand-orange/40 hover:shadow-lg transition-all duration-300 flex flex-col">
                  {/* Image Placeholder */}
                  <div className="aspect-square bg-brand-bg relative flex items-center justify-center">
                    <span className="text-brand-charcoal/20 font-bold font-serif text-2xl">Ekora</span>
                    {product.bulkDiscountAvailable && (
                      <div className="absolute top-3 left-3 bg-brand-orange text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                        <Tag className="w-3 h-3" /> Bulk Discount
                      </div>
                    )}
                  </div>
                  {/* Product Info */}
                  <div className="p-5 flex-1 flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40 mb-1">{product.category}</span>
                    <h3 className="font-semibold text-brand-charcoal mb-2 line-clamp-2">{product.name}</h3>
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

      <BuyerFooter />
    </main>
  );
}
