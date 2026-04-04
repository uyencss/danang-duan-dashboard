"use client";

import {
  Funnel,
  FunnelChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrangThaiDuAn } from "@prisma/client";

export function StatusFunnel({ data }: { data: any }) {
  const chartData = [
    { value: data[TrangThaiDuAn.MOI] || 0, name: "Mới", fill: "#94a3b8" },
    { value: data[TrangThaiDuAn.DANG_LAM_VIEC] || 0, name: "Làm việc", fill: "#3b82f6" },
    { value: data[TrangThaiDuAn.DA_DEMO] || 0, name: "Demo", fill: "#8b5cf6" },
    { value: data[TrangThaiDuAn.DA_GUI_BAO_GIA] || 0, name: "Báo giá", fill: "#eab308" },
    { value: data[TrangThaiDuAn.DA_KY_HOP_DONG] || 0, name: "Đã ký HĐ", fill: "#22c55e" },
  ].sort((a, b) => b.value - a.value);

  return (
    <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-gray-200/20 bg-white overflow-hidden h-full flex flex-col">
      <CardHeader className="bg-gray-50/50 pb-6 border-b border-gray-50">
        <CardTitle className="text-xl font-black text-[#003466]">Phễu Trạng thái Dự án</CardTitle>
        <CardDescription className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Phân bổ nguồn lực theo giai đoạn</CardDescription>
      </CardHeader>
      <CardContent className="pt-10 flex-1 relative">
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
                <Tooltip 
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Funnel
                    data={chartData}
                    dataKey="value"
                    isAnimationActive
                >
                    <LabelList 
                        position="right" 
                        fill="#003466" 
                        stroke="none" 
                        dataKey="name" 
                        style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    />
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Funnel>
            </FunnelChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
