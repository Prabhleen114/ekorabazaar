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
} from "lucide-react";

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
}

interface FunnelStage {
  label: string;
  sublabel: string;
  count: number;
  dropCount: number;
  dropReason: string;
  icon: React.ReactNode;
  color: string;
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

// ─── Funnel Drop-off Visualizer ───────────────────────────────────────────────

function HesitationFunnel({ flags }: { flags: FlagItem[] }) {
  const pendingFlags = flags.filter((f) => !f.resolved);

  const stageCounts = {
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

  const stages: FunnelStage[] = [
    {
      label: "Browsed, didn't buy",
      sublabel: "Looked at products repeatedly but left",
      count: stageCounts.browsed,
      dropCount: stageCounts.browsed,
      dropReason: "No purchase signal despite high interest — price confusion or trust gap",
      icon: <Eye className="w-4 h-4" />,
      color: "amber",
    },
    {
      label: "Cart abandoned",
      sublabel: "Added items but left before checkout",
      count: stageCounts.cart,
      dropCount: stageCounts.cart,
      dropReason: "Shipping cost was the tipping point — just ₹X away from free shipping",
      icon: <ShoppingCart className="w-4 h-4" />,
      color: "orange",
    },
    {
      label: "Checkout friction",
      sublabel: "Started payment but got confused",
      count: stageCounts.checkout,
      dropCount: stageCounts.checkout,
      dropReason: "GST / business invoicing field caused confusion — buyer unsure if mandatory",
      icon: <CreditCard className="w-4 h-4" />,
      color: "red",
    },
    {
      label: "Post-order issues",
      sublabel: "Orders placed but need attention",
      count: stageCounts.postOrder,
      dropCount: stageCounts.postOrder,
      dropReason: "Delayed dispatch or overdue reorder — loyalty risk if not addressed",
      icon: <Package className="w-4 h-4" />,
      color: "rose",
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; bar: string }> = {
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      bar: "bg-amber-400",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-800",
      bar: "bg-orange-400",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      bar: "bg-red-400",
    },
    rose: {
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-800",
      bar: "bg-rose-400",
    },
  };

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-xs">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="w-4 h-4 text-gray-500" />
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Where Are Buyers Dropping Off?
        </h2>
      </div>
      <p className="text-xs text-gray-500 mb-5">
        These are the exact points in your sales funnel where customers stopped and left. Click any bar to understand why.
      </p>

      <div className="space-y-3">
        {stages.map((stage) => {
          const c = colorMap[stage.color];
          const pct = Math.round((stage.count / maxCount) * 100);
          return (
            <div key={stage.label} className={`p-3.5 rounded-xl border ${c.border} ${c.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`${c.text}`}>{stage.icon}</span>
                  <div>
                    <p className={`text-xs font-bold ${c.text}`}>{stage.label}</p>
                    <p className="text-[11px] text-gray-500">{stage.sublabel}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-lg font-bold ${c.text}`}>{stage.count}</p>
                  <p className="text-[10px] text-gray-400">buyers</p>
                </div>
              </div>
              {stage.count > 0 && (
                <>
                  <div className="w-full h-1.5 bg-white/70 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full ${c.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-600 italic">
                    💡 {stage.dropReason}
                  </p>
                </>
              )}
              {stage.count === 0 && (
                <p className="text-[11px] text-emerald-700 font-medium">✓ No active drop-offs here right now</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Summary Header ───────────────────────────────────────────────────────────

function IntelligenceSummary({ flags, stats, onRunAnalysis, runningJobs, lastRun }: {
  flags: FlagItem[];
  stats: Stats;
  onRunAnalysis: () => void;
  runningJobs: boolean;
  lastRun: string | null;
}) {
  const pendingFlags = flags.filter((f) => !f.resolved);

  const topFlag = [...pendingFlags].sort(
    (a, b) => (FLAG_PRIORITY[a.flag] || 9) - (FLAG_PRIORITY[b.flag] || 9)
  )[0];

  const reorderCount = pendingFlags.filter((f) => f.flag === "reorder_due").length;
  const highIntentCount = pendingFlags.filter((f) => f.flag === "high_intent_no_purchase").length;
  const checkoutDropCount = pendingFlags.filter((f) => f.flag === "gst_checkout_block").length;
  const dispatchRiskCount = pendingFlags.filter((f) => f.flag === "supplier_dispatch_risk").length;

  return (
    <div className="space-y-4">
      {/* Plain-English Summary */}
      <div className="bg-gradient-to-br from-stone-900 to-gray-900 text-white rounded-2xl p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Your Buyer Intelligence — This Week
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold leading-snug mb-3">
              {stats.pending === 0
                ? "All clear — no buyer friction detected right now 🎉"
                : `You have ${stats.pending} buyer${stats.pending !== 1 ? "s" : ""} who need${stats.pending === 1 ? "s" : ""} attention`}
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {reorderCount > 0 && (
                <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl p-3">
                  <p className="text-xs text-emerald-300 font-medium">Ready to reorder</p>
                  <p className="text-2xl font-bold text-emerald-300">{reorderCount}</p>
                  <p className="text-[10px] text-emerald-400/80">Send them a nudge</p>
                </div>
              )}
              {highIntentCount > 0 && (
                <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-3">
                  <p className="text-xs text-amber-300 font-medium">Browsed, didn't buy</p>
                  <p className="text-2xl font-bold text-amber-300">{highIntentCount}</p>
                  <p className="text-[10px] text-amber-400/80">Still warm leads</p>
                </div>
              )}
              {checkoutDropCount > 0 && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
                  <p className="text-xs text-red-300 font-medium">Checkout friction</p>
                  <p className="text-2xl font-bold text-red-300">{checkoutDropCount}</p>
                  <p className="text-[10px] text-red-400/80">GST field confusion</p>
                </div>
              )}
              {dispatchRiskCount > 0 && (
                <div className="bg-rose-500/20 border border-rose-400/30 rounded-xl p-3">
                  <p className="text-xs text-rose-300 font-medium">Dispatch delay</p>
                  <p className="text-2xl font-bold text-rose-300">{dispatchRiskCount}</p>
                  <p className="text-[10px] text-rose-400/80">Need ops action</p>
                </div>
              )}
              {stats.pending === 0 && (
                <div className="bg-white/10 border border-white/20 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-white/70">Total resolved this week</p>
                  <p className="text-2xl font-bold">{stats.resolved}</p>
                  <p className="text-[10px] text-white/50">Great work! 🎉</p>
                </div>
              )}
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
            <p className="text-[10px] text-white/30">Auto-refreshes every hour</p>
          </div>
        </div>

        {/* Top priority callout */}
        {topFlag && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-white/80">
              <span className="font-bold text-white">Most urgent right now:</span>{" "}
              <span className="text-amber-300 font-semibold">{topFlag.customer.name}</span>{" "}
              {topFlag.flag === "reorder_due"
                ? "is likely running low on supplies — send them a reorder link."
                : topFlag.flag === "supplier_dispatch_risk"
                ? "has an order stuck in processing — check with your supplier immediately."
                : "has been browsing without buying — a personal WhatsApp message could convert them today."}
            </p>
          </div>
        )}
      </div>

      {/* What to do TODAY callout */}
      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Target className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">Your team's action for today</p>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Scan the list below each morning. For each buyer, you'll see a ready-to-send WhatsApp message — just click "Copy", personalise if needed, and send. This takes 10–15 minutes and can recover significant revenue.
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
        onRunAnalysis={runAnalysis}
        runningJobs={runningJobs}
        lastRun={lastRunTime}
      />

      {/* View Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "actions", label: "Action Queue", icon: <Target className="w-3.5 h-3.5" /> },
          { key: "funnel", label: "Drop-off Map", icon: <TrendingDown className="w-3.5 h-3.5" /> },
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
      {activeView === "funnel" && <HesitationFunnel flags={flags} />}

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
