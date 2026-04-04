"use client";

import { TrangThaiDuAn } from "@prisma/client";

const STAGES = [
  { key: TrangThaiDuAn.MOI, label: "Mới", color: "#0d1f3c", widthPct: 100 },
  { key: TrangThaiDuAn.DANG_LAM_VIEC, label: "Đang làm việc", color: "#0c1d38", widthPct: 85 },
  { key: TrangThaiDuAn.DA_DEMO, label: "Đã Demo", color: "#0a1930", widthPct: 70 },
  { key: TrangThaiDuAn.DA_GUI_BAO_GIA, label: "Đã gửi báo giá", color: "#071427", widthPct: 55 },
  { key: TrangThaiDuAn.DA_KY_HOP_DONG, label: "Đã ký Hợp đồng", color: "#0058bc", widthPct: 45 },
];

export function StatusFunnel({ data }: { data: any }) {
  const maxVal = Math.max(1, ...STAGES.map(s => data[s.key] || 0));

  return (
    <div className="bg-white p-8 rounded-xl border border-[#c5c6ce]/10 h-full">
      <h4 className="text-sm font-black uppercase tracking-widest text-[#44474d] mb-8 flex items-center gap-2">
        <span className="w-1 h-4 bg-[#0058bc] rounded-full inline-block" />
        Sales Funnel (Số lượng Dự án)
      </h4>
      <div className="flex flex-col items-center space-y-2">
        {STAGES.map((stage) => {
          const count = data[stage.key] || 0;
          const barWidth = maxVal > 0 ? Math.max(15, (count / maxVal) * 100) : 15;
          return (
            <div key={stage.key} className="flex items-center w-full gap-4">
              <span className="text-[10px] font-bold text-slate-400 w-36 text-right uppercase leading-tight shrink-0">
                {stage.label}
              </span>
              <div
                className="flex-1 h-10 rounded-md flex items-center justify-center px-4 transition-all duration-700"
                style={{
                  backgroundColor: stage.color,
                  maxWidth: `${barWidth}%`,
                }}
              >
                <span className="text-white text-xs font-bold">{count}</span>
              </div>
            </div>
          );
        })}

        {/* Thất bại (outside funnel) */}
        {(data[TrangThaiDuAn.THAT_BAI] || 0) > 0 && (
          <div className="flex items-center w-full gap-4">
            <span className="text-[10px] font-bold text-slate-400 w-36 text-right uppercase shrink-0">
              Thất bại
            </span>
            <div
              className="h-10 rounded-md flex items-center justify-center px-4"
              style={{
                backgroundColor: "#e0e3e5",
                maxWidth: `${Math.max(15, ((data[TrangThaiDuAn.THAT_BAI] || 0) / maxVal) * 100)}%`,
              }}
            >
              <span className="text-slate-500 text-xs font-bold">{data[TrangThaiDuAn.THAT_BAI]}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
