"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Treemap } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Map, Trophy, Users, CheckCircle, Flame, Building2, TrendingUp, Target, DollarSign, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiaBanData {
    name: string;
    revenue: number;
    signedRevenue: number;
    otherRevenue: number;
    projects: number;
    contracts: number;
    staffCount: number;
}

interface TopStaff {
    id: string;
    name: string;
    diaBan: string;
    revenue: number;
    signedRevenue: number;
    otherRevenue: number;
    contracts: number;
    totalProjects: number;
    conversionRate: number;
}

const COLORS = [
    '#0058bc', // MobiFone Blue
    '#00c2ff', // Sky Blue
    '#00d084', // Green
    '#ff9f00', // Amber
    '#ff4d4d', // Red
    '#7b61ff', // Purple
    '#ff6b00', // Orange
    '#002147', // Navy
];

const TreemapContent = (props: any) => {
    const { root, depth, x, y, width, height, index, colors, name } = props;
    if (depth !== 1) return null;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={8}
                ry={8}
                style={{
                    fill: colors[index % colors.length],
                    stroke: '#fff',
                    strokeWidth: 2,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                }}
                className="hover:opacity-80"
            />
            {width > 60 && height > 30 ? (
                <>
                    <text 
                        x={x + 10} 
                        y={y + 25} 
                        fill="#fff" 
                        fontSize={13} 
                        fontWeight="900"
                        className="pointer-events-none uppercase tracking-wider"
                    >
                        {name}
                    </text>
                    <text 
                        x={x + 10} 
                        y={y + 45} 
                        fill="rgba(255,255,255,0.8)" 
                        fontSize={11} 
                        fontWeight="bold"
                        className="pointer-events-none"
                    >
                        {props.revenue?.toLocaleString()} Tr.đ
                    </text>
                </>
            ) : null}
        </g>
    );
};

