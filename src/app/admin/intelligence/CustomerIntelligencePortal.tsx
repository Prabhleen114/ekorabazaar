"use client";

import React, { useState, useEffect } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import BehavioralFlags from "./BehavioralFlags";
import {
  Calendar,
  IndianRupee,
  RotateCw,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Copy,
  DollarSign,
  Eye,
  EyeOff,
  Filter,
  Flame,
  HelpCircle,
  Layers,
  MessageCircle,
  Package,
  Play,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  X,
  Zap,
} from "lucide-react";

type TabKey =
  | "today"
  | "lost_sessions"
  | "funnel"
  | "demand"
  | "customers"
  | "suppliers"
  | "actions"
  | "system_health"
  | "synthetic_tests"
  | "analytics_charts"
  | "flags";

export default function CustomerIntelligencePortal() {
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [lostSessionFilter, setLostSessionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [maskContactDetails, setMaskContactDetails] = useState(true);

  // Modal / Explain State
  const [selectedExplain, setSelectedExplain] = useState<any>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Synthetic Test Runner State
  const [syntheticResults, setSyntheticResults] = useState<any>(null);
  const [runningTests, setRunningTests] = useState(false);

  // Action status message
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/intelligence-e2e");
      if (!res.ok) throw new Error("Failed to load intelligence data");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkHandled = async (sessionId: string) => {
    try {
      const res = await fetch("/api/admin/intelligence-e2e", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "handle_session", session_id: sessionId, handled_by: "Prabhleen (Admin)" }),
      });
      if (res.ok) {
        setActionNotice(`Session ${sessionId} marked as handled!`);
        setTimeout(() => setActionNotice(null), 3000);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExplain = async (sessionId: string) => {
    try {
      setIsExplaining(true);
      setSelectedExplain(null);
      const res = await fetch("/api/admin/intelligence-e2e", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "explain_session", session_id: sessionId }),
      });
      const json = await res.json();
      setSelectedExplain(json);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleRunSyntheticTests = async () => {
    try {
      setRunningTests(true);
      const res = await fetch("/api/admin/intelligence-e2e", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_synthetic_tests" }),
      });
      const json = await res.json();
      setSyntheticResults(json);
      setActiveTab("synthetic_tests");
    } catch (e) {
      console.error(e);
    } finally {
      setRunningTests(false);
    }
  };

  const maskPhone = (phone?: string) => {
    if (!phone) return "N/A";
    if (!maskContactDetails) return phone;
    return phone.replace(/(\+91\s\d{2})\d{4}(\d{4})/, "$1••••$2");
  };

  const maskEmail = (email?: string) => {
    if (!email) return "N/A";
    if (!maskContactDetails) return email;
    const parts = email.split("@");
    if (parts.length < 2) return email;
    const name = parts[0];
    return `${name.slice(0, 3)}•••@${parts[1]}`;
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm font-medium text-slate-300">
            Loading Ekora Bazaar Customer Intelligence Engine...
          </p>
        </div>
      </div>
    );
  }

  const { today, lostSessions, funnel, demand, customers, suppliers, actionsAndResults, systemHealth } =
    data || {};

  const filteredLostSessions = (lostSessions || []).filter((s: any) => {
    if (lostSessionFilter !== "all" && s.cause !== lostSessionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchKey = s.visitor_key.toLowerCase().includes(q);
      const matchName = s.customer_name?.toLowerCase().includes(q);
      const matchEvt = s.evidence.some((e: string) => e.toLowerCase().includes(q));
      return matchKey || matchName || matchEvt;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  Ekora Bazaar
                </h1>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                  Release 1 · Evidence-First
                </span>
                <span className="hidden text-xs text-slate-400 sm:inline">
                  ekorabazaar.in
                </span>
              </div>
              <p className="text-xs text-slate-500">
                B2B Customer Intelligence, Lost-Session Diagnosis & Demand Layer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMaskContactDetails(!maskContactDetails)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              title="DPDP Privacy Compliance: Toggle masked contact details"
            >
              {maskContactDetails ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Contacts Masked</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Contacts Revealed</span>
                </>
              )}
            </button>

            <button
              onClick={handleRunSyntheticTests}
              disabled={runningTests}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
            >
              <Play className={`h-3.5 w-3.5 ${runningTests ? "animate-spin" : ""}`} />
              <span>{runningTests ? "Verifying..." : "Run Synthetic Verification"}</span>
            </button>

            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* 8-Tab Navigation Bar (strictly matching the 8 admin portal pages in the plan) */}
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 sm:px-6">
          <div className="mx-auto flex max-w-7xl space-x-1 overflow-x-auto py-1 scrollbar-none">
            {[
              { id: "today", label: "1. Today (5-Min Check)", icon: Clock },
              { id: "lost_sessions", label: "2. Lost Sessions", icon: TrendingDown },
              { id: "funnel", label: "3. Funnel", icon: Layers },
              { id: "demand", label: "4. Demand (9 Reports)", icon: BarChart3 },
              { id: "customers", label: "5. Customers & RFM", icon: Users },
              { id: "suppliers", label: "6. Suppliers", icon: Truck },
              { id: "actions", label: "7. Actions & Holdout", icon: CheckCircle },
              { id: "system_health", label: "8. System Health", icon: ShieldCheck },
              { id: "synthetic_tests", label: "Verification Tests", icon: Zap },
              { id: "analytics_charts", label: "Revenue & LTV Charts", icon: IndianRupee },
              { id: "flags", label: "Database Flags", icon: Flame },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabKey)}
                  className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      isActive ? "text-emerald-600" : "text-slate-400"
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.id === "actions" && today?.actionsWaiting > 0 && (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                      {today.actionsWaiting}
                    </span>
                  )}
                  {tab.id === "lost_sessions" && (
                    <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700">
                      {lostSessions?.length || 0}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Floating Notice */}
      {actionNotice && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg">
          <Check className="h-4 w-4 text-emerald-300" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* =================================================================== */}
        {/* PAGE 1: TODAY (The 5-minute morning check)                           */}
        {/* =================================================================== */}
        {activeTab === "today" && today && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Today: 5-Minute Morning Check
              </h2>
              <p className="text-xs text-slate-500">
                The single admin view ranking lost revenue causes in rupees, errors detected, and actions waiting.
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                    Cart Value Lost (24h)
                  </span>
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-rose-950">
                  ₹{today.cartValueLost24h.toLocaleString("en-IN")}
                </div>
                <p className="mt-1 text-xs text-rose-600">
                  Across diagnosed cart and checkout abandonments
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Est. Lost (Last 7 Days)
                  </span>
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900">
                  ₹{Math.round(today.cartValueLost7d).toLocaleString("en-IN")}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Cumulative hesitation and drop-offs
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                    Errors Seen
                  </span>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-amber-950">
                  {today.errorsSeen}
                </div>
                <p className="mt-1 text-xs text-amber-700">
                  Server 5xx & payment gateway failures
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                    Actions Waiting
                  </span>
                  <Send className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-emerald-950">
                  {today.actionsWaiting}
                </div>
                <p className="mt-1 text-xs text-emerald-700">
                  Personalized WhatsApp follow-ups ready
                </p>
              </div>
            </div>

            {/* Core Plan Requirement: Causes Ranked in RUPEES, NOT Counts! */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Why Didn't They Buy? Causes Ranked by Rupees Lost
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ranked by cart value lost because ten ₹500 carts and one ₹40,000 cart are not the same problem (Page 8).
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("lost_sessions")}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 sm:mt-0"
                >
                  <span>View All Lost Sessions</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {today.rankedCauses.map((item: any, idx: number) => {
                  const pct =
                    today.cartValueLost24h > 0
                      ? Math.min(100, Math.round((item.lostRupees / today.cartValueLost24h) * 100))
                      : 0;

                  return (
                    <div key={item.cause} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {item.meta.label}
                              </span>
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${item.meta.badgeColor}`}
                              >
                                {item.sessionCount} session{item.sessionCount > 1 ? "s" : ""}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {item.meta.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right sm:min-w-[180px]">
                          <div className="flex-1">
                            <div className="text-sm font-extrabold text-slate-900">
                              ₹{item.lostRupees.toLocaleString("en-IN")}
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${Math.max(8, pct)}%` }}
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setLostSessionFilter(item.cause);
                              setActiveTab("lost_sessions");
                            }}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Default Action:</span>
                        <span>{item.meta.defaultAction}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Link Cards to Key Diagnostic Workflows */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div
                onClick={() => setActiveTab("lost_sessions")}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Daily Follow-up Work</h4>
                  <ArrowRight className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Inspect {lostSessions?.length || 0} lost sessions, copy tailored WhatsApp drafts, and mark handled.
                </p>
              </div>

              <div
                onClick={() => setActiveTab("demand")}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Demand & Merchandising</h4>
                  <ArrowRight className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  View unmet demand, zero-result search phrases, and ₹ lost to out-of-stock items.
                </p>
              </div>

              <div
                onClick={() => setActiveTab("actions")}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">10% Holdout Results</h4>
                  <ArrowRight className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Measure incremental conversion: treated vs control holdout group (Page 12).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PAGE 2: LOST SESSIONS TABLE                                        */}
        {/* =================================================================== */}
        {activeTab === "lost_sessions" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Lost Sessions Decision List
                </h2>
                <p className="text-xs text-slate-500">
                  One ranked cause per lost session with logged evidence lines, confidence score, and suggested action.
                </p>
              </div>

              {/* Search & Cause Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search visitor, cause, evidence..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs focus:border-emerald-500 focus:outline-none sm:w-64"
                  />
                </div>

                <select
                  value={lostSessionFilter}
                  onChange={(e) => setLostSessionFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">All Causes</option>
                  <option value="technical_failure">Technical Failure</option>
                  <option value="supply_problem">Supply / Stock Problem</option>
                  <option value="whatsapp_diverted">WhatsApp Diverted</option>
                  <option value="gst_block">GST Billing Friction</option>
                  <option value="shipping_shock">Shipping Shock (&lt; ₹2k)</option>
                  <option value="tier_confusion">Tier Confusion</option>
                  <option value="trust_hesitation">Trust / COA Hesitation</option>
                  <option value="price_concern">Price Concern</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>

            {/* Sessions Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Visitor & Device</th>
                      <th className="px-4 py-3">Cart Value</th>
                      <th className="px-4 py-3">Diagnosed Cause</th>
                      <th className="px-4 py-3">Confidence</th>
                      <th className="px-4 py-3">Evidence Lines</th>
                      <th className="px-4 py-3">Suggested Action</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLostSessions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          No lost sessions matching the current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredLostSessions.map((s: any) => (
                        <tr
                          key={s.session_id}
                          className={`transition hover:bg-slate-50/70 ${
                            s.handled ? "bg-slate-50/40 opacity-75" : ""
                          }`}
                        >
                          <td className="px-4 py-3.5 align-top">
                            <div className="font-bold text-slate-900">
                              {s.customer_name || "Guest Visitor"}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500">
                              {s.visitor_key}
                            </div>
                            {s.customer_phone && (
                              <div className="mt-0.5 text-[11px] text-slate-600">
                                {maskPhone(s.customer_phone)}
                              </div>
                            )}
                            <div className="mt-1 text-[10px] text-slate-400">
                              {new Date(s.diagnosed_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 align-top font-extrabold text-slate-900">
                            {s.cart_value > 0 ? (
                              `₹${s.cart_value.toLocaleString("en-IN")}`
                            ) : (
                              <span className="text-slate-400">₹0 (Browse)</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 align-top">
                            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                              {s.cause_label}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 align-top">
                            <span
                              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                s.confidence === "high"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : s.confidence === "medium"
                                  ? "bg-amber-100 text-amber-800"
                                  : s.confidence === "low"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {s.confidence}
                            </span>
                          </td>

                          <td className="max-w-xs px-4 py-3.5 align-top">
                            <ul className="space-y-1 text-[11px] text-slate-600">
                              {s.evidence.map((line: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-emerald-500">•</span>
                                  <span>{line}</span>
                                </li>
                              ))}
                            </ul>
                          </td>

                          <td className="max-w-xs px-4 py-3.5 align-top text-xs text-slate-700">
                            <div className="rounded-md bg-slate-50 p-2 text-[11px] leading-relaxed">
                              {s.suggested_action}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 align-top text-right">
                            <div className="flex flex-col items-end gap-1.5">
                              <button
                                onClick={() => handleExplain(s.session_id)}
                                className="flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                                title="Generate plain-English summary & WhatsApp message"
                              >
                                <Sparkles className="h-3 w-3 text-emerald-600" />
                                <span>Explain & WhatsApp</span>
                              </button>

                              {s.handled ? (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                                  <Check className="h-3 w-3" />
                                  <span>Handled</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleMarkHandled(s.session_id)}
                                  className="rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
                                >
                                  Mark Handled
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PAGE 3: FUNNEL                                                     */}
        {/* =================================================================== */}
        {activeTab === "funnel" && funnel && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Conversion Funnel & Leaks
              </h2>
              <p className="text-xs text-slate-500">
                Tracking drop-off between stages, showing where customer intent leaks before purchase.
              </p>
            </div>

            {/* Visual 5-Stage Funnel */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
              {funnel.stages.map((stage: any, index: number) => (
                <div
                  key={stage.stage}
                  className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Stage {index + 1}</span>
                    {index > 0 && (
                      <span className="text-rose-600 font-bold">-{stage.dropPct}%</span>
                    )}
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900">
                    {stage.count.toLocaleString("en-IN")}
                  </div>
                  <div className="mt-0.5 text-xs font-bold text-slate-800">
                    {stage.label}
                  </div>

                  {stage.leakDiagnosis && (
                    <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-600">
                      <span className="font-semibold text-rose-700">Leak Trigger:</span>{" "}
                      {stage.leakDiagnosis}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Funnel Splits by Device & Traffic */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900">Performance by Device</h3>
                <p className="text-xs text-slate-500">
                  Mobile conversion rates are critical for B2B WhatsApp & Instagram discovery.
                </p>

                <div className="mt-4 space-y-3">
                  {Object.entries(funnel.deviceSplit).map(([dev, stats]: [string, any]) => {
                    const convRate = ((stats.purchases / stats.visits) * 100).toFixed(1);
                    return (
                      <div key={dev} className="rounded-lg bg-slate-50 p-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 capitalize">
                          <span>{dev}</span>
                          <span className="text-emerald-700">{convRate}% Conversion</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                          <span>{stats.visits} Visitors</span>
                          <span>{stats.carts} Added to Cart</span>
                          <span className="font-bold text-slate-800">{stats.purchases} Orders</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900">Traffic Source Acquisition</h3>
                <p className="text-xs text-slate-500">
                  Direct & WhatsApp referrals demonstrate the highest purchase intent.
                </p>

                <div className="mt-4 space-y-3">
                  {funnel.sourceSplit.map((src: any) => (
                    <div key={src.source} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                      <div>
                        <div className="text-xs font-bold text-slate-800">{src.source}</div>
                        <div className="text-[11px] text-slate-500">{src.visits} Visitors</div>
                      </div>
                      <div className="rounded-md bg-white px-3 py-1 font-mono text-xs font-bold text-emerald-700 shadow-sm ring-1 ring-slate-200">
                        {src.conversionRate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PAGE 4: DEMAND (The 9 ranked lists from page 9 of plan)             */}
        {/* =================================================================== */}
        {activeTab === "demand" && demand && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Demand & Sourcing Intelligence (9 Ranked Lists)
              </h2>
              <p className="text-xs text-slate-500">
                Views show interest, carts show intent, purchases show revenue, and searches/requests show unmet demand (Page 9).
              </p>
            </div>

            {/* Row 1: Unmet Demand & Out-of-Stock Losses (Critical for Supplier Sourcing Team) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-amber-950">
                      Unmet Demand (Zero-Results & Requests)
                    </h3>
                    <p className="text-xs text-amber-800">
                      Products buyers searched for that you do not yet list.
                    </p>
                  </div>
                  <HelpCircle className="h-4 w-4 text-amber-700" />
                </div>

                <div className="mt-4 space-y-2.5">
                  {demand.unmetDemand.map((item: any, i: number) => (
                    <div key={i} className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-amber-200/60">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">"{item.requestedPhrase}"</span>
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          {item.uniqueVisitors} unique buyers
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-700">Sourcing Brief:</span> {item.actionAdvice}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-rose-950">
                      Out-of-Stock Losses
                    </h3>
                    <p className="text-xs text-rose-800">
                      Estimated revenue lost: OOS views × cart rate × AOV in ₹.
                    </p>
                  </div>
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                </div>

                <div className="mt-4 space-y-2.5">
                  {demand.outOfStockLosses.map((item: any, i: number) => (
                    <div key={i} className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-rose-200/60">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{item.product_name}</span>
                        <span className="font-extrabold text-rose-700 text-xs">
                          ₹{item.estimatedLossRupees.toLocaleString("en-IN")} lost
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                        <span>{item.oos_views} OOS views</span>
                        <span>{item.requestsCount} "Notify Me" restock alerts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Leaky Products & Rising Products */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900">
                  Leaky Products (High Carts, Low Purchase Rate)
                </h3>
                <p className="text-xs text-slate-500">
                  Where interest is not turning into completed orders, with top diagnosis cause.
                </p>

                <div className="mt-3 divide-y divide-slate-100">
                  {demand.leakyProducts.map((p: any) => (
                    <div key={p.product_id} className="py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-xs">{p.product_name}</span>
                        <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                          {p.cartToPurchaseRate}% Conversion
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{p.carts} Carts · {p.purchases} Purchases</span>
                        <span className="font-medium text-slate-700">
                          Top Cause: <span className="underline">{p.top_diagnosis_cause}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-bold text-slate-900">Rising Products (Surge Demand)</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Last 7 days of views against the prior 28-day daily average.
                </p>

                <div className="mt-3 space-y-2.5">
                  {demand.rising.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5">
                      <div>
                        <div className="text-xs font-bold text-slate-800">{item.product_name}</div>
                        <div className="text-[10px] text-slate-500">{item.category}</div>
                      </div>
                      <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800">
                        {item.surgePct}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: Top Searches with Synonym Normalisation */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Top Searches & Editable Synonym Normalisation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Collapse plurals and spelling variants ("soya wax" and "soy wax" are counted as one demand).
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Normalised Top Searches
                  </h4>
                  <div className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {demand.topSearches.map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2.5 text-xs">
                        <span className="font-mono text-slate-800">"{s.query}"</span>
                        <span className="font-semibold text-slate-600">{s.uniqueVisitors} visitors</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Synonym Table (Page 9)
                  </h4>
                  <div className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {demand.synonyms.map((syn: any) => (
                      <div key={syn.id} className="flex items-center justify-between p-2.5 text-xs">
                        <span className="text-slate-700">
                          <span className="font-mono text-rose-700">{syn.raw_term}</span> →{" "}
                          <span className="font-mono font-bold text-emerald-700">{syn.canonical_term}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">{syn.notes}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PAGE 5: CUSTOMERS & STANDING FLAGS                                 */}
        {/* =================================================================== */}
        {activeTab === "customers" && customers && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Customer Profiles & Standing Flags
              </h2>
              <p className="text-xs text-slate-500">
                Standing flags (Reorder Due, Dormant Buyer, High Value at Risk) run alongside lost-session rules and require no cart (Page 11-12).
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {customers.map((c: any) => (
                <div key={c.customer_id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {c.city}, {c.state}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {maskPhone(c.phone)} · {maskEmail(c.email)}
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        c.standingFlag === "reorder_due"
                          ? "bg-emerald-100 text-emerald-800"
                          : c.standingFlag === "high_value_at_risk"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {c.standingFlag.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>

                  {/* Customer Metrics */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500">Lifetime Spend</span>
                      <div className="font-extrabold text-slate-900">
                        ₹{c.lifetimeSpendRupees.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Orders Placed</span>
                      <div className="font-extrabold text-slate-900">{c.totalOrders}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Order Cadence</span>
                      <div className="font-extrabold text-slate-900">
                        {c.averageOrderIntervalDays ? `${c.averageOrderIntervalDays}d avg` : "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Suggested Action */}
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs">
                    <span className="font-bold text-slate-800">Action:</span>{" "}
                    <span className="text-slate-700">{c.suggestedAction}</span>
                  </div>

                  {/* Timeline */}
                  <div className="mt-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Recent Activity Timeline
                    </span>
                    <div className="mt-1.5 space-y-1 text-xs text-slate-600">
                      {c.recentTimeline.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span>{item.event}</span>
                          <span className="text-slate-400">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PAGE 6: SUPPLIERS                                                  */}
        {/* =================================================================== */}
        {activeTab === "suppliers" && suppliers && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Supplier Health & Onboarding Funnel
              </h2>
              <p className="text-xs text-slate-500">
                Rule 2 safeguard: distinguish slow suppliers from hesitant buyers before recommending buyer-facing nudges (Page 10).
              </p>
            </div>

            {/* Supplier Health Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  supplier_health SLA Monitoring
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5">Supplier & Location</th>
                      <th className="px-4 py-2.5">Product</th>
                      <th className="px-4 py-2.5">Dispatch Time (SLA: &le; 5d)</th>
                      <th className="px-4 py-2.5">Cancel Rate (SLA: &le; 10%)</th>
                      <th className="px-4 py-2.5">30d Stock-Outs</th>
                      <th className="px-4 py-2.5">Listing Quality</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppliers.supplierHealth.map((s: any) => (
                      <tr key={`${s.seller_id}_${s.product_id}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{s.seller_name}</td>
                        <td className="px-4 py-3 text-slate-700">{s.product_name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-mono font-bold ${
                              s.avg_dispatch_days > 5 ? "text-rose-600" : "text-emerald-700"
                            }`}
                          >
                            {s.avg_dispatch_days} days
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-mono font-bold ${
                              s.cancel_rate > 0.1 ? "text-rose-600" : "text-slate-700"
                            }`}
                          >
                            {(s.cancel_rate * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {s.stockout_days_30d > 0 ? (
                            <span className="font-bold text-rose-600">{s.stockout_days_30d} days</span>
                          ) : (
                            <span className="text-emerald-700">0 days</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{s.listing_completeness}%</span>
                            {s.has_coa_upload ? (
                              <span className="rounded bg-emerald-50 px-1 text-[10px] font-semibold text-emerald-700">
                                COA verified
                              </span>
                            ) : (
                              <span className="rounded bg-amber-50 px-1 text-[10px] font-semibold text-amber-700">
                                Missing COA
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {s.is_flagged ? (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                              FLAGGED
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              HEALTHY
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Supplier Onboarding Funnel */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Supplier Growth Funnel</h3>
              <p className="text-xs text-slate-500">
                Tracking supply growth and maker onboarding friction (seller_apply_start to first sale).
              </p>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
                {suppliers.supplierFunnel.map((st: any, i: number) => (
                  <div key={st.stage} className="rounded-lg bg-slate-50 p-3 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Step {i + 1}</span>
                    <div className="mt-1 text-xl font-extrabold text-slate-900">{st.count}</div>
                    <div className="mt-0.5 text-[11px] font-medium text-slate-700">{st.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PAGE 7: ACTIONS AND RESULTS (Treated vs 10% Holdout)                */}
        {/* =================================================================== */}
        {activeTab === "actions" && actionsAndResults && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Actions & Holdout Attribution
              </h2>
              <p className="text-xs text-slate-500">
                10% hash-based holdout isolates incremental sales from "they were going to buy anyway" (Page 12).
              </p>
            </div>

            {/* Holdout Attribution Comparison */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Treated Group vs. 10% Holdout Group
                  </h3>
                  <p className="text-xs text-slate-500">
                    Holdout visitors get no outreach. Incremental sales = Treated Rate - Holdout Rate.
                  </p>
                </div>

                {actionsAndResults.isTooEarly ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    Sample: Too Early (&lt; 100 per group)
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    Statistically Significant Sample
                  </span>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                  <span className="text-xs font-bold uppercase text-emerald-800">Treated Visitors (Nudged)</span>
                  <div className="mt-2 text-2xl font-black text-emerald-950">
                    {actionsAndResults.treatedConversionRate}
                  </div>
                  <p className="mt-1 text-xs text-emerald-700">
                    {actionsAndResults.treatedPurchases} purchases out of {actionsAndResults.treatedCount} actions
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-xs font-bold uppercase text-slate-600">Holdout Group (No Outreach)</span>
                  <div className="mt-2 text-2xl font-black text-slate-800">
                    {actionsAndResults.holdoutConversionRate}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {actionsAndResults.holdoutPurchases} purchases out of {actionsAndResults.holdoutCount} control visitors
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                  <span className="text-xs font-bold uppercase text-indigo-800">True Incremental Lift</span>
                  <div className="mt-2 text-2xl font-black text-indigo-950">
                    {actionsAndResults.incrementalConversionRate}
                  </div>
                  <p className="mt-1 text-xs text-indigo-700">
                    Attributed net revenue generated by prompt intervention
                  </p>
                </div>
              </div>

              {/* Action Rules Enforcement Banner */}
              <div className="mt-6 rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
                <span className="font-bold text-slate-900">Enforced Action Engine Rules (Page 12):</span>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-slate-600">
                  <li>No discount unless cause is price_concern, and then only if margin on cart stays positive.</li>
                  <li>No action is a valid recommendation, and is the default for unknown.</li>
                  <li>At most one outreach per customer in 7 days, and none to anyone who opted out.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PAGE 8: SYSTEM HEALTH                                              */}
        {/* =================================================================== */}
        {activeTab === "system_health" && systemHealth && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                System Health & Collector Trust
              </h2>
              <p className="text-xs text-slate-500">
                Trust the data first: if customer_id share drops or events per session falls to 1, the tracker is broken (Page 11).
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-500">Identified Visitor Share</span>
                <div className="mt-2 text-2xl font-black text-slate-900">
                  {systemHealth.identifiedCustomerSharePct}%
                </div>
                <p className="mt-1 text-xs text-emerald-700">
                  Target SLA: {systemHealth.identifiedTargetSla} (Healthy)
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-500">Events Per Session</span>
                <div className="mt-2 text-2xl font-black text-slate-900">
                  {systemHealth.eventsPerSession}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Multi-touch session reconstruction active
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <span className="text-xs font-bold uppercase text-slate-500">First-Party Collector</span>
                <div className="mt-2 text-2xl font-black text-emerald-700">
                  /api/collect
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  sendBeacon + batching enabled
                </p>
              </div>
            </div>

            {/* Error Logs by Route */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">API Errors by Route</h3>
              <div className="mt-3 divide-y divide-slate-100">
                {systemHealth.errorsByRoute.map((r: any) => (
                  <div key={r.route} className="flex items-center justify-between py-2.5 text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-800">{r.route}</span>
                      <span className="ml-2 text-slate-400">{r.avgLatencyMs}ms avg latency</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={r.errors5xx > 0 ? "font-bold text-rose-600" : "text-slate-400"}>
                        {r.errors5xx} 5xx errors
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          r.status === "Healthy"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SYNTHETIC TEST VERIFICATION (Task 8 from page 18 of plan)           */}
        {/* =================================================================== */}
        {activeTab === "synthetic_tests" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Synthetic Session Verification Suite (Task 8)
                </h2>
                <p className="text-xs text-slate-500">
                  Automated test that scripts fake visitors through the 8 diagnosis paths and verifies exact expected cause and confidence.
                </p>
              </div>
              <button
                onClick={handleRunSyntheticTests}
                disabled={runningTests}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
              >
                <Play className="h-4 w-4" />
                <span>{runningTests ? "Executing Test Suite..." : "Re-Run All Synthetic Tests"}</span>
              </button>
            </div>

            {syntheticResults ? (
              <div className="space-y-4">
                <div
                  className={`rounded-xl border p-4 ${
                    syntheticResults.allPassed
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-rose-200 bg-rose-50 text-rose-900"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {syntheticResults.allPassed ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-rose-600" />
                    )}
                    <span>
                      {syntheticResults.passedCount} / {syntheticResults.totalTests} Diagnostic Test Cases Passed
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
                  {syntheticResults.results.map((t: any) => (
                    <div key={t.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                              t.passed ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          >
                            {t.passed ? "✓" : "✗"}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{t.testName}</span>
                          <span className="font-mono text-[10px] text-slate-400">({t.id})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                            Expected: {t.expectedCause} ({t.expectedConfidence})
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${
                              t.passed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            Actual: {t.actualCause} ({t.actualConfidence})
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-600">Generated Evidence:</span>{" "}
                        {t.evidence?.join(" · ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
                <Zap className="h-10 w-10 text-slate-300" />
                <h3 className="mt-2 text-sm font-bold text-slate-800">
                  Ready to run Task 8 Verification Tests
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Asserts that payment failure, OOS views, WhatsApp click, GST abandon, shipping shock, tier confusion, and trust hesitation all land in the exact specified cause.
                </p>
                <button
                  onClick={handleRunSyntheticTests}
                  className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Run Suite Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB: REVENUE & LTV CHARTS                                           */}
        {/* =================================================================== */}
        {activeTab === "analytics_charts" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Customer Analytics & Revenue Trends
              </h2>
              <p className="text-xs text-slate-500">
                Eligible order volume, repeat purchase rates, and lifetime value trends across Indian tier-1/2/3 businesses.
              </p>
            </div>
            <CustomerOverviewTab />
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB: DATABASE BEHAVIORAL FLAGS                                      */}
        {/* =================================================================== */}
        {activeTab === "flags" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Live Behavioral Flags Database
              </h2>
              <p className="text-xs text-slate-500">
                Real-time hesitation and abandoned checkout flags logged directly to database with resolution status.
              </p>
            </div>
            <BehavioralFlags />
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* MODAL: EXPLAIN & DRAFT WHATSAPP MESSAGE (Page 5 & 18 of plan)       */}
      {/* =================================================================== */}
      {selectedExplain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  {selectedExplain.cause_label}
                </span>
                <h3 className="mt-1 text-base font-bold text-slate-900">
                  Customer Diagnosis & Outreach
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedExplain.customer_name} ({maskPhone(selectedExplain.customer_phone)})
                </p>
              </div>
              <button
                onClick={() => setSelectedExplain(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Plain English Summary */}
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Plain-English Summary (Page 5)
              </span>
              <p className="mt-1 text-xs leading-relaxed text-slate-700">
                {selectedExplain.plainEnglishSummary}
              </p>
            </div>

            {/* WhatsApp Draft */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Draft WhatsApp Message
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedExplain.whatsappDraft);
                    setCopiedText(true);
                    setTimeout(() => setCopiedText(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  {copiedText ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-1.5 whitespace-pre-wrap rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 text-xs leading-relaxed text-slate-800">
                {selectedExplain.whatsappDraft}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setSelectedExplain(null)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <a
                href={selectedExplain.waLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Open in WhatsApp Web</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Embedded Customer Overview Analytics ──────────────────────────────────────

function CustomerOverviewTab() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/intelligence/analytics?period=${period}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [period]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 animate-pulse">Loading analytics...</div>;
  }
  
  if (!data || !data.kpis) {
    return <div className="p-12 text-center text-rose-500">Failed to load data.</div>;
  }

  const { kpis, segments, chartData } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Date Filter */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <Calendar className="w-5 h-5 text-slate-400" />
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
          className="border-none bg-transparent text-sm font-medium focus:ring-0 cursor-pointer"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="12m">Last 12 Months</option>
          <option value="all">All Time</option>
        </select>
        <div className="ml-auto text-xs text-slate-400 max-w-[200px] text-right">
          KPIs reflect eligible completed orders in selected period.
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Active Customers" value={kpis.activeCustomersInPeriod} icon={<Users className="w-4 h-4 text-blue-500" />} subtitle={`${kpis.newRegistrations} new registrations`} />
        <KpiCard title="Order Revenue" value={`₹${(kpis.totalRevenue / 100).toLocaleString()}`} icon={<IndianRupee className="w-4 h-4 text-emerald-500" />} subtitle="Eligible completed orders" />
        <KpiCard title="Average Order Value" value={`₹${(kpis.avgOrderValue / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<TrendingUp className="w-4 h-4 text-purple-500" />} />
        <KpiCard title="Repeat Purchase Rate" value={`${kpis.repeatPurchaseRate.toFixed(1)}%`} icon={<RotateCw className="w-4 h-4 text-orange-500" />} subtitle={`${kpis.repeatCustomersCount} lifetime repeat buyers`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Segments */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Customer Segments (Lifetime)</h3>
            <div className="space-y-4">
              <SegmentRow label="First-Time Buyers (≤ 30d)" count={segments.new} color="bg-blue-500" />
              <SegmentRow label="Active / Repeat Buyers" count={segments.activeRepeat} color="bg-emerald-500" />
              <SegmentRow label="At Risk (> 60d)" count={segments.atRisk} color="bg-amber-500" />
              <SegmentRow label="Inactive (> 90d)" count={segments.inactive} color="bg-slate-400" />
              <SegmentRow label="Never Purchased" count={segments.neverPurchased} color="bg-rose-200" />
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-4">Order Revenue & Volume</h3>
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Insufficient data for this period</div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748B'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tickFormatter={(val) => `₹${val/100000}k`} tick={{fontSize: 12, fill: '#64748B'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#64748B'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(value: any, name: any) => name === "Revenue" ? [`₹${(value/100).toLocaleString()}`, name] : [value, name]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, subtitle }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function SegmentRow({ label, count, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`}></span>
        <span className="text-sm text-slate-700">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-900">{count}</span>
    </div>
  );
}
