"use client";

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  Sector
} from 'recharts';
import { TrangThaiDuAn } from "@prisma/client";
import { useState } from 'react';

interface StatusPieChartProps {
  data: Record<TrangThaiDuAn, number>;
}

const COLORS = {
  MOI: "#64748b",           // Slate
  DANG_LAM_VIEC: "#0058bc", // Blue
  DA_DEMO: "#9333ea",       // Purple
  DA_GUI_BAO_GIA: "#eab308",// Yellow
  DA_KY_HOP_DONG: "#22c55e",// Green
  THAT_BAI: "#ef4444",      // Red
};

const LABELS: any = {
  MOI: "Mới",
  DANG_LAM_VIEC: "Đang làm việc",
  DA_DEMO: "Đã Demo",
  DA_GUI_BAO_GIA: "Đã gửi báo giá",
  DA_KY_HOP_DONG: "Đã ký kết",
  THAT_BAI: "Thất bại",
};

export function StatusPieChart({ data }: StatusPieChartProps) {
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: LABELS[key] || key,
      value: value,
      key: key
    }));

  const total = chartData.reduce((sum, entry) => sum + entry.value, 0);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show labels for small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-[10px] font-black"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white p-8 rounded-xl border border-[#c5c6ce]/10 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-black uppercase tracking-widest text-[#44474d] flex items-center gap-2">
          <span className="w-1 h-4 bg-[#0058bc] rounded-full inline-block" />
          Phân bổ Trạng thái Dự án
        </h4>
        <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng cộng</p>
            <p className="text-xl font-black text-[#0058bc]">{total}</p>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={4}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.key as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip 
               content={({ active, payload }) => {
                 if (active && payload && payload.length) {
                   const data = payload[0].payload;
                   const pct = ((data.value / total) * 100).toFixed(1);
                   return (
                     <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{data.name}</p>
                       <p className="text-lg font-black text-[#191c1e]">{data.value} <span className="text-xs text-slate-400 font-bold">Dự án</span></p>
                       <p className="text-xs font-bold text-[#0058bc]">{pct}% tổng số</p>
                     </div>
                   );
                 }
                 return null;
               }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              content={({ payload }) => (
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                  {payload?.map((entry: any, index: number) => (
                    <div key={`item-${index}`} className="flex items-center gap-1.5">
                      <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{entry.value}</span>
                      <span className="text-[10px] font-black text-[#191c1e]">{chartData[index]?.value}</span>
                    </div>
                  ))}
                </div>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
