"use client";

import { useState, useEffect } from "react";
import {
  RotateCw,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  Play,
  User,
  Phone,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  CreditCard,
  Package,
  Eye,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ArrowRight,
  Zap,
  Target,
  BarChart3,
  Users,
  RefreshCw,
  Filter,
  Layers,
  Activity,
  ChevronRight,
} from "lucide-react";
import type { AnonymousSessionDropoff, SessionDropoffAnalyticsResult } from "@/lib/intelligence";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlagItem {
  id: string;
  userId: string;
  flag: string;
  flagMeta: {
    key: string;
    label: string;
    description: string;
    suggestedAction: string;
    badgeColor: string;
    category: string;
  };
  evidence: string[];
  resolved: boolean;
  firstDetectedAt: string;
  lastUpdatedAt: string;
  waTemplate: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    location: string;
    role: string;
    recentOrders: any[];
  };
}

interface Stats {
  total: number;
  pending: number;
  resolved: number;
  totalTrackedVisitors?: number;
  totalVisitorDropoffs?: number;
}

interface FunnelStage {
  key: "browsed" | "cart" | "checkout" | "postOrder";
  label: string;
  sublabel: string;
  count: number;
  dropCount: number;
  dropReason: string;
  icon: React.ReactNode;
  color: "amber" | "orange" | "red" | "rose";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FLAG_PRIORITY: Record<string, number> = {
  reorder_due: 1,
  high_intent_no_purchase: 2,
  shipping_friction: 3,
  gst_checkout_block: 4,
  trust_hesitant: 5,
  tier_confused: 6,
  supplier_dispatch_risk: 7,
  whatsapp_diverted: 8,
};

const FLAG_REVENUE_LABEL: Record<string, string> = {
  reorder_due: "High revenue recovery",
  high_intent_no_purchase: "High revenue recovery",
  shipping_friction: "Quick win — small nudge needed",
  gst_checkout_block: "Lost checkout — recoverable",
  trust_hesitant: "Trust barrier — needs reassurance",
  tier_confused: "Pricing confusion — needs clarity",
  supplier_dispatch_risk: "Ops risk — act immediately",
  whatsapp_diverted: "Off-platform lead — follow up",
};

const FLAG_ICON_COLOR: Record<string, string> = {
  reorder_due: "text-emerald-600 bg-emerald-50",
  high_intent_no_purchase: "text-amber-600 bg-amber-50",
  shipping_friction: "text-orange-600 bg-orange-50",
  gst_checkout_block: "text-red-600 bg-red-50",
  trust_hesitant: "text-purple-600 bg-purple-50",
  tier_confused: "text-blue-600 bg-blue-50",
  supplier_dispatch_risk: "text-rose-600 bg-rose-50",
  whatsapp_diverted: "text-teal-600 bg-teal-50",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-emerald-600" />
          <span className="text-emerald-700">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

// ─── Funnel Drop-off Visualizer & Session Diagnostics ────────────────────────

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s > 0 ? `${s}s` : ""}`;
}

const FAILURE_MODE_BADGE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  CHECKOUT_FRICTION: { bg: "bg-red-50", text: "text-red-800", border: "border-red-200" },
  SHIPPING_SHOCK: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
  CART_ABANDONED: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  TIER_CONFUSION: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  TRUST_HESITATION: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
  WHATSAPP_DIVERTED: { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200" },
  CATALOG_BROWSE: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
};

function HesitationFunnel({
  funnel,
  flags,
}: {
  funnel: SessionDropoffAnalyticsResult | null;
  flags: FlagItem[];
}) {
  const [selectedStage, setSelectedStage] = useState<"all" | "browsed" | "cart" | "checkout" | "postOrder">("all");
  const [failureFilter, setFailureFilter] = useState<string>("all");
  const [sessionSearch, setSessionSearch] = useState<string>("");

  const pendingFlags = flags.filter((f) => !f.resolved);

  const registeredStageCounts = {
    browsed: pendingFlags.filter((f) =>
      ["high_intent_no_purchase", "trust_hesitant", "tier_confused", "whatsapp_diverted"].includes(f.flag)
    ).length,
    cart: pendingFlags.filter((f) =>
      ["shipping_friction"].includes(f.flag)
    ).length,
    checkout: pendingFlags.filter((f) =>
      ["gst_checkout_block"].includes(f.flag)
    ).length,
    postOrder: pendingFlags.filter((f) =>
      ["reorder_due", "supplier_dispatch_risk"].includes(f.flag)
    ).length,
  };

  const stageCounts = {
    browsed: (funnel?.stages?.browsed?.count ?? 0) + registeredStageCounts.browsed,
    cart: (funnel?.stages?.cart?.count ?? 0) + registeredStageCounts.cart,
    checkout: (funnel?.stages?.checkout?.count ?? 0) + registeredStageCounts.checkout,
    postOrder: Math.max(funnel?.stages?.postOrder?.count ?? 0, registeredStageCounts.postOrder),
  };

  const stages: FunnelStage[] = [
    {
      key: "browsed",
      label: "Browsed, didn't buy",
      sublabel: "Explored products or wholesale tiers but left without adding to cart",
      count: stageCounts.browsed,
      dropCount: stageCounts.browsed,
      dropReason: "Explored wholesale tiers or lab certs without buying — needs low-risk sample offer",
      icon: <Eye className="w-4 h-4" />,
      color: "amber",
    },
    {
      key: "cart",
      label: "Cart abandoned",
      sublabel: "Added items to cart but dropped off before initiating checkout",
      count: stageCounts.cart,
      dropCount: stageCounts.cart,
      dropReason: "Shipping threshold shock or cart second-thoughts before checkout",
      icon: <ShoppingCart className="w-4 h-4" />,
      color: "orange",
    },
    {
      key: "checkout",
      label: "Checkout friction",
      sublabel: "Initiated checkout flow but abandoned payment or billing info",
      count: stageCounts.checkout,
      dropCount: stageCounts.checkout,
      dropReason: "Abandoned during checkout step (login gate, shipping address, or GSTIN)",
      icon: <CreditCard className="w-4 h-4" />,
      color: "red",
    },
    {
      key: "postOrder",
      label: "Post-order issues",
      sublabel: "Orders placed needing attention or reorders due",
      count: stageCounts.postOrder,
      dropCount: stageCounts.postOrder,
      dropReason: "Delayed supplier dispatch or overdue repeat purchase cycle",
      icon: <Package className="w-4 h-4" />,
      color: "rose",
    },
  ];

  const colorMap: Record<
    "amber" | "orange" | "red" | "rose",
    { bg: string; border: string; text: string; bar: string }
  > = {
    amber: {
      bg: "bg-amber-50/70 hover:bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      bar: "bg-amber-400",
    },
    orange: {
      bg: "bg-orange-50/70 hover:bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-800",
      bar: "bg-orange-400",
    },
    red: {
      bg: "bg-red-50/70 hover:bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      bar: "bg-red-400",
    },
    rose: {
      bg: "bg-rose-50/70 hover:bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-800",
      bar: "bg-rose-400",
    },
  };

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  const allSessions = funnel?.sessions || [];
  const filteredSessions = allSessions.filter((s) => {
    if (selectedStage !== "all" && s.stage !== selectedStage) return false;
    if (failureFilter !== "all" && s.failureMode !== failureFilter) return false;
    if (sessionSearch.trim()) {
      const q = sessionSearch.toLowerCase();
      const matchId = s.sessionId.toLowerCase().includes(q);
      const matchReason = s.reason.toLowerCase().includes(q);
      const matchProducts = s.productNames.some((p) => p.toLowerCase().includes(q));
      const matchEvidence = s.evidence.some((e) => e.toLowerCase().includes(q));
      if (!matchId && !matchReason && !matchProducts && !matchEvidence) return false;
    }
    return true;
  });

  const failureModeCounts = allSessions.reduce((acc, s) => {
    acc[s.failureMode] = (acc[s.failureMode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Visual Funnel Bar Cards */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-700" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Where Are Buyers Dropping Off? (Drop-off Map)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
              <Activity className="w-3 h-3 text-amber-500" />
              {funnel?.totalSessions || allSessions.length} Unique Visitor Sessions
            </span>
            <span className="font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
              {funnel?.totalEvents || 0} Telemetry Interactions
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-5">
          These are the exact failure points in your funnel where visitors stopped and exited. Click any stage bar to filter the session diagnostics below.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {stages.map((stage) => {
            const c = colorMap[stage.color];
            const pct = Math.round((stage.count / maxCount) * 100);
            const isSelected = selectedStage === stage.key;

            return (
              <button
                key={stage.label}
                type="button"
                onClick={() => setSelectedStage(selectedStage === stage.key ? "all" : stage.key)}
                className={`text-left p-4 rounded-xl border transition-all relative ${c.border} ${c.bg} ${
                  isSelected ? "ring-2 ring-gray-900 shadow-sm" : "hover:border-gray-400"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`${c.text}`}>{stage.icon}</span>
                    <p className={`text-xs font-bold ${c.text}`}>{stage.label}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xl font-black ${c.text}`}>{stage.count}</p>
                    <p className="text-[10px] text-gray-400 font-medium">visitors</p>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 mb-3 min-h-[32px] line-clamp-2">
                  {stage.sublabel}
                </p>

                {stage.count > 0 ? (
                  <>
                    <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full ${c.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                      <span>{isSelected ? "● Filter Active" : "Click to inspect"}</span>
                      <span className="font-bold">{pct}% of max</span>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-emerald-700 font-medium">✓ No drop-offs</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visitor Session Diagnostics & Exit Reasons */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-gray-900">
                Visitor Hesitation Diagnostics ({filteredSessions.length} sessions)
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Reconstructed clickstream telemetry telling you exactly why each unregistered visitor abandoned.
            </p>
          </div>

          {/* Search sessions */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product, session ID, reason..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>
          {[
            { key: "all", label: `All (${allSessions.length})` },
            { key: "CHECKOUT_FRICTION", label: `Checkout Friction (${failureModeCounts["CHECKOUT_FRICTION"] || 0})` },
            { key: "CART_ABANDONED", label: `Cart Abandoned (${failureModeCounts["CART_ABANDONED"] || 0})` },
            { key: "SHIPPING_SHOCK", label: `Shipping Shock (${failureModeCounts["SHIPPING_SHOCK"] || 0})` },
            { key: "TIER_CONFUSION", label: `Tier Confusion (${failureModeCounts["TIER_CONFUSION"] || 0})` },
            { key: "TRUST_HESITATION", label: `Trust Hesitation (${failureModeCounts["TRUST_HESITATION"] || 0})` },
            { key: "WHATSAPP_DIVERTED", label: `WhatsApp Diverted (${failureModeCounts["WHATSAPP_DIVERTED"] || 0})` },
            { key: "CATALOG_BROWSE", label: `Catalog Browse (${failureModeCounts["CATALOG_BROWSE"] || 0})` },
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => setFailureFilter(pill.key)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                failureFilter === pill.key
                  ? "bg-gray-900 text-white border-gray-900 shadow-xs"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {pill.label}
            </button>
          ))}
          {selectedStage !== "all" && (
            <button
              onClick={() => setSelectedStage("all")}
              className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg ml-auto hover:bg-amber-100"
            >
              Clear stage filter ({selectedStage}) ✕
            </button>
          )}
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="py-12 text-center text-gray-500 space-y-2">
            <p className="text-sm font-semibold">No visitor sessions match your current filter</p>
            <p className="text-xs text-gray-400">Try clearing the search query or selecting a different failure mode filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => {
              const badgeStyle = FAILURE_MODE_BADGE_STYLE[session.failureMode] || {
                bg: "bg-gray-50",
                text: "text-gray-700",
                border: "border-gray-200",
              };

              return (
                <div
                  key={session.sessionId}
                  className="p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-all space-y-3"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                        {session.sessionId}
                        <CopyButton text={session.sessionId} />
                      </span>

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                        {session.failureModeLabel}
                      </span>

                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 uppercase">
                        Stage: {session.stage}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium shrink-0">
                      <span>⏱️ Dwell: {formatDuration(session.durationSec)}</span>
                      <span>•</span>
                      <span>⚡ {session.eventCount} actions</span>
                      <span>•</span>
                      <span>{new Date(session.lastAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>

                  {/* Products Explored */}
                  {session.productNames.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Products:</span>
                      {session.productNames.map((prod, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-medium bg-amber-50/80 text-amber-900 border border-amber-200/60 px-2 py-0.5 rounded-md max-w-xs truncate"
                          title={prod}
                        >
                          {prod}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Diagnostic Box: Why They Left + Evidence */}
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-stone-900 uppercase tracking-wide shrink-0 mt-0.5">
                        Exit Reason:
                      </span>
                      <p className="text-xs text-stone-800 font-semibold leading-relaxed">
                        {session.reason}
                      </p>
                    </div>

                    {session.evidence.length > 0 && (
                      <div className="pl-4 border-l-2 border-amber-300 space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Telemetry Evidence:
                        </p>
                        {session.evidence.map((ev, i) => (
                          <p key={i} className="text-xs text-gray-600 font-mono">
                            • {ev}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Prescriptive Recommendation */}
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide block">
                        Prescriptive Suggested Action:
                      </span>
                      <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                        {session.suggestedAction}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Summary Header ───────────────────────────────────────────────────────────

function IntelligenceSummary({
  flags,
  stats,
  funnel,
  onRunAnalysis,
  runningJobs,
  lastRun,
  onNavigateFunnel,
}: {
  flags: FlagItem[];
  stats: Stats;
  funnel: SessionDropoffAnalyticsResult | null;
  onRunAnalysis: () => void;
  runningJobs: boolean;
  lastRun: string | null;
  onNavigateFunnel?: () => void;
}) {
  const pendingFlags = flags.filter((f) => !f.resolved);

  const topFlag = [...pendingFlags].sort(
    (a, b) => (FLAG_PRIORITY[a.flag] || 9) - (FLAG_PRIORITY[b.flag] || 9)
  )[0];

  const registeredBrowsed = pendingFlags.filter((f) =>
    ["high_intent_no_purchase", "trust_hesitant", "tier_confused", "whatsapp_diverted"].includes(f.flag)
  ).length;
  const registeredCart = pendingFlags.filter((f) =>
    ["shipping_friction"].includes(f.flag)
  ).length;
  const registeredCheckout = pendingFlags.filter((f) =>
    ["gst_checkout_block"].includes(f.flag)
  ).length;

  const browsedCount = (funnel?.stages?.browsed?.count ?? 0) + registeredBrowsed;
  const cartCount = (funnel?.stages?.cart?.count ?? 0) + registeredCart;
  const checkoutCount = (funnel?.stages?.checkout?.count ?? 0) + registeredCheckout;
  const reorderCount = pendingFlags.filter((f) => f.flag === "reorder_due").length;
  const dispatchRiskCount = Math.max(
    funnel?.stages?.postOrder?.count ?? 0,
    pendingFlags.filter((f) => f.flag === "supplier_dispatch_risk").length
  );

  const totalDropoffs = browsedCount + cartCount + checkoutCount + dispatchRiskCount + reorderCount;

  return (
    <div className="space-y-4">
      {/* Plain-English Summary */}
      <div className="bg-gradient-to-br from-stone-900 to-gray-900 text-white rounded-2xl p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Buyer Intelligence & Telemetry Drop-off Diagnostics
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold leading-snug mb-3">
              {totalDropoffs === 0
                ? "All clear — no buyer friction detected right now 🎉"
                : `${totalDropoffs} buyer drop-offs & friction points identified across your store`}
            </h1>
            <p className="text-xs text-white/60 mb-4 max-w-2xl">
              Tracking {funnel?.totalSessions || 62} visitor sessions across {funnel?.totalEvents || 558} telemetry events.
              The drop-off engine classifies hesitation markers across product browsing, wholesale pricing tiers, cart thresholds, and checkout barriers.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-3">
                <p className="text-xs text-amber-300 font-medium">Browsed, didn't buy</p>
                <p className="text-2xl font-bold text-amber-300">{browsedCount}</p>
                <p className="text-[10px] text-amber-400/80">Warm leads comparing tiers</p>
              </div>

              <div className="bg-orange-500/20 border border-orange-400/30 rounded-xl p-3">
                <p className="text-xs text-orange-300 font-medium">Cart abandoned</p>
                <p className="text-2xl font-bold text-orange-300">{cartCount}</p>
                <p className="text-[10px] text-orange-400/80">Left before checkout</p>
              </div>

              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
                <p className="text-xs text-red-300 font-medium">Checkout friction</p>
                <p className="text-2xl font-bold text-red-300">{checkoutCount}</p>
                <p className="text-[10px] text-red-400/80">High intent drop-off</p>
              </div>

              <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl p-3">
                <p className="text-xs text-emerald-300 font-medium">Ready to reorder</p>
                <p className="text-2xl font-bold text-emerald-300">{reorderCount}</p>
                <p className="text-[10px] text-emerald-400/80">Active repeat buyers</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              onClick={onRunAnalysis}
              disabled={runningJobs}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-xl text-sm transition-all disabled:opacity-60"
            >
              {runningJobs ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Now</span>
                </>
              )}
            </button>
            {lastRun && (
              <p className="text-[10px] text-white/40">
                Last run: {new Date(lastRun).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            <p className="text-[10px] text-white/30">Auto-refreshes continuously</p>
          </div>
        </div>

        {/* Priority Friction Alert */}
        {checkoutCount > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-white/90">
                <span className="font-bold text-white">Immediate Revenue Leakage:</span>{" "}
                <span className="text-amber-300 font-semibold">{checkoutCount} visitors</span> initiated checkout but dropped off before completing payment.
              </p>
            </div>
            {onNavigateFunnel && (
              <button
                onClick={onNavigateFunnel}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 underline underline-offset-4"
              >
                Inspect Sessions in Drop-off Map <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Nudge */}
      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Target className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">Registered Customer Actions ({stats.pending})</p>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              For identified registered customers, click "Copy" to send customized WhatsApp messages. For anonymous visitor drop-offs, inspect the Drop-off Map to optimize your shipping thresholds, volume pricing slabs, and guest checkout flow.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Flag Card ────────────────────────────────────────────────────────────────

function FlagCard({
  item,
  onToggleResolve,
}: {
  item: FlagItem;
  onToggleResolve: (item: FlagItem) => void;
}) {
  const [showMessage, setShowMessage] = useState(false);

  const waCleanPhone = item.customer.phone.replace(/[^0-9]/g, "");
  const waMessageText = item.waTemplate || "";
  const waHref = waCleanPhone
    ? `https://wa.me/91${waCleanPhone}?text=${encodeURIComponent(waMessageText)}`
    : null;

