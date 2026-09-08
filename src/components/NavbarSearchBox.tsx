"use client";

/**
 * NavbarSearchBox
 *
 * Autocomplete search box for the BuyerNavbar.
 * - Debounces keystrokes (300ms) before fetching suggestions.
 * - Minimum 2 characters before making a request.
 * - Shows product + category suggestions with a "View all results" link.
 * - Submits to /shop?q=... on Enter or Submit click.
 * - Navigates directly for product/category suggestions.
 * - Closes on Escape, outside click, or navigation.
 * - No emoji or encoding-unsafe characters.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Package, FolderOpen } from "lucide-react";
import Link from "next/link";

interface Suggestion {
  type: "product" | "category";
  label: string;
  href: string;
}

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

export default function NavbarSearchBox() {
  const router = useRouter();
  const [query, setQuery]           = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading]       = useState(false);
  const [isOpen, setIsOpen]         = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef     = useRef<AbortController | null>(null);

  // Fetch suggestions (debounced)
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
      setIsOpen(val.trim().length > 0); // keep open but empty
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val.trim());
    }, DEBOUNCE_MS);
  }

  // Submit: navigate to /shop?q=...
  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setIsOpen(false);
    setSuggestions([]);
    router.push("/shop?q=" + encodeURIComponent(q));
  }

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      return;
    }

    const items = suggestions;
    if (!isOpen || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < items.length) {
        e.preventDefault();
        router.push(items[activeIndex].href);
        setIsOpen(false);
        setSuggestions([]);
      }
      // else default form submit fires
    }
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown = isOpen && (suggestions.length > 0 || loading);

  return (
    <div ref={containerRef} className="hidden lg:block relative">
      <form onSubmit={handleSubmit} className="flex items-center relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query.trim().length >= MIN_CHARS && suggestions.length > 0) setIsOpen(true); }}
          placeholder="Search materials, moulds, scents..."
          autoComplete="off"
          aria-label="Search products"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          className="bg-brand-bg border border-brand-linen rounded-full pl-4 pr-9 py-1.5 text-sm font-medium focus:outline-none focus:border-brand-orange w-52 transition-all focus:w-72"
        />
        {query ? (
          <button
            type="button"
            onClick={() => { setQuery(""); setSuggestions([]); setIsOpen(false); inputRef.current?.focus(); }}
            className="absolute right-8 text-brand-charcoal/40 hover:text-brand-charcoal"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
        <button
          type="submit"
          className="absolute right-3 text-brand-charcoal/50 hover:text-brand-orange"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full mt-2 left-0 right-0 min-w-[300px] bg-white rounded-2xl border border-brand-linen shadow-xl z-50 overflow-hidden"
        >
          {loading && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-brand-charcoal/50">Searching...</div>
          )}

          {!loading && suggestions.length === 0 && query.trim().length >= MIN_CHARS && (
            <div className="px-4 py-3 text-sm text-brand-charcoal/50">
              No suggestions for &quot;{query}&quot;
            </div>
          )}

          {suggestions.map((s, i) => (
            <Link
              key={s.href}
              href={s.href}
              role="option"
              aria-selected={i === activeIndex}
              onClick={() => { setIsOpen(false); setSuggestions([]); setQuery(""); }}
              className={
                "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors " +
                (i === activeIndex
                  ? "bg-brand-bg text-brand-orange"
                  : "text-brand-charcoal hover:bg-brand-bg hover:text-brand-orange")
              }
            >
              <span className="shrink-0 text-brand-charcoal/40">
                {s.type === "category"
                  ? <FolderOpen className="w-3.5 h-3.5" />
                  : <Package className="w-3.5 h-3.5" />}
              </span>
              <span className="flex-1 truncate font-medium">{s.label}</span>
              {s.type === "category" && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/40">
                  Category
                </span>
              )}
            </Link>
          ))}

          {/* View all results */}
          {query.trim().length >= MIN_CHARS && (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 w-full px-4 py-2.5 border-t border-brand-linen text-sm font-semibold text-brand-orange hover:bg-brand-bg transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              View all results for &quot;{query}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
