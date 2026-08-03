"use client";

import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  CalendarRange,
  Briefcase,
  Award,
  Star,
  BarChart3,
  ListChecks,
  Layers,
  CalendarDays,
  CalendarCheck,
} from "lucide-react";

interface BoardOverviewProps {
  data: any;
}

/* ── Animated SVG ring with curved label hugging the circle ── */
function LabeledRing({
  percent,
  color,
  label,
  size = 72,
}: {
  percent: number;
  color: string;
  label: string;
  size?: number;
}) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(percent, 200);
  const displayPercent = Math.min(clampedPercent, 100);
  const offset = circumference - (displayPercent / 100) * circumference;

  // Outer radius for the curved text path (slightly outside the ring)
  const textRadius = radius + 10;
  const cx = size / 2 + 10;
  const cy = size / 2 + 10;
  const svgSize = size + 20;

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg
        width={svgSize}
        height={svgSize}
        className="shrink-0"
        style={{ overflow: "visible" }}
      >
        {/* Define the curved path: starts at 12 o'clock, arcs clockwise */}
        <defs>
          <path
            id={`arc-${label.replace(/\s/g, "")}-${color}`}
            d={`M ${cx},${cy - textRadius} A ${textRadius},${textRadius} 0 0,1 ${cx + textRadius},${cy}`}
            fill="none"
          />
        </defs>

        {/* Curved label text — starts at 12 o'clock clockwise */}
        <text>
          <textPath
            href={`#arc-${label.replace(/\s/g, "")}-${color}`}
            startOffset="0%"
            textAnchor="start"
            fill={color}
            fontSize="9"
            fontWeight="800"
            letterSpacing="1.5"
            style={{ textTransform: "uppercase" }}
          >
            {label}
          </textPath>
        </text>

        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          className="-rotate-90 origin-center"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
        {/* Progress ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="-rotate-90 transition-all duration-1000 ease-out"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      </svg>
      {/* Percentage text in center */}
      <span className="absolute text-sm font-black text-white" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -40%)' }}>
        {clampedPercent.toFixed(0)}%
      </span>
    </div>
  );
}

