"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Target, Download, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { exportToExcel } from "@/lib/export-excel";

interface AMStat {
    id: string;
    name: string;
    team: string;
    monthlyRev: number;
    expectedRev: number;
    monthlyContracts: number;
    quarterlyRev: number;
    quarterlyContracts: number;
    yearlyRev: number;
    yearlyContracts: number;
    monthlyOutreach: number;
    totalOutreach: number;
    conversionRate: number;
    rankMonth: number;
    rankQuarter: number;
    rankYear: number;
}

type SortConfig = {
    key: keyof AMStat | null;
    direction: 'asc' | 'desc';
};

export function AMManagementTable({ data }: { data: AMStat[] }) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'monthlyRev', direction: 'desc' });

    const formatCurrency = (val: number) => {
        return val.toLocaleString('vi-VN') + " Tr.đ";
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return "bg-amber-100 text-amber-600 border-amber-200 ring-4 ring-amber-50";
        if (rank === 2) return "bg-slate-100 text-slate-600 border-slate-200 ring-4 ring-slate-50";
        if (rank === 3) return "bg-orange-100 text-orange-600 border-orange-200 ring-4 ring-orange-50";
        return "bg-slate-50 text-slate-400 border-slate-100";
    };

    const handleSort = (key: keyof AMStat) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        const sortableItems = [...data];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
                }
                
                const aStr = String(aValue).toLowerCase();
                const bStr = String(bValue).toLowerCase();
                if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    const handleExport = () => {
        const exportData = sortedData.map(am => ({
            "Tên AM": am.name,
            "Đội/Tổ": am.team,
            "Tỷ lệ Chuyển đổi (%)": parseFloat(am.conversionRate.toFixed(1)),
            "Doanh Thu Tháng (VNĐ)": am.monthlyRev,
            "DT Dự kiến (VNĐ)": am.expectedRev,
            "Hợp Đồng Tháng": am.monthlyContracts,
            "Tiếp Cận Tháng": am.monthlyOutreach,
            "Hạng Tháng": am.rankMonth,
            "Doanh Thu Quý (VNĐ)": am.quarterlyRev,
            "Hợp Đồng Quý": am.quarterlyContracts,
            "Hạng Quý": am.rankQuarter,
            "Doanh Thu Năm (VNĐ)": am.yearlyRev,
            "Hợp Đồng Năm": am.yearlyContracts,
            "Tổng Tiếp Cận Năm": am.totalOutreach,
            "Hạng Năm": am.rankYear
        }));
        exportToExcel(exportData, "BaoCao_QuanLy_AM");
    };

    const SortIcon = ({ columnKey }: { columnKey: keyof AMStat }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-1 size-3 opacity-50 group-hover:opacity-100 transition-opacity" />;
        return sortConfig.direction === 'asc' ? <ChevronUp className="ml-1 size-3 text-cyan-300" /> : <ChevronDown className="ml-1 size-3 text-cyan-300" />;
    };

    return (
        <Card className="border-none shadow-2xl shadow-blue-900/5 overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl ring-1 ring-blue-100/50">
            <div className="p-4 border-b border-blue-50 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-transparent">
                <span className="text-sm font-bold text-blue-900/60">Hiển thị {data.length} nhân sự (AM)</span>
                <Button onClick={handleExport} variant="outline" size="sm" className="h-8 gap-2 font-bold text-[#0058bc] border-[#0058bc]/20 bg-white shadow-sm hover:shadow transition-all">
                    <Download className="size-3" /> Xuất Excel
                </Button>
            </div>
            <div className="overflow-x-auto">
                <Table className="min-w-[1900px]">
                    <TableHeader className="bg-gradient-to-r from-[#0058bc]/95 via-blue-600/95 to-cyan-500/95 backdrop-blur-sm">
                        <TableRow className="border-b border-white/10 hover:bg-transparent">
                             <TableHead className="w-16 text-center font-black text-white/70 uppercase tracking-widest text-[10px]">#</TableHead>
                             <TableHead 
                                className="font-black text-white uppercase tracking-widest text-[10px] cursor-pointer group"
                                onClick={() => handleSort('name')}
                             >
                                <div className="flex items-center">AM <SortIcon columnKey="name" /></div>
                             </TableHead>
                             <TableHead className="font-black text-white uppercase tracking-widest text-[10px]">Tổ / Địa bàn</TableHead>
                             <TableHead 
                                className="font-black text-cyan-200 uppercase tracking-widest text-[10px] text-center cursor-pointer group"
                                onClick={() => handleSort('conversionRate')}
                             >
                                <div className="flex items-center justify-center">Tỷ lệ Chuyển đổi <SortIcon columnKey="conversionRate" /></div>
                             </TableHead>
                             
                             {/* Monthly Header Group */}
                             <TableHead 
                                className="bg-white/10 font-black text-white uppercase tracking-widest text-[10px] border-l border-white/10 cursor-pointer group"
                                onClick={() => handleSort('monthlyRev')}
                             >
                                <div className="flex items-center">Doanh thu Tháng <SortIcon columnKey="monthlyRev" /></div>
                             </TableHead>
                             <TableHead 
                                className="bg-white/10 font-black text-yellow-200 uppercase tracking-widest text-[10px] cursor-pointer group"
                                onClick={() => handleSort('expectedRev')}
                             >
                                <div className="flex items-center">DT dự kiến <SortIcon columnKey="expectedRev" /></div>
                             </TableHead>
                             <TableHead 
                                className="bg-white/10 text-center font-black text-white uppercase tracking-widest text-[10px] cursor-pointer group"
                                onClick={() => handleSort('monthlyContracts')}
                             >
                                <div className="flex items-center justify-center">HĐ Tháng <SortIcon columnKey="monthlyContracts" /></div>
                             </TableHead>
                             <TableHead 
                                className="bg-white/10 text-center font-black text-white uppercase tracking-widest text-[10px] cursor-pointer group"
                                onClick={() => handleSort('monthlyOutreach')}
                             >
                                <div className="flex items-center justify-center">Tiếp cận (M) <SortIcon columnKey="monthlyOutreach" /></div>
                             </TableHead>
                             <TableHead className="bg-white/10 text-center font-black text-white uppercase tracking-widest text-[10px] border-r border-white/10">Hạng Tháng</TableHead>

                             {/* Quarterly Header Group */}
                             <TableHead 
                                className="bg-white/5 font-black text-white uppercase tracking-widest text-[10px] cursor-pointer group"
                                onClick={() => handleSort('quarterlyRev')}
                             >
                                <div className="flex items-center">Doanh thu Quý <SortIcon columnKey="quarterlyRev" /></div>
                             </TableHead>
                             <TableHead className="bg-white/5 text-center font-black text-white uppercase tracking-widest text-[10px]">HĐ Quý</TableHead>
                             <TableHead className="bg-white/5 text-center font-black text-white uppercase tracking-widest text-[10px] border-r border-white/10">Hạng Quý</TableHead>

                             {/* Yearly Header Group */}
                             <TableHead 
                                className="bg-white/10 font-black text-white uppercase tracking-widest text-[10px] cursor-pointer group"
                                onClick={() => handleSort('yearlyRev')}
                             >
                                <div className="flex items-center">Doanh thu Năm <SortIcon columnKey="yearlyRev" /></div>
                             </TableHead>
                             <TableHead className="bg-white/10 text-center font-black text-white uppercase tracking-widest text-[10px]">HĐ Năm</TableHead>
                             <TableHead className="bg-white/10 text-center font-black text-white uppercase tracking-widest text-[10px]">Hạng Năm</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedData.map((am, idx) => (
                            <TableRow key={am.id} className="group hover:bg-blue-50/60 transition-all duration-300 border-b border-slate-50 relative">
                                <TableCell className="text-center font-bold text-slate-300 group-hover:text-slate-500 transition-colors">
                                    {idx + 1}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-gradient-to-br from-slate-100 to-[#e2e8f0] flex items-center justify-center font-black text-[#64748b] text-xs shadow-inner">
                                            {am.name.charAt(0)}
                                        </div>
                                        <span className="font-bold text-slate-700">{am.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                                        <MapPin className="size-3 text-[#cbd5e1]" />
                                        {am.team}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <div className="flex items-center gap-1.5">
                                            <Target className="size-3 text-indigo-400" />
                                            <span className="text-sm font-black text-indigo-600">{am.conversionRate.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-indigo-500 transition-all duration-1000" 
                                                style={{ width: `${Math.min(am.conversionRate, 100)}%` }} 
                                            />
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Monthly Stats */}
                                <TableCell className="bg-blue-50/10 border-l border-blue-100/20">
                                    <span className="font-black text-blue-600">
                                        {formatCurrency(am.monthlyRev)}
                                    </span>
                                </TableCell>
                                <TableCell className="bg-yellow-50/30">
                                    <span className="font-black text-amber-700">
                                        {formatCurrency(am.expectedRev)}
                                    </span>
                                </TableCell>
                                <TableCell className="bg-blue-50/10 text-center font-bold text-slate-600">
                                    {am.monthlyContracts}
                                </TableCell>
                                <TableCell className="bg-blue-50/10 text-center">
                                    <Badge variant="outline" className="bg-white border-blue-100/50 text-blue-600 font-bold px-2 py-0 rounded-md">
                                        {am.monthlyOutreach}
                                    </Badge>
                                </TableCell>
                                <TableCell className="bg-blue-50/10 text-center border-r border-blue-100/20">
                                    <div className="flex justify-center">
                                        <div className={`${getRankBadge(am.rankMonth)} h-8 w-8 rounded-xl flex items-center justify-center font-black shadow-sm transition-transform group-hover:scale-110`}>
                                            {am.rankMonth}
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Quarterly Stats */}
                                <TableCell className="bg-purple-50/10">
                                    <span className="font-black text-purple-600">
                                        {formatCurrency(am.quarterlyRev)}
                                    </span>
                                </TableCell>
                                <TableCell className="bg-purple-50/10 text-center font-bold text-slate-600">
                                    {am.quarterlyContracts}
                                </TableCell>
                                <TableCell className="bg-purple-50/10 text-center border-r border-purple-100/20">
                                    <div className="flex justify-center">
                                        <div className={`${getRankBadge(am.rankQuarter)} h-8 w-8 rounded-xl flex items-center justify-center font-black shadow-sm transition-transform group-hover:scale-110`}>
                                            {am.rankQuarter}
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Yearly Stats */}
                                <TableCell className="bg-amber-50/10">
                                    <span className="font-black text-amber-600">
                                        {formatCurrency(am.yearlyRev)}
                                    </span>
                                </TableCell>
                                <TableCell className="bg-amber-50/10 text-center font-bold text-slate-600">
                                    {am.yearlyContracts}
                                </TableCell>
                                <TableCell className="bg-amber-50/10 text-center">
                                    <div className="flex justify-center">
                                        <div className={`${getRankBadge(am.rankYear)} h-8 w-8 rounded-xl flex items-center justify-center font-black shadow-sm transition-transform group-hover:scale-110`}>
                                            {am.rankYear}
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}
