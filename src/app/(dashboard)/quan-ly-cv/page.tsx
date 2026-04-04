import { getCVManagementData } from "./actions";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { CVManagementTable } from "./cv-management-table";
import { TimeFilters } from "@/components/dashboard/time-filters";
import { AlertCircle } from "lucide-react";

export default async function CVManagementPage({
    searchParams,
}: {
    searchParams: Promise<{ y?: string; q?: string; m?: string }>;
}) {
    const params = await searchParams;
    const year = params.y ? parseInt(params.y) : 2026;
    const quarter = params.q && params.q !== "all" ? parseInt(params.q) : undefined;
    const month = params.m && params.m !== "all" ? parseInt(params.m) : undefined;

    const res = await getCVManagementData({ year, quarter, month });

    if (res.error || !res.data) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                 <AlertCircle className="size-12 text-red-500 mb-4" />
                 <h2 className="text-2xl font-black text-gray-800">Lỗi tải dữ liệu</h2>
                 <p className="text-gray-500 mt-2">{res.error || "Không thể lấy dữ liệu quản lý Chuyên viên."}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Breadcrumb items={[{ label: "Báo cáo" }, { label: "Quản lý Chuyên viên" }]} />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#191c1e] tracking-tight">Quản lý Chuyên viên</h1>
                    <p className="text-slate-500 mt-1">Phân tích hiệu suất, doanh thu và tỷ lệ chuyển đổi cho đội ngũ Chuyên viên.</p>
                </div>
                <TimeFilters />
            </div>

            <CVManagementTable data={res.data} />
        </div>
    );
}
