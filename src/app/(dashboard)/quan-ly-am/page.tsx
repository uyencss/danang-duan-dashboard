import { getAMManagementData } from "./actions";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { AMManagementTable } from "./am-management-table";
import { TimeFilters } from "@/components/dashboard/time-filters";
import { AlertCircle } from "lucide-react";
import { requireRole } from "@/lib/auth-utils";

export default async function AMManagementPage({
    searchParams,
}: {
    searchParams: Promise<{ y?: string; q?: string; m?: string }>;
}) {
    await requireRole("ADMIN");
    const params = await searchParams;
    const year = params.y ? parseInt(params.y) : 2026;
    const quarter = params.q && params.q !== "all" ? parseInt(params.q) : undefined;
    const month = params.m && params.m !== "all" ? parseInt(params.m) : undefined;

    const res = await getAMManagementData({ year, quarter, month });

    if (res.error || !res.data) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                 <AlertCircle className="size-12 text-red-500 mb-4" />
                 <h2 className="text-2xl font-black text-gray-800">Lỗi tải dữ liệu</h2>
                 <p className="text-gray-500 mt-2">{res.error || "Không thể lấy dữ liệu quản lý AM."}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Breadcrumb items={[{ label: "Báo cáo" }, { label: "Quản lý AM" }]} />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#191c1e] tracking-tight">Quản lý AM</h1>
                    <p className="text-slate-500 mt-1">Phân tích hiệu suất và doanh thu chi tiết cho đội ngũ AM.</p>
                </div>
                <TimeFilters />
            </div>

            <AMManagementTable data={res.data} />
        </div>
    );
}
