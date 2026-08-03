"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Search } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function BuyerNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: "Shop Now", href: "/shop" },
    { name: "Categories", href: "/shop" },
    { name: "Free Formulations", href: "/formulations" },
    { name: "Sample Kits", href: "/classes" },
    { name: "A to Z Classes", href: "/classes" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled || mobileMenuOpen ? "bg-white border-b border-brand-linen shadow-sm" : "bg-white/90 backdrop-blur-md border-b border-brand-linen/60"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand Logo */}
          <div className="flex-1 flex justify-start">
            <Link
              href="/"
              className="flex items-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Image 
                src="/images/logo.jpg" 
                alt="Ekora Bazaar" 
                width={120}
                height={40}
                priority
                className="object-contain mix-blend-multiply"
                style={{ height: "40px", width: "auto" }}
              />
            </Link>
          </div>

          {/* Center: Desktop Nav Items & Mega Menu Trigger */}
          <nav className="hidden md:flex justify-center items-center gap-8 h-full">
            {/* Top-Level Categories Mega Menu Dropdown */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => setIsCategoriesOpen(true)}
              onMouseLeave={() => setIsCategoriesOpen(false)}
            >
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className={`relative flex items-center gap-1.5 text-sm font-medium h-full transition-colors ${
                  isCategoriesOpen ? "text-brand-orange" : "text-brand-charcoal/80 hover:text-brand-charcoal"
                }`}
              >
                <span>Categories</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCategoriesOpen ? "rotate-180 text-brand-orange" : ""}`} />
                {/* Underline Indicator */}
                {isCategoriesOpen && (
                  <motion.div
                    layoutId="activeUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-orange"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>

              {/* Full-Width Mega Menu Dropdown Container */}
              <AnimatePresence>
                {isCategoriesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed top-16 left-0 right-0 w-full bg-white/98 backdrop-blur-xl border-b border-brand-linen shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-10 text-left">
                      {/* Column 1: Premium Bases & Raw Materials */}
                      <div>
                        <h3 className="font-sans font-bold text-base text-brand-charcoal tracking-tight mb-4">
                          Premium Bases &amp; Raw Materials
                        </h3>
                        <ul className="space-y-2.5">
                          {[
                            "Melt & Pour Soap Bases",
                            "Liquid & Cream Bases",
                            "Premium Waxes & Butters",
                            "Raw Chemicals & Preservatives",
                          ].map((item) => (
                            <li key={item}>
                              <Link
                                href={`/shop?category=${encodeURIComponent(item)}`}
                                className="font-sans font-normal text-sm text-brand-charcoal/70 hover:text-brand-orange block leading-relaxed transition-colors"
                              >
                                {item}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Column 2: Scents, Colors & Botanicals */}
                      <div>
                        <h3 className="font-sans font-bold text-base text-brand-charcoal tracking-tight mb-4">
                          Scents, Colors &amp; Botanicals
                        </h3>
                        <ul className="space-y-2.5">
                          <li>
                            <div className="flex flex-col">
                              <Link
                                href={`/shop?category=${encodeURIComponent("Premium Fragrance Oils")}`}
                                className="font-sans font-normal text-sm text-brand-charcoal/70 hover:text-brand-orange leading-relaxed transition-colors flex items-center"
                              >
                                Premium Fragrance Oils
                                <span className="inline-flex items-center justify-center bg-[#e0f2fe] text-[#0369a1] text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 tracking-wide uppercase">
                                  NEW
                                </span>
                              </Link>
                              {/* Sub-divisions */}
                              <ul className="ml-3 mt-1.5 space-y-1 border-l-2 border-brand-linen pl-3">
                                {["Cosmetic Safe", "CP Stable", "Candle"].map((sub) => (
                                  <li key={sub}>
                                    <Link
                                      href={`/shop?category=Premium Fragrance Oils&sub=${encodeURIComponent(sub)}`}
                                      className="font-sans font-normal text-xs text-brand-charcoal/50 hover:text-brand-orange block py-0.5 leading-normal transition-colors"
                                    >
                                      {sub}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </li>
                          {[
                            "Pure Essential Oils",
                            "Mica & Liquid Colors",
                            "Steam Distilled Hydrosols",
                            "Dried Flowers & Botanicals",
                            "Natural Extracts & Flavours",
                          ].map((item) => (
                            <li key={item}>
                              <Link
                                href={`/shop?category=${encodeURIComponent(item)}`}
                                className="font-sans font-normal text-sm text-brand-charcoal/70 hover:text-brand-orange block leading-relaxed transition-colors"
                              >
                                {item}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Column 3: Silicone Moulds & Equipment */}
                      <div>
                        <h3 className="font-sans font-bold text-base text-brand-charcoal tracking-tight mb-4">
                          Silicone Moulds &amp; Equipment
                        </h3>
                        <ul className="space-y-2.5">
                          {["Soap & Loaf Moulds", "Candle Moulds"].map((item) => (
                            <li key={item}>
                              <Link
                                href={`/shop?category=${encodeURIComponent(item)}`}
                                className="font-sans font-normal text-sm text-brand-charcoal/70 hover:text-brand-orange block leading-relaxed transition-colors"
                              >
                                {item}
                              </Link>
                            </li>
                          ))}
                          <li>
                            <Link
                              href={`/shop?category=${encodeURIComponent("Resin Moulds")}`}
                              className="font-sans font-normal text-sm text-brand-charcoal/70 hover:text-brand-orange leading-relaxed transition-colors flex items-center"
                            >
                              Resin Moulds
                              <span className="inline-flex items-center justify-center bg-[#e0f2fe] text-[#0369a1] text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 tracking-wide uppercase">
                                NEW
                              </span>
                            </Link>
                          </li>
                          {[
                            "Culinary Moulds (Chocolate & Fondant)",
                            "DIY Tools & Accessories",
                          ].map((item) => (
                            <li key={item}>
                              <Link
                                href={`/shop?category=${encodeURIComponent(item)}`}
                                className="font-sans font-normal text-sm text-brand-charcoal/70 hover:text-brand-orange block leading-relaxed transition-colors"
                              >
                                {item}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Column 4: Curated Lifestyle & Learning */}
                      <div>
                        <h3 className="font-sans font-bold text-base text-brand-charcoal tracking-tight mb-4">
                          Curated Lifestyle &amp; Learning
                        </h3>
                        <ul className="space-y-2.5">
                          {[
                            "Cold Processed Soaps",
                            "Home Decor & Office",
                            "Free Formulations",
                            "Classes & Training",
                          ].map((item) => (
                            <li key={item}>
                              <Link
                                href={`/shop?category=${encodeURIComponent(item)}`}
                                className="font-sans font-normal text-sm text-brand-charcoal/70 hover:text-brand-orange block leading-relaxed transition-colors"
                              >
                                {item}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {navLinks.filter(l => l.name !== "Categories").map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-brand-charcoal/70 hover:text-brand-charcoal transition-colors py-5"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right: Search & CTA */}
          <div className="flex-1 flex justify-end items-center gap-4">
            <form action="/shop" method="GET" className="hidden lg:flex items-center relative">
              <input type="text" name="q" placeholder="Search products..." className="bg-brand-bg border border-brand-linen rounded-full pl-4 pr-10 py-1.5 text-sm font-medium focus:outline-none focus:border-brand-orange w-48 transition-all focus:w-64" />
              <button type="submit" className="absolute right-3 text-brand-charcoal/50 hover:text-brand-orange">
                <Search className="w-4 h-4" />
              </button>
            </form>

            <Link
              href="/sell"
              className="hidden md:inline-flex items-center justify-center bg-brand-charcoal hover:bg-brand-charcoal/80 text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-all shadow-md"
            >
              Become a Seller
            </Link>

            <button
              className="md:hidden p-2 -mr-2 text-brand-charcoal focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden flex flex-col overflow-y-auto"
          >
            <div className="flex flex-col gap-6 flex-1 pb-12">
              <form action="/shop" method="GET" className="relative mb-2">
                <input type="text" name="q" placeholder="Search products..." className="w-full bg-stone-50 border border-brand-linen rounded-2xl pl-5 pr-12 py-3.5 text-base font-medium focus:outline-none focus:border-brand-orange shadow-sm" />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-charcoal/50 hover:text-brand-orange">
                  <Search className="w-5 h-5" />
                </button>
              </form>
              
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-2xl font-bold font-sans tracking-tight text-brand-charcoal hover:text-brand-orange transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            <div className="pb-8 mt-auto">
              <Link
                href="/sell"
                className="flex items-center justify-center bg-brand-charcoal text-white rounded-xl px-6 py-4 text-base font-semibold w-full hover:bg-brand-charcoal/90 transition-all shadow-lg text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Become a Seller
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
