"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  Play, 
  RotateCw, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MessageSquare, 
  Sparkles, 
  Filter, 
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  User,
  Phone
} from "lucide-react";

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

export default function IntelligenceClient() {
  const [flags, setFlags] = useState<FlagItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, resolved: 0 });
  const [flagDefinitions, setFlagDefinitions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [runningJobs, setRunningJobs] = useState(false);
  const [lastJobResult, setLastJobResult] = useState<any | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"pending" | "resolved" | "all">("pending");
  const [selectedFlag, setSelectedFlag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

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
      const res = await fetch("/api/admin/intelligence/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: item.userId,
          flag: item.flag,
          resolved: newResolvedState,
        }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch (err) {
      console.error(err);
      // Revert on error
      loadData();
    }
  };

  const highIntentCount = flags.filter((f) => f.flag === "high_intent_no_purchase").length;

  return (
    <div className="space-y-6">
      {/* 1. Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Unresolved Flags</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
          <p className="text-xs text-gray-500 mt-1">Pending operational follow-up</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Resolved / Handled</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.resolved}</p>
          <p className="text-xs text-gray-500 mt-1">Actioned buyer situations</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">High Intent Leads</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{highIntentCount}</p>
          <p className="text-xs text-gray-500 mt-1">Visited 2+ PDPs without purchasing</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Inference Engine</span>
            <p className="text-sm font-semibold text-gray-800 mt-1">8 Behavioral Rules Active</p>
          </div>
          <button
            onClick={runAnalysis}
            disabled={runningJobs}
            className="mt-3 w-full bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {runningJobs ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Engine...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>Run Analysis Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Result Banner */}
      {lastJobResult && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Analysis complete: <strong>{lastJobResult.totalFlagsGenerated}</strong> flags detected across the user base.
            </span>
          </div>
          <button
            onClick={() => setLastJobResult(null)}
            className="text-amber-700 hover:text-amber-900 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Filter & Action Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "pending" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Pending Action ({stats.pending})
          </button>
          <button
            onClick={() => setStatusFilter("resolved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "resolved" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Resolved ({stats.resolved})
          </button>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "all" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All Flags ({stats.total})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 md:justify-end">
          {/* Flag Type Selector */}
          <select
            value={selectedFlag}
            onChange={(e) => setSelectedFlag(e.target.value)}
            className="w-full sm:w-auto bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Flag Types (8)</option>
            {Object.entries(flagDefinitions).map(([key, def]: any) => (
              <option key={key} value={key}>
                {def.label}
              </option>
            ))}
          </select>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search email, name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
            />
          </form>
        </div>
      </div>

      {/* 3. Flagged Customers List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-3">
          <RotateCw className="w-5 h-5 animate-spin text-amber-600" />
          <span>Scanning buyer behavior events...</span>
        </div>
      ) : flags.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">No active flags match your criteria</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Run the analysis engine to inspect recent telemetry and discover buyer behavioral patterns.
          </p>
          <button
            onClick={runAnalysis}
            disabled={runningJobs}
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
          >
            <Play className="w-3.5 h-3.5 text-amber-400" />
            Run Analysis Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {flags.map((item) => {
            const waCleanPhone = item.customer.phone.replace(/[^0-9]/g, "");
            const waHref = waCleanPhone
              ? `https://wa.me/91${waCleanPhone}?text=${encodeURIComponent(
                  `Hi ${item.customer.name}, this is the Ekora Wholesale team regarding your raw material requirements.`
                )}`
              : null;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all p-5 md:p-6 shadow-xs ${
                  item.resolved ? "border-gray-200 opacity-70" : "border-gray-200 hover:border-amber-400/80"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Customer + Flag Details */}
                  <div className="space-y-3 flex-1">
                    {/* Badges Bar */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${item.flagMeta.badgeColor}`}>
                        {item.flagMeta.label}
                      </span>
                      {item.resolved && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          Handled ✓
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Updated {new Date(item.lastUpdatedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{item.customer.name}</span>
                      </div>
                      <span className="text-gray-500 font-mono">{item.customer.email}</span>
                      {item.customer.phone !== "N/A" && (
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{item.customer.phone}</span>
                          {waHref && (
                            <a
                              href={waHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors ml-1"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                      )}
                      <span className="text-gray-400 text-[11px]">{item.customer.location}</span>
                    </div>

                    {/* Evidence Array */}
                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                        Trigger Evidence &amp; Behavioral History
                      </p>
                      {item.evidence.map((bullet, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Suggested Action Box & Toggle */}
                  <div className="lg:w-80 flex flex-col justify-between gap-3 bg-stone-50/60 p-4 rounded-xl border border-gray-200 shrink-0">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Recommended Operational Action</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                        {item.flagMeta.suggestedAction}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-200 flex items-center justify-between gap-2">
                      <button
                        onClick={() => toggleResolve(item)}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          item.resolved
                            ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{item.resolved ? "Reopen Lead" : "Mark as Handled"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
