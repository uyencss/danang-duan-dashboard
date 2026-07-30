import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireRole } from "@/lib/auth-utils";
import { Database } from "lucide-react";
import { SourceDataClient } from "./source-data-client";
import {
  getSourceDataByType,
  getMasterRevenueData,
} from "./source-data-actions";

export const metadata = {
  title: "Dữ liệu nguồn — CRM & DS Dự án",
};

export const dynamic = "force-dynamic";

// Valid tab ids that map to source types
const VALID_TABS = ["pipeline", "cloud", "econtract", "master"] as const;
type TabId = (typeof VALID_TABS)[number];

export default async function DuLieuNguonPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await requireRole("ADMIN", "USER");
  const params = await searchParams;
  const year =
    typeof params.year === "string"
      ? parseInt(params.year)
      : new Date().getFullYear();

  // Determine which tab to pre-fetch (default: pipeline)
  const requestedTab = (typeof params.tab === "string" ? params.tab : "pipeline") as TabId;
  const activeTab = VALID_TABS.includes(requestedTab) ? requestedTab : "pipeline";

  // Only fetch data for the initially active tab to avoid 73s+ SSR loads
  let pipelineData: Awaited<ReturnType<typeof getSourceDataByType>>["data"] = [];
  let cloudData: Awaited<ReturnType<typeof getSourceDataByType>>["data"] = [];
  let econtractData: Awaited<ReturnType<typeof getSourceDataByType>>["data"] = [];
  let masterData: Awaited<ReturnType<typeof getMasterRevenueData>>["data"] = [];

  try {
    switch (activeTab) {
      case "pipeline": {
        const res = await getSourceDataByType("PIPELINE", year);
        pipelineData = res.data;
        break;
      }
      case "cloud": {
        const res = await getSourceDataByType("CLOUD_DISTRIBUTE", year);
        cloudData = res.data;
        break;
      }
      case "econtract": {
        const res = await getSourceDataByType("ECONTRACT_INVOICE", year);
        econtractData = res.data;
        break;
      }
      case "master": {
        const res = await getMasterRevenueData(year);
        masterData = res.data;
        break;
      }
    }
  } catch (error) {
    console.error("[DuLieuNguon] SSR fetch error:", error);
    // Gracefully continue with empty data — client will retry on tab switch
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Breadcrumb
        items={[
          { label: "CRM & DS Dự án", href: "/du-an" },
          { label: "Dữ liệu nguồn" },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 rounded-2xl">
            <Database className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#191c1e]">
              Dữ liệu nguồn
            </h1>
            <p className="text-[#44474d] text-sm md:text-base mt-0.5">
              Quản lý 4 bảng dữ liệu: Pipeline, Cloud-Distribute,
              EContract-Invoice và Tổng hợp Master
            </p>
          </div>
        </div>
      </div>

      {/* Client Component — only the active tab has pre-loaded data */}
      <SourceDataClient
        initialYear={year}
        initialTab={activeTab}
        pipelineData={pipelineData}
        cloudData={cloudData}
        econtractData={econtractData}
        masterData={masterData}
      />
    </div>
  );
}
