"use client";

/**
 * NavbarSearchBox
 *
 * Supercharged B2B Autocomplete search box for Ekora Bazaar.
 * - Debounces keystrokes (250ms) before querying catalog suggestions.
 * - Rich suggestion cards with product thumbnails, wholesale pricing, and category badges.
 * - Trending B2B Wholesale queries displayed on focus when input is empty.
 * - Global Ctrl+K / Cmd+K shortcut listener to instantly focus search.
 * - Accessible ARIA combobox / listbox semantics with full keyboard navigation (Up, Down, Enter, Esc).
 * - Submits to /shop?q=... on Enter or Search button click.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, ArrowRight, Package, FolderOpen, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

export interface SuggestionItem {
  type: "product" | "category" | "trending";
  label: string;
  href: string;
  category?: string;
  price?: number;
  image?: string;
  badge?: string;
}

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

const DEFAULT_TRENDING: SuggestionItem[] = [
  { type: "trending", label: "Soy Wax 464 Wholesale", href: "/shop?q=Soy+Wax+464", badge: "High Demand" },
  { type: "trending", label: "Silicone Candle Moulds", href: "/shop?q=Silicone+Candle+Moulds", badge: "Top Category" },
  { type: "trending", label: "IFRA Fragrance Oils Bulk", href: "/shop?category=Fragrance+%26+Flavour+Oils", badge: "Lab-Tested" },
  { type: "trending", label: "Amber Glass Jars with Lids", href: "/shop?q=Amber+Glass+Jars", badge: "Packaging" },
  { type: "trending", label: "Melt & Pour Soap Base", href: "/shop?q=Melt+and+Pour+Soap+Base", badge: "Raw Material" },
  { type: "trending", label: "Mica Powder Pigments", href: "/shop?category=Colourants+%26+Pigments", badge: "Bulk" }
];

export default function NavbarSearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [trending, setTrending] = useState<SuggestionItem[]>(DEFAULT_TRENDING);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Fetch initial trending searches
  useEffect(() => {
    fetch("/api/search/suggestions?q=")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data?.trending) && data.trending.length > 0) {
          setTrending(data.trending);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (q: string) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const res = await fetch(
        "/api/search/suggestions?q=" + encodeURIComponent(q),
        { signal: abortRef.current.signal }
      );
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setIsOpen(true);
    } catch (e: any) {
      if (e.name !== "AbortError") setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input change with debounce
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < MIN_CHARS) {
      setSuggestions([]);
      setIsOpen(true);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val.trim());
    }, DEBOUNCE_MS);
  }

  // Submit search query
  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setIsOpen(false);
    setSuggestions([]);
    router.push("/shop?q=" + encodeURIComponent(q));
  }

  // Determine which list is currently navigable via arrow keys
  const activeItems = query.trim().length >= MIN_CHARS ? suggestions : trending;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      return;
    }

    if (!isOpen || activeItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, activeItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < activeItems.length) {
        e.preventDefault();
        router.push(activeItems[activeIndex].href);
        setIsOpen(false);
        setSuggestions([]);
      }
    }
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown = isOpen && (isFocused || query.trim().length > 0);

  return (
    <div ref={containerRef} className="hidden sm:block relative">
      <form onSubmit={handleSubmit} className="flex items-center relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          placeholder="Search materials, moulds, scents..."
          autoComplete="off"
          aria-label="Search wholesale products"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          className="bg-brand-bg border border-brand-linen rounded-full pl-4 pr-16 py-1.5 text-xs md:text-sm font-medium focus:outline-none focus:border-brand-orange w-48 md:w-56 transition-all duration-300 focus:w-72 lg:focus:w-80 shadow-inner"
        />

        {/* Clear input button */}
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            className="absolute right-8 text-brand-charcoal/40 hover:text-brand-charcoal transition-colors p-1"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          /* Ctrl+K shortcut badge when idle */
          !isFocused && (
            <span className="hidden md:inline-flex items-center gap-0.5 absolute right-8 text-[10px] text-brand-charcoal/40 bg-white border border-brand-linen rounded px-1.5 py-0.5 pointer-events-none font-mono font-bold shadow-xs">
              <span>Ctrl</span>
              <span>K</span>
            </span>
          )
        )}

        <button
          type="submit"
          className="absolute right-2.5 text-brand-charcoal/50 hover:text-brand-orange transition-colors p-1"
          aria-label="Submit search"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Rich Autocomplete Dropdown */}
      {showDropdown && (
        <div
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full mt-2 left-0 sm:-right-8 md:right-0 min-w-[320px] md:min-w-[380px] bg-white rounded-2xl border border-brand-linen shadow-2xl z-50 overflow-hidden"
        >
          {/* State 1: Empty or short query -> Show Trending B2B Searches */}
          {query.trim().length < MIN_CHARS && (
            <div className="p-3">
              <div className="flex items-center gap-1.5 px-2 py-1 mb-1 text-[11px] font-bold uppercase tracking-wider text-brand-charcoal/50">
                <TrendingUp className="w-3.5 h-3.5 text-brand-orange" />
                <span>Trending B2B Sourcing Searches</span>
              </div>
              <div className="space-y-1">
                {trending.map((item, i) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    role="option"
                    aria-selected={i === activeIndex}
                    onClick={() => {
                      setIsOpen(false);
                      setIsFocused(false);
                    }}
                    className={
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors " +
                      (i === activeIndex
                        ? "bg-brand-bg text-brand-orange"
                        : "text-brand-charcoal hover:bg-brand-bg hover:text-brand-orange")
                    }
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Sparkles className="w-3 h-3 text-brand-orange/70 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-brand-orange border border-brand-orange/20 shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* State 2: Active Query Loading */}
          {loading && suggestions.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-4 text-xs font-medium text-brand-charcoal/50">
              <span className="w-3 h-3 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></span>
              <span>Searching wholesale catalog...</span>
            </div>
          )}

          {/* State 3: Active Query No Results */}
          {!loading && suggestions.length === 0 && query.trim().length >= MIN_CHARS && (
            <div className="px-4 py-5 text-center text-xs text-brand-charcoal/60">
              <p className="font-semibold text-brand-charcoal">No direct matches found for &quot;{query}&quot;</p>
              <p className="mt-1 text-[11px] text-brand-charcoal/40">Try searching broader keywords like &quot;wax&quot;, &quot;mould&quot;, or &quot;oil&quot;</p>
            </div>
          )}

          {/* State 4: Suggestion Results */}
          {suggestions.length > 0 && (
            <div className="py-2 max-h-96 overflow-y-auto divide-y divide-brand-linen/40">
              {suggestions.map((s, i) => (
                <Link
                  key={s.href}
                  href={s.href}
                  role="option"
                  aria-selected={i === activeIndex}
                  onClick={() => {
                    setIsOpen(false);
                    setSuggestions([]);
                    setQuery("");
                  }}
                  className={
                    "flex items-center gap-3 px-4 py-2.5 transition-colors " +
                    (i === activeIndex
                      ? "bg-brand-bg text-brand-orange"
                      : "text-brand-charcoal hover:bg-brand-bg")
                  }
                >
                  {/* Thumbnail / Icon */}
                  {s.type === "product" && s.image ? (
                    <div className="w-10 h-10 rounded-lg bg-white border border-brand-linen overflow-hidden shrink-0 relative flex items-center justify-center">
                      <Image
                        src={s.image}
                        alt={s.label}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-stone-50 border border-brand-linen flex items-center justify-center text-brand-charcoal/40 shrink-0">
                      {s.type === "category" ? (
                        <FolderOpen className="w-4 h-4 text-brand-orange" />
                      ) : (
                        <Package className="w-4 h-4" />
                      )}
                    </div>
                  )}

                  {/* Text & Category */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-brand-charcoal truncate leading-snug">
                      {s.label}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {s.category && (
                        <span className="text-[10px] font-medium text-brand-charcoal/50 truncate">
                          {s.category}
                        </span>
                      )}
                      {s.type === "category" && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-brand-orange bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200">
                          Category
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Wholesale Price Tag */}
                  {typeof s.price === "number" && s.price > 0 && (
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-brand-charcoal block">
                        ₹{s.price}
                      </span>
                      <span className="text-[9px] font-semibold text-emerald-600 block">
                        Wholesale
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* View all results footer */}
          {query.trim().length >= MIN_CHARS && (
            <button
              onClick={handleSubmit}
              className="flex items-center justify-between w-full px-4 py-2.5 bg-stone-50 border-t border-brand-linen text-xs font-bold text-brand-orange hover:bg-orange-50 transition-colors"
            >
              <span className="flex items-center gap-2 truncate">
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">View all catalog results for &quot;{query}&quot;</span>
              </span>
              <span className="text-[10px] text-brand-charcoal/40 uppercase tracking-wider shrink-0 font-medium">
                Press Enter
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

