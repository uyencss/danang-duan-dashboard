import { NhanSuDashboardClient } from "./nhan-su-client";
import { getNhanSuAnalytics } from "../dashboard-actions";
import { AlertCircle } from "lucide-react";

export default async function NhanSuPage({ searchParams }: { searchParams: Promise<{ type?: string, year?: string, value?: string }> }) {
    const params = await searchParams;
    let filterArgs: any = { type: 'all' };

    if (params.type === 'nam' && params.year) {
        filterArgs = { type: 'nam', year: Number(params.year) };
    } else if (params.type === 'quy' && params.year && params.value) {
        filterArgs = { type: 'quy', year: Number(params.year), quarter: Number(params.value) };
    } else if (params.type === 'thang' && params.year && params.value) {
        filterArgs = { type: 'thang', year: Number(params.year), month: Number(params.value) };
    }

    const res = await getNhanSuAnalytics(filterArgs);

    if (res.error || !res.data) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                 <AlertCircle className="size-12 text-red-500 mb-4" />
                 <h2 className="text-2xl font-black text-gray-800">Lỗi tải dữ liệu</h2>
                 <p className="text-gray-500 mt-2">{res.error || "Không thể lấy dữ liệu phân tích nhân sự."}</p>
            </div>
        );
    }

    return <NhanSuDashboardClient initialData={res.data} />;
}