export function DiaBanDashboardClient({ diaBanData, topStaffData }: { diaBanData: DiaBanData[], topStaffData: TopStaff[] }) {
    const [selectedDiaBan, setSelectedDiaBan] = useState<string>("all");
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [selectedTimePeriod, setSelectedTimePeriod] = useState(() => {
        const type = searchParams.get("type") || "all";
        const val = searchParams.get("value") || "all";
        return type === 'all' ? 'all' : `${type}-${val}`;
    });

    useEffect(() => {
        const type = searchParams.get("type") || "all";
        const val = searchParams.get("value") || "all";
        setSelectedTimePeriod(type === 'all' ? 'all' : `${type}-${val}`);
    }, [searchParams]);

    const handleFilterChange = (value: string | null) => {
        if (!value) return;
        const params = new URLSearchParams(searchParams);
        
        if (value === "all") {
            params.delete("type");
            params.delete("year");
            params.delete("value");
        } else {
            const [type, val] = value.split("-");
            params.set("type", type);
            params.set("year", "2026"); 
            params.set("value", val);
        }
        
        router.push(`/dia-ban?${params.toString()}`);
    };

    const filteredStaff = selectedDiaBan === "all" 
        ? topStaffData 
        : topStaffData.filter(s => s.diaBan === selectedDiaBan);

    const filteredDiaBanData = selectedDiaBan === "all"
        ? diaBanData
        : diaBanData.filter(d => d.name === selectedDiaBan);

    const totalRevenue = filteredDiaBanData.reduce((acc, d) => acc + d.revenue, 0);
    const totalSignedRevenue = filteredDiaBanData.reduce((acc, d) => acc + d.signedRevenue, 0);
    const totalOtherRevenue = filteredDiaBanData.reduce((acc, d) => acc + d.otherRevenue, 0);
    const totalProjects = filteredDiaBanData.reduce((acc, d) => acc + d.projects, 0);
    const totalContracts = filteredDiaBanData.reduce((acc, d) => acc + d.contracts, 0);
    const avgConversion = (totalProjects > 0) ? (totalContracts / totalProjects * 100) : 0;

    const treeData = [
        {
            name: 'Địa bàn',
            children: filteredDiaBanData.map(d => ({ size: d.revenue, ...d }))
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-4xl font-[900] text-[#0D1F3C] tracking-tight flex items-center gap-3">
                        <Map className="size-10 text-[#0058bc]" />
                        Khu vực & Địa bàn
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">Báo cáo phân tích hiệu suất kinh doanh theo đơn vị địa lý</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 min-w-[240px]">
                    <div className="flex flex-col gap-2 w-full sm:w-[200px]">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian</span>
                        <div className="bg-[#f7f9fb] p-1.5 rounded-2xl border border-gray-200/50 shadow-inner">
                            <Select onValueChange={handleFilterChange} value={selectedTimePeriod}>
                                <SelectTrigger className="w-full border-none bg-transparent shadow-none font-black text-[#0D1F3C] focus:ring-0 truncate">
                                    <SelectValue placeholder="Toàn thời gian" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
                                    <SelectItem value="all" className="font-bold">Toàn thời gian</SelectItem>
                                    <SelectItem value="quy-1" className="font-bold">Quý 1 / 2026</SelectItem>
                                    <SelectItem value="quy-2" className="font-bold">Quý 2 / 2026</SelectItem>
                                    <SelectItem value="quy-3" className="font-bold">Quý 3 / 2026</SelectItem>
                                    <SelectItem value="quy-4" className="font-bold">Quý 4 / 2026</SelectItem>
                                    <SelectItem value="thang-1" className="font-bold">Tháng 1 / 2026</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full sm:w-[200px]">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Bộ lọc địa bàn</span>
                        <div className="bg-[#f7f9fb] p-1.5 rounded-2xl border border-gray-200/50 shadow-inner">
                            <Select onValueChange={(val) => val && setSelectedDiaBan(val)} defaultValue="all">
                                <SelectTrigger className="w-full border-none bg-transparent shadow-none font-black text-[#0D1F3C] focus:ring-0 truncate">
                                    <SelectValue placeholder="Tất cả khu vực" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
                                    <SelectItem value="all" className="font-bold">🌍 Toàn bộ địa bàn</SelectItem>
                                    {[
                                        "Tổ nghiệp vụ",
                                        "Tổ dự án",
                                        "Tổ kỹ thuật",
                                        "Tổ 1",
                                        "Tổ 2",
                                        "Tổ 3",
                                        "Lãnh đạo",
                                        "Chưa phân công"
                                    ].map(name => (
                                        <SelectItem key={name} value={name} className="font-bold">📍 {name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                    { label: "DT Đã Ký", value: `${totalSignedRevenue.toLocaleString()} Tr.đ`, icon: CheckCircle, color: "bg-blue-500", text: "text-blue-600" },
                    { label: "DT Trạng Thái Khác", value: `${totalOtherRevenue.toLocaleString()} Tr.đ`, icon: DollarSign, color: "bg-orange-500", text: "text-orange-600" },
                    { label: "Tổng Hợp Đồng", value: totalContracts, icon: Briefcase, color: "bg-emerald-500", text: "text-emerald-600" },
                    { label: "Dự Án Khác", value: totalProjects - totalContracts, icon: Target, color: "bg-amber-500", text: "text-amber-600" },
                    { label: "Tỉ lệ Thành Công", value: `${avgConversion.toFixed(1)}%`, icon: TrendingUp, color: "bg-purple-500", text: "text-purple-600" },
                ].map((kpi, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-3xl overflow-hidden bg-white">
                        <CardContent className="p-4 lg:p-6">
                            <div className="flex items-center gap-4">
                                <div className={cn("p-3 rounded-2xl text-white shadow-lg", kpi.color)}>
                                    <kpi.icon className="size-6" />
                                </div>
                                <div className="overflow-visible break-words w-full">
                                    <p className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-wider break-words whitespace-normal leading-tight">{kpi.label}</p>
                                    <h3 className="text-lg lg:text-xl font-black text-[#0D1F3C] mt-1 break-words whitespace-normal">{kpi.value}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Treemap */}
                <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden flex flex-col">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-xl font-black text-[#0D1F3C]">Phân Bổ Doanh Thu</CardTitle>
                                <CardDescription className="font-medium">Tỉ trọng dự kiến theo Treemap</CardDescription>
                            </div>
                            <Badge className="bg-blue-50 text-blue-700 border-blue-100 font-black">LIVE DATA</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 pb-8">
                        <div className="h-[350px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <Treemap
                                    data={treeData}
                                    dataKey="size"
                                    stroke="#fff"
                                    content={<TreemapContent colors={COLORS} />}
                                >
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.15)', padding: '12px 16px' }}
                                        itemStyle={{ fontWeight: '900', color: '#0D1F3C' }}
                                        formatter={(value: any, name: any, props: any) => {
                                            return [`${Number(value).toLocaleString()} Tr.đ`, props.payload.name];
                                        }}
                                    />
                                </Treemap>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Chart */}
                <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden flex flex-col">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-xl font-black text-[#0D1F3C]">Xếp Hạng Khu Vực</CardTitle>
                                <CardDescription className="font-medium">So sánh doanh thu thực tế</CardDescription>
                            </div>
                            <div className="flex -space-x-2">
                                {filteredDiaBanData.slice(0, 3).map((d, i) => (
                                    <div key={i} className={cn("size-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white", COLORS[i % COLORS.length])}>
                                        {d.name.charAt(0)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 pb-8">
                        <div className="h-[350px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={[...filteredDiaBanData].sort((a,b) => b.revenue - a.revenue)} margin={{ top: 0, right: 40, left: 20, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 12, fontWeight: '900', fill: '#0D1F3C' }} 
                                        width={90} 
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(0,88,188,0.04)', radius: 8 }}
                                        contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.15)' }}
                                    />
                                    <Bar dataKey="signedRevenue" name="DT Đã Ký" stackId="a" fill="#0058bc" radius={[0, 0, 0, 0]} barSize={24} />
                                    <Bar dataKey="otherRevenue" name="DT Khác" stackId="a" fill="#ffb700" radius={[0, 12, 12, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Leaderboard Table */}
            <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden">
                <div className="p-8 pb-4 flex justify-between items-center border-b border-gray-50 mb-2">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 rounded-2xl">
                            <Trophy className="size-6 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#0D1F3C]">Bảng Vàng Cá Nhân</h2>
                            <p className="text-slate-500 font-medium text-sm">Vinh danh các AM & Chuyên viên xuất sắc theo địa bàn</p>
                        </div>
                    </div>
                </div>
                <div className="px-4 pb-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="w-20 font-black text-[#0D1F3C] text-xs uppercase tracking-widest text-center">Rank</TableHead>
                                <TableHead className="font-black text-[#0D1F3C] text-xs uppercase tracking-widest">Nhân sự / District</TableHead>
                                <TableHead className="text-right font-black text-[#0D1F3C] text-xs uppercase tracking-widest">DT Đã Ký</TableHead>
                                <TableHead className="text-right font-black text-[#0D1F3C] text-xs uppercase tracking-widest">DT Khác</TableHead>
                                <TableHead className="text-center font-black text-[#0D1F3C] text-xs uppercase tracking-widest">Hợp đồng</TableHead>
                                <TableHead className="text-right font-black text-[#0D1F3C] text-xs uppercase tracking-widest">Hiệu suất</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStaff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-slate-400 italic">Chưa ghi nhận dữ liệu tại địa bàn này</TableCell>
                                </TableRow>
                            ) : filteredStaff.slice(0, 10).map((staff, index) => (
                                <TableRow key={staff.id} className="group border-gray-50/50 hover:bg-slate-50/80 transition-all rounded-2xl">
                                    <TableCell className="text-center">
                                        <div className={cn(
                                            "inline-flex size-10 items-center justify-center rounded-xl font-black text-sm shadow-sm",
                                            index === 0 ? "bg-amber-400 text-white shadow-amber-200" :
                                            index === 1 ? "bg-slate-300 text-white shadow-slate-100" :
                                            index === 2 ? "bg-orange-300 text-white shadow-orange-100" :
                                            "bg-[#f7f9fb] text-slate-400"
                                        )}>
                                            {index + 1}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-white group-hover:text-[#0058bc] shadow-inner transition-colors">
                                                {staff.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-[#0D1F3C] group-hover:text-[#0058bc] transition-colors">{staff.name}</span>
                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{staff.diaBan}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-lg font-[900] text-[#0D1F3C]">
                                            {staff.signedRevenue.toLocaleString()} 
                                            <span className="ml-1 text-[10px] text-slate-400">Tr.đ</span>
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-sm font-bold text-orange-600">
                                            {staff.otherRevenue.toLocaleString()} 
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="inline-flex items-center gap-2 bg-[#f7f9fb] px-3 py-1 rounded-full group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all">
                                            <Users className="size-3 text-slate-400" />
                                            <span className="font-black text-slate-600 text-xs">{staff.contracts}/{staff.totalProjects}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn("h-full rounded-full transition-all duration-1000", staff.conversionRate > 50 ? "bg-emerald-500" : "bg-orange-500")}
                                                    style={{ width: `${staff.conversionRate}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500">{staff.conversionRate.toFixed(1)}%</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}

