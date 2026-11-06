import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import CustomerIntelligencePortal from "./CustomerIntelligencePortal";

export const dynamic = "force-dynamic";

export default async function AdminIntelligencePage() {
  const session = await requireAdmin().catch(() => null);
  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  return <CustomerIntelligencePortal />;
}
