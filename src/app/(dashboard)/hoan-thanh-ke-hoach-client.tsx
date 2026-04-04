"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target } from "lucide-react";

export function HoanThanhKeHoachClient({ projects, kpis }: { projects: any[], kpis: any[] }) {
    const [selectedTimePeriod, setSelectedTimePeriod] = useState("thang-1");

    const getStats = () => {
        const [type, val] = selectedTimePeriod.split("-");
        const valueNum = parseInt(val);

        let targetMonthForMonthly = 1;
        let quarterStartMonth = 1;
        let contextMonth = 1;

        if (type === "thang") {
            targetMonthForMonthly = valueNum;
            contextMonth = valueNum;
        } else if (type === "quy") {
            quarterStartMonth = (valueNum - 1) * 3 + 1;
            contextMonth = valueNum * 3;
            // When filtering by quarter, "Theo tháng" might refer to the last month of the quarter, or just the whole context?
            // The instructions say "cách lấy giá trị doanh thu theo từng quý". We'll compute both overall.
        }

        // --- KPI Processing ---
        let monthlyKpi = 0;
        let quarterlyKpi = 0;

        if (type === "thang") {
            const kpiRow = kpis.find(k => k.thang === valueNum);
            if (kpiRow) monthlyKpi = kpiRow.anNinhMang + kpiRow.giaiPhapCntt + kpiRow.duAnCds + kpiRow.cnsAnNinh;
            
            // Quarterly KPI for the quarter this month belongs to
            const q = Math.ceil(valueNum / 3);
            const qStart = (q - 1) * 3 + 1;
            quarterlyKpi = kpis.filter(k => k.thang >= qStart && k.thang <= qStart + 2)
                               .reduce((acc, k) => acc + k.anNinhMang + k.giaiPhapCntt + k.duAnCds + k.cnsAnNinh, 0);
        } else if (type === "quy") {
            quarterlyKpi = kpis.filter(k => k.thang >= quarterStartMonth && k.thang <= quarterStartMonth + 2)
                               .reduce((acc, k) => acc + k.anNinhMang + k.giaiPhapCntt + k.duAnCds + k.cnsAnNinh, 0);
            
            // Monthly KPI for the last month of the quarter
            const kpiRow = kpis.find(k => k.thang === contextMonth);
            if (kpiRow) monthlyKpi = kpiRow.anNinhMang + kpiRow.giaiPhapCntt + kpiRow.duAnCds + kpiRow.cnsAnNinh;
        }

        // --- Revenue Processing ---
        let monthlyRevenue = 0;
        let quarterlyRevenue = 0;

        projects.forEach(p => {
            if (p.trangThaiHienTai !== "DA_KY_HOP_DONG") return;

            const pThang = p.thang || 1;
            const hasTotal = p.tongDoanhThuDuKien && p.tongDoanhThuDuKien > 0;
            const hasMonthly = p.doanhThuTheoThang && p.doanhThuTheoThang > 0;
            
            // 1. Calculate for the SINGLE month (Theo tháng)
            // If the project started before or during this month
            if (pThang <= (type === 'thang' ? valueNum : contextMonth)) {
                let valToAddForMonth = 0;
                if (hasTotal && hasMonthly) valToAddForMonth = p.doanhThuTheoThang;
                else if (hasMonthly && !hasTotal) valToAddForMonth = p.doanhThuTheoThang;
                else if (hasTotal && !hasMonthly) valToAddForMonth = p.tongDoanhThuDuKien;
                monthlyRevenue += valToAddForMonth;
            }

            // 2. Calculate for the QUARTER (Theo quý)
            // Quarter ends at `contextMonth` (3, 6, 9, 12). Start is `contextMonth - 2`.
            const qStart = type === 'quy' ? quarterStartMonth : Math.ceil(valueNum/3)*3 - 2;
            const qEnd = type === 'quy' ? contextMonth : Math.ceil(valueNum/3)*3;

            if (pThang <= qEnd) {
                // How many months in this specific quarter did the project span?
                const effectiveStart = Math.max(pThang, qStart);
                const monthsInQuarter = qEnd - effectiveStart + 1;

                if (monthsInQuarter > 0) {
                    let valToAddForQ = 0;
                    if (hasTotal && hasMonthly) valToAddForQ = monthsInQuarter * p.doanhThuTheoThang;
                    else if (hasMonthly && !hasTotal) valToAddForQ = monthsInQuarter * p.doanhThuTheoThang;
                    else if (hasTotal && !hasMonthly) valToAddForQ = monthsInQuarter * p.tongDoanhThuDuKien; // "lũy kế doanh thu Tổng dự kiến"
                    
                    quarterlyRevenue += valToAddForQ;
                }
            }
        });

        return {
            monthlyKpi, quarterlyKpi, monthlyRevenue, quarterlyRevenue
        };
    };

    const stats = getStats();
    const monthlyPct = stats.monthlyKpi > 0 ? (stats.monthlyRevenue / stats.monthlyKpi * 100) : 0;
    const quarterlyPct = stats.quarterlyKpi > 0 ? (stats.quarterlyRevenue / stats.quarterlyKpi * 100) : 0;

    return (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white flex flex-col h-full border border-[#c5c6ce]/10">
            <CardHeader className="flex flex-row items-center justify-between py-6 px-8 border-b border-[#eceef0]">
                <div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-[#44474d] flex items-center gap-2">
                        <span className="w-1 h-4 bg-emerald-500 rounded-full inline-block" />
                        Hoàn thành kế hoạch
                        <Target className="size-4 text-emerald-500" />
                    </CardTitle>
                </div>
                <div className="w-[140px]">
                    <Select value={selectedTimePeriod} onValueChange={(val) => val && setSelectedTimePeriod(val)}>
                        <SelectTrigger className="font-bold border-gray-200">
                            <SelectValue placeholder="Chọn kỳ" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100">
                            <SelectItem value="thang-1" className="font-bold">Tháng 1</SelectItem>
                            <SelectItem value="thang-2" className="font-bold">Tháng 2</SelectItem>
                            <SelectItem value="thang-3" className="font-bold">Tháng 3</SelectItem>
                            <SelectItem value="thang-4" className="font-bold">Tháng 4</SelectItem>
                            <SelectItem value="thang-5" className="font-bold">Tháng 5</SelectItem>
                            <SelectItem value="thang-6" className="font-bold">Tháng 6</SelectItem>
                            <SelectItem value="thang-7" className="font-bold">Tháng 7</SelectItem>
                            <SelectItem value="thang-8" className="font-bold">Tháng 8</SelectItem>
                            <SelectItem value="thang-9" className="font-bold">Tháng 9</SelectItem>
                            <SelectItem value="thang-10" className="font-bold">Tháng 10</SelectItem>
                            <SelectItem value="thang-11" className="font-bold">Tháng 11</SelectItem>
                            <SelectItem value="thang-12" className="font-bold">Tháng 12</SelectItem>
                            <SelectItem value="quy-1" className="font-bold">Quý 1</SelectItem>
                            <SelectItem value="quy-2" className="font-bold">Quý 2</SelectItem>
                            <SelectItem value="quy-3" className="font-bold">Quý 3</SelectItem>
                            <SelectItem value="quy-4" className="font-bold">Quý 4</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-8 grid grid-cols-2 gap-8 divide-x divide-gray-100">
                {/* THEO THÁNG */}
                <div className="flex flex-col justify-center pr-4">
                    <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Mục tiêu theo Tháng</h5>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-black text-emerald-600">{monthlyPct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: `${Math.min(100, monthlyPct)}%` }} />
                    </div>
                    <div className="flex flex-col gap-2 bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                            <span className="uppercase">Thực tế</span>
                            <span className="text-sm text-[#0D1F3C] font-black">{stats.monthlyRevenue.toLocaleString()} Tr</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                            <span className="uppercase">Chỉ tiêu (KPI)</span>
                            <span className="text-sm text-[#0D1F3C] font-black">{stats.monthlyKpi.toLocaleString()} Tr</span>
                        </div>
                    </div>
                </div>

                {/* THEO QUÝ */}
                <div className="flex flex-col justify-center pl-8">
                    <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Mục tiêu theo Quý</h5>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-black text-indigo-600">{quarterlyPct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full" style={{ width: `${Math.min(100, quarterlyPct)}%` }} />
                    </div>
                    <div className="flex flex-col gap-2 bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                            <span className="uppercase">Thực tế lũy kế</span>
                            <span className="text-sm text-[#0D1F3C] font-black">{stats.quarterlyRevenue.toLocaleString()} Tr</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                            <span className="uppercase">Chỉ tiêu (KPI)</span>
                            <span className="text-sm text-[#0D1F3C] font-black">{stats.quarterlyKpi.toLocaleString()} Tr</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
