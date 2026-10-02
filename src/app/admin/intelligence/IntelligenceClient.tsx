"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from "recharts";
import { 
  Users, TrendingUp, IndianRupee, RotateCw, Calendar, Search, Activity
} from "lucide-react";
import BehavioralFlags from "./BehavioralFlags";

export default function IntelligenceClient() {
  const [activeTab, setActiveTab] = useState<"overview" | "customers" | "flags">("overview");
  
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button 
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "overview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
        >
          Customer Analytics
        </button>
        <button 
          onClick={() => setActiveTab("customers")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "customers" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
        >
          Customer Directory
        </button>
        <button 
          onClick={() => setActiveTab("flags")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "flags" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
        >
          Behavioral Flags
        </button>
      </div>

      {/* Content */}
      {activeTab === "overview" && <CustomerOverviewTab />}
      {activeTab === "customers" && <CustomerDirectoryTab />}
      {activeTab === "flags" && <BehavioralFlags />}
    </div>
  );
}

// ─── Customer Overview Tab ──────────────────────────────────────────────────

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
    return <div className="p-12 text-center text-gray-500 animate-pulse">Loading analytics...</div>;
  }
  
  if (!data || !data.kpis) {
    return <div className="p-12 text-center text-red-500">Failed to load data.</div>;
  }

  const { kpis, segments, chartData } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Date Filter */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <Calendar className="w-5 h-5 text-gray-400" />
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
        <div className="ml-auto text-xs text-gray-400 max-w-[200px] text-right">
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
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Customer Segments (Lifetime)</h3>
            <div className="space-y-4">
              <SegmentRow label="First-Time Buyers" count={segments.new} color="bg-blue-500" />
              <SegmentRow label="Repeat Customers (2+)" count={segments.repeat} color="bg-orange-500" />
              <SegmentRow label="High Value (> ₹10k)" count={segments.highValue} color="bg-emerald-500" />
              <SegmentRow label="At Risk (> 60d)" count={segments.atRisk} color="bg-amber-500" />
              <SegmentRow label="Inactive (> 90d)" count={segments.inactive} color="bg-gray-400" />
              <SegmentRow label="Never Purchased" count={segments.neverPurchased} color="bg-red-200" />
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Order Revenue & Volume</h3>
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Insufficient data for this period</div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tickFormatter={(val) => `₹${val/100000}k`} tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(value: any, name: any) => name === "Revenue" ? [`₹${(value/100).toLocaleString()}`, name] : [value, name]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function SegmentRow({ label, count, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`}></span>
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <span className="text-sm font-semibold text-gray-900">{count}</span>
    </div>
  );
}

// ─── Customer Directory Tab ──────────────────────────────────────────────────

function CustomerDirectoryTab() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/intelligence/customers?q=${encodeURIComponent(search)}&segment=${segment}&page=${page}`);
      const json = await res.json();
      setCustomers(json.customers || []);
      setTotalPages(json.pagination?.pages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, segment]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCustomers();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm animate-in fade-in duration-300">
      
      {/* Filters */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search name, email, phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-gray-500">Segment:</span>
          <select 
            value={segment} 
            onChange={(e) => { setSegment(e.target.value); setPage(1); }}
            className="text-sm bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Customers</option>
            <option value="highValue">High Value (> ₹10k)</option>
            <option value="repeat">Repeat Buyers</option>
            <option value="never">Never Purchased</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Segment</th>
              <th className="px-6 py-4 text-right" title="Frequency">Orders (F)</th>
              <th className="px-6 py-4 text-right" title="Monetary">Spent (M)</th>
              <th className="px-6 py-4 text-right">AOV</th>
              <th className="px-6 py-4 text-right" title="Recency">Last Order (R)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && customers.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 animate-pulse">Loading directory...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No customers found matching criteria.</td></tr>
            ) : (
              customers.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.email}</div>
                    {c.phone && <div className="text-xs text-gray-400">{c.phone}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      c.segment === "High Value" ? "bg-emerald-50 text-emerald-700" :
                      c.segment === "Repeat" ? "bg-orange-50 text-orange-700" :
                      c.segment === "At Risk" ? "bg-amber-50 text-amber-700" :
                      c.segment === "Inactive" ? "bg-gray-200 text-gray-700" :
                      c.segment === "Never Purchased" ? "bg-red-50 text-red-700" :
                      "bg-blue-50 text-blue-700"
                    }`}>
                      {c.segment}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{c.totalOrders}</td>
                  <td className="px-6 py-4 text-right font-medium text-emerald-600">
                    ₹{(c.totalSpent / 100).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    ₹{(c.aov / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {c.recencyDays >= 0 ? (
                      <div>
                        <span className="text-gray-900">{c.recencyDays} days ago</span>
                        <div className="text-xs text-gray-400">{new Date(c.lastOrderDate).toLocaleDateString()}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
