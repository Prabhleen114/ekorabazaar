"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Menu, 
  X, 
  ChevronDown, 
  GraduationCap, 
  Sparkles, 
  ArrowRight,
  User,
  ShoppingBag,
  Package,
  MapPin,
  LogOut,
  Phone
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import TopUtilityBar from "./TopUtilityBar";
import { DEPARTMENTS, DISCIPLINE_HUBS } from "@/lib/taxonomy";
import NavbarSearchBox from "./NavbarSearchBox";
import CartIcon from "./CartIcon";

type NavMenu = "craft" | "departments" | "academy" | "profile" | null;

export default function BuyerNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<NavMenu>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [mobileSectionOpen, setMobileSectionOpen] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check auth
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleNavbarLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    window.location.href = '/';
  };

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

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Smooth hover intent handlers (prevents accidental closing and mouse-jitter)
  const handleMouseEnter = (menu: NavMenu) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 180);
  };

  const closeMenu = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setActiveMenu(null);
  };

  return (
    <>
      <TopUtilityBar />
      <header
        className={`sticky top-0 inset-x-0 z-50 transition-all duration-200 ${
          isScrolled || mobileMenuOpen 
            ? "bg-white border-b border-stone-200/90 shadow-sm" 
            : "bg-white border-b border-stone-200/70"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between relative">
          {/* Left: Brand Logo */}
          <div className="flex-1 flex justify-start items-center">
            <Link
              href="/"
              className="flex items-center group py-2"
              onClick={() => {
                setMobileMenuOpen(false);
                closeMenu();
              }}
            >
              <Image 
                src="/images/logo.jpg" 
                alt="Ekora Bazaar" 
                width={124}
                height={40}
                priority
                className="object-contain mix-blend-multiply group-hover:opacity-90 transition-opacity"
                style={{ height: "38px", width: "auto" }}
              />
            </Link>
          </div>

          {/* Center: Desktop Navigation Bar */}
          <nav className="hidden md:flex justify-center items-center gap-7 h-full">
            
            {/* 1. Craft Studios Mega Menu Trigger */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => handleMouseEnter("craft")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => (activeMenu === "craft" ? closeMenu() : handleMouseEnter("craft"))}
                aria-expanded={activeMenu === "craft"}
                aria-haspopup="true"
                className={`relative flex items-center gap-1.5 text-sm font-semibold h-full transition-colors ${
                  activeMenu === "craft" ? "text-amber-700" : "text-stone-700 hover:text-stone-950"
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 transition-colors ${activeMenu === "craft" ? "text-amber-600" : "text-amber-500"}`} />
                <span>Craft Studios</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMenu === "craft" ? "rotate-180 text-amber-700" : "text-stone-400"}`} />
                {activeMenu === "craft" && (
                  <motion.div
                    layoutId="activeUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-600 rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
            </div>

            {/* 2. Departments Mega Menu Trigger */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => handleMouseEnter("departments")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => (activeMenu === "departments" ? closeMenu() : handleMouseEnter("departments"))}
                aria-expanded={activeMenu === "departments"}
                aria-haspopup="true"
                className={`relative flex items-center gap-1.5 text-sm font-medium h-full transition-colors ${
                  activeMenu === "departments" ? "text-amber-700 font-semibold" : "text-stone-700 hover:text-stone-950"
                }`}
              >
                <span>Departments</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMenu === "departments" ? "rotate-180 text-amber-700" : "text-stone-400"}`} />
                {activeMenu === "departments" && (
                  <motion.div
                    layoutId="activeUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-600 rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
            </div>

            {/* 3. Discovery Kits */}
            <Link
              href="/classes"
              onClick={closeMenu}
              className="text-sm font-medium text-stone-700 hover:text-stone-950 transition-colors py-5"
            >
              Discovery Kits
            </Link>

            {/* 4. The Academy Dropdown */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => handleMouseEnter("academy")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => (activeMenu === "academy" ? closeMenu() : handleMouseEnter("academy"))}
                aria-expanded={activeMenu === "academy"}
                aria-haspopup="true"
                className={`relative flex items-center gap-1 text-sm font-medium h-full transition-colors ${
                  activeMenu === "academy" ? "text-amber-700 font-semibold" : "text-stone-700 hover:text-stone-950"
                }`}
              >
                <span>The Academy</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMenu === "academy" ? "rotate-180 text-amber-700" : "text-stone-400"}`} />
                {activeMenu === "academy" && (
                  <motion.div
                    layoutId="activeUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-600 rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
              </button>

              <AnimatePresence>
                {activeMenu === "academy" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    onMouseEnter={() => handleMouseEnter("academy")}
                    onMouseLeave={handleMouseLeave}
                    className="absolute top-14 left-0 w-64 bg-white rounded-2xl border border-stone-200 shadow-2xl p-2.5 z-50"
                  >
                    <Link
                      href="/formulations"
                      onClick={closeMenu}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                          Free Formulations
                        </div>
                        <div className="text-[11px] text-stone-500 font-normal leading-snug mt-0.5">
                          Lab-tested recipes, percentages &amp; step-by-step methods
                        </div>
                      </div>
                    </Link>
                    <Link
                      href="/classes"
                      onClick={closeMenu}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                          A to Z Masterclasses
                        </div>
                        <div className="text-[11px] text-stone-500 font-normal leading-snug mt-0.5">
                          Professional workshops and foundational artisan guides
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 5. About Us */}
            <Link
              href="/sell/platform"
              onClick={closeMenu}
              className="text-sm font-medium text-stone-700 hover:text-stone-950 transition-colors py-5"
            >
              About Us
            </Link>
          </nav>

          {/* Right: Search, Cart, Profile & Mobile Hamburger */}
          <div className="flex-1 flex justify-end items-center gap-2 sm:gap-4">
            <NavbarSearchBox />

            {/* Profile Dropdown */}
            <div 
              className="relative flex items-center"
              onMouseEnter={() => handleMouseEnter("profile")}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href={currentUser ? "/account" : "/login"}
                onClick={closeMenu}
                className="flex flex-col items-center justify-center text-stone-700 hover:text-amber-700 transition-colors px-2 py-1 min-w-[44px] rounded-lg hover:bg-stone-50"
                aria-label="User profile"
              >
                <User className="w-5 h-5 text-stone-700" />
                <span className="text-[10px] font-semibold mt-0.5 tracking-tight">Profile</span>
              </Link>

              <AnimatePresence>
                {activeMenu === "profile" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    onMouseEnter={() => handleMouseEnter("profile")}
                    onMouseLeave={handleMouseLeave}
                    className="absolute top-12 right-0 w-72 bg-white rounded-2xl border border-stone-200 shadow-2xl p-5 z-50 text-left"
                  >
                    {currentUser ? (
                      <div>
                        <div className="pb-3 border-b border-stone-100">
                          <p className="font-serif font-bold text-base text-stone-900">
                            Hello, {currentUser.displayName || 'Creator'}
                          </p>
                          <p className="text-xs text-stone-500 truncate mt-0.5 font-mono">
                            {currentUser.email}
                          </p>
                        </div>

                        <div className="py-2.5 space-y-1">
                          <Link
                            href="/account?tab=orders"
                            onClick={closeMenu}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-amber-700 hover:bg-stone-50 transition-colors"
                          >
                            <Package className="w-4 h-4 text-amber-600" />
                            <span>My Orders</span>
                          </Link>
                          <Link
                            href="/account?tab=addresses"
                            onClick={closeMenu}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-amber-700 hover:bg-stone-50 transition-colors"
                          >
                            <MapPin className="w-4 h-4 text-amber-600" />
                            <span>Saved Addresses</span>
                          </Link>
                          <Link
                            href="/account?tab=profile"
                            onClick={closeMenu}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-amber-700 hover:bg-stone-50 transition-colors"
                          >
                            <User className="w-4 h-4 text-amber-600" />
                            <span>Personal Details</span>
                          </Link>
                          <a
                            href="https://wa.me/919041500605"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={closeMenu}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-emerald-700 hover:bg-emerald-50/60 transition-colors"
                          >
                            <Phone className="w-4 h-4 text-emerald-600" />
                            <span>Contact Concierge</span>
                          </a>
                        </div>

                        <div className="pt-2.5 border-t border-stone-100">
                          <button
                            onClick={handleNavbarLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="pb-3 mb-3 border-b border-stone-100">
                          <h4 className="font-serif font-bold text-base text-stone-900">
                            Welcome Creator
                          </h4>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Sign in to access tier discounts, saved carts &amp; order tracking
                          </p>
                          <Link
                            href="/login"
                            onClick={closeMenu}
                            className="mt-3 w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold tracking-wider transition-colors shadow-sm"
                          >
                            LOGIN / SIGN UP
                          </Link>
                        </div>

                        <div className="space-y-1">
                          <Link
                            href="/login?redirect=/account?tab=orders"
                            onClick={closeMenu}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-stone-600 hover:text-amber-700 hover:bg-stone-50 transition-colors"
                          >
                            <span>Orders</span>
                            <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                          </Link>
                          <Link
                            href="/login?redirect=/account?tab=addresses"
                            onClick={closeMenu}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-stone-600 hover:text-amber-700 hover:bg-stone-50 transition-colors"
                          >
                            <span>Saved Addresses</span>
                            <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                          </Link>
                          <a
                            href="https://wa.me/919041500605"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={closeMenu}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-stone-600 hover:text-emerald-700 hover:bg-stone-50 transition-colors"
                          >
                            <span>Contact Support</span>
                            <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                          </a>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <CartIcon />

            <button
              className="md:hidden p-2 text-stone-700 hover:text-stone-950 focus:outline-none flex items-center justify-center min-w-[44px] min-h-[44px]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP MEGA-MENUS: FLUSH TO NAVBAR WITH OPAQUE LUXURY STYLING & ZERO GAP */}
        {/* ========================================================================= */}

        {/* 1. Craft Studios Mega Menu Panel */}
        <AnimatePresence>
          {activeMenu === "craft" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              onMouseEnter={() => handleMouseEnter("craft")}
              onMouseLeave={handleMouseLeave}
              className="absolute top-full left-0 right-0 w-full bg-white border-b border-stone-200 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.18)] z-50 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-6 md:px-8 py-7">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-200/80">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 block mb-0.5">
                      Shop by Discipline
                    </span>
                    <h3 className="font-serif text-xl md:text-2xl font-bold text-stone-900 tracking-tight">
                      Dedicated Craft Studios
                    </h3>
                  </div>
                  <Link 
                    href="/shop" 
                    onClick={closeMenu}
                    className="text-xs font-bold text-stone-600 hover:text-amber-700 flex items-center gap-1.5 transition-colors group"
                  >
                    <span>Browse Full Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {DISCIPLINE_HUBS.map((hub) => (
                    <Link
                      key={hub.id}
                      href={`/shop?discipline=${hub.id}`}
                      onClick={closeMenu}
                      className="group p-4 rounded-xl border border-stone-200/90 bg-white hover:border-amber-500/70 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-lg group-hover:bg-amber-50 group-hover:scale-105 transition-all">
                            {hub.icon}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${hub.badgeBg} ${hub.badgeText} ${hub.borderCol}`}>
                            Studio
                          </span>
                        </div>
                        <h4 className="font-serif text-[15px] font-bold text-stone-900 group-hover:text-amber-700 transition-colors leading-snug">
                          {hub.name}
                        </h4>
                        <p className="text-[11px] font-medium text-stone-600 mt-1 mb-1.5 line-clamp-1">
                          {hub.tagline}
                        </p>
                        <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-2">
                          {hub.description}
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] font-bold text-amber-600 group-hover:text-amber-700">
                        <span>Enter Studio</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Departments Mega Menu Panel */}
        <AnimatePresence>
          {activeMenu === "departments" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              onMouseEnter={() => handleMouseEnter("departments")}
              onMouseLeave={handleMouseLeave}
              className="absolute top-full left-0 right-0 w-full bg-white border-b border-stone-200 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.18)] z-50 overflow-hidden max-h-[calc(100vh-80px)] overflow-y-auto"
            >
              <div className="max-w-7xl mx-auto px-6 md:px-8 py-7">
                <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-stone-200/80">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                    Raw Materials &amp; Studio Equipment Architecture
                  </span>
                  <Link 
                    href="/shop" 
                    onClick={closeMenu}
                    className="text-xs font-bold text-stone-600 hover:text-amber-700 flex items-center gap-1.5 transition-colors group"
                  >
                    <span>View All Departments</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-left">
                  {DEPARTMENTS.map((dept) => (
                    <div key={dept.name} className="flex flex-col">
                      <Link
                        href={`/shop?department=${encodeURIComponent(dept.name)}`}
                        onClick={closeMenu}
                        className="font-serif font-bold text-sm text-stone-900 hover:text-amber-700 tracking-tight mb-2.5 transition-colors block border-b border-stone-200/80 pb-1.5"
                      >
                        {dept.name}
                      </Link>
                      <ul className="space-y-1.5 flex-1">
                        {dept.subcategories.slice(0, 6).map((sub) => (
                          <li key={sub}>
                            <Link
                              href={`/shop?category=${encodeURIComponent(sub)}`}
                              onClick={closeMenu}
                              className="text-xs text-stone-600 hover:text-amber-700 hover:translate-x-0.5 block py-0.5 leading-snug transition-all"
                            >
                              {sub}
                            </Link>
                          </li>
                        ))}
                        {dept.subcategories.length > 6 && (
                          <li>
                            <Link
                              href={`/shop?department=${encodeURIComponent(dept.name)}`}
                              onClick={closeMenu}
                              className="text-[11px] font-semibold text-amber-600 hover:underline block pt-1"
                            >
                              + {dept.subcategories.length - 6} more
                            </Link>
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Dimmed Backdrop Scrim (Dims page content underneath when mega menu is open) */}
      <AnimatePresence>
        {(activeMenu === "craft" || activeMenu === "departments") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 top-16 bg-stone-950/40 backdrop-blur-xs z-40 pointer-events-auto"
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>

      {/* Full-Screen Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden flex flex-col overflow-y-auto"
          >
            <div className="flex flex-col gap-4 flex-1 pb-12">
              
              {/* Mobile Craft Studios */}
              <div className="border-b border-stone-200 pb-4">
                <button
                  onClick={() => setMobileSectionOpen(mobileSectionOpen === "crafts" ? null : "crafts")}
                  className="w-full flex items-center justify-between text-lg font-bold font-serif text-stone-900 py-2"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Craft Studios
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform text-stone-400 ${mobileSectionOpen === "crafts" ? "rotate-180 text-amber-600" : ""}`} />
                </button>
                {mobileSectionOpen === "crafts" && (
                  <div className="mt-2 space-y-2 pl-4 border-l-2 border-amber-500/40">
                    {DISCIPLINE_HUBS.map((hub) => (
                      <Link
                        key={hub.id}
                        href={`/shop?discipline=${hub.id}`}
                        className="flex items-center gap-2.5 text-sm font-medium text-stone-700 hover:text-amber-700 py-1.5"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="text-base">{hub.icon}</span>
                        <span>{hub.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Departments */}
              <div className="border-b border-stone-200 pb-4">
                <button
                  onClick={() => setMobileSectionOpen(mobileSectionOpen === "departments" ? null : "departments")}
                  className="w-full flex items-center justify-between text-lg font-bold font-serif text-stone-900 py-2"
                >
                  <span>Departments</span>
                  <ChevronDown className={`w-4 h-4 transition-transform text-stone-400 ${mobileSectionOpen === "departments" ? "rotate-180 text-amber-600" : ""}`} />
                </button>
                {mobileSectionOpen === "departments" && (
                  <div className="mt-2 space-y-3 pl-4 border-l-2 border-stone-200">
                    {DEPARTMENTS.map((dept) => (
                      <div key={dept.name} className="py-1">
                        <Link
                          href={`/shop?department=${encodeURIComponent(dept.name)}`}
                          className="text-sm font-bold text-stone-900 hover:text-amber-700 block mb-1.5"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {dept.name}
                        </Link>
                        <div className="flex flex-wrap gap-1.5">
                          {dept.subcategories.slice(0, 4).map((sub) => (
                            <Link
                              key={sub}
                              href={`/shop?category=${encodeURIComponent(sub)}`}
                              className="text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {sub}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/shop"
                className="text-lg font-bold font-serif text-stone-900 hover:text-amber-700 transition-colors py-2 flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse All Products
              </Link>
              <Link
                href="/classes"
                className="text-lg font-bold font-serif text-stone-900 hover:text-amber-700 transition-colors py-2 flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Discovery Kits
              </Link>
              <Link
                href="/formulations"
                className="text-lg font-bold font-serif text-stone-900 hover:text-amber-700 transition-colors py-2 flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                The Academy (Formulations)
              </Link>
              <Link
                href="/sell/platform"
                className="text-lg font-bold font-serif text-stone-900 hover:text-amber-700 transition-colors py-2 flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>

              {/* Mobile Account / Profile Section */}
              <div className="border-t border-stone-200 pt-4 mt-2 space-y-2">
                {currentUser ? (
                  <>
                    <div className="px-1 py-1 text-xs text-stone-500 font-mono">
                      Signed in as <strong className="text-stone-900 font-sans">{currentUser.email}</strong>
                    </div>
                    <Link
                      href="/account?tab=orders"
                      className="text-base font-semibold text-stone-800 hover:text-amber-700 transition-colors py-1 flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Package className="w-4 h-4 text-amber-600" />
                      My Orders
                    </Link>
                    <Link
                      href="/account?tab=addresses"
                      className="text-base font-semibold text-stone-800 hover:text-amber-700 transition-colors py-1 flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MapPin className="w-4 h-4 text-amber-600" />
                      Saved Addresses
                    </Link>
                    <Link
                      href="/account?tab=profile"
                      className="text-base font-semibold text-stone-800 hover:text-amber-700 transition-colors py-1 flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-4 h-4 text-amber-600" />
                      Personal Details
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleNavbarLogout();
                      }}
                      className="text-sm font-semibold text-red-600 hover:text-red-700 py-1 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      href="/login"
                      className="flex-1 text-center bg-stone-900 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-wider"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login / Sign Up
                    </Link>
                  </div>
                )}
              </div>

              <div className="border-t border-stone-200 pt-4 mt-2">
                <Link
                  href="/sell"
                  className="flex items-center justify-center bg-stone-900 hover:bg-black text-white rounded-xl px-6 py-3.5 text-sm font-bold w-full transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Become a Seller
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
