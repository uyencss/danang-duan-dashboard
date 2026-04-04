"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, FileText, Target, Activity, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TimeSeriesData {
    timeLabel: string;
    revenue: number;
    newProjects: number;
    signedContracts: number;
}

interface GrowthStats {
    revenueGrowth: number;
    projectGrowth: number;
    contractGrowth: number;
}

export function KPIDashboardClient({ 
    initialData, 
    growth 
}: { 
    initialData: TimeSeriesData[], 
    growth: GrowthStats | null 
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentGranularity = searchParams.get("granularity") || "thang";

    const handleTabChange = (val: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("granularity", val);
        router.push(`/kpi?${params.toString()}`);
    };

    const renderGrowthBadge = (value: number) => {
        if (!value) return null;
        const isOpt = value > 0;
        return (
            <Badge className={`${isOpt ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border-none uppercase text-[10px] font-black`}>
                {isOpt ? '+' : ''}{value.toFixed(1)}% vs kỳ trước
            </Badge>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard KPI Thời gian</h1>
                    <p className="text-gray-500 mt-1">Xu hướng phát triển kinh doanh</p>
                </div>

                <div className="flex bg-white/50 border border-gray-200/60 p-1.5 rounded-2xl shadow-sm">
                    <Tabs value={currentGranularity} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="bg-transparent gap-1">
                            {/* <TabsTrigger value="tuan" className="rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold">Tuần</TabsTrigger> */}
                            <TabsTrigger value="thang" className="rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold">Tháng</TabsTrigger>
                            <TabsTrigger value="quy" className="rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold">Quý</TabsTrigger>
                            <TabsTrigger value="nam" className="rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold">Năm</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {growth && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-none shadow-md shadow-gray-200/20 bg-white min-h-[120px]">
                        <CardHeader className="pb-2">
                             <CardTitle className="text-sm font-bold text-gray-500 flex items-center justify-between">
                                  <span>Tăng trưởng Doanh thu</span>
                                  <Activity className="size-4 text-blue-500" />
                             </CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center justify-between">
                                 {renderGrowthBadge(growth.revenueGrowth)}
                             </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md shadow-gray-200/20 bg-white min-h-[120px]">
                        <CardHeader className="pb-2">
                             <CardTitle className="text-sm font-bold text-gray-500 flex items-center justify-between">
                                  <span>Tăng trưởng Nguồn việc mới</span>
                                  <Target className="size-4 text-amber-500" />
                             </CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center justify-between">
                                 {renderGrowthBadge(growth.projectGrowth)}
                             </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md shadow-gray-200/20 bg-white min-h-[120px]">
                        <CardHeader className="pb-2">
                             <CardTitle className="text-sm font-bold text-gray-500 flex items-center justify-between">
                                  <span>Tăng trưởng Hợp đồng ký</span>
                                  <FileText className="size-4 text-purple-500" />
                             </CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center justify-between">
                                 {renderGrowthBadge(growth.contractGrowth)}
                             </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl shadow-gray-200/20 bg-white/60 min-h-[400px]">
                    <CardHeader>
                        <CardTitle className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <TrendingUp className="size-5 text-blue-600" />
                            Xu Hướng Doanh Thu Dự Kiến (Tr.đ)
                        </CardTitle>
                        <CardDescription>Biến động tổng doanh thu dự kiến theo {currentGranularity}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={initialData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="timeLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#6b7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="revenue" name="Doanh Thu" stroke="#2563eb" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-gray-200/20 bg-white/60 min-h-[400px]">
                    <CardHeader>
                        <CardTitle className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <Target className="size-5 text-amber-600" />
                            Xu Hướng Số Lượng Dự Án & Hợp Đồng
                        </CardTitle>
                        <CardDescription>Biến động số lượng dự án mới và hợp đồng ký thành công theo {currentGranularity}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={initialData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="timeLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#6b7280' }} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} allowDecimals={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="newProjects" name="Dự án mới" stroke="#d97706" strokeWidth={4} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line yAxisId="right" type="monotone" dataKey="signedContracts" name="Hợp đồng đã ký" stroke="#9333ea" strokeWidth={4} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
