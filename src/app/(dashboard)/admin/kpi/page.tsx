import { getKpiTargets } from "./kpi-actions";
import { KpiDashboardClient } from "./kpi-client";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { AlertCircle } from "lucide-react";
import { requireRole } from "@/lib/auth-utils";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function KpiAdminPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
    const sessionRes = await (auth.api as any).getSession({
        headers: await headers()
    });
    const user = sessionRes?.user;

    if (!user || !["ADMIN", "USER", "AM", "CV"].includes(user.role)) {
        redirect("/du-an");
    }

    const params = await searchParams;
    const year = params.year ? parseInt(params.year) : 2026;

    const res = await getKpiTargets(year);

    if (res.error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                 <AlertCircle className="size-12 text-red-500 mb-4" />
                 <h2 className="text-2xl font-black text-gray-800">Lỗi tải dữ liệu KPI</h2>
                 <p className="text-gray-500 mt-2">{res.error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Breadcrumb items={[{ label: "Admin" }, { label: "Cấu hình KPI Target" }]} />
            <KpiDashboardClient initialData={res.data || []} />
        </div>
    );
}
