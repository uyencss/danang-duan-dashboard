import { getRevenueDistributionData } from "./actions";
import { RevenueTrackingClient } from "./revenue-client";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { AlertCircle } from "lucide-react";
import { requireRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export default async function RevenueTrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string }>;
}) {
  await requireRole("ADMIN", "USER");
  const params = await searchParams;
  const year = params.y ? parseInt(params.y) : 2026;

  try {
    const data = await getRevenueDistributionData(year);
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "Quản trị" }, { label: "Phân bổ Doanh thu" }]} />
        <RevenueTrackingClient data={data} year={year} />
      </div>
    );
  } catch (error: any) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="size-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-gray-800">Lỗi tải dữ liệu</h2>
        <p className="text-gray-500 mt-2">{error?.message || "Không thể lấy dữ liệu phân bổ doanh thu."}</p>
      </div>
    );
  }
}
