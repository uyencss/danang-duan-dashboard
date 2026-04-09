import { getDashboardOverview, getAMPerformance, getHoanThanhKeHoachData, getBoardOverview } from "./dashboard-actions";
import { KPICard } from "@/components/dashboard/kpi-card";
import { StatusPieChart } from "@/components/dashboard/status-pie-chart";
import { HoanThanhKeHoachClient } from "./hoan-thanh-ke-hoach-client";
import {
  Package2,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Medal,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AMPerformanceTab } from "@/components/dashboard/am-dashboard";
import { BoardOverview } from "@/components/dashboard/board-overview";
import { LayoutDashboard, Users2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Tổng quan",
};

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  await requireRole("ADMIN", "USER", "AM", "CV");

  const result = await getDashboardOverview();
  const amPerf = await getAMPerformance();
  const planData = await getHoanThanhKeHoachData();
  const boardData = await getBoardOverview();

  if (result.error || !result.stats || !result.statusCounts) {
    return (
      <div className="p-12 text-center bg-red-50 text-[#ba1a1a] rounded-xl border border-red-100">
        <AlertTriangle className="size-10 mx-auto mb-4 opacity-50" />
        <p className="text-xl font-black">{result.error || "Không thể tải dữ liệu thống kê"}</p>
        <p className="text-sm font-medium opacity-70 mt-1">
          Vui lòng kiểm tra kết nối database hoặc quyền truy cập của bạn.
        </p>
      </div>
    );
  }

  const { stats, statusCounts } = result;

  // Compute max revenue for bar chart


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Breadcrumb items={[]} />
      {/* Page Header */}
      <section className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-[#191c1e] tracking-tight mb-1">
            Dashboard Tổng quan
          </h2>
          <p className="text-[#44474d] font-medium">
            Theo dõi hiệu quả kinh doanh và tiến độ dự án thực tế.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/du-an"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-full font-bold px-6 py-2.5 h-[38px] border-[#c5c6ce] text-[#191c1e] hover:bg-[#eceef0]"
            )}
          >
            Danh sách dự án
          </Link>
          <Link
            href="/du-an/tao-moi"
            className="px-6 py-2.5 h-[38px] rounded-full bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-bold text-[13px] flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Package2 className="size-4" />
            Tạo dự án mới
          </Link>
        </div>
      </section>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-[#f2f4f6] p-1 rounded-2xl w-fit gap-1 shadow-sm border border-[#eceef0]">
          <TabsTrigger value="overview" className="rounded-xl px-6 py-2 text-xs font-black uppercase tracking-tight flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#0058bc] data-[state=active]:shadow-sm transition-all">
            <LayoutDashboard className="size-3.5" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="am" className="rounded-xl px-6 py-2 text-xs font-black uppercase tracking-tight flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#0058bc] data-[state=active]:shadow-sm transition-all">
            <Users2 className="size-3.5" />
            Dashboard AM
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-10 m-0 focus-visible:outline-none pt-4">
          <BoardOverview data={boardData} />
        </TabsContent>

        <TabsContent value="am" className="m-0 focus-visible:outline-none">
          <AMPerformanceTab amPerf={amPerf} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

