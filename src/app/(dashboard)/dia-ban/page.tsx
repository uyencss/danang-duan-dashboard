import { DiaBanDashboardClient } from "./dia-ban-client";
import { getDiaBanAnalytics } from "../dashboard-actions";
import { AlertCircle } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";

export default async function DiaBanPage() {
    const res = await getDiaBanAnalytics();

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
            <DiaBanDashboardClient diaBanData={res.diaBanData} topStaffData={res.topStaffData} />
        </div>
    );
}
