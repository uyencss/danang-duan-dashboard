"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Target } from "lucide-react";

interface CVStat {
    id: string;
    name: string;
    team: string;
    monthlyRev: number;
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

export function CVManagementTable({ data }: { data: CVStat[] }) {
    const formatCurrency = (val: number) => {
        return val.toLocaleString('vi-VN') + " Tr.đ";
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return "bg-amber-100 text-amber-600 border-amber-200 ring-4 ring-amber-50";
        if (rank === 2) return "bg-slate-100 text-slate-600 border-slate-200 ring-4 ring-slate-50";
        if (rank === 3) return "bg-orange-100 text-orange-600 border-orange-200 ring-4 ring-orange-50";
        return "bg-slate-50 text-slate-400 border-slate-100";
    };

    return (
        <Card className="border-none shadow-2xl shadow-slate-200/50 overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl">
            <div className="overflow-x-auto">
                <Table className="min-w-[1700px]">
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-b border-slate-100">
                             <TableHead className="w-16 text-center font-black text-slate-400 uppercase tracking-widest text-[10px]">#</TableHead>
                             <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Chuyên viên</TableHead>
                             <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Tổ / Địa bàn</TableHead>
                             <TableHead className="font-black text-indigo-600 uppercase tracking-widest text-[10px] text-center">Tỷ lệ Chuyển đổi</TableHead>
                             
                             {/* Monthly Header Group */}
                             <TableHead className="bg-blue-50/30 font-black text-blue-600 uppercase tracking-widest text-[10px] border-l border-white">Doanh thu Tháng</TableHead>
                             <TableHead className="bg-blue-50/30 text-center font-black text-blue-600 uppercase tracking-widest text-[10px]">HĐ Tháng</TableHead>
                             <TableHead className="bg-blue-50/30 text-center font-black text-blue-600 uppercase tracking-widest text-[10px]">Tiếp cận (M)</TableHead>
                             <TableHead className="bg-blue-50/30 text-center font-black text-blue-600 uppercase tracking-widest text-[10px] border-r border-white">Hạng Tháng</TableHead>

                             {/* Quarterly Header Group */}
                             <TableHead className="bg-purple-50/30 font-black text-purple-600 uppercase tracking-widest text-[10px]">Doanh thu Quý</TableHead>
                             <TableHead className="bg-purple-50/30 text-center font-black text-purple-600 uppercase tracking-widest text-[10px]">HĐ Quý</TableHead>
                             <TableHead className="bg-purple-50/30 text-center font-black text-purple-600 uppercase tracking-widest text-[10px] border-r border-white">Hạng Quý</TableHead>

                             {/* Yearly Header Group */}
                             <TableHead className="bg-amber-50/30 font-black text-amber-600 uppercase tracking-widest text-[10px]">Doanh thu Năm</TableHead>
                             <TableHead className="bg-amber-50/30 text-center font-black text-amber-600 uppercase tracking-widest text-[10px]">HĐ Năm</TableHead>
                             <TableHead className="bg-amber-50/30 text-center font-black text-amber-600 uppercase tracking-widest text-[10px]">Hạng Năm</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((cv, idx) => (
                            <TableRow key={cv.id} className="group hover:bg-slate-50/80 transition-all border-b border-slate-50">
                                <TableCell className="text-center font-bold text-slate-300 group-hover:text-slate-500 transition-colors">
                                    {idx + 1}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center font-black text-indigo-500 text-xs shadow-inner">
                                            {cv.name.charAt(0)}
                                        </div>
                                        <span className="font-bold text-slate-700">{cv.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                                        <MapPin className="size-3 text-[#cbd5e1]" />
                                        {cv.team}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <div className="flex items-center gap-1.5">
                                            <Target className="size-3 text-indigo-400" />
                                            <span className="text-sm font-black text-indigo-600">{cv.conversionRate.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-indigo-500 transition-all duration-1000" 
                                                style={{ width: `${Math.min(cv.conversionRate, 100)}%` }} 
                                            />
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Monthly Stats */}
                                <TableCell className="bg-blue-50/10 border-l border-blue-100/20">
                                    <span className="font-black text-blue-600">
                                        {formatCurrency(cv.monthlyRev)}
                                    </span>
                                </TableCell>
                                <TableCell className="bg-blue-50/10 text-center font-bold text-slate-600">
                                    {cv.monthlyContracts}
                                </TableCell>
                                <TableCell className="bg-blue-50/10 text-center">
                                    <Badge variant="outline" className="bg-white border-blue-100/50 text-blue-600 font-bold px-2 py-0 rounded-md">
                                        {cv.monthlyOutreach}
                                    </Badge>
                                </TableCell>
                                <TableCell className="bg-blue-50/10 text-center border-r border-blue-100/20">
                                    <div className="flex justify-center">
                                        <div className={`${getRankBadge(cv.rankMonth)} h-8 w-8 rounded-xl flex items-center justify-center font-black shadow-sm transition-transform group-hover:scale-110`}>
                                            {cv.rankMonth}
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Quarterly Stats */}
                                <TableCell className="bg-purple-50/10">
                                    <span className="font-black text-purple-600">
                                        {formatCurrency(cv.quarterlyRev)}
                                    </span>
                                </TableCell>
                                <TableCell className="bg-purple-50/10 text-center font-bold text-slate-600">
                                    {cv.quarterlyContracts}
                                </TableCell>
                                <TableCell className="bg-purple-50/10 text-center border-r border-purple-100/20">
                                    <div className="flex justify-center">
                                        <div className={`${getRankBadge(cv.rankQuarter)} h-8 w-8 rounded-xl flex items-center justify-center font-black shadow-sm transition-transform group-hover:scale-110`}>
                                            {cv.rankQuarter}
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Yearly Stats */}
                                <TableCell className="bg-amber-50/10">
                                    <span className="font-black text-amber-600">
                                        {formatCurrency(cv.yearlyRev)}
                                    </span>
                                </TableCell>
                                <TableCell className="bg-amber-50/10 text-center font-bold text-slate-600">
                                    {cv.yearlyContracts}
                                </TableCell>
                                <TableCell className="bg-amber-50/10 text-center">
                                    <div className="flex justify-center">
                                        <div className={`${getRankBadge(cv.rankYear)} h-8 w-8 rounded-xl flex items-center justify-center font-black shadow-sm transition-transform group-hover:scale-110`}>
                                            {cv.rankYear}
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
