"use client";

import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { updateKpiTarget } from "./kpi-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface KpiData {
    nam: number;
    thang: number;
    anNinhMang: number;
    giaiPhapCntt: number;
    duAnCds: number;
    cnsAnNinh: number;
}

export function KpiDashboardClient({ initialData }: { initialData: KpiData[] }) {
    const [year, setYear] = useState(2026);
    const [isSaving, setIsSaving] = useState(false);
    
    // Map initial data into a workable grid exactly for 12 months
    const [gridData, setGridData] = useState<KpiData[]>(() => {
        const grid = [];
        for (let m = 1; m <= 12; m++) {
            const existing = initialData.find(d => d.thang === m);
            grid.push(existing || { nam: 2026, thang: m, anNinhMang: 0, giaiPhapCntt: 0, duAnCds: 0, cnsAnNinh: 0 });
        }
        return grid;
    });

    const handleInputChange = (month: number, field: keyof KpiData, value: string) => {
        // Parse the input keeping numbers safe
        const val = value === "" ? 0 : parseFloat(value);
        if (isNaN(val)) return;

        setGridData(prev => prev.map(row => 
            row.thang === month ? { ...row, [field]: val } : row
        ));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save all rows
            let hasError = false;
            // Since there are 12 rows, we can just Promise.all them safely
            await Promise.all(gridData.map(async (row) => {
                const res = await updateKpiTarget(year, row.thang, {
                    anNinhMang: row.anNinhMang,
                    giaiPhapCntt: row.giaiPhapCntt,
                    duAnCds: row.duAnCds,
                    cnsAnNinh: row.cnsAnNinh
                });
                if (res.error) hasError = true;
            }));

            if (hasError) {
                toast.error("Có lỗi xảy ra khi lưu một số trường. Vui lòng kiểm tra lại.");
            } else {
                toast.success("Lưu dữ liệu KPI thành công!");
            }
        } catch (e: any) {
            toast.error("Lỗi kết nối: " + e.message);
        }
        setIsSaving(false);
    };

    // Derived values for Quarters
    const getQuarterSum = (quarterStartMonth: number) => {
        const rows = gridData.filter(r => r.thang >= quarterStartMonth && r.thang <= quarterStartMonth + 2);
        const sum = rows.reduce((acc, row) => acc + row.anNinhMang + row.giaiPhapCntt + row.duAnCds + row.cnsAnNinh, 0);
        return sum;
    }

    return (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-[#f8fafc] border-b border-gray-100 flex flex-row items-center justify-between py-6 px-8">
                <div>
                    <CardTitle className="text-2xl font-black text-[#0D1F3C]">Bảng Giao KPI Năm {year}</CardTitle>
                    <CardDescription className="text-slate-500 font-medium mt-1">Cấu hình chỉ tiêu KPI hằng tháng cho mục tiêu doanh thu</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                    <Select value={year.toString()} onValueChange={(val) => setYear(Number(val))}>
                        <SelectTrigger className="w-32 bg-white font-bold border-gray-200">
                            <SelectValue placeholder="Chọn Năm" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100">
                            <SelectItem value="2025" className="font-bold">Năm 2025</SelectItem>
                            <SelectItem value="2026" className="font-bold">Năm 2026</SelectItem>
                            <SelectItem value="2027" className="font-bold">Năm 2027</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-[#0070eb] hover:bg-[#0058bc] text-white font-bold rounded-xl h-10 px-6 shadow-md shadow-blue-500/20"
                    >
                        {isSaving ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                        Lưu Thay Đổi
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-[#f0f4f8]">
                        <TableRow className="hover:bg-transparent">
                            <TableHead rowSpan={2} className="w-24 text-center font-black text-[#0D1F3C] border-r border-gray-200 uppercase text-[10px] tracking-wider">Thời Gian</TableHead>
                            <TableHead colSpan={3} className="text-center font-black text-[#0D1F3C] border-b border-r border-gray-200 uppercase text-[10px] tracking-wider bg-blue-50/50">DỊCH VỤ GIẢI PHÁP SỐ</TableHead>
                            <TableHead rowSpan={2} className="w-40 text-center font-black text-[#0D1F3C] border-r border-gray-200 uppercase text-[10px] tracking-wider bg-orange-50/50">CNS TRONG LĨNH VỰC AN NINH</TableHead>
                            <TableHead rowSpan={2} className="w-40 text-center font-black text-[#0D1F3C] border-r border-gray-200 uppercase text-[10px] tracking-wider bg-emerald-50/50 text-emerald-700">TỔNG KPI THÁNG</TableHead>
                            <TableHead rowSpan={2} className="w-48 text-center font-black text-[#0D1F3C] uppercase text-[10px] tracking-wider bg-indigo-50/50">TỔNG CỘNG THEO QUÝ</TableHead>
                        </TableRow>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-center font-bold text-gray-600 bg-blue-50/30 border-r border-gray-200 text-xs">An ninh mạng</TableHead>
                            <TableHead className="text-center font-bold text-gray-600 bg-blue-50/30 border-r border-gray-200 text-xs">Giải pháp CNTT</TableHead>
                            <TableHead className="text-center font-bold text-gray-600 bg-blue-50/30 border-r border-gray-200 text-xs">Dự án CĐS KHCP, KHDN lớn</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gridData.map((row) => (
                            <TableRow key={row.thang} className="group border-gray-100 hover:bg-slate-50/50">
                                <TableCell className="font-bold text-center text-gray-700 bg-[#f8fafc] border-r border-gray-200/50">Tháng {row.thang}</TableCell>
                                <TableCell className="border-r border-gray-100 p-0">
                                    <Input 
                                        type="number" 
                                        value={row.anNinhMang.toString() || ""} 
                                        onChange={(e) => handleInputChange(row.thang, 'anNinhMang', e.target.value)}
                                        className="border-0 shadow-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-none h-12 text-center font-medium bg-transparent"
                                        placeholder="0"
                                    />
                                </TableCell>
                                <TableCell className="border-r border-gray-100 p-0">
                                    <Input 
                                        type="number" 
                                        value={row.giaiPhapCntt.toString() || ""} 
                                        onChange={(e) => handleInputChange(row.thang, 'giaiPhapCntt', e.target.value)}
                                        className="border-0 shadow-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-none h-12 text-center font-medium bg-transparent"
                                        placeholder="0"
                                    />
                                </TableCell>
                                <TableCell className="border-r border-gray-100 p-0">
                                    <Input 
                                        type="number" 
                                        value={row.duAnCds.toString() || ""} 
                                        onChange={(e) => handleInputChange(row.thang, 'duAnCds', e.target.value)}
                                        className="border-0 shadow-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-none h-12 text-center font-medium bg-transparent"
                                        placeholder="0"
                                    />
                                </TableCell>
                                <TableCell className="border-r border-gray-100 p-0 bg-orange-50/10">
                                    <Input 
                                        type="number" 
                                        value={row.cnsAnNinh.toString() || ""} 
                                        onChange={(e) => handleInputChange(row.thang, 'cnsAnNinh', e.target.value)}
                                        className="border-0 shadow-none focus-visible:ring-1 focus-visible:ring-orange-500 rounded-none h-12 text-center font-medium bg-transparent"
                                        placeholder="0"
                                    />
                                </TableCell>
                                <TableCell className="text-center font-black text-emerald-700 bg-emerald-50/20 border-r border-gray-100 align-middle text-sm">
                                    {(row.anNinhMang + row.giaiPhapCntt + row.duAnCds + row.cnsAnNinh).toLocaleString()}
                                </TableCell>
                                
                                {/* Compute the Quarter Total only on Months 3, 6, 9, 12 */}
                                {row.thang % 3 === 0 ? (
                                    <TableCell className="text-center bg-indigo-50/30 align-middle">
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="text-xs font-black text-indigo-400 mb-0.5 uppercase tracking-widest">Quý {row.thang / 3}</span>
                                            <span className="text-lg font-black text-indigo-700">
                                                {getQuarterSum(row.thang - 2).toLocaleString()}
                                            </span>
                                        </div>
                                    </TableCell>
                                ) : (
                                    <TableCell className="bg-indigo-50/10 align-middle text-center text-slate-300 italic text-xs border-r-0">
                                        -
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
