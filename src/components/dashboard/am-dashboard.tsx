"use client";

import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Medal, Flame, TrendingUp, Users2, Target, CreditCard, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AMPerformanceTabProps {
  amPerf: any[];
}

export function AMPerformanceTab({ amPerf }: AMPerformanceTabProps) {
  if (!amPerf || amPerf.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-[2rem] border border-[#eceef0]">
        <TrendingUp className="size-12 mx-auto mb-4 text-slate-200" />
        <p className="text-slate-500 font-medium">Chưa có dữ liệu hiệu quả AM trong tháng này.</p>
      </div>
    );
  }

  // Sorting logic for Signed projects (based on doanhThuDaKy)
  const sortedBySigned = [...amPerf].sort((a, b) => b.doanhThuDaKy - a.doanhThuDaKy);
  const top3Signed = sortedBySigned.slice(0, 3);
  const bottom3Signed = [...sortedBySigned].reverse().slice(0, 3);

  // Sorting logic for Potential projects (based on doanhThuKyVong)
  const sortedByPotential = [...amPerf].sort((a, b) => b.doanhThuKyVong - a.doanhThuKyVong);
  const top3Potential = sortedByPotential.slice(0, 3);
  const bottom3Potential = [...sortedByPotential].reverse().slice(0, 3);

  return (
    <div className="space-y-8">
      {/* SECTION 1: FULL-WIDTH COMBINED CHART */}
      <Card className="p-8 rounded-[2rem] border-[#eceef0] shadow-sm bg-white overflow-hidden overflow-x-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-1">
            <h4 className="text-xl font-black uppercase tracking-tight text-[#191c1e] flex items-center gap-3">
              <span className="w-1.5 h-6 bg-[#0058bc] rounded-full inline-block" />
              DASHBOARD AM
              <Users2 className="size-6 text-[#0058bc]" />
            </h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-4">Tháng 04/2026 • Doanh thu dự kiến & Lượt tiếp cận</p>
          </div>
        </div>

        <div className="h-[550px] w-full min-w-[800px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={amPerf} margin={{ top: 20, right: 30, bottom: 100, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} 
                angle={-45}
                textAnchor="end"
                interval={0}
                height={80}
              />
              <YAxis 
                yAxisId="left" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#0058bc', fontSize: 11, fontWeight: 800 }} 
                tickFormatter={(val) => `${val} Tr`}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#f59e0b', fontSize: 11, fontWeight: 800 }} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '30px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }} />
              <Bar 
                yAxisId="left" 
                dataKey="doanhThuDuKienThang" 
                name="Doanh thu dự kiến (Tr.đ)" 
                fill="#0058bc" 
                radius={[6, 6, 0, 0]} 
                barSize={40} 
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="soLuongTiepCan" 
                name="Lượt tiếp cận" 
                stroke="#f59e0b" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 6 }}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="soHopDongDaKy" 
                name="Hợp đồng đã ký" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* SECTION 2: TOP 3 & BOTTOM 3 RANKINGS WITH TABS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* TOP 3 HIGHEST */}
        <div className="bg-white p-8 rounded-[2rem] border border-[#eceef0] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-lg font-black uppercase tracking-tight text-[#0058bc] flex items-center gap-3">
              <span className="p-2 bg-blue-50 rounded-xl">
                <Medal className="size-5 text-amber-500" />
              </span>
              TOP 3 AM CAO NHẤT
            </h4>
            <ChevronUp className="size-5 text-blue-300" />
          </div>

          <Tabs defaultValue="signed" className="w-full">
            <TabsList className="bg-[#f2f4f6] p-1.5 rounded-full mb-6 w-full gap-1 grid grid-cols-2 shadow-inner border border-[#eceef0]">
              <TabsTrigger value="signed" className="rounded-full text-[11px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-white data-[state=active]:text-[#0058bc] data-[state=active]:shadow-md transition-all">Dự án Đã ký</TabsTrigger>
              <TabsTrigger value="potential" className="rounded-full text-[11px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-white data-[state=active]:text-[#0058bc] data-[state=active]:shadow-md transition-all">Tiềm năng khác</TabsTrigger>
            </TabsList>

            <TabsContent value="signed" className="space-y-6 focus-visible:outline-none">
              {top3Signed.map((am, i) => (
                <AMRankCard key={am.id} am={am} rank={i + 1} isTop={true} maxVal={top3Signed[0].doanhThuDaKy} valKey="doanhThuDaKy" />
              ))}
            </TabsContent>
            <TabsContent value="potential" className="space-y-6 focus-visible:outline-none">
              {top3Potential.map((am, i) => (
                <AMRankCard key={am.id} am={am} rank={i + 1} isTop={true} maxVal={top3Potential[0].doanhThuKyVong} valKey="doanhThuKyVong" />
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* TOP 3 LOWEST */}
        <div className="bg-white p-8 rounded-[2rem] border border-[#eceef0] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-lg font-black uppercase tracking-tight text-red-600 flex items-center gap-3">
              <span className="p-2 bg-red-50 rounded-xl">
                <Flame className="size-5 text-red-500" />
              </span>
              TOP 3 AM THẤP NHẤT
            </h4>
            <ChevronDown className="size-5 text-red-300" />
          </div>

          <Tabs defaultValue="signed" className="w-full">
            <TabsList className="bg-[#fff4f2] p-1.5 rounded-full mb-6 w-full gap-1 grid grid-cols-2 shadow-inner border border-red-50">
              <TabsTrigger value="signed" className="rounded-full text-[11px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-md transition-all text-red-400">Dự án Đã ký</TabsTrigger>
              <TabsTrigger value="potential" className="rounded-full text-[11px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-md transition-all text-red-400">Tiềm năng khác</TabsTrigger>
            </TabsList>

            <TabsContent value="signed" className="space-y-6 focus-visible:outline-none">
              {bottom3Signed.map((am, i) => (
                <AMRankCard key={am.id} am={am} rank={i + 1} isTop={false} maxVal={top3Signed[0].doanhThuDaKy || 1} valKey="doanhThuDaKy" />
              ))}
            </TabsContent>
            <TabsContent value="potential" className="space-y-6 focus-visible:outline-none">
              {bottom3Potential.map((am, i) => (
                <AMRankCard key={am.id} am={am} rank={i + 1} isTop={false} maxVal={top3Potential[0].doanhThuKyVong || 1} valKey="doanhThuKyVong" />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function AMRankCard({ am, rank, isTop, maxVal, valKey }: { am: any, rank: number, isTop: boolean, maxVal: number, valKey: string }) {
  const value = am[valKey] || 0;
  const pct = Math.max(5, (value / (maxVal || 1)) * 100);
  
  return (
    <div className="group relative p-4 rounded-2xl transition-all hover:bg-slate-50 border border-transparent hover:border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <div className={cn(
            "size-8 rounded-full flex items-center justify-center text-sm font-black shadow-sm",
            isTop ? "bg-blue-600 text-white" : "bg-red-50 text-red-600 border border-red-100"
          )}>
            {rank}
          </div>
          <div>
            <p className="text-sm font-black text-[#191c1e]">{am.name}</p>
            <div className="flex items-center gap-3 mt-0.5 text-[10px] font-bold text-slate-400 uppercase">
              <span className="flex items-center gap-1"><Target className="size-3" /> {am.soLuongTiepCan} Tiếp cận</span>
              <span className="flex items-center gap-1"><CreditCard className="size-3" /> {am.soHopDongDaKy} HĐ</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-base font-black", isTop ? "text-blue-600" : "text-red-600")}>
            {value.toLocaleString('vi-VN')}
          </p>
          <p className="text-[9px] font-black uppercase text-slate-300">Tr.đ / Tháng</p>
        </div>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            isTop ? "bg-gradient-to-r from-blue-500 to-blue-700" : "bg-gradient-to-r from-red-400 to-red-600"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
