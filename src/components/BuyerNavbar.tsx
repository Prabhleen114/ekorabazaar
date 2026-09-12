"use client";

import { useState, useEffect } from "react";
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

export default function BuyerNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDepartmentsOpen, setIsDepartmentsOpen] = useState(false);
  const [isCraftOpen, setIsCraftOpen] = useState(false);
  const [isAcademyOpen, setIsAcademyOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileSectionOpen, setMobileSectionOpen] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    // Check auth
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    // Check cart count
    fetch('/api/cart')
      .then(res => res.json())
      .then(data => {
        if (data?.items && Array.isArray(data.items)) {
          const totalQty = data.items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
          setCartCount(totalQty);
        }
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

  return (
    <>
      <TopUtilityBar />
      <header
        className={`sticky top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled || mobileMenuOpen ? "bg-white border-b border-brand-linen shadow-sm" : "bg-white/95 backdrop-blur-md border-b border-brand-linen/60"
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

          {/* Center: Desktop Nav Items & Mega Menu Triggers */}
          <nav className="hidden md:flex justify-center items-center gap-7 h-full">
            
            {/* 1. Craft Studios Dropdown */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => setIsCraftOpen(true)}
              onMouseLeave={() => setIsCraftOpen(false)}
            >
              <button
                onClick={() => setIsCraftOpen(!isCraftOpen)}
                className={`relative flex items-center gap-1.5 text-sm font-semibold h-full transition-colors ${
                  isCraftOpen ? "text-brand-orange" : "text-brand-charcoal/80 hover:text-brand-charcoal"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                <span>Craft Studios</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCraftOpen ? "rotate-180 text-brand-orange" : ""}`} />
                {isCraftOpen && (
                  <motion.div
                    layoutId="activeUnderlineCraft"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-orange"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>

              <AnimatePresence>
                {isCraftOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed top-24 left-0 right-0 w-full bg-white/98 backdrop-blur-xl border-b border-brand-linen shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="max-w-7xl mx-auto px-8 py-8">
                      <div className="flex items-center justify-between pb-4 mb-6 border-b border-brand-linen">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-orange block mb-0.5">
                            Shop by Discipline
                          </span>
                          <h3 className="font-serif text-2xl font-bold text-brand-charcoal">
                            Dedicated Craft Studios
                          </h3>
                        </div>
                        <Link 
                          href="/shop" 
                          className="text-xs font-bold text-brand-charcoal/70 hover:text-brand-orange flex items-center gap-1 transition-colors"
                        >
                          Browse Full Catalog <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {DISCIPLINE_HUBS.map((hub) => (
                          <Link
                            key={hub.id}
                            href={`/shop?discipline=${hub.id}`}
                            className="group p-5 rounded-2xl border border-brand-linen bg-white hover:border-brand-orange/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{hub.icon}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${hub.badgeBg} ${hub.badgeText} ${hub.borderCol}`}>
                                  Studio
                                </span>
                              </div>
                              <h4 className="font-serif text-lg font-bold text-brand-charcoal group-hover:text-brand-orange transition-colors">
                                {hub.name}
                              </h4>
                              <p className="text-xs font-semibold text-brand-charcoal/60 mt-1 mb-2">
                                {hub.tagline}
                              </p>
                              <p className="text-xs text-brand-charcoal/50 leading-relaxed line-clamp-2">
                                {hub.description}
                              </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-brand-linen/60 flex items-center justify-between text-xs font-bold text-brand-orange group-hover:translate-x-0.5 transition-transform">
                              <span>Enter Studio</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Departments Mega Menu Dropdown */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => setIsDepartmentsOpen(true)}
              onMouseLeave={() => setIsDepartmentsOpen(false)}
            >
              <button
                onClick={() => setIsDepartmentsOpen(!isDepartmentsOpen)}
                className={`relative flex items-center gap-1.5 text-sm font-medium h-full transition-colors ${
                  isDepartmentsOpen ? "text-brand-orange" : "text-brand-charcoal/80 hover:text-brand-charcoal"
                }`}
              >
                <span>Departments</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDepartmentsOpen ? "rotate-180 text-brand-orange" : ""}`} />
                {isDepartmentsOpen && (
                  <motion.div
                    layoutId="activeUnderlineDept"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-orange"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>

              <AnimatePresence>
                {isDepartmentsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed top-24 left-0 right-0 w-full bg-white/98 backdrop-blur-xl border-b border-brand-linen shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="max-w-7xl mx-auto px-8 py-8">
                      <div className="flex items-center justify-between pb-3 mb-6 border-b border-brand-linen">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-brand-charcoal/50">
                          Raw Materials &amp; Studio Equipment Architecture
                        </span>
                        <Link 
                          href="/shop" 
                          className="text-xs font-bold text-brand-charcoal/70 hover:text-brand-orange flex items-center gap-1 transition-colors"
                        >
                          View All Departments <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 text-left">
                        {DEPARTMENTS.map((dept) => (
                          <div key={dept.name} className="flex flex-col">
                            <Link
                              href={`/shop?department=${encodeURIComponent(dept.name)}`}
                              className="font-serif font-bold text-sm text-brand-charcoal hover:text-brand-orange tracking-tight mb-2.5 transition-colors block border-b border-brand-linen/60 pb-1.5"
                            >
                              {dept.name}
                            </Link>
                            <ul className="space-y-1.5 flex-1">
                              {dept.subcategories.slice(0, 6).map((sub) => (
                                <li key={sub}>
                                  <Link
                                    href={`/shop?category=${encodeURIComponent(sub)}`}
                                    className="text-xs text-brand-charcoal/65 hover:text-brand-orange block py-0.5 leading-snug transition-colors"
                                  >
                                    {sub}
                                  </Link>
                                </li>
                              ))}
                              {dept.subcategories.length > 6 && (
                                <li>
                                  <Link
                                    href={`/shop?department=${encodeURIComponent(dept.name)}`}
                                    className="text-[11px] font-semibold text-brand-orange hover:underline block pt-1"
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
            </div>

            {/* 3. Discovery Kits */}
            <Link
              href="/classes"
              className="text-sm font-medium text-brand-charcoal/70 hover:text-brand-charcoal transition-colors py-5"
            >
              Discovery Kits
            </Link>

            {/* 4. The Academy Dropdown */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => setIsAcademyOpen(true)}
              onMouseLeave={() => setIsAcademyOpen(false)}
            >
              <button
                onClick={() => setIsAcademyOpen(!isAcademyOpen)}
                className="flex items-center gap-1 text-sm font-medium text-brand-charcoal/70 hover:text-brand-charcoal transition-colors py-5"
              >
                <span>The Academy</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAcademyOpen ? "rotate-180 text-brand-orange" : ""}`} />
              </button>

              <AnimatePresence>
                {isAcademyOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-14 left-0 w-56 bg-white rounded-2xl border border-brand-linen shadow-xl p-3 z-50"
                  >
                    <Link
                      href="/formulations"
                      className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-brand-bg text-sm font-medium text-brand-charcoal hover:text-brand-orange transition-colors"
                    >
                      <GraduationCap className="w-4 h-4 text-brand-orange" />
                      <span>Free Formulations</span>
                    </Link>
                    <Link
                      href="/classes"
                      className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-brand-bg text-sm font-medium text-brand-charcoal hover:text-brand-orange transition-colors"
                    >
                      <GraduationCap className="w-4 h-4 text-brand-sage" />
                      <span>A to Z Masterclasses</span>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 5. About Us */}
            <Link
              href="/sell/platform"
              className="text-sm font-medium text-brand-charcoal/70 hover:text-brand-charcoal transition-colors py-5"
            >
              About Us
            </Link>
          </nav>

          {/* Right: Search, Cart, Profile & Mobile Hamburger */}
          <div className="flex-1 flex justify-end items-center gap-2 sm:gap-4">
            <NavbarSearchBox />

            {/* Profile Dropdown (Myntra Style) */}
            <div 
              className="relative flex items-center"
              onMouseEnter={() => setIsProfileOpen(true)}
              onMouseLeave={() => setIsProfileOpen(false)}
            >
              <Link
                href={currentUser ? "/account" : "/login"}
                onClick={() => setIsProfileOpen(false)}
                className="flex flex-col items-center justify-center text-brand-charcoal/80 hover:text-brand-charcoal transition-colors px-1.5 py-1 min-w-[42px]"
                aria-label="User profile"
              >
                <User className="w-5 h-5" />
                <span className="text-[10px] font-bold mt-0.5 tracking-tight">Profile</span>
              </Link>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-11 right-0 w-72 bg-white rounded-2xl border border-brand-linen shadow-2xl p-5 z-50 text-left"
                  >
                    {currentUser ? (
                      <div>
                        <div className="pb-3 border-b border-brand-linen">
                          <p className="font-serif font-bold text-base text-brand-charcoal">
                            Hello, {currentUser.displayName || 'Creator'}
                          </p>
                          <p className="text-xs text-brand-charcoal/60 truncate mt-0.5">
                            {currentUser.email}
                          </p>
                        </div>

                        <div className="py-2 space-y-1">
                          <Link
                            href="/account?tab=orders"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-brand-charcoal/80 hover:text-brand-orange hover:bg-brand-bg transition-colors"
                          >
                            <Package className="w-4 h-4 text-brand-orange" />
                            <span>My Orders</span>
                          </Link>
                          <Link
                            href="/account?tab=addresses"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-brand-charcoal/80 hover:text-brand-orange hover:bg-brand-bg transition-colors"
                          >
                            <MapPin className="w-4 h-4 text-brand-orange" />
                            <span>Saved Addresses</span>
                          </Link>
                          <Link
                            href="/account?tab=profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-brand-charcoal/80 hover:text-brand-orange hover:bg-brand-bg transition-colors"
                          >
                            <User className="w-4 h-4 text-brand-orange" />
                            <span>Personal Details</span>
                          </Link>
                          <a
                            href="https://wa.me/919041500605"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-brand-charcoal/80 hover:text-brand-orange hover:bg-brand-bg transition-colors"
                          >
                            <Phone className="w-4 h-4 text-emerald-600" />
                            <span>Contact Concierge</span>
                          </a>
                        </div>

                        <div className="pt-2 border-t border-brand-linen">
                          <button
                            onClick={handleNavbarLogout}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="pb-3 mb-3 border-b border-brand-linen">
                          <h4 className="font-serif font-bold text-sm text-brand-charcoal">
                            Welcome
                          </h4>
                          <p className="text-[11px] text-brand-charcoal/60 mt-0.5">
                            To access account and manage orders
                          </p>
                          <Link
                            href="/login"
                            onClick={() => setIsProfileOpen(false)}
                            className="mt-3 w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-brand-charcoal hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                          >
                            LOGIN / SIGNUP
                          </Link>
                        </div>

                        <div className="space-y-1">
                          <Link
                            href="/login?redirect=/account?tab=orders"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-medium text-brand-charcoal/80 hover:text-brand-orange transition-colors"
                          >
                            <span>Orders</span>
                          </Link>
                          <Link
                            href="/login?redirect=/account?tab=addresses"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-medium text-brand-charcoal/80 hover:text-brand-orange transition-colors"
                          >
                            <span>Saved Addresses</span>
                          </Link>
                          <a
                            href="https://wa.me/919041500605"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-medium text-brand-charcoal/80 hover:text-brand-orange transition-colors"
                          >
                            <span>Contact Support</span>
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
              className="md:hidden p-3 -mr-3 text-brand-charcoal focus:outline-none flex items-center justify-center min-w-[44px] min-h-[44px]"
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
            <div className="flex flex-col gap-4 flex-1 pb-12">
              
              {/* Mobile Craft Studios */}
              <div className="border-b border-brand-linen pb-4">
                <button
                  onClick={() => setMobileSectionOpen(mobileSectionOpen === "crafts" ? null : "crafts")}
                  className="w-full flex items-center justify-between text-lg font-bold font-serif text-brand-charcoal py-2"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-orange" />
                    Craft Studios
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileSectionOpen === "crafts" ? "rotate-180" : ""}`} />
                </button>
                {mobileSectionOpen === "crafts" && (
                  <div className="mt-2 space-y-2 pl-4 border-l-2 border-brand-orange/30">
                    {DISCIPLINE_HUBS.map((hub) => (
                      <Link
                        key={hub.id}
                        href={`/shop?discipline=${hub.id}`}
                        className="flex items-center gap-2 text-sm font-semibold text-brand-charcoal/80 hover:text-brand-orange py-1.5"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>{hub.icon}</span>
                        <span>{hub.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Departments */}
              <div className="border-b border-brand-linen pb-4">
                <button
                  onClick={() => setMobileSectionOpen(mobileSectionOpen === "departments" ? null : "departments")}
                  className="w-full flex items-center justify-between text-lg font-bold font-serif text-brand-charcoal py-2"
                >
                  <span>Departments</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileSectionOpen === "departments" ? "rotate-180" : ""}`} />
                </button>
                {mobileSectionOpen === "departments" && (
                  <div className="mt-2 space-y-3 pl-4 border-l-2 border-brand-linen">
                    {DEPARTMENTS.map((dept) => (
                      <div key={dept.name} className="py-1">
                        <Link
                          href={`/shop?department=${encodeURIComponent(dept.name)}`}
                          className="text-sm font-bold text-brand-charcoal hover:text-brand-orange block mb-1"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {dept.name}
                        </Link>
                        <div className="flex flex-wrap gap-1.5">
                          {dept.subcategories.slice(0, 4).map((sub) => (
                            <Link
                              key={sub}
                              href={`/shop?category=${encodeURIComponent(sub)}`}
                              className="text-[11px] bg-brand-bg text-brand-charcoal/70 px-2 py-0.5 rounded"
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
                className="text-xl font-bold font-serif text-brand-charcoal hover:text-brand-orange transition-colors py-2 flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse All Products
              </Link>
              <Link
                href="/classes"
                className="text-xl font-bold font-serif text-brand-charcoal hover:text-brand-orange transition-colors py-2 flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Discovery Kits
              </Link>
              <Link
                href="/formulations"
                className="text-xl font-bold font-serif text-brand-charcoal hover:text-brand-orange transition-colors py-2 flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                The Academy (Formulations)
              </Link>
              <Link
                href="/sell/platform"
                className="text-xl font-bold font-serif text-brand-charcoal hover:text-brand-orange transition-colors py-2 flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>

              {/* Mobile Account / Profile Section */}
              <div className="border-t border-brand-linen pt-4 mt-2 space-y-2">
                {currentUser ? (
                  <>
                    <div className="px-1 py-1 text-xs text-brand-charcoal/60">
                      Signed in as <strong className="text-brand-charcoal">{currentUser.email}</strong>
                    </div>
                    <Link
                      href="/account?tab=orders"
                      className="text-lg font-bold font-serif text-brand-charcoal hover:text-brand-orange transition-colors py-1 flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Package className="w-4 h-4 text-brand-orange" />
                      My Orders
                    </Link>
                    <Link
                      href="/account?tab=addresses"
                      className="text-lg font-bold font-serif text-brand-charcoal hover:text-brand-orange transition-colors py-1 flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MapPin className="w-4 h-4 text-brand-orange" />
                      Saved Addresses
                    </Link>
                    <Link
                      href="/account?tab=profile"
                      className="text-lg font-bold font-serif text-brand-charcoal hover:text-brand-orange transition-colors py-1 flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-4 h-4 text-brand-orange" />
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
                      className="flex-1 text-center bg-brand-charcoal text-white rounded-xl py-3 text-xs font-bold uppercase tracking-wider"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login / Sign Up
                    </Link>
                  </div>
                )}
              </div>

              <div className="border-t border-brand-linen pt-4 mt-2">
                <Link
                  href="/sell"
                  className="flex items-center justify-center bg-brand-charcoal text-white rounded-xl px-6 py-4 text-base font-semibold w-full min-h-[52px]"
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
