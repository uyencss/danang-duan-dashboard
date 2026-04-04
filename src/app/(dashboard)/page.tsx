import { getDashboardOverview, getAMPerformance, getHoanThanhKeHoachData } from "./dashboard-actions";
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

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Tổng quan",
};

export default async function DashboardPage() {
  const result = await getDashboardOverview();
  const amPerf = await getAMPerformance();
  const planData = await getHoanThanhKeHoachData();

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

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Tổng Dự án"
          value={stats.totalProjects}
          icon={Package2}
          subValue={stats.totalCustomers}
          subLabel="Tổng khách hàng"
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
      {/* Charts Row */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Pie Chart */}
        <StatusPieChart data={statusCounts} />

        {/* Top 5 AM */}
        <div className="bg-white p-8 rounded-xl border border-[#c5c6ce]/10 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-[#44474d] flex items-center gap-2">
              <span className="w-1 h-4 bg-[#0058bc] rounded-full inline-block" />
              Top 5 AM
              <Medal className="size-4 text-amber-500 animate-bounce" />
            </h4>
          </div>

          <Tabs defaultValue="signed" className="flex-1 flex flex-col">
             <TabsList className="bg-[#f2f4f6] p-1 rounded-full mb-6 w-full gap-1 grid grid-cols-2 shadow-inner">
                <TabsTrigger value="signed" className="rounded-full text-[10px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-[#0058bc] data-[state=active]:text-white transition-all shadow-none">Dự án Đã ký</TabsTrigger>
                <TabsTrigger value="others" className="rounded-full text-[10px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-[#0058bc] data-[state=active]:text-white transition-all shadow-none">Trạng thái khác</TabsTrigger>
             </TabsList>

             <div className="flex-1 overflow-y-auto pr-1">
               <TabsContent value="signed" className="space-y-6 pt-2 m-0 mt-0 focus-visible:outline-none">
                  {(amPerf as any).topAMSigned?.map((am: any, i: number) => {
                    const maxVal = (amPerf as any).topAMSigned[0]?.signedRevenue || 1;
                    const pct = Math.max(5, (am.signedRevenue / maxVal) * 100);
                    return (
                      <div key={i} className="space-y-2 animate-in slide-in-from-right-1 duration-300">
                        <div className="flex justify-between text-xs font-bold text-[#191c1e]">
                          <span className="truncate pr-4">{am.name}</span>
                          <span className="text-[#0058bc] font-black">{am.signedRevenue.toLocaleString()} Tr</span>
                        </div>
                        <div className="h-2.5 w-full bg-[#f2f4f6] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {(!(amPerf as any).topAMSigned || (amPerf as any).topAMSigned.length === 0) && (
                    <div className="text-center py-12 flex flex-col items-center justify-center text-slate-300">
                      <TrendingUp className="size-8 mb-2 opacity-20" />
                      <p className="text-sm font-medium italic">Chưa có dữ liệu.</p>
                    </div>
                  )}
               </TabsContent>
               <TabsContent value="others" className="space-y-6 pt-2 m-0 focus-visible:outline-none">
                  {(amPerf as any).topAMOthers?.map((am: any, i: number) => {
                    const maxVal = (amPerf as any).topAMOthers[0]?.otherRevenue || 1;
                    const pct = Math.max(5, (am.otherRevenue / maxVal) * 100);
                    return (
                      <div key={i} className="space-y-2 animate-in slide-in-from-right-1 duration-300">
                        <div className="flex justify-between text-xs font-bold text-[#191c1e]">
                          <span className="truncate pr-4">{am.name}</span>
                          <span className="text-[#0058bc] font-black">{am.otherRevenue.toLocaleString()} Tr</span>
                        </div>
                        <div className="h-2.5 w-full bg-[#f2f4f6] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#0058bc] to-[#004493] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {(!(amPerf as any).topAMOthers || (amPerf as any).topAMOthers.length === 0) && (
                    <div className="text-center py-12 flex flex-col items-center justify-center text-slate-300">
                      <TrendingUp className="size-8 mb-2 opacity-20" />
                      <p className="text-sm font-medium italic">Chưa có dữ liệu.</p>
                    </div>
                  )}
               </TabsContent>
             </div>
          </Tabs>
        </div>

        {/* Top 5 Chuyên viên */}
        <div className="bg-white p-8 rounded-xl border border-[#c5c6ce]/10 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-[#44474d] flex items-center gap-2">
              <span className="w-1 h-4 bg-purple-600 rounded-full inline-block" />
              Top 5 Chuyên viên
              <Medal className="size-4 text-amber-500 animate-bounce" />
            </h4>
          </div>

          <Tabs defaultValue="signed" className="flex-1 flex flex-col">
             <TabsList className="bg-[#f2f4f6] p-1 rounded-full mb-6 w-full gap-1 grid grid-cols-2 shadow-inner">
                <TabsTrigger value="signed" className="rounded-full text-[10px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all shadow-none">Dự án Đã ký</TabsTrigger>
                <TabsTrigger value="others" className="rounded-full text-[10px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all shadow-none">Trạng thái khác</TabsTrigger>
             </TabsList>

             <div className="flex-1 overflow-y-auto pr-1">
               <TabsContent value="signed" className="space-y-6 pt-2 m-0 mt-0 focus-visible:outline-none">
                  {(amPerf as any).topCVSigned?.map((cv: any, i: number) => {
                    const maxVal = (amPerf as any).topCVSigned[0]?.signedRevenue || 1;
                    const pct = Math.max(5, (cv.signedRevenue / maxVal) * 100);
                    return (
                      <div key={i} className="space-y-2 animate-in slide-in-from-right-1 duration-300">
                        <div className="flex justify-between text-xs font-bold text-[#191c1e]">
                          <span className="truncate pr-4">{cv.name}</span>
                          <span className="text-purple-600 font-black">{cv.signedRevenue.toLocaleString()} Tr</span>
                        </div>
                        <div className="h-2.5 w-full bg-[#f2f4f6] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {(!(amPerf as any).topCVSigned || (amPerf as any).topCVSigned.length === 0) && (
                    <div className="text-center py-12 flex flex-col items-center justify-center text-slate-300">
                      <TrendingUp className="size-8 mb-2 opacity-20" />
                      <p className="text-sm font-medium italic">Chưa có dữ liệu.</p>
                    </div>
                  )}
               </TabsContent>
               <TabsContent value="others" className="space-y-6 pt-2 m-0 focus-visible:outline-none">
                  {(amPerf as any).topCVOthers?.map((cv: any, i: number) => {
                    const maxVal = (amPerf as any).topCVOthers[0]?.otherRevenue || 1;
                    const pct = Math.max(5, (cv.otherRevenue / maxVal) * 100);
                    return (
                      <div key={i} className="space-y-2 animate-in slide-in-from-right-1 duration-300">
                        <div className="flex justify-between text-xs font-bold text-[#191c1e]">
                          <span className="truncate pr-4">{cv.name}</span>
                          <span className="text-purple-600 font-black">{cv.otherRevenue.toLocaleString()} Tr</span>
                        </div>
                        <div className="h-2.5 w-full bg-[#f2f4f6] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-purple-700 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {(!(amPerf as any).topCVOthers || (amPerf as any).topCVOthers.length === 0) && (
                    <div className="text-center py-12 flex flex-col items-center justify-center text-slate-300">
                      <TrendingUp className="size-8 mb-2 opacity-20" />
                      <p className="text-sm font-medium italic">Chưa có dữ liệu.</p>
                    </div>
                  )}
               </TabsContent>
             </div>
          </Tabs>
        </div>
      </section>

      {/* Alarm Section */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <HoanThanhKeHoachClient projects={(planData as any).projects || []} kpis={(planData as any).kpis || []} />

        {/* Bottom 5 AM */}
        <div className="bg-white p-8 rounded-xl border border-red-100 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-red-600 flex items-center gap-2">
              <span className="w-1 h-4 bg-red-600 rounded-full inline-block" />
              Top 5 AM Thấp nhất
              <Flame className="size-4 text-red-500 animate-pulse" />
            </h4>
          </div>
          
          <Tabs defaultValue="signed" className="flex-1 flex flex-col">
             <TabsList className="bg-red-50 border border-red-100 p-1 rounded-full mb-6 w-full gap-1 grid grid-cols-2 shadow-inner">
                <TabsTrigger value="signed" className="rounded-full text-[10px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all shadow-none text-red-600">Dự án Đã ký</TabsTrigger>
                <TabsTrigger value="others" className="rounded-full text-[10px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all shadow-none text-red-600">Trạng thái khác</TabsTrigger>
             </TabsList>

             <div className="flex-1 overflow-y-auto pr-1">
               <TabsContent value="signed" className="space-y-6 pt-2 m-0 mt-0 focus-visible:outline-none">
                  {(amPerf as any).bottomAMSigned?.map((am: any, i: number) => {
                    const maxInGroup = Math.max(...(amPerf as any).bottomAMSigned.map((a: any) => a.signedRevenue), 1);
                    const pct = Math.max(5, (am.signedRevenue / maxInGroup) * 100);
                    return (
                      <div key={i} className="space-y-2 animate-in slide-in-from-right-1 duration-300">
                        <div className="flex justify-between text-xs font-bold text-[#191c1e]">
                          <span className="truncate pr-4">{am.name}</span>
                          <span className="text-red-600 font-black">{am.signedRevenue.toLocaleString()} Tr</span>
                        </div>
                        <div className="h-2.5 w-full bg-red-50 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {(!(amPerf as any).bottomAMSigned || (amPerf as any).bottomAMSigned.length === 0) && (
                    <div className="text-center py-12 flex flex-col items-center justify-center text-red-300/50">
                      <TrendingUp className="size-8 mb-2 opacity-50" />
                      <p className="text-sm font-medium italic">Chưa có dữ liệu.</p>
                    </div>
                  )}
               </TabsContent>
               <TabsContent value="others" className="space-y-6 pt-2 m-0 focus-visible:outline-none">
                  {(amPerf as any).bottomAMOthers?.map((am: any, i: number) => {
                    const maxInGroup = Math.max(...(amPerf as any).bottomAMOthers.map((a: any) => a.otherRevenue), 1);
                    const pct = Math.max(5, (am.otherRevenue / maxInGroup) * 100);
                    return (
                      <div key={i} className="space-y-2 animate-in slide-in-from-right-1 duration-300">
                        <div className="flex justify-between text-xs font-bold text-[#191c1e]">
                          <span className="truncate pr-4">{am.name}</span>
                          <span className="text-red-600 font-black">{am.otherRevenue.toLocaleString()} Tr</span>
                        </div>
                        <div className="h-2.5 w-full bg-red-50 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {(!(amPerf as any).bottomAMOthers || (amPerf as any).bottomAMOthers.length === 0) && (
                    <div className="text-center py-12 flex flex-col items-center justify-center text-red-300/50">
                      <TrendingUp className="size-8 mb-2 opacity-50" />
                      <p className="text-sm font-medium italic">Chưa có dữ liệu.</p>
                    </div>
                  )}
               </TabsContent>
             </div>
          </Tabs>
        </div>

        {/* Bottom 5 CV */}
        <div className="bg-white p-8 rounded-xl border border-orange-100 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-orange-600 flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-600 rounded-full inline-block" />
              Top 5 Chuyên viên Thấp nhất
              <Flame className="size-4 text-orange-500 animate-pulse" />
            </h4>
          </div>
          
          <Tabs defaultValue="signed" className="flex-1 flex flex-col">
             <TabsList className="bg-orange-50 border border-orange-100 p-1 rounded-full mb-6 w-full gap-1 grid grid-cols-2 shadow-inner">
                <TabsTrigger value="signed" className="rounded-full text-[10px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all shadow-none text-orange-600">Dự án Đã ký</TabsTrigger>
                <TabsTrigger value="others" className="rounded-full text-[10px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all shadow-none text-orange-600">Trạng thái khác</TabsTrigger>
             </TabsList>

             <div className="flex-1 overflow-y-auto pr-1">
               <TabsContent value="signed" className="space-y-6 pt-2 m-0 mt-0 focus-visible:outline-none">
                  {(amPerf as any).bottomCVSigned?.map((cv: any, i: number) => {
                    const maxInGroup = Math.max(...(amPerf as any).bottomCVSigned.map((a: any) => a.signedRevenue), 1);
                    const pct = Math.max(5, (cv.signedRevenue / maxInGroup) * 100);
                    return (
                      <div key={i} className="space-y-2 animate-in slide-in-from-right-1 duration-300">
                        <div className="flex justify-between text-xs font-bold text-[#191c1e]">
                          <span className="truncate pr-4">{cv.name}</span>
                          <span className="text-orange-600 font-black">{cv.signedRevenue.toLocaleString()} Tr</span>
                        </div>
                        <div className="h-2.5 w-full bg-orange-50 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {(!(amPerf as any).bottomCVSigned || (amPerf as any).bottomCVSigned.length === 0) && (
                    <div className="text-center py-12 flex flex-col items-center justify-center text-orange-300/50">
                      <TrendingUp className="size-8 mb-2 opacity-50" />
                      <p className="text-sm font-medium italic">Chưa có dữ liệu.</p>
                    </div>
                  )}
               </TabsContent>
               <TabsContent value="others" className="space-y-6 pt-2 m-0 focus-visible:outline-none">
                  {(amPerf as any).bottomCVOthers?.map((cv: any, i: number) => {
                    const maxInGroup = Math.max(...(amPerf as any).bottomCVOthers.map((a: any) => a.otherRevenue), 1);
                    const pct = Math.max(5, (cv.otherRevenue / maxInGroup) * 100);
                    return (
                      <div key={i} className="space-y-2 animate-in slide-in-from-right-1 duration-300">
                        <div className="flex justify-between text-xs font-bold text-[#191c1e]">
                          <span className="truncate pr-4">{cv.name}</span>
                          <span className="text-orange-600 font-black">{cv.otherRevenue.toLocaleString()} Tr</span>
                        </div>
                        <div className="h-2.5 w-full bg-orange-50 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {(!(amPerf as any).bottomCVOthers || (amPerf as any).bottomCVOthers.length === 0) && (
                    <div className="text-center py-12 flex flex-col items-center justify-center text-orange-300/50">
                      <TrendingUp className="size-8 mb-2 opacity-50" />
                      <p className="text-sm font-medium italic">Chưa có dữ liệu.</p>
                    </div>
                  )}
               </TabsContent>
             </div>
          </Tabs>
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
            href="/admin/users"
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
              {(amPerf as any).data?.slice(0, 5).map((am: any, i: number) => {
                const convRate = am.projects > 0 ? ((am.contracts / am.projects) * 100).toFixed(1) : "0.0";
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
              {(!(amPerf as any).data || (amPerf as any).data.length === 0) && (
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
