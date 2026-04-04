"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, DollarSign, FileText, Briefcase } from "lucide-react";

interface AnalyticsData {
    id: string;
    name: string;
    diaBan: string;
    revenue: number;
    contracts: number;
    projects: number;
}

export function NhanSuDashboardClient({ initialData }: { initialData: AnalyticsData[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Controlled state for Select
    const [selectedValue, setSelectedValue] = useState(() => {
        const type = searchParams.get("type") || "all";
        const val = searchParams.get("value") || "all";
        return type === 'all' ? 'all' : `${type}-${val}`;
    });

    // Synchronize state with URL changes
    useEffect(() => {
        const type = searchParams.get("type") || "all";
        const val = searchParams.get("value") || "all";
        setSelectedValue(type === 'all' ? 'all' : `${type}-${val}`);
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
            params.set("year", "2026"); // Defaulting to 2026 or reading from a separate year selector
            params.set("value", val);
        }
        
        router.push(`/nhan-su?${params.toString()}`);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Tổng hợp Nhân sự</h1>
                    <p className="text-gray-500 mt-1">So sánh hiệu suất Doanh thu và Hợp đồng theo AM / Chuyên viên</p>
                </div>

                <div className="flex bg-white/50 border border-gray-200/60 p-1.5 rounded-2xl shadow-sm">
                    <Select onValueChange={handleFilterChange} value={selectedValue}>
                        <SelectTrigger className="w-[180px] border-none bg-transparent shadow-none font-bold text-gray-700">
                            <SelectValue placeholder="Toàn thời gian" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                            <SelectItem value="all" className="font-bold cursor-pointer hover:bg-primary/5 focus:bg-primary/5 focus:text-primary transition-colors">Toàn thời gian</SelectItem>
                            <SelectItem value="quy-1" className="font-bold cursor-pointer hover:bg-primary/5 focus:bg-primary/5 focus:text-primary transition-colors">Quý 1 / 2026</SelectItem>
                            <SelectItem value="quy-2" className="font-bold cursor-pointer hover:bg-primary/5 focus:bg-primary/5 focus:text-primary transition-colors">Quý 2 / 2026</SelectItem>
                            <SelectItem value="quy-3" className="font-bold cursor-pointer hover:bg-primary/5 focus:bg-primary/5 focus:text-primary transition-colors">Quý 3 / 2026</SelectItem>
                            <SelectItem value="quy-4" className="font-bold cursor-pointer hover:bg-primary/5 focus:bg-primary/5 focus:text-primary transition-colors">Quý 4 / 2026</SelectItem>
                            <SelectItem value="thang-1" className="font-bold cursor-pointer hover:bg-primary/5 focus:bg-primary/5 focus:text-primary transition-colors">Tháng 1 / 2026</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl shadow-gray-200/20 bg-white/60 min-h-[400px]">
                    <CardHeader>
                        <CardTitle className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <DollarSign className="size-5 text-primary" />
                            Doanh Thu theo Nhân Sự (Tr.đ)
                        </CardTitle>
                        <CardDescription>Biểu đồ so sánh doanh thu dự kiến do mỗi nhân sự phụ trách</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={initialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#6b7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Bar dataKey="revenue" name="Doanh Thu" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-gray-200/20 bg-white/60 min-h-[400px]">
                    <CardHeader>
                        <CardTitle className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <FileText className="size-5 text-purple-600" />
                            Số lượng Hợp Đồng Đã Ký
                        </CardTitle>
                        <CardDescription>Biểu đồ so sánh số lượng hợp đồng đã ký thành công</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={initialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#6b7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Bar dataKey="contracts" name="Hợp Đồng" fill="#9333ea" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* TABLE */}
            <Card className="border-none shadow-xl shadow-gray-200/20 overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                    <CardTitle className="text-lg font-black text-gray-800">
                        Bảng Xếp Hạng & Thống Kê Chi Tiết
                    </CardTitle>
                </CardHeader>
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-gray-100">
                            <TableHead className="w-16 font-extrabold text-gray-400">Hạng</TableHead>
                            <TableHead className="font-extrabold text-gray-500">Nhân viên & Địa bàn</TableHead>
                            <TableHead className="text-right font-extrabold text-gray-500">Doanh Thu (Tr.đ)</TableHead>
                            <TableHead className="text-right font-extrabold text-gray-500">Số dự án</TableHead>
                            <TableHead className="text-right font-extrabold text-gray-500">Hợp đồng ký</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-gray-400 font-bold">Không có dữ liệu phù hợp.</TableCell>
                            </TableRow>
                        ) : initialData.map((item, index) => (
                            <TableRow key={item.id} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                                <TableCell>
                                    <Badge className={`${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-gray-200 text-gray-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'} border-none shadow-none font-black flex justify-center w-8`}>
                                        {index + 1}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-800">{item.name}</span>
                                        <span className="text-xs text-gray-400 font-medium">{item.diaBan}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-black text-green-600">
                                        {item.revenue.toLocaleString()}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-bold text-gray-600">
                                    {item.projects}
                                </TableCell>
                                <TableCell className="text-right font-bold text-gray-600">
                                    {item.contracts}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