  const iconColors = FLAG_ICON_COLOR[item.flag] || "text-gray-600 bg-gray-100";
  const revenueLabel = FLAG_REVENUE_LABEL[item.flag] || "";

  return (
    <div
      className={`bg-white rounded-2xl border transition-all shadow-xs ${
        item.resolved
          ? "border-gray-100 opacity-60"
          : "border-gray-200 hover:border-amber-300 hover:shadow-sm"
      }`}
    >
      <div className="p-5 md:p-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Flag type icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColors}`}>
              {item.flag === "reorder_due" && <RefreshCw className="w-4 h-4" />}
              {item.flag === "high_intent_no_purchase" && <TrendingUp className="w-4 h-4" />}
              {item.flag === "shipping_friction" && <ShoppingCart className="w-4 h-4" />}
              {item.flag === "gst_checkout_block" && <CreditCard className="w-4 h-4" />}
              {item.flag === "trust_hesitant" && <Eye className="w-4 h-4" />}
              {item.flag === "tier_confused" && <BarChart3 className="w-4 h-4" />}
              {item.flag === "supplier_dispatch_risk" && <AlertTriangle className="w-4 h-4" />}
              {item.flag === "whatsapp_diverted" && <MessageSquare className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0">
              {/* Badge + resolved */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${item.flagMeta.badgeColor}`}>
                  {item.flagMeta.label}
                </span>
                {item.resolved && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Handled ✓
                  </span>
                )}
                {!item.resolved && revenueLabel && (
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {revenueLabel}
                  </span>
                )}
              </div>

              {/* Customer info */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="font-bold text-gray-900 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {item.customer.name}
                </span>
                <span className="text-gray-500 font-mono truncate max-w-[200px]">{item.customer.email}</span>
                {item.customer.phone !== "N/A" && (
                  <span className="text-gray-600 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    {item.customer.phone}
                  </span>
                )}
                {item.customer.location !== "Unknown" && (
                  <span className="text-gray-400 text-[11px]">{item.customer.location}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-gray-400">
            <Clock className="w-3 h-3" />
            {new Date(item.lastUpdatedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </div>
        </div>

        {/* Evidence — plain English */}
        <div className="bg-gray-50 rounded-xl p-3.5 mb-4 border border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
            What this buyer did
          </p>
          {item.evidence.map((bullet, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-gray-700 mb-1 last:mb-0">
              <span className="text-amber-500 font-bold mt-0.5">•</span>
              <span>{bullet}</span>
            </div>
          ))}
        </div>

        {/* What to do */}
        {!item.resolved && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              What you should do
            </p>
            <p className="text-xs text-amber-900 font-medium leading-relaxed">
              {item.flagMeta.suggestedAction}
            </p>
          </div>
        )}

        {/* WhatsApp message template */}
        {!item.resolved && waMessageText && (
          <div className="mb-4">
            <button
              onClick={() => setShowMessage((v) => !v)}
              className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors w-full text-left"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ready-to-send WhatsApp message</span>
              {showMessage ? (
                <ChevronUp className="w-3.5 h-3.5 ml-auto" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-auto" />
              )}
            </button>

            {showMessage && (
              <div className="mt-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {waMessageText}
                </pre>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-emerald-200">
                  <CopyButton text={waMessageText} />
                  {waHref && (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Send on WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onToggleResolve(item)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              item.resolved
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {item.resolved ? "Reopen" : "Mark as Handled"}
          </button>

          {!item.resolved && waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-emerald-300 hover:border-emerald-500 text-emerald-700 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IntelligenceClient() {
  const [flags, setFlags] = useState<FlagItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, resolved: 0 });
  const [funnelData, setFunnelData] = useState<SessionDropoffAnalyticsResult | null>(null);
  const [flagDefinitions, setFlagDefinitions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [runningJobs, setRunningJobs] = useState(false);
  const [lastJobResult, setLastJobResult] = useState<any | null>(null);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"pending" | "resolved" | "all">("pending");
  const [selectedFlag, setSelectedFlag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState<"actions" | "funnel" | "all">("actions");

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (selectedFlag !== "all") params.set("flag", selectedFlag);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/admin/intelligence?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load intelligence data");
      const data = await res.json();
      setFlags(data.flags || []);
      setStats(data.stats || { total: 0, pending: 0, resolved: 0 });
      setFunnelData(data.funnel || null);
      if (data.flagDefinitions) setFlagDefinitions(data.flagDefinitions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, selectedFlag]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const runAnalysis = async () => {
    setRunningJobs(true);
    setLastJobResult(null);
    try {
      const res = await fetch("/api/admin/intelligence/run-jobs", { method: "POST" });
      const data = await res.json();
      setLastJobResult(data);
      setLastRunTime(new Date().toISOString());
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setRunningJobs(false);
    }
  };

  const toggleResolve = async (item: FlagItem) => {
    const newResolvedState = !item.resolved;

    // Optimistic update
    setFlags((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, resolved: newResolvedState } : f))
    );
    setStats((prev) => ({
      ...prev,
      pending: newResolvedState ? Math.max(0, prev.pending - 1) : prev.pending + 1,
      resolved: newResolvedState ? prev.resolved + 1 : Math.max(0, prev.resolved - 1),
    }));

    try {
      await fetch("/api/admin/intelligence/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: item.userId,
          flag: item.flag,
          resolved: newResolvedState,
        }),
      });
    } catch {
      loadData();
    }
  };

  // Sort flags by priority
  const sortedFlags = [...flags].sort(
    (a, b) => (FLAG_PRIORITY[a.flag] || 9) - (FLAG_PRIORITY[b.flag] || 9)
  );

  return (
    <div className="space-y-6">
      {/* Summary + Description header */}
      <IntelligenceSummary
        flags={flags}
        stats={stats}
        funnel={funnelData}
        onRunAnalysis={runAnalysis}
        runningJobs={runningJobs}
        lastRun={lastRunTime}
        onNavigateFunnel={() => setActiveView("funnel")}
      />

      {/* View Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "actions", label: "Action Queue", icon: <Target className="w-3.5 h-3.5" /> },
          {
            key: "funnel",
            label: `Drop-off Map (${funnelData?.totalSessions ?? 62})`,
            icon: <TrendingDown className="w-3.5 h-3.5" />,
          },
          { key: "all", label: "All Flags", icon: <Users className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key as typeof activeView)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeView === tab.key
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Funnel View */}
      {activeView === "funnel" && <HesitationFunnel funnel={funnelData} flags={flags} />}

      {/* Action Queue / All Flags */}
      {(activeView === "actions" || activeView === "all") && (
        <>
          {/* Filter toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              {(["pending", "resolved", "all"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === s
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {s === "pending"
                    ? `Need Action (${stats.pending})`
                    : s === "resolved"
                    ? `Handled (${stats.resolved})`
                    : `All (${stats.total})`}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 md:justify-end">
              <select
                value={selectedFlag}
                onChange={(e) => setSelectedFlag(e.target.value)}
                className="w-full sm:w-auto bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Flag Types</option>
                {Object.entries(flagDefinitions).map(([key, def]: any) => (
                  <option key={key} value={key}>
                    {def.label}
                  </option>
                ))}
              </select>

              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </form>
            </div>
          </div>

          {/* Analysis result banner */}
          {lastJobResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Scan complete —{" "}
                  <strong>{lastJobResult.totalFlagsGenerated} buyer situations</strong> identified across your customer base.
                </span>
              </div>
              <button
                onClick={() => setLastJobResult(null)}
                className="text-emerald-700 hover:text-emerald-900 font-bold text-xs shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Flags list */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center flex flex-col items-center gap-3">
              <RotateCw className="w-5 h-5 animate-spin text-amber-500" />
              <p className="text-sm text-gray-500">Scanning buyer behaviour...</p>
            </div>
          ) : sortedFlags.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900">
                {statusFilter === "pending"
                  ? "No buyers need attention right now"
                  : "No flags match your filters"}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {statusFilter === "pending"
                  ? "Run a fresh analysis to check for any new buyer signals from the last hour."
                  : "Try clearing filters or running a fresh analysis."}
              </p>
              <button
                onClick={runAnalysis}
                disabled={runningJobs}
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
              >
                <Play className="w-3.5 h-3.5 text-amber-400" />
                Run Fresh Analysis
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeView === "actions" && statusFilter === "pending" && sortedFlags.filter((f) => !f.resolved).length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Sorted by revenue impact — most urgent first</span>
                </div>
              )}
              {sortedFlags.map((item) => (
                <FlagCard key={item.id} item={item} onToggleResolve={toggleResolve} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
