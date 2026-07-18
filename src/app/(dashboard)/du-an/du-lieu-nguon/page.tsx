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

  // Fetch all 4 tables in parallel
  const [pipelineRes, cloudRes, econtractRes, masterRes] = await Promise.all([
    getSourceDataByType("PIPELINE", year),
    getSourceDataByType("CLOUD_DISTRIBUTE", year),
    getSourceDataByType("ECONTRACT_INVOICE", year),
    getMasterRevenueData(year),
  ]);

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

      {/* Client Component with all data */}
      <SourceDataClient
        initialYear={year}
        pipelineData={pipelineRes.data}
        cloudData={cloudRes.data}
        econtractData={econtractRes.data}
        masterData={masterRes.data}
      />
    </div>
  );
}
