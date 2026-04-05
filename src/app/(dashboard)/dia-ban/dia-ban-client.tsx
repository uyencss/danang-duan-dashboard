"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
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

export function DiaBanDashboardClient({ diaBanData, topStaffData, kpiTotal }: { diaBanData: DiaBanData[], topStaffData: TopStaff[], kpiTotal: number }) {
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

    // Globals for percentage calculations
    const globalSigned = diaBanData.reduce((acc, d) => acc + d.signedRevenue, 0);
    const globalOther = diaBanData.reduce((acc, d) => acc + d.otherRevenue, 0);

    // Prepare pie chart datasets
    let pieSignedData: any[] = [];
    let pieOtherData: any[] = [];
    let pieKpiData: any[] = [];

    if (selectedDiaBan === "all") {
        pieSignedData = diaBanData.map(d => ({ name: d.name, value: d.signedRevenue })).filter(d => d.value > 0);
        pieOtherData = diaBanData.map(d => ({ name: d.name, value: d.otherRevenue })).filter(d => d.value > 0);
        pieKpiData = [
            { name: "Đã Ký (Tổng)", value: globalSigned },
            { name: "KPI Chưa Hoàn Thành", value: Math.max(0, kpiTotal - globalSigned) }
        ];
    } else {
        const sel = filteredDiaBanData[0];
        if (sel) {
            pieSignedData = [
                { name: sel.name, value: sel.signedRevenue },
                { name: "Các tổ khác", value: Math.max(0, globalSigned - sel.signedRevenue) }
            ];
            pieOtherData = [
                { name: sel.name, value: sel.otherRevenue },
                { name: "Các tổ khác", value: Math.max(0, globalOther - sel.otherRevenue) }
            ];
            pieKpiData = [
                { name: `Đã Ký (${sel.name})`, value: sel.signedRevenue },
                { name: "KPI Tương ứng còn lại", value: Math.max(0, kpiTotal - sel.signedRevenue) }
            ];
        }
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,88,188,0.2)] border border-blue-50">
                    <p className="font-black text-[#0D1F3C] text-sm uppercase mb-1">{data.name}</p>
                    <p className="text-blue-600 font-bold text-lg">{data.value.toLocaleString()} Tr.đ</p>
                </div>
            );
        }
        return null;
    };

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
                                    <SelectValue placeholder="Toàn thời gian">
                                        {selectedTimePeriod === "all" ? "Toàn thời gian" : 
                                         selectedTimePeriod.startsWith("quarter-") ? `Quý ${selectedTimePeriod.split("-")[1]} / 2026` :
                                         selectedTimePeriod.startsWith("month-") ? `Tháng ${selectedTimePeriod.split("-")[1]} / 2026` :
                                         selectedTimePeriod}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
                                    <SelectItem value="all" className="font-bold">Toàn thời gian</SelectItem>
                                    <SelectItem value="quarter-1" className="font-bold">Quý 1 / 2026</SelectItem>
                                    <SelectItem value="quarter-2" className="font-bold">Quý 2 / 2026</SelectItem>
                                    <SelectItem value="quarter-3" className="font-bold">Quý 3 / 2026</SelectItem>
                                    <SelectItem value="quarter-4" className="font-bold">Quý 4 / 2026</SelectItem>
                                    <SelectItem value="month-1" className="font-bold">Tháng 1 / 2026</SelectItem>
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
                    { label: "DT Đã Ký", value: `${totalSignedRevenue.toLocaleString()} Tr.đ`, icon: CheckCircle, color: "bg-gradient-to-br from-blue-400 to-[#0058bc]" },
                    { label: "DT Trạng Thái Khác", value: `${totalOtherRevenue.toLocaleString()} Tr.đ`, icon: DollarSign, color: "bg-gradient-to-br from-orange-400 to-red-500" },
                    { label: "Tổng Hợp Đồng", value: totalContracts, icon: Briefcase, color: "bg-gradient-to-br from-emerald-400 to-[#00d084]" },
                    { label: "Dự Án Khác", value: totalProjects - totalContracts, icon: Target, color: "bg-gradient-to-br from-amber-300 to-orange-500" },
                    { label: "Tỉ lệ Thành Công", value: `${avgConversion.toFixed(1)}%`, icon: TrendingUp, color: "bg-gradient-to-br from-purple-400 to-indigo-600" },
                ].map((kpi, i) => (
                    <Card key={i} className="border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,88,188,0.1)] transition-all rounded-[24px] overflow-hidden bg-white/80 backdrop-blur-xl group">
                        <CardContent className="p-5 lg:p-6 flex flex-col gap-5">
                            <div className="flex items-start">
                                <div className={cn("p-3.5 rounded-[18px] text-white shadow-xl shadow-blue-900/10 ring-1 ring-white/50 group-hover:scale-110 transition-transform duration-300", kpi.color)}>
                                    <kpi.icon className="size-6 drop-shadow-md" strokeWidth={2.5} />
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 h-8 line-clamp-2 leading-tight flex items-end">{kpi.label}</p>
                                <h3 className="text-2xl lg:text-[26px] font-[900] text-[#0D1F3C] tracking-tight break-words pb-1">{kpi.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Phân Bổ Doanh Thu - 3 Pie Charts */}
                <Card className="xl:col-span-2 border-none shadow-2xl shadow-blue-900/5 rounded-[32px] bg-white overflow-hidden flex flex-col ring-1 ring-blue-100/50">
                    <CardHeader className="pb-2 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-blue-50/50">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-xl font-black text-[#0D1F3C]">Phân Bổ Tỉ Trọng & KPI</CardTitle>
                                <CardDescription className="font-medium text-slate-500">
                                    {selectedDiaBan === "all" ? "Tỉ trọng đóng góp của các tổ" : `Đóng góp của ${selectedDiaBan} so với toàn hệ thống`}
                                </CardDescription>
                            </div>
                            <Badge className="bg-gradient-to-r from-[#0058bc] to-blue-500 text-white border-none font-black px-3 py-1 shadow-lg">LIVE DATA</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                            {/* Chart 1: Doanh Thu Đã Ký */}
                            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#f7f9fb] shadow-inner border border-white">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4 whitespace-normal text-center">Tỉ trọng DT Đã Ký</h4>
                                <div className="h-[220px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieSignedData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={2}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {pieSignedData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={selectedDiaBan !== "all" && index === 1 ? '#e2e8f0' : COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Chart 2: Doanh Thu Khác */}
                            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#f7f9fb] shadow-inner border border-white">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4 whitespace-normal text-center">Tỉ trọng DT Trạng Thái Khác</h4>
                                <div className="h-[220px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieOtherData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={2}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {pieOtherData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={selectedDiaBan !== "all" && index === 1 ? '#e2e8f0' : COLORS[(index + 2) % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Chart 3: KPI Hoàn Thành */}
                            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-blue-50/50 to-[#f7f9fb] shadow-inner border border-blue-100/50">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-[#0058bc] mb-4 whitespace-normal text-center">Hoàn Thành KPI Tương Ứng</h4>
                                <div className="h-[220px] w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieKpiData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={85}
                                                paddingAngle={2}
                                                dataKey="value"
                                                stroke="none"
                                                startAngle={90}
                                                endAngle={-270}
                                            >
                                                {pieKpiData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#00d084' : '#e2e8f0'} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-2xl font-black text-[#00d084]">
                                            {kpiTotal > 0 ? ((pieKpiData[0]?.value || 0) / kpiTotal * 100).toFixed(1) : 0}%
                                        </span>
                                        <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Tiến độ</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Chart */}
                <Card className="xl:col-span-1 border-none shadow-sm rounded-[32px] bg-white overflow-hidden flex flex-col">
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

        </div>
    );
}

