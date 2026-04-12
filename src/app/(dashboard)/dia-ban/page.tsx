import { DiaBanDashboardClient } from "./dia-ban-client";
import { getDiaBanAnalytics } from "../dashboard-actions";
import { AlertCircle } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireRole } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export default async function DiaBanPage({ searchParams }: { searchParams: Promise<{ type?: string, year?: string, value?: string }> }) {
    await requireRole("ADMIN", "USER");
    const params = await searchParams;
    let filterArgs: any = { type: 'all' };

    if (params.type === 'nam' && params.year) {
        filterArgs = { type: 'nam', year: Number(params.year) };
    } else if (params.type === 'quarter' && params.year && params.value) {
        // map to legacy 'quy' param for server action
        filterArgs = { type: 'quy', year: Number(params.year), quarter: Number(params.value) };
    } else if (params.type === 'month' && params.year && params.value) {
        filterArgs = { type: 'thang', year: Number(params.year), month: Number(params.value) };
    }

    const res = await getDiaBanAnalytics(filterArgs);

    if (res.error || !res.diaBanData || !res.topStaffData) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <AlertCircle className="size-12 text-red-500 mb-4" />
                <h2 className="text-2xl font-black text-gray-800">Lỗi tải dữ liệu</h2>
                <p className="text-gray-500 mt-2">{res.error || "Không thể lấy dữ liệu phân tích Địa Bàn."}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Breadcrumb items={[{ label: "Thống kê" }, { label: "Phân bổ & Địa bàn" }]} />
            <DiaBanDashboardClient diaBanData={res.diaBanData} topStaffData={res.topStaffData} kpiTotal={res.kpiTotal || 0} />
        </div>
    );
}
