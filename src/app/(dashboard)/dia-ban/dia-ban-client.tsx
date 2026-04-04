"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Treemap } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Map, Trophy, Users, CheckCircle, Flame } from "lucide-react";

interface DiaBanData {
    name: string;
    revenue: number;
    projects: number;
    contracts: number;
    staffCount: number;
}

interface TopStaff {
    id: string;
    name: string;
    diaBan: string;
    revenue: number;
    contracts: number;
    totalProjects: number;
    conversionRate: number;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

const TreemapContent = (props: any) => {
    const { root, depth, x, y, width, height, index, payload, colors, rank, name } = props;
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: depth < 2 ? colors[Math.floor((index / root.children.length) * 6)] : '#ffffff',
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                    cursor: 'pointer'
                }}
            />
            {depth === 1 && width > 50 && height > 30 ? (
                <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={14} fontWeight="bold">
                    {name}
                </text>
            ) : null}
        </g>
    );
};


export function DiaBanDashboardClient({ diaBanData, topStaffData }: { diaBanData: DiaBanData[], topStaffData: TopStaff[] }) {
    const [selectedDiaBan, setSelectedDiaBan] = useState<string>("all");

    const filteredStaff = selectedDiaBan === "all" 
        ? topStaffData 
        : topStaffData.filter(s => s.diaBan === selectedDiaBan);

    // Transforming data for Treemap (Recharts Treemap requires nested structure)
    const treeData = [
        {
            name: 'Địa bàn',
            children: diaBanData.map(d => ({ size: d.revenue, ...d }))
        }
    ];

    const handleDiaBanChange = (value: string | null) => {
        if (value) setSelectedDiaBan(value);
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Địa Bàn</h1>
                    <p className="text-gray-500 mt-1">Phân tích hiệu suất theo khu vực kinh doanh</p>
                </div>

                <div className="flex bg-white/50 border border-gray-200/60 p-1.5 rounded-2xl shadow-sm">
                    <Select onValueChange={handleDiaBanChange} defaultValue="all">
                        <SelectTrigger className="w-[200px] border-none bg-transparent shadow-none font-bold text-gray-700">
                            <SelectValue placeholder="Lọc theo địa bàn" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                            <SelectItem value="all" className="font-bold">Tất cả khu vực</SelectItem>
                            {diaBanData.map(d => (
                                <SelectItem key={d.name} value={d.name} className="font-bold">{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl shadow-gray-200/20 bg-white/60 min-h-[400px]">
                    <CardHeader>
                        <CardTitle className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <Map className="size-5 text-emerald-600" />
                            Phân Bổ Doanh Thu (Treemap)
                        </CardTitle>
                        <CardDescription>Tỉ trọng doanh thu dự kiến giữa các địa bàn lớn nhỏ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <Treemap
                                    data={treeData}
                                    dataKey="size"
                                    aspectRatio={4 / 3}
                                    stroke="#fff"
                                    content={<TreemapContent colors={COLORS} />}
                                >
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(value: any, name: any, props: any) => {
                                            // Handling custom props passed from Treemap nodes
                                            return [`${Number(value).toLocaleString()} Tr.đ`, props.payload.name];
                                        }}
                                    />
                                </Treemap>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-gray-200/20 bg-white/60 min-h-[400px]">
                    <CardHeader>
                        <CardTitle className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <Flame className="size-5 text-orange-500" />
                            So Sánh Hiệu Suất Khu Vực
                        </CardTitle>
                        <CardDescription>Tổng doanh thu mang lại xếp hạng từ cao đến thấp</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={diaBanData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#6b7280' }} width={80} />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="revenue" name="Doanh Thu" radius={[0, 4, 4, 0]} barSize={20}>
                                        {diaBanData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* TABLE */}
            <Card className="border-none shadow-xl shadow-gray-200/20 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500">
                    <CardTitle className="text-lg font-black text-white flex gap-2 items-center">
                        <Trophy className="size-5" />
                        Bảng Vàng Cá Nhân Xuất Sắc Nhất
                    </CardTitle>
                </CardHeader>
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-gray-100 bg-gray-50/50">
                            <TableHead className="w-16 font-extrabold text-gray-500">Rank</TableHead>
                            <TableHead className="font-extrabold text-gray-500">Nhân viên & Địa bàn</TableHead>
                            <TableHead className="text-right font-extrabold text-gray-500">Doanh Thu (Tr.đ)</TableHead>
                            <TableHead className="text-right font-extrabold text-gray-500">Hợp đồng chốt</TableHead>
                            <TableHead className="text-right font-extrabold text-gray-500">Tỉ lệ thành công</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStaff.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-gray-400 font-bold">Chưa có dữ liệu.</TableCell>
                            </TableRow>
                        ) : filteredStaff.slice(0, 10).map((staff, index) => (
                            <TableRow key={staff.id} className={`group hover:bg-orange-50/50 transition-colors border-gray-50 ${index < 3 ? 'bg-orange-50/20' : ''}`}>
                                <TableCell>
                                    <Badge className={`${index === 0 ? 'bg-yellow-400 text-yellow-900 border-yellow-500' : index === 1 ? 'bg-gray-300 text-gray-800' : index === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-50 text-gray-400 border-none'} font-black flex justify-center w-8 shadow-sm`}>
                                        {index + 1}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-800 flex items-center gap-2">
                                            {staff.name}
                                            {index === 0 && <CheckCircle className="size-3 text-blue-500 fill-blue-100" />}
                                        </span>
                                        <span className="text-xs text-gray-500 font-medium">{staff.diaBan}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-black text-amber-600">
                                        {staff.revenue.toLocaleString()}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-bold text-gray-600">
                                    <div className="flex items-center justify-end gap-1">
                                        <Users className="size-3 text-gray-400" /> {staff.contracts}/{staff.totalProjects}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                    <Badge variant="outline" className={`${staff.conversionRate > 50 ? 'border-green-200 text-green-700 bg-green-50' : 'border-gray-200 text-gray-600'} rounded-lg`}>
                                        {staff.conversionRate.toFixed(1)}%
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
