"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { openMiniCart } from "@/components/MiniCartDrawer";
import { getGuestCart } from "@/lib/guest-cart";
import ProductImageClient from "@/components/ProductImageClient";
import QuickAddButton from "@/components/QuickAddButton";
import HomepageFaqAccordion from "@/components/HomepageFaqAccordion";
import { normalizeTierPriceToRupees } from "@/lib/pricing";

interface TrendingProduct {
  id: string | number;
  name: string;
  category: string;
  image: string;
  price?: number | string;
  isQuoteOnly?: boolean;
  inStock?: boolean;
  variants?: Array<{ price: number }>;
  tiers?: Array<{ price: number | string }>;
}

interface HomepageClientProps {
  trendingProducts: TrendingProduct[];
}

export default function HomepageClient({ trendingProducts }: HomepageClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const coverTrackRef = useRef<HTMLDivElement>(null);

  // Cart item count sync
  const updateCartCount = async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.status === 401 || res.status === 403 || !res.ok) {
        const guestItems = getGuestCart();
        setCartCount(guestItems.reduce((acc, item) => acc + item.quantity, 0));
      } else {
        const data = await res.json();
        setCartCount((data.items || []).reduce((acc: number, item: any) => acc + item.quantity, 0));
      }
    } catch {
      const guestItems = getGuestCart();
      setCartCount(guestItems.reduce((acc, item) => acc + item.quantity, 0));
    }
  };

  useEffect(() => {
    updateCartCount();
    const handleCartUpdate = () => updateCartCount();
    window.addEventListener("cart_updated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);
    return () => {
      window.removeEventListener("cart_updated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const scrollTrack = (dir: number) => {
    if (!coverTrackRef.current) return;
    const track = coverTrackRef.current;
    const scrollAmount = Math.min(track.clientWidth * 0.88, 920) + 20;
    track.scrollBy({ left: dir * scrollAmount, behavior: "smooth" });
  };

  const scrollToCover = (id: string) => {
    const el = document.getElementById("cover-" + id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }
  };

  const tickerItems = [
    { label: "Candle wax", href: "/shop?category=Candle%20Waxes%20%26%20Additives" },
    { label: "Soap bases", href: "/shop?category=Artisan%20Soap%20Bases" },
    { label: "Perfume oils", href: "/shop?category=Fragrance%20Oils" },
    { label: "Silicone moulds", href: "/shop?category=Eco-Resin%20%26%20Stone%20Moulds" },
    { label: "Resin moulds", href: "/shop?category=Eco-Resin%20%26%20Stone%20Moulds" },
    { label: "Colour powders", href: "/shop?category=Micas%20%26%20Pigments" },
    { label: "Candle jars", href: "/shop?category=Candle%20Jars%20%26%20Containers" },
    { label: "Attar bottles", href: "/shop?category=Attar%20%26%20Perfume%20Bottles" },
    { label: "Gypsum powder", href: "/shop?q=gypsum" },
    { label: "Essential oils", href: "/shop?category=Essential%20Oils" },
    { label: "Chocolate moulds", href: "/shop?category=Culinary%20%26%20Fondant%20Moulds" },
    { label: "Diffuser bottles", href: "/shop?category=Diffuser%20Bottles%20%26%20Accessories" },
    { label: "Gift bags", href: "/shop?category=Gift%20Bags%20%26%20Pouches" },
    { label: "Labels & stickers", href: "/shop?category=Stickers%20%26%20Labels" },
    { label: "Body scrubs", href: "/shop?category=Body%20%26%20Facial%20Scrubs" },
    { label: "Shea & cocoa butter", href: "/shop?category=Raw%20Butters%20%26%20Carrier%20Oils" },
  ];

  const slides = [
    {
      id: "candles",
      no: "01",
      tab: "Candles",
      name: "Candles",
      tagline: "Start your own candle brand.",
      price: "Moulds from ₹249",
      bg: "#FBE3C4",
      cta: "See candle supplies",
      href: "/shop?discipline=candle-studio",
      chips: [
        { label: "Wax", href: "/shop?category=Candle%20Waxes%20%26%20Additives" },
        { label: "Perfume oils", href: "/shop?category=Fragrance%20Oils" },
        { label: "Jars", href: "/shop?category=Candle%20Jars%20%26%20Containers" },
        { label: "Candle moulds", href: "/shop?category=Candle%20%26%20Pillar%20Moulds" },
        { label: "Colours", href: "/shop?category=Micas%20%26%20Pigments" },
      ],
    },
    {
      id: "soap",
      no: "02",
      tab: "Soap & bath",
      name: "Soap & Bath",
      tagline: "Pour it, set it, sell it.",
      price: "Moulds from ₹249",
      bg: "#F9D9D6",
      cta: "See soap supplies",
      href: "/shop?discipline=soap-atelier",
      chips: [
        { label: "Soap bases", href: "/shop?category=Artisan%20Soap%20Bases" },
        { label: "Body scrubs", href: "/shop?category=Body%20%26%20Facial%20Scrubs" },
        { label: "Skin-safe scents", href: "/shop?category=Skin%20Safe%20Fragrances" },
        { label: "Soap moulds", href: "/shop?category=Soap%20%26%20Bar%20Moulds" },
        { label: "Butters & oils", href: "/shop?category=Raw%20Butters%20%26%20Carrier%20Oils" },
      ],
    },
    {
      id: "stone",
      no: "03",
      tab: "Stone & décor",
      name: "Stone & Concrete Décor",
      tagline: "Make pots, trays and décor pieces.",
      price: "Gypsum ₹110/kg",
      bg: "#E4E0D8",
      cta: "See stone supplies",
      href: "/shop?category=Eco-Resin%20%26%20Stone%20Moulds",
      chips: [
        { label: "Gypsum powder", href: "/shop?q=gypsum" },
        { label: "Stone moulds", href: "/shop?category=Eco-Resin%20%26%20Stone%20Moulds" },
        { label: "Colours", href: "/shop?category=Micas%20%26%20Pigments" },
      ],
    },
    {
      id: "resin",
      no: "04",
      tab: "Resin art",
      name: "Resin Art",
      tagline: "Keep flowers and memories forever.",
      price: "Moulds from ₹249",
      bg: "#D6E8F2",
      cta: "See resin supplies",
      href: "/shop?category=Eco-Resin%20%26%20Stone%20Moulds",
      chips: [
        { label: "Resin moulds", href: "/shop?category=Eco-Resin%20%26%20Stone%20Moulds" },
        { label: "Colour powders", href: "/shop?category=Micas%20%26%20Pigments" },
      ],
    },
    {
      id: "perfume",
      no: "05",
      tab: "Perfume & attar",
      name: "Perfume & Attar",
      tagline: "Fill your own bottle with your own scent.",
      price: "Oils from ₹199",
      bg: "#E8DDF3",
      cta: "See perfume supplies",
      href: "/shop?department=Aromatics%20%26%20Botanicals%20Studio",
      chips: [
        { label: "Perfume oils", href: "/shop?category=Fragrance%20Oils" },
        { label: "Essential oils", href: "/shop?category=Essential%20Oils" },
        { label: "Attar bottles", href: "/shop?category=Attar%20%26%20Perfume%20Bottles" },
        { label: "Floral waters", href: "/shop?category=Hydrosols%20%26%20Floral%20Waters" },
      ],
    },
    {
      id: "sweets",
      no: "06",
      tab: "Chocolate",
      name: "Chocolate & Sweets",
      tagline: "Shape treats people remember.",
      price: "Moulds from ₹249",
      bg: "#EBD5C3",
      cta: "See sweets supplies",
      href: "/shop?category=Culinary%20%26%20Fondant%20Moulds",
      chips: [
        { label: "Food-safe flavours", href: "/shop?category=Food-Grade%20Flavor%20Oils" },
        { label: "Chocolate moulds", href: "/shop?category=Culinary%20%26%20Fondant%20Moulds" },
        { label: "Fondant moulds", href: "/shop?category=Culinary%20%26%20Fondant%20Moulds" },
      ],
    },
    {
      id: "care",
      no: "07",
      tab: "Hair & skin",
      name: "Hair & Skin Care",
      tagline: "Make your own creams, oils and shampoos.",
      price: "Bases from ₹299",
      bg: "#DDEBD3",
      cta: "See care supplies",
      href: "/shop?department=Personal%20Care%20%26%20Cosmetic%20Studio",
      chips: [
        { label: "Hair & skin bases", href: "/shop?category=Skincare%20%26%20Body%20Bases" },
        { label: "Butters & oils", href: "/shop?category=Raw%20Butters%20%26%20Carrier%20Oils" },
        { label: "Preservatives", href: "/shop?category=Cosmetic%20Preservatives%20%26%20Chemicals" },
        { label: "Jars & bottles", href: "/shop?category=Cosmetic%20Jars%20%26%20Bottles" },
      ],
    },
    {
      id: "home",
      no: "08",
      tab: "Room scents",
      name: "Room Fragrance",
      tagline: "Make every home smell lovely.",
      price: "Bottles from ₹149",
      bg: "#FCEFC2",
      cta: "See room scent supplies",
      href: "/shop?category=Diffuser%20Bottles%20%26%20Accessories",
      chips: [
        { label: "Diffuser bottles", href: "/shop?category=Diffuser%20Bottles%20%26%20Accessories" },
        { label: "Perfume oils", href: "/shop?category=Fragrance%20Oils" },
        { label: "Diffuser extras", href: "/shop?category=Diffuser%20Bottles%20%26%20Accessories" },
      ],
    },
    {
      id: "packing",
      no: "09",
      tab: "Jars & packing",
      name: "Jars & Packing",
      tagline: "Make it look ready to sell.",
      price: "170+ products to choose from",
      bg: "#D9E7E4",
      cta: "See all packing",
      href: "/shop?department=Vessels%20%26%20Packaging%20Studio",
      chips: [
        { label: "Jars", href: "/shop?category=Candle%20Jars%20%26%20Containers" },
        { label: "Bottles", href: "/shop?category=Attar%20%26%20Perfume%20Bottles" },
        { label: "Tins", href: "/shop?category=Metal%20Containers%20%26%20Tins" },
        { label: "Boxes", href: "/shop?category=Packaging%20Boxes%20%26%20Mailers" },
        { label: "Gift bags", href: "/shop?category=Gift%20Bags%20%26%20Pouches" },
        { label: "Labels", href: "/shop?category=Stickers%20%26%20Labels" },
      ],
    },
  ];

  const departments = [
    {
      name: "Bases",
      blurb: "Wax, soap base, butters and oils: what you melt and pour.",
      seeAllHref: "/shop?department=Personal%20Care%20%26%20Cosmetic%20Studio",
      chips: [
        { label: "Candle Waxes & Additives", href: "/shop?category=Candle%20Waxes%20%26%20Additives" },
        { label: "Artisan Soap Bases", href: "/shop?category=Artisan%20Soap%20Bases" },
        { label: "Skincare & Body Bases", href: "/shop?category=Skincare%20%26%20Body%20Bases" },
        { label: "Body & Facial Scrubs", href: "/shop?category=Body%20%26%20Facial%20Scrubs" },
        { label: "Haircare & Wash Bases", href: "/shop?category=Haircare%20%26%20Wash%20Bases" },
        { label: "Raw Butters & Carrier Oils", href: "/shop?category=Raw%20Butters%20%26%20Carrier%20Oils" },
        { label: "Cosmetic Preservatives & Chemicals", href: "/shop?category=Cosmetic%20Preservatives%20%26%20Chemicals" },
      ],
    },
    {
      name: "Scents & Flavours",
      blurb: "Perfume oils, essential oils and food-safe flavours.",
      seeAllHref: "/shop?department=Aromatics%20%26%20Botanicals%20Studio",
      chips: [
        { label: "Fragrance Oils", href: "/shop?category=Fragrance%20Oils" },
        { label: "Skin Safe Fragrances", href: "/shop?category=Skin%20Safe%20Fragrances" },
        { label: "Essential Oils", href: "/shop?category=Essential%20Oils" },
        { label: "Food-Grade Flavor Oils", href: "/shop?category=Food-Grade%20Flavor%20Oils" },
        { label: "Hydrosols & Floral Waters", href: "/shop?category=Hydrosols%20%26%20Floral%20Waters" },
      ],
    },
    {
      name: "Colours",
      blurb: "Colour powders for wax, soap and resin.",
      seeAllHref: "/shop?category=Micas%20%26%20Pigments",
      chips: [{ label: "Micas & Pigments", href: "/shop?category=Micas%20%26%20Pigments" }],
    },
    {
      name: "Moulds",
      blurb: "Silicone moulds for candles, soap, resin, stone and food.",
      seeAllHref: "/shop?department=Silicone%20%26%20Casting%20Moulds%20Studio",
      chips: [
        { label: "Candle & Pillar Moulds", href: "/shop?category=Candle%20%26%20Pillar%20Moulds" },
        { label: "Soap & Bar Moulds", href: "/shop?category=Soap%20%26%20Bar%20Moulds" },
        { label: "Eco-Resin & Stone Moulds", href: "/shop?category=Eco-Resin%20%26%20Stone%20Moulds" },
        { label: "Culinary & Fondant Moulds", href: "/shop?category=Culinary%20%26%20Fondant%20Moulds" },
        { label: "General Silicone Moulds", href: "/shop?category=General%20Silicone%20Moulds" },
      ],
    },
    {
      name: "Jars, Bottles & Packing",
      blurb: "Everything to hold, pack and sell what you make.",
      seeAllHref: "/shop?department=Vessels%20%26%20Packaging%20Studio",
      chips: [
        { label: "Candle Jars & Containers", href: "/shop?category=Candle%20Jars%20%26%20Containers" },
        { label: "Attar & Perfume Bottles", href: "/shop?category=Attar%20%26%20Perfume%20Bottles" },
        { label: "Diffuser Bottles & Accessories", href: "/shop?category=Diffuser%20Bottles%20%26%20Accessories" },
        { label: "Cosmetic Jars & Bottles", href: "/shop?category=Cosmetic%20Jars%20%26%20Bottles" },
        { label: "Metal Containers & Tins", href: "/shop?category=Metal%20Containers%20%26%20Tins" },
        { label: "Packaging Boxes & Mailers", href: "/shop?category=Packaging%20Boxes%20%26%20Mailers" },
        { label: "Lids, Caps & Closures", href: "/shop?category=Lids%2C%20Caps%20%26%20Closures" },
        { label: "Gift Bags & Pouches", href: "/shop?category=Gift%20Bags%20%26%20Pouches" },
        { label: "Stickers & Labels", href: "/shop?category=Stickers%20%26%20Labels" },
      ],
    },
    {
      name: "Tools",
      blurb: "Tools and equipment for your workspace.",
      seeAllHref: "/shop?q=tools",
      chips: [
        { label: "Weighing Scales & Thermometers", href: "/shop?q=thermometer" },
        { label: "Melting Pots & Pitchers", href: "/shop?q=melting+pot" },
        { label: "Stirring Spatulas & Wicks", href: "/shop?q=wick" },
        { label: "Safety Gear & Workstation", href: "/shop?q=safety" },
      ],
    },
  ];

  return (
    <div
      style={{
        fontFamily: "'Lato', system-ui, sans-serif",
        color: "#1A1613",
        background: "#FAF8F4",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* ── 1. Announcement Bar ── */}
      <div
        style={{
          background: "#1A1613",
          color: "#F3EEE6",
          fontSize: "12px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "10px clamp(16px, 4vw, 40px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <span className="hidden md:inline" style={{ color: "#D9D0C4" }}>
          Direct from the factory
        </span>
        <span style={{ fontWeight: 700, textAlign: "center", flex: 1 }}>
          99% heavy-metal tested gypsum powder at just ₹110 per kg
        </span>
        <a
          className="hidden md:inline hover:underline"
          href="https://wa.me/919041500605?text=Hi%20Ekora!%20I'm%20interested%20in%20becoming%20a%20supplier."
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#F3C48F" }}
        >
          Become a supplier →
        </a>
      </div>

      {/* ── 2. Header ── */}
      <header
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E8E2D9",
          padding: "14px clamp(16px, 4vw, 40px)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "14px 28px",
        }}
      >
        <Link
          href="/"
          aria-label="Ekora Bazaar home"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "24px",
            fontWeight: 600,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            textDecoration: "none",
            color: "#1A1613",
          }}
        >
          <span>Ekora</span>
          <span
            aria-hidden="true"
            style={{
              width: "28px",
              height: "28px",
              border: "1.5px solid #1A1613",
              borderRadius: "50%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            B
          </span>
          <span>Bazaar</span>
        </Link>

        {/* Search bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="w-full md:w-auto order-3 md:order-none"
          style={{
            flex: "1 1 360px",
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#F5F2EC",
            border: "1px solid #E8E2D9",
            borderRadius: "999px",
            padding: "0 18px",
            height: "48px",
            boxSizing: "border-box",
          }}
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6B625A"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7"></circle>
            <path d="M20 20l-3.5-3.5"></path>
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search products"
            placeholder="Search for wax, moulds, perfume oil…"
            style={{
              flex: 1,
              minWidth: 0,
              border: 0,
              background: "transparent",
              fontFamily: "inherit",
              fontSize: "15px",
              color: "#1A1613",
              outline: "none",
            }}
          />
        </form>

        {/* Right Actions: Account, Cart, Mobile Menu */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginLeft: "auto" }}>
          <Link
            href="/account"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              fontSize: "10px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#4A423B",
              minWidth: "44px",
              textDecoration: "none",
            }}
          >
            <svg
              aria-hidden="true"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A1613"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              <circle cx="12" cy="8" r="4"></circle>
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6"></path>
            </svg>
            <span>Account</span>
          </Link>

          <Link
            href="/cart"
            aria-label={`Cart, ${cartCount} items`}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              background: "transparent",
              border: 0,
              cursor: "pointer",
            }}
          >
            <svg
              aria-hidden="true"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A1613"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 8h14l-1 12H6L5 8z"></path>
              <path d="M9 8V6a3 3 0 0 1 6 0v2"></path>
            </svg>
            <span
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                background: "#A8520F",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 700,
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {cartCount}
            </span>
          </Link>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            style={{
              width: "44px",
              height: "44px",
              border: 0,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg
              aria-hidden="true"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A1613"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12"></path>
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16"></path>
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-b border-[#E8E2D9] bg-[#FAF8F4] px-6 py-4 flex flex-col gap-3"
          style={{ animation: "rise 0.3s ease-out" }}
        >
          <Link
            href="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs uppercase tracking-widest font-bold text-[#A8520F] py-2 flex items-center justify-between border-b border-[#E8E2D9]"
          >
            <span>My Cart ({cartCount})</span>
            <span>View &rarr;</span>
          </Link>
          <Link
            href="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs uppercase tracking-widest font-bold text-[#A8520F] py-2 flex items-center justify-between border-b border-[#E8E2D9]"
          >
            <span>All Products</span>
            <span>→</span>
          </Link>
          <Link
            href="/shop?discipline=candle-studio"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs uppercase tracking-widest font-bold text-[#1A1613] py-2 border-b border-[#E8E2D9]"
          >
            Candles
          </Link>
          <Link
            href="/shop?discipline=soap-atelier"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs uppercase tracking-widest font-bold text-[#1A1613] py-2 border-b border-[#E8E2D9]"
          >
            Soap & Bath
          </Link>
          <Link
            href="/shop?category=Fragrance%20Oils"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs uppercase tracking-widest font-bold text-[#1A1613] py-2 border-b border-[#E8E2D9]"
          >
            Perfume & Oils
          </Link>
          <Link
            href="/shop?category=Eco-Resin%20%26%20Stone%20Moulds"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs uppercase tracking-widest font-bold text-[#1A1613] py-2 border-b border-[#E8E2D9]"
          >
            Moulds
          </Link>
          <Link
            href="/shop?department=Vessels%20%26%20Packaging%20Studio"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs uppercase tracking-widest font-bold text-[#1A1613] py-2 border-b border-[#E8E2D9]"
          >
            Jars & Packing
          </Link>
          <Link
            href="/classes"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs uppercase tracking-widest font-bold text-[#A8520F] py-2 border-b border-[#E8E2D9]"
          >
            Starter Kits
          </Link>
          <Link
            href="/shop?sort=new"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs uppercase tracking-widest font-bold text-[#1A1613] py-2 border-b border-[#E8E2D9]"
          >
            New Arrivals
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs uppercase tracking-widest font-bold text-[#1A1613] py-2"
          >
            Learn
          </Link>
        </div>
      )}

      {/* ── 3. Category Navigation Row (Desktop) ── */}
      <nav
        className="hidden md:flex"
        aria-label="Main categories"
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E8E2D9",
          padding: "0 clamp(16px, 4vw, 40px)",
          alignItems: "center",
          gap: "32px",
          flexWrap: "wrap",
        }}
      >
        <a
          href="#departments"
          style={{
            background: "#A8520F",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 7h16M4 12h16M4 17h16"></path>
          </svg>
          All products
        </a>
        <Link
          href="/shop?discipline=candle-studio"
          className="hover:text-[#A8520F] transition-colors"
          style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "16px 0",
            textDecoration: "none",
          }}
        >
          Candles
        </Link>
        <Link
          href="/shop?discipline=soap-atelier"
          className="hover:text-[#A8520F] transition-colors"
          style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "16px 0",
            textDecoration: "none",
          }}
        >
          Soap &amp; bath
        </Link>
        <Link
          href="/shop?category=Fragrance%20Oils"
          className="hover:text-[#A8520F] transition-colors"
          style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "16px 0",
            textDecoration: "none",
          }}
        >
          Perfume &amp; oils
        </Link>
        <Link
          href="/shop?category=Eco-Resin%20%26%20Stone%20Moulds"
          className="hover:text-[#A8520F] transition-colors"
          style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "16px 0",
            textDecoration: "none",
          }}
        >
          Moulds
        </Link>
        <Link
          href="/shop?department=Vessels%20%26%20Packaging%20Studio"
          className="hover:text-[#A8520F] transition-colors"
          style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "16px 0",
            textDecoration: "none",
          }}
        >
          Jars &amp; packing
        </Link>
        <Link
          href="/classes"
          className="hover:opacity-80 transition-opacity"
          style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "16px 0",
            color: "#A8520F",
            textDecoration: "none",
          }}
        >
          Starter kits
        </Link>
        <Link
          href="/shop?sort=new"
          className="hover:text-[#A8520F] transition-colors"
          style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "16px 0",
            marginLeft: "auto",
            textDecoration: "none",
          }}
        >
          New arrivals
        </Link>
        <Link
          href="/about"
          className="hover:text-[#A8520F] transition-colors"
          style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "16px 0",
            textDecoration: "none",
          }}
        >
          Learn
        </Link>
      </nav>

      {/* ── 4. Hero Section ── */}
      <section
        style={{
          padding: "clamp(28px, 5vw, 52px) clamp(16px, 4vw, 40px) clamp(24px, 4vw, 40px)",
          display: "flex",
          flexWrap: "wrap",
          gap: "32px 56px",
          alignItems: "center",
          maxWidth: "1360px",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <div style={{ flex: "1.4 1 380px", minWidth: 0, display: "flex", flexDirection: "column", gap: "18px" }}>
          <span
            className="anim-rise"
            style={{
              alignSelf: "flex-start",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#0B6B4E",
              background: "#E3F5EE",
              padding: "6px 12px",
              borderRadius: "6px",
            }}
          >
            Factory price · No middleman
          </span>

          <h1
            aria-label="Make your own candles, soaps, perfumes, resin art and chocolates"
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 600,
              fontSize: "clamp(36px, 5vw, 64px)",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            <span aria-hidden="true" style={{ display: "block" }}>
              Make your own
            </span>
            <span
              aria-hidden="true"
              style={{ display: "block", height: "1.2em", overflow: "hidden", color: "#A8520F" }}
            >
              <span className="anim-words" style={{ display: "block" }}>
                <span style={{ display: "block", height: "1.2em" }}>Candles</span>
                <span style={{ display: "block", height: "1.2em" }}>Soaps</span>
                <span style={{ display: "block", height: "1.2em" }}>Perfumes</span>
                <span style={{ display: "block", height: "1.2em" }}>Resin art</span>
                <span style={{ display: "block", height: "1.2em" }}>Chocolates</span>
                <span style={{ display: "block", height: "1.2em" }}>Candles</span>
              </span>
            </span>
          </h1>

          <p style={{ margin: 0, fontSize: "18px", lineHeight: 1.55, color: "#4A423B", maxWidth: "520px" }}>
            So many things to choose from, all in one shop. Wax, moulds, perfume oils, jars and more, straight from the factory.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <a
              href="#collection"
              style={{
                background: "#A8520F",
                color: "#fff",
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "16px 24px",
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              See what you can make →
            </a>
            <Link
              href="/classes"
              style={{
                background: "#fff",
                color: "#1A1613",
                border: "1.5px solid #1A1613",
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "14px 24px",
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              First time? Starter kits
            </Link>
          </div>
        </div>

        {/* Pulse Stat Cards */}
        <div
          style={{
            flex: "1 1 300px",
            minWidth: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "16px",
          }}
        >
          <Link
            href="/shop?category=Eco-Resin%20%26%20Stone%20Moulds"
            className="anim-pulse"
            style={{
              background: "#fff",
              border: "1.5px solid #1A1613",
              borderRadius: "18px",
              padding: "22px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              textDecoration: "none",
              color: "#1A1613",
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(40px, 5vw, 60px)",
                fontWeight: 700,
                color: "#A8520F",
                lineHeight: 1,
              }}
            >
              ₹249
            </span>
            <span style={{ fontSize: "15px", fontWeight: 700 }}>Moulds start here</span>
            <span style={{ fontSize: "13px", color: "#6B625A", lineHeight: 1.4 }}>
              Silicone moulds for candles, soap and more
            </span>
          </Link>

          <Link
            href="/shop?q=gypsum"
            className="anim-pulse"
            style={{
              background: "#fff",
              border: "1.5px solid #1A1613",
              borderRadius: "18px",
              padding: "22px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              textDecoration: "none",
              color: "#1A1613",
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(40px, 5vw, 60px)",
                fontWeight: 700,
                color: "#A8520F",
                lineHeight: 1,
              }}
            >
              ₹110
            </span>
            <span style={{ fontSize: "15px", fontWeight: 700 }}>Per kg gypsum powder</span>
            <span style={{ fontSize: "13px", color: "#6B625A", lineHeight: 1.4 }}>
              Tested for safety, ready to pour
            </span>
          </Link>
        </div>
      </section>

      {/* ── 5. Scrolling Ticker ── */}
      <div
        className="ticker-container"
        role="marquee"
        aria-label="A few of the things we sell"
        style={{
          background: "#A8520F",
          color: "#fff",
          overflow: "hidden",
          whiteSpace: "nowrap",
          padding: "14px 0",
        }}
      >
        <div className="anim-marquee" style={{ display: "inline-flex", width: "max-content" }}>
          <div style={{ display: "inline-flex" }}>
            {tickerItems.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "0 22px",
                  color: "#fff",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {item.label}{" "}
                <span aria-hidden="true" style={{ opacity: 0.55, paddingLeft: "22px" }}>
                  ✦
                </span>
              </Link>
            ))}
          </div>
          <div aria-hidden="true" style={{ display: "inline-flex" }}>
            {tickerItems.map((item, idx) => (
              <Link
                key={`dup-${idx}`}
                href={item.href}
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "0 22px",
                  color: "#fff",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {item.label}{" "}
                <span style={{ opacity: 0.55, paddingLeft: "22px" }}>✦</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6. Swipe Collection Showcase ── */}
      <section
        id="collection"
        style={{
          padding: "clamp(32px, 5vw, 56px) 0 clamp(24px, 4vw, 40px)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            maxWidth: "1360px",
            width: "100%",
            margin: "0 auto",
            padding: "0 clamp(16px, 4vw, 40px)",
            boxSizing: "border-box",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: "1 1 280px" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#A8520F",
              }}
            >
              What do you want to make?
            </span>
            <h2
              style={{
                margin: 0,
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 600,
                fontSize: "clamp(28px, 3.4vw, 42px)",
                lineHeight: 1.15,
              }}
            >
              Swipe through everything
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              className="anim-nudge"
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#A8520F",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              Swipe{" "}
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#A8520F"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6"></path>
              </svg>
            </span>
            <button
              aria-label="Previous card"
              onClick={() => scrollTrack(-1)}
              className="hover:bg-[#1A1613] hover:text-white transition-colors group"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                border: "1.5px solid #1A1613",
                background: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 6l-6 6 6 6"></path>
              </svg>
            </button>
            <button
              aria-label="Next card"
              onClick={() => scrollTrack(1)}
              className="hover:bg-[#1A1613] hover:text-white transition-colors group"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                border: "1.5px solid #1A1613",
                background: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 6l6 6-6 6"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Jump Pills Tabs */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            padding: "2px clamp(16px, 4vw, 40px)",
          }}
        >
          {slides.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollToCover(s.id)}
              className="hover:bg-[#1A1613] hover:text-white transition-all"
              style={{
                flex: "none",
                minHeight: "44px",
                padding: "0 18px",
                borderRadius: "999px",
                border: "1.5px solid #1A1613",
                background: "#fff",
                color: "#1A1613",
                fontFamily: "inherit",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {s.tab}
            </button>
          ))}
        </div>

        {/* Swipe Track of 9 Cards */}
        <div
          id="cover-track"
          ref={coverTrackRef}
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: "20px",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollPadding: "0 clamp(16px, 4vw, 40px)",
            padding: "8px clamp(16px, 4vw, 40px) 24px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {slides.map((slide) => (
            <article
              key={slide.id}
              id={`cover-${slide.id}`}
              style={{
                flex: "0 0 min(88vw, 920px)",
                scrollSnapAlign: "start",
                position: "relative",
                overflow: "hidden",
                background: slide.bg,
                borderRadius: "28px",
                minHeight: "440px",
                padding: "clamp(24px, 3.5vw, 44px)",
                boxSizing: "border-box",
                display: "flex",
                flexWrap: "wrap",
                gap: "24px 36px",
                alignItems: "center",
              }}
            >
              {/* Background ambient watermarks & circles */}
              <div
                aria-hidden="true"
                className="anim-floaty"
                style={{
                  position: "absolute",
                  right: "-70px",
                  top: "-70px",
                  width: "260px",
                  height: "260px",
                  borderRadius: "50%",
                  background: "rgba(26,22,19,0.06)",
                  pointerEvents: "none",
                }}
              />
              <div
                aria-hidden="true"
                className="anim-floaty2"
                style={{
                  position: "absolute",
                  left: "42%",
                  bottom: "-90px",
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.5)",
                  pointerEvents: "none",
                }}
              />
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  right: "28px",
                  top: "6px",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "120px",
                  lineHeight: 1,
                  fontWeight: 700,
                  color: "rgba(26,22,19,0.09)",
                  pointerEvents: "none",
                }}
              >
                {slide.no}
              </span>

              {/* Left Column of Card */}
              <div
                style={{
                  position: "relative",
                  flex: "1 1 280px",
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#4A423B",
                  }}
                >
                  {slide.no} / 09
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: 700,
                    fontSize: "clamp(32px, 4vw, 48px)",
                    lineHeight: 1.1,
                  }}
                >
                  {slide.name}
                </h3>
                <p style={{ margin: 0, fontSize: "18px", lineHeight: 1.5, color: "#2A241F" }}>{slide.tagline}</p>
                <span
                  style={{
                    background: "#1A1613",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 700,
                    padding: "8px 14px",
                    borderRadius: "999px",
                  }}
                >
                  {slide.price}
                </span>
                <Link
                  href={slide.href}
                  className="hover:bg-[#1A1613] hover:text-white transition-colors"
                  style={{
                    marginTop: "6px",
                    background: "#fff",
                    color: "#1A1613",
                    border: "1.5px solid #1A1613",
                    fontWeight: 700,
                    fontSize: "14px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "14px 22px",
                    borderRadius: "8px",
                    display: "inline-flex",
                    alignItems: "center",
                    textDecoration: "none",
                  }}
                >
                  {slide.cta} →
                </Link>
              </div>

              {/* Right Column of Card: Chips */}
              <div
                style={{
                  position: "relative",
                  flex: "1 1 260px",
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#4A423B",
                  }}
                >
                  What you can buy
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {slide.chips.map((chip, cIdx) => (
                    <Link
                      key={cIdx}
                      href={chip.href}
                      className="anim-pop hover:scale-105 transition-transform"
                      style={{
                        background: "#fff",
                        borderRadius: "999px",
                        padding: "12px 18px",
                        fontWeight: 700,
                        fontSize: "15px",
                        lineHeight: "20px",
                        boxShadow: "0 2px 0 rgba(26,22,19,0.14)",
                        color: "#1A1613",
                        textDecoration: "none",
                      }}
                    >
                      {chip.label}
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── 7. Trending in the Studio (Curated Real Products Shelf) ── */}
      {trendingProducts && trendingProducts.length > 0 && (
        <section
          style={{
            maxWidth: "1360px",
            margin: "0 auto",
            padding: "clamp(24px, 4vw, 48px) clamp(16px, 4vw, 40px)",
            boxSizing: "border-box",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: "24px",
              paddingBottom: "12px",
              borderBottom: "1px solid #E8E2D9",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#A8520F",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Real-Time Demand
              </span>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "clamp(24px, 3vw, 32px)",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                Trending in the Studio
              </h2>
            </div>
            <Link
              href="/shop"
              style={{
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#A8520F",
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }}
            >
              View All SKUs →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {trendingProducts.map((p) => {
              const hasVariants = Boolean(p.variants && p.variants.length > 0);
              const rawPrice = hasVariants && p.variants
                ? p.variants[0].price
                : typeof p.price === "number"
                ? p.price
                : parseFloat(String(p.price || "0"));
              const isZeroOrMissing = p.isQuoteOnly === true || isNaN(rawPrice) || rawPrice <= 0 || p.inStock === false;
              const price = !isZeroOrMissing ? rawPrice : 0;
              const hasTiers = Boolean(p.tiers && p.tiers.length > 1);
              const validBulkTier = hasTiers && p.tiers
                ? p.tiers.find((t: any, idx: number) => idx > 0 && t && Number(t.price) > 0)
                : null;
              const bulkPrice = validBulkTier
                ? normalizeTierPriceToRupees(Number(validBulkTier.price), Math.round(price * 100))
                : null;

              return (
                <div
                  key={p.id}
                  style={{
                    background: "#fff",
                    border: "1px solid #E8E2D9",
                    borderRadius: "16px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Link
                    href={`/products/${p.id}`}
                    style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", flex: 1 }}
                  >
                    <div
                      style={{
                        aspectRatio: "1 / 1",
                        width: "100%",
                        background: "#FAF8F5",
                        borderRadius: "10px",
                        overflow: "hidden",
                        position: "relative",
                        marginBottom: "12px",
                      }}
                    >
                      <ProductImageClient
                        src={p.image}
                        alt={p.name}
                        quality={85}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover object-center w-full h-full hover:scale-105 transition-transform"
                        fallbackSrc="/og-image.jpg"
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#6B625A",
                        marginBottom: "4px",
                      }}
                    >
                      {p.category}
                    </span>
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: "16px",
                        fontWeight: 600,
                        lineHeight: 1.3,
                        marginBottom: "8px",
                        minHeight: "2.6em",
                      }}
                    >
                      {p.name}
                    </h3>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "12px" }}>
                      {isZeroOrMissing ? (
                        <span style={{ fontSize: "13px", fontStyle: "italic", color: "#6B625A" }}>Quote on Request</span>
                      ) : (
                        <>
                          <span style={{ fontSize: "16px", fontWeight: 700, color: "#1A1613" }}>
                            ₹{price.toLocaleString()}
                          </span>
                          {bulkPrice && (
                            <span style={{ fontSize: "11px", color: "#A8520F" }}>(10+ Bulk: ₹{bulkPrice.toLocaleString()})</span>
                          )}
                        </>
                      )}
                    </div>
                  </Link>

                  {!isZeroOrMissing && (
                    <div style={{ marginTop: "auto" }}>
                      <QuickAddButton
                        productId={String(p.id)}
                        productName={p.name}
                        basePrice={price}
                        category={p.category}
                        inStock={!isZeroOrMissing}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 8. Trust Strip ── */}
      <section
        aria-label="Why Ekora Bazaar"
        style={{
          background: "#FFFFFF",
          borderTop: "1px solid #E8E2D9",
          borderBottom: "1px solid #E8E2D9",
        }}
      >
        <div
          style={{
            maxWidth: "1360px",
            margin: "0 auto",
            padding: "22px clamp(16px, 4vw, 40px)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px 28px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <strong style={{ fontSize: "15px" }}>Straight from the factory</strong>
            <span style={{ fontSize: "13px", color: "#6B625A" }}>1,200+ makers already buy this way</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <strong style={{ fontSize: "15px" }}>Factory price, no middleman</strong>
            <span style={{ fontSize: "13px", color: "#6B625A" }}>No extra charges added on top</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <strong style={{ fontSize: "15px" }}>Safe, certified perfume oils</strong>
            <span style={{ fontSize: "13px", color: "#6B625A" }}>Made to meet safety standards</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <strong style={{ fontSize: "15px" }}>Safety-tested gypsum</strong>
            <span style={{ fontSize: "13px", color: "#6B625A" }}>Just ₹110 per kg</span>
          </div>
        </div>
      </section>

      {/* ── 9. Department Directory ── */}
      <section
        id="departments"
        style={{
          maxWidth: "1360px",
          margin: "0 auto",
          padding: "clamp(36px, 5vw, 64px) clamp(16px, 4vw, 40px)",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#A8520F",
            }}
          >
            Full list
          </span>
          <h2
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 600,
              fontSize: "clamp(26px, 3vw, 38px)",
              lineHeight: 1.15,
            }}
          >
            Every product, in six simple groups
          </h2>
          <p style={{ margin: 0, fontSize: "16px", color: "#4A423B", maxWidth: "640px", lineHeight: 1.55 }}>
            Tap anything below to see the products.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
          {departments.map((dept, dIdx) => (
            <div
              key={dIdx}
              style={{
                background: "#fff",
                border: "1px solid #E8E2D9",
                borderRadius: "16px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: 600,
                    fontSize: "22px",
                    lineHeight: 1.2,
                  }}
                >
                  {dept.name}
                </h3>
                <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#6B625A" }}>{dept.blurb}</p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", flex: 1, alignContent: "flex-start" }}>
                {dept.chips.map((chip, cIdx) => (
                  <Link
                    key={cIdx}
                    href={chip.href}
                    className="hover:bg-[#FBEBD9] transition-colors"
                    style={{
                      background: "#F5F2EC",
                      borderRadius: "999px",
                      padding: "12px 14px",
                      fontSize: "13px",
                      lineHeight: "20px",
                      color: "#2A241F",
                      textDecoration: "none",
                    }}
                  >
                    {chip.label}
                  </Link>
                ))}
              </div>
              <Link
                href={dept.seeAllHref}
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#A8520F",
                  paddingTop: "4px",
                  textDecoration: "none",
                }}
              >
                See all →
              </Link>
            </div>
          ))}

          {/* Starter Kits Banner */}
          <div
            style={{
              gridColumn: "1 / -1",
              background: "#1A1613",
              color: "#fff",
              borderRadius: "16px",
              padding: "clamp(24px, 3vw, 36px)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 320px" }}>
              <h3
                style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: 600,
                  fontSize: "26px",
                }}
              >
                Never made anything before? Start here.
              </h3>
              <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.5, color: "#D9D0C4" }}>
                Starter kits are the easiest way to try a new craft.
              </p>
            </div>
            <Link
              href="/classes"
              className="hover:scale-105 transition-transform"
              style={{
                background: "#F3C48F",
                color: "#1A1613",
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "16px 24px",
                borderRadius: "8px",
                textDecoration: "none",
              }}
            >
              See starter kits →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 10. How It Works: Three Easy Steps ── */}
      <section style={{ background: "#F3EEE6", borderTop: "1px solid #E8E2D9" }}>
        <div
          style={{
            maxWidth: "1360px",
            margin: "0 auto",
            padding: "clamp(36px, 5vw, 64px) clamp(16px, 4vw, 40px)",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#A8520F",
              }}
            >
              Not sure where to start?
            </span>
            <h2
              style={{
                margin: 0,
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 600,
                fontSize: "clamp(26px, 3vw, 38px)",
                lineHeight: 1.15,
              }}
            >
              Three easy steps
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "32px",
                  color: "#A8520F",
                  lineHeight: 1,
                  fontWeight: 700,
                }}
              >
                1
              </span>
              <strong style={{ fontSize: "17px" }}>Pick what you want to make</strong>
              <span style={{ fontSize: "14px", lineHeight: 1.55, color: "#4A423B" }}>
                Candles, soap, resin art, perfume or something else. Swipe through the pages above.
              </span>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "32px",
                  color: "#A8520F",
                  lineHeight: 1,
                  fontWeight: 700,
                }}
              >
                2
              </span>
              <strong style={{ fontSize: "17px" }}>Add what you need to your cart</strong>
              <span style={{ fontSize: "14px", lineHeight: 1.55, color: "#4A423B" }}>
                Most crafts need something to pour, a scent, a colour, a mould and a jar. We keep them all in one place.
              </span>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "32px",
                  color: "#A8520F",
                  lineHeight: 1,
                  fontWeight: 700,
                }}
              >
                3
              </span>
              <strong style={{ fontSize: "17px" }}>We send it from the factory</strong>
              <span style={{ fontSize: "14px", lineHeight: 1.55, color: "#4A423B" }}>
                No middleman, so the price stays low. Moulds start at just ₹249.
              </span>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: "15px", color: "#4A423B" }}>
            Need help choosing?{" "}
            <Link href="/about" style={{ color: "#A8520F", fontWeight: 700, textDecoration: "underline" }}>
              Learn how it's done
            </Link>{" "}
            or{" "}
            <a
              href="https://wa.me/919041500605?text=Hi%20Ekora!%20I%20need%20help%20choosing%20craft%20supplies."
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#A8520F", fontWeight: 700, textDecoration: "underline" }}
            >
              chat with us on WhatsApp
            </a>
            .
          </p>
        </div>
      </section>

      {/* ── 11. SEO & FAQ Accordion ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12" aria-labelledby="aeo-faq-heading">
        <h2 id="aeo-faq-heading" className="sr-only">
          About Ekora Bazaar Wholesale & Raw Materials
        </h2>
        <HomepageFaqAccordion />
      </section>

      {/* ── 12. Footer ── */}
      <footer style={{ background: "#1A1613", color: "#D9D0C4" }}>
        <div
          style={{
            maxWidth: "1360px",
            margin: "0 auto",
            padding: "40px clamp(16px, 4vw, 40px)",
            boxSizing: "border-box",
            display: "flex",
            flexWrap: "wrap",
            gap: "32px 64px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "22px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "#fff",
              }}
            >
              Ekora Bazaar
            </span>
            <span style={{ fontSize: "14px", lineHeight: 1.55 }}>
              Factory-direct supplies for Indian craft makers.
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "14px" }}>
            <strong style={{ color: "#fff", marginBottom: "6px" }}>Shop</strong>
            <Link href="/shop" className="hover:text-white" style={{ padding: "6px 0", textDecoration: "none" }}>
              All products
            </Link>
            <Link href="/classes" className="hover:text-white" style={{ padding: "6px 0", textDecoration: "none" }}>
              Starter kits
            </Link>
            <Link href="/shop?sort=new" className="hover:text-white" style={{ padding: "6px 0", textDecoration: "none" }}>
              New arrivals
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "14px" }}>
            <strong style={{ color: "#fff", marginBottom: "6px" }}>Learn &amp; sell</strong>
            <Link href="/about" className="hover:text-white" style={{ padding: "6px 0", textDecoration: "none" }}>
              Learn
            </Link>
            <a
              href="https://wa.me/919041500605?text=Hi%20Ekora!%20I'm%20interested%20in%20becoming%20a%20supplier."
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
              style={{ padding: "6px 0", textDecoration: "none" }}
            >
              Become a supplier
            </a>
            <a
              href="https://wa.me/919041500605"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
              style={{ padding: "6px 0", textDecoration: "none" }}
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
