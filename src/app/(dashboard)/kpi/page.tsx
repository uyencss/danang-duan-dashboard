import { KPIDashboardClient } from "./kpi-client";
import { getKPITimeSeries } from "../dashboard-actions";
import { AlertCircle } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";

export default async function KPIPage({ searchParams }: { searchParams: Promise<{ granularity?: string }> }) {
    const params = await searchParams;
    const granularity = (params.granularity === 'thang' || params.granularity === 'quy' || params.granularity === 'nam') 
        ? params.granularity 
        : 'thang';

    const res = await getKPITimeSeries(granularity as any);

    if (res.error || !res.data) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                 <AlertCircle className="size-12 text-red-500 mb-4" />
                 <h2 className="text-2xl font-black text-gray-800">Lỗi tải dữ liệu</h2>
                 <p className="text-gray-500 mt-2">{res.error || "Không thể lấy dữ liệu KPI thời gian."}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Breadcrumb items={[{ label: "Thống kê" }, { label: "KPI" }]} />
            <KPIDashboardClient initialData={res.data} growth={res.growth as any} />
        </div>
    );
}
