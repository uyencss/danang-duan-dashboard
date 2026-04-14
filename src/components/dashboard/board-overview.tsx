"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingUp, Target, Briefcase, Award, Zap, Building, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardOverviewProps {
  data: any;
}

export function BoardOverview({ data }: BoardOverviewProps) {
  if (!data || data.error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl border border-red-100">
        <AlertTriangle className="size-10 mx-auto mb-2" />
        <p className="font-bold">{data?.error || "Không có dữ liệu cho Dashboard"}</p>
      </div>
    );
  }

  const { revenueMetrics, projectMetrics } = data;

  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN');
  };

  return (
    <div className="space-y-10">
      {/* LỚP DOANH THU */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gradient-to-b from-[#004F9E] to-[#00AEEF] rounded-full" />
          <h3 className="text-xl font-black uppercase tracking-tight text-[#191c1e]">Tổng Quan Doanh Thu</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1: DT Tổng Dự Án */}
          <MetricCard 
             title="DT Tổng Dự Án" 
             value={`${formatCurrency(revenueMetrics.dtTongDuAn)} Tr.đ`}
             icon={Briefcase}
             accentColor="from-[#004F9E] to-[#0070eb]"
          />

          {/* Card 2: DT Tháng Đã Ký */}
          <Card className="relative p-6 rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group">
            <div className="relative z-10 space-y-4">
               <div className="flex items-center justify-between">
                 <div className="p-2.5 rounded-2xl bg-green-50 text-green-600">
                    <Award className="size-5" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#004F9E] bg-blue-50 px-2 py-0.5 rounded-full">Kế hoạch</span>
               </div>
               <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">DT Tháng Đã Ký</p>
                  <p className="text-2xl font-black text-slate-900">{formatCurrency(revenueMetrics.dtThangDaKyValue)} <span className="text-xs">Tr.đ</span></p>
               </div>
               <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">% Hoàn thành</span>
                    <span className="text-sm font-black text-green-600">{revenueMetrics.dtThangDaKyPerc.toFixed(1)}%</span>
                  </div>
                  <Progress value={revenueMetrics.dtThangDaKyPerc} className="h-2 bg-slate-100" indicatorClassName="bg-gradient-to-r from-[#003B75] to-[#00AEEF]" />
               </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-125 transition-transform duration-500" />
          </Card>

          {/* Card 3: DT Dự Kiến Tháng */}
          <Card className="relative p-6 rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group">
            <div className="relative z-10 space-y-4">
               <div className="flex items-center justify-between">
                 <div className="p-2.5 rounded-2xl bg-blue-50 text-[#0058bc]">
                    <Target className="size-5" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#004F9E] bg-blue-50 px-2 py-0.5 rounded-full">Dự kiến</span>
               </div>
               <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">DT Dự Kiến Tháng</p>
                  <p className="text-2xl font-black text-slate-900">{formatCurrency(revenueMetrics.dtDuKienThangValue)} <span className="text-xs">Tr.đ</span></p>
               </div>
               <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">% Hoàn thành</span>
                    <span className="text-sm font-black text-[#0058bc]">{revenueMetrics.dtDuKienThangPerc.toFixed(1)}%</span>
                  </div>
                  <Progress value={revenueMetrics.dtDuKienThangPerc} className="h-2 bg-slate-100" indicatorClassName="bg-gradient-to-r from-[#003B75] to-[#00AEEF]" />
               </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-125 transition-transform duration-500" />
          </Card>

          {/* Card 4: DT Theo Quý */}
          <MetricCard 
             title="DT Theo Quý" 
             value={`${formatCurrency(revenueMetrics.dtTheoQuy)} Tr.đ`}
             description="Quý hiện tại (Quý 2)"
             icon={Zap}
             accentColor="from-orange-500 to-amber-500"
          />

          {/* Card 5: DT Theo Năm */}
          <MetricCard 
             title="DT Theo Năm" 
             value={`${formatCurrency(revenueMetrics.dtTheoNam)} Tr.đ`}
             description="Toàn bộ năm 2026"
             icon={TrendingUp}
             accentColor="from-purple-600 to-indigo-600"
          />
        </div>
      </section>

      {/* TỔNG QUAN DỰ ÁN */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gradient-to-b from-[#004493] to-[#0058bc] rounded-full" />
          <h3 className="text-xl font-black uppercase tracking-tight text-[#191c1e]">Tổng Quan Dự Án</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
           {/* Metric 6: Tổng số dự án */}
           <MetricCard 
             title="Tổng Số Dự Án" 
             value={projectMetrics.tongSoDuAn}
             icon={Building}
             accentColor="from-slate-600 to-slate-800"
          />

          {/* Metric 7: Dự án trọng điểm */}
          <MetricCard 
             title="Dự Án Trọng Điểm" 
             value={projectMetrics.duAnTrongDiem}
             description="Các dự án Flagged"
             icon={Award}
             accentColor="from-amber-400 to-orange-500"
          />

          {/* Metric 8: Hiện trạng tháng */}
          <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white overflow-hidden flex flex-col justify-between min-h-[160px]">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Hiện Trạng Tháng</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                {projectMetrics.hienTrangThang.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-[11px] font-medium border-b border-slate-50 last:border-none pb-1">
                    <span className="text-slate-500">{s.label}</span>
                    <span className="font-black text-[#0058bc]">{s.count}</span>
                  </div>
                ))}
            </div>
          </Card>

          {/* Metric 9: Thống kê theo bước */}
          <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white overflow-hidden flex flex-col min-h-[160px]">
             <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Theo Bước Quy Trình</p>
             <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                {projectMetrics.thongKeTheoBuoc.map((b: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-[10px] font-bold px-2 py-1 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 truncate max-w-[80px]">{b.label}</span>
                    <span className="text-[#0058bc]">{b.count}</span>
                  </div>
                ))}
                {projectMetrics.thongKeTheoBuoc.length === 0 && <p className="text-[10px] text-slate-400 italic">Chưa có dữ liệu bước</p>}
             </div>
          </Card>

          {/* Metric 10: Cảnh báo theo tổ */}
          <Card className="p-6 rounded-[2rem] border-red-100 border-2 shadow-sm bg-red-50 overflow-hidden flex flex-col justify-between min-h-[160px]">
             <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="size-4 animate-pulse" />
                <p className="text-[11px] font-black uppercase tracking-widest">CẢNH BÁO (&gt;15 ngày)</p>
             </div>
             <div className="grid grid-cols-2 gap-2 mt-2">
                {projectMetrics.canhBaoTheoTo.map((t: any, i: number) => (
                  <div key={i} className="flex flex-col items-center p-2 bg-white rounded-xl shadow-sm border border-red-100">
                    <span className="text-[10px] font-bold text-slate-400">{t.label}</span>
                    <span className="text-lg font-black text-red-600 leading-none">{t.count}</span>
                  </div>
                ))}
             </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, description, icon: Icon, accentColor }: any) {
  return (
    <Card className="group relative p-6 rounded-[2rem] border-none shadow-sm bg-white overflow-hidden transition-all hover:shadow-xl hover:shadow-blue-900/5">
      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        <div className="flex items-center justify-between">
          <div className={cn("p-2.5 rounded-2xl bg-gradient-to-br text-white shadow-lg", accentColor)}>
            <Icon className="size-5" />
          </div>
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-black text-slate-900">{value}</p>
          {description && <p className="text-[10px] font-medium text-slate-400 mt-1 italic">{description}</p>}
        </div>
      </div>
      <div className={cn("absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br opacity-[0.03] rounded-full translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700", accentColor)} />
    </Card>
  );
}
