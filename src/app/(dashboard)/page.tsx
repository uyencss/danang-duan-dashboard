import { getDashboardOverview, getAMPerformance } from "./dashboard-actions";
import { KPICard } from "@/components/dashboard/kpi-card";
import { StatusFunnel } from "@/components/dashboard/status-funnel";
import {
  Package2,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/layout/breadcrumb";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Tổng quan",
};

export default async function DashboardPage() {
  const result = await getDashboardOverview();
  const amPerf = await getAMPerformance();

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
  const amList = amPerf.data?.slice(0, 5) || [];
  const maxRevenue = Math.max(1, ...amList.map((a: any) => a.revenue));

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

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Tổng Dự án"
          value={stats.totalProjects}
          icon={Package2}
          trend="+12% vs tháng"
          variant="default"
        />
        <KPICard
          title="Doanh thu Dự kiến"
          value={`${stats.totalRevenue.toLocaleString()} Tr.đ`}
          icon={DollarSign}
          description="Kỳ vọng tổng"
          variant="success"
        />
        <KPICard
          title="Đã ký Hợp đồng"
          value={stats.signedProjects}
          icon={CheckCircle2}
          variant="warning"
        />
        <KPICard
          title="Cần Chăm sóc gấp"
          value={stats.urgentCare}
          icon={AlertTriangle}
          description="Quá 15 ngày"
          variant="urgent"
        />
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Funnel */}
        <StatusFunnel data={statusCounts} />

        {/* AM Performance Bar Chart */}
        <div className="bg-white p-8 rounded-xl border border-[#c5c6ce]/10">
          <h4 className="text-sm font-black uppercase tracking-widest text-[#44474d] mb-8 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#0058bc] rounded-full inline-block" />
            Top 5 AM Performance (Revenue)
          </h4>
          <div className="space-y-6">
            {amList.map((am: any, i: number) => {
              const pct = maxRevenue > 0 ? Math.max(5, (am.revenue / maxRevenue) * 100) : 5;
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-[#191c1e]">
                    <span>{am.name}</span>
                    <span>{am.revenue.toLocaleString()} Tr</span>
                  </div>
                  <div className="h-2 w-full bg-[#eceef0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0058bc] to-[#004493] rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {amList.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8">
                Chưa có dữ liệu nhân sự.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* AM Evaluation Table */}
      <section className="bg-white rounded-xl shadow-sm border border-[#c5c6ce]/10 overflow-hidden">
        <div className="px-8 py-6 flex justify-between items-center border-b border-[#eceef0]">
          <h4 className="text-sm font-black uppercase tracking-widest text-[#44474d] flex items-center gap-2">
            <span className="w-1 h-4 bg-[#0058bc] rounded-full inline-block" />
            Bảng đánh giá hiệu quả Nhân sự (AM)
          </h4>
          <Link
            href="/admin/nhan-vien"
            className="text-xs text-[#0058bc] font-bold flex items-center gap-1 hover:underline"
          >
            Xem tất cả <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f2f4f6]">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-[#44474d] uppercase tracking-widest">
                  Nhân viên | AM
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-[#44474d] uppercase tracking-widest text-center">
                  Số dự án
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-[#44474d] uppercase tracking-widest text-right">
                  Doanh thu (Tr.đ)
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-[#44474d] uppercase tracking-widest text-center">
                  Số HĐ ký
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-[#44474d] uppercase tracking-widest text-right">
                  Tỷ lệ CĐ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {amList.map((am: any, i: number) => {
                const convRate = am.count > 0 ? ((am.signed / am.count) * 100).toFixed(1) : "0.0";
                const initials = am.name.split(" ").map((n: string) => n[0]).slice(-2).join("").toUpperCase();
                return (
                  <tr key={i} className="hover:bg-[#f7f9fb] transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#000719]/10 flex items-center justify-center text-[#000719] font-bold text-xs">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#191c1e]">{am.name}</p>
                          <p className="text-[10px] text-slate-500">Account Manager</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-[#191c1e]">
                      {am.count}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-[#0058bc]">
                      {am.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">
                        {am.signed}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-black text-[#191c1e]">{convRate}%</span>
                        <div className="w-12 h-1.5 bg-[#eceef0] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${convRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {amList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 text-sm">
                    Chưa có dữ liệu nhân sự.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