/* ── Dual metric card (Đã ký + Kỳ vọng) ── */
function DualRevenueCard({
  icon: Icon,
  signedLabel,
  signedValue,
  signedPerc,
  signedColor,
  expectedLabel,
  expectedValue,
  expectedPerc,
  expectedColor,
  formatCurrency,
}: any) {
  return (
    <div className="relative rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.08] p-5 flex flex-col justify-between gap-4 overflow-hidden group hover:bg-white/[0.10] transition-colors duration-300">
      {/* Decorative glow */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-3xl group-hover:opacity-30 transition-opacity duration-500"
        style={{ background: signedColor }}
      />

      {/* Signed row */}
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2.5 rounded-xl" style={{ background: `${signedColor}22` }}>
            <Icon className="size-5" style={{ color: signedColor }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-100/90">
            {signedLabel}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-black text-white leading-none">
              {formatCurrency(signedValue)}
            </p>
            <p className="text-xs text-blue-100/80 font-medium mt-1">Triệu đồng</p>
          </div>
          <LabeledRing percent={signedPerc} color={signedColor} label="Đã ký" />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Expected row */}
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2.5 rounded-xl" style={{ background: `${expectedColor}22` }}>
            <Icon className="size-5" style={{ color: expectedColor }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-100/90">
            {expectedLabel}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-black text-white leading-none">
              {formatCurrency(expectedValue)}
            </p>
            <p className="text-xs text-blue-100/80 font-medium mt-1">Triệu đồng</p>
          </div>
          <LabeledRing percent={expectedPerc} color={expectedColor} label="Kỳ vọng" />
        </div>
      </div>
    </div>
  );
}

export function BoardOverview({ data }: BoardOverviewProps) {
  if (!data || data.error) {
    return (
      <div className="p-8 text-center text-red-400 bg-red-950/30 rounded-2xl border border-red-500/20">
        <AlertTriangle className="size-10 mx-auto mb-2" />
        <p className="font-bold">
          {data?.error || "Không có dữ liệu cho Dashboard"}
        </p>
      </div>
    );
  }

  const { revenueMetrics, projectMetrics } = data;

  const formatCurrency = (val: number) => {
    return Math.round(val).toLocaleString("vi-VN");
  };

  // Status color mapping
  const statusColors: Record<string, string> = {
    MOI: "#8b5cf6",
    DANG_LAM_VIEC: "#3b82f6",
    DA_DEMO: "#06b6d4",
    DA_GUI_BAO_GIA: "#f59e0b",
    DA_KY_HOP_DONG: "#10b981",
    THAT_BAI: "#ef4444",
  };

  const statusLabels: Record<string, string> = {
    MOI: "Mới",
    DANG_LAM_VIEC: "Đang làm việc",
    DA_DEMO: "Đã demo",
    DA_GUI_BAO_GIA: "Đã gửi báo giá",
    DA_KY_HOP_DONG: "Đã ký HĐ",
    THAT_BAI: "Thất bại",
  };

  return (
    <div className="relative p-6 lg:p-8 rounded-3xl overflow-hidden">
      {/* ── Background gradient — #003b8b dominant ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#002d6b] via-[#003b8b] to-[#002d6b]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,83,207,0.15)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,45,107,0.40)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(0,59,139,0.20)_0%,transparent_40%)]" />

      {/* Content */}
      <div className="relative z-10 space-y-6">
        {/* ── ROW 1: Revenue metrics (4 cols) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ô 1: DT Tổng Dự Án + Tổng Số Dự Án */}
          <div className="relative rounded-2xl bg-gradient-to-br from-[#1e3a5f]/80 to-[#0f2847]/80 backdrop-blur-xl border border-white/[0.08] p-5 overflow-hidden group hover:border-cyan-500/20 transition-all duration-300">
            {/* Decorative orb */}
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-cyan-500/10 blur-2xl group-hover:bg-cyan-500/20 transition-all duration-500" />

            <div className="relative z-10 flex flex-col h-full justify-between gap-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                  <Briefcase className="size-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-100/80">
                    Doanh thu tổng
                  </p>
                  <p className="text-[11px] text-cyan-300 font-medium">
                    Tất cả dự án
                  </p>
                </div>
              </div>

              <div>
                <p className="text-4xl font-black text-white leading-none tracking-tight">
                  {formatCurrency(revenueMetrics.dtTongDuAn)}
                </p>
                <p className="text-xs text-blue-100/80 font-medium mt-1">
                  Triệu đồng
                </p>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-blue-500/10">
                    <Layers className="size-5 text-blue-400" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-100/90">
                    Tổng số dự án
                  </span>
                </div>
                <p className="text-3xl font-black text-white">
                  {projectMetrics.tongSoDuAn}
                </p>
              </div>
            </div>
          </div>

          {/* Ô 2: DT Tháng */}
          <DualRevenueCard
            icon={CalendarDays}
            signedLabel="DT Tháng Đã Ký"
            signedValue={revenueMetrics.dtThangDaKyValue}
            signedPerc={revenueMetrics.dtThangDaKyPerc}
            signedColor="#10b981"
            expectedLabel="DT Dự Kiến Tháng"
            expectedValue={revenueMetrics.dtDuKienThangValue}
            expectedPerc={revenueMetrics.dtDuKienThangPerc}
            expectedColor="#38bdf8"
            formatCurrency={formatCurrency}
          />

          {/* Ô 3: DT Quý */}
          <DualRevenueCard
            icon={CalendarRange}
            signedLabel="DT Quý Đã Ký"
            signedValue={revenueMetrics.dtTheoQuyValue}
            signedPerc={revenueMetrics.dtTheoQuyPerc}
            signedColor="#f59e0b"
            expectedLabel="DT Dự Kiến Quý"
            expectedValue={revenueMetrics.dtDuKienQuyValue}
            expectedPerc={revenueMetrics.dtDuKienQuyPerc}
            expectedColor="#a78bfa"
            formatCurrency={formatCurrency}
          />

          {/* Ô 4: DT Năm */}
          <DualRevenueCard
            icon={CalendarCheck}
            signedLabel="DT Năm Đã Ký"
            signedValue={revenueMetrics.dtTheoNamValue}
            signedPerc={revenueMetrics.dtTheoNamPerc}
            signedColor="#c084fc"
            expectedLabel="DT Dự Kiến Năm"
            expectedValue={revenueMetrics.dtDuKienNamValue}
            expectedPerc={revenueMetrics.dtDuKienNamPerc}
            expectedColor="#fb7185"
            formatCurrency={formatCurrency}
          />
        </div>

        {/* ── ROW 2: Project metrics (4 cols) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ô 5: Dự Án Trọng Điểm & Kỳ Vọng */}
          <div className="relative rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.08] p-5 overflow-hidden group hover:bg-white/[0.10] transition-colors duration-300">
            <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-amber-500/10 blur-2xl" />

            <div className="relative z-10 flex flex-col h-full gap-5">
              {/* Trọng điểm */}
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
                    <Award className="size-5 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-100/90">
                    Dự án trọng điểm
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-black text-white leading-none">
                    {projectMetrics.duAnTrongDiem}
                  </p>
                  <span className="text-sm text-amber-300 font-bold mb-0.5">
                    dự án
                  </span>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Kỳ vọng */}
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10">
                    <Star className="size-5 text-blue-400" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-100/90">
                    Dự án kỳ vọng
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-black text-white leading-none">
                    {projectMetrics.duAnKyVong}
                  </p>
                  <span className="text-sm text-blue-300 font-bold mb-0.5">
                    dự án
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ô 6: Hiện Trạng Tháng */}
          <div className="relative rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.08] p-5 overflow-hidden">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                <BarChart3 className="size-5 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-100/90">
                Hiện Trạng Tháng
              </span>
            </div>

            <div className="space-y-3">
              {projectMetrics.hienTrangThang.map((s: any, i: number) => {
                const color = statusColors[s.label] || "#64748b";
                const label = statusLabels[s.label] || s.label;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 group/item"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-[13px] font-medium text-blue-100 flex-1 truncate group-hover/item:text-white transition-colors">
                      {label}
                    </span>
                    <span
                      className="text-base font-black tabular-nums"
                      style={{ color }}
                    >
                      {s.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ô 7: Theo Bước Quy Trình */}
          <div className="relative rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.08] p-5 overflow-hidden">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/20">
                <ListChecks className="size-5 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-100/90">
                Theo Bước Quy Trình
              </span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
              {projectMetrics.thongKeTheoBuoc.map((b: any, i: number) => {
                const stepColors = [
                  "#06b6d4",
                  "#3b82f6",
                  "#8b5cf6",
                  "#a855f7",
                  "#ec4899",
                  "#f43f5e",
                  "#10b981",
                ];
                const color = stepColors[i % stepColors.length];
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors group/step"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
                      style={{ background: `${color}33` }}
                    >
                      <span style={{ color }}>{i + 1}</span>
                    </div>
                    <span className="text-[12px] font-medium text-blue-100 flex-1 truncate group-hover/step:text-white transition-colors">
                      {b.label}
                    </span>
                    <span
                      className="text-base font-black tabular-nums"
                      style={{ color }}
                    >
                      {b.count}
                    </span>
                  </div>
                );
              })}
              {projectMetrics.thongKeTheoBuoc.length === 0 && (
                <p className="text-xs text-blue-100/70 italic">
                  Chưa có dữ liệu bước
                </p>
              )}
            </div>
          </div>

          {/* Ô 8: Cảnh Báo (>10 ngày) */}
          <div className="relative rounded-2xl bg-gradient-to-br from-red-950/40 to-rose-950/30 backdrop-blur-xl border border-red-500/20 p-5 overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-red-500/10 blur-2xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/20">
                  <AlertTriangle className="size-5 text-white animate-pulse" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-400/80">
                  Cảnh báo (&gt;10 ngày)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {projectMetrics.canhBaoTheoTo.map((t: any, i: number) => (
                  <div
                    key={i}
                    className="flex flex-col items-center p-3.5 rounded-xl bg-white/[0.05] border border-red-500/10 hover:border-red-500/20 transition-colors"
                  >
                    <span className="text-[10px] font-bold text-blue-100/80 uppercase tracking-wide">
                      {t.label}
                    </span>
                    <span className="text-2xl font-black text-red-400 leading-none mt-2">
                      {t.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
