import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import IntelligenceClient from "./IntelligenceClient";

export const dynamic = "force-dynamic";

export default async function AdminIntelligencePage() {
  const session = await requireAdmin().catch(() => null);
  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Customer Intelligence Layer
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">
            B2B Buyer Behavioral Flags
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Rule-based customer intent signals, friction detection, and proactive conversion actions.
          </p>
        </div>
      </div>

      {/* Main Interactive Client Table & Controls */}
      <IntelligenceClient />
    </div>
  );
}
