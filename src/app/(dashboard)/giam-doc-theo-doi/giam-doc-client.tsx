"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, CheckCircle2, TrendingUp, Target, AlertCircle, History as HistoryIcon, XCircle, ChevronDown, ChevronUp, Star, Rocket } from "lucide-react";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from 'recharts';
import { SmartDateInput } from "@/components/ui/smart-date-input";

const formatCurrency = (val: number) => {
    return Math.round(val || 0).toLocaleString('vi-VN');
};

export default function GiamDocClient() {
    const [urgentTasks, setUrgentTasks] = useState<any[]>([]);
    const [resolvedTasks, setResolvedTasks] = useState<any[]>([]);
    const [b2aProjects, setB2aProjects] = useState<any[]>([]);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    
    const [kpiTarget, setKpiTarget] = useState(0);
    const [kpiActual, setKpiActual] = useState(0);
    const [kpiGap, setKpiGap] = useState(0);

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(0, 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        d.setMonth(11, 31);
        return d.toISOString().split('T')[0];
    });
    const [includeExpected, setIncludeExpected] = useState(false);

    const [loadingTasks, setLoadingTasks] = useState(true);
    const [loadingKpi, setLoadingKpi] = useState(true);
    const [loadingB2a, setLoadingB2a] = useState(true);

    const fetchUrgentTasks = async () => {
        try {
            const res = await fetch(`/api/director/urgent-tasks?resolved=false&t=${Date.now()}`);
            const data = await res.json();
            setUrgentTasks(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingTasks(false);
        }
    };

    const fetchResolvedTasks = async () => {
        try {
            const res = await fetch(`/api/director/urgent-tasks?resolved=true&t=${Date.now()}`);
            const data = await res.json();
            setResolvedTasks(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchKpi = async () => {
        setLoadingKpi(true);
        try {
            const res = await fetch("/api/director/dynamic-kpi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startDate, endDate, includeExpected })
            });
            const data = await res.json();
            setKpiTarget(data.target || 0);
            setKpiActual(data.actual || 0);
            setKpiGap(data.gap || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingKpi(false);
        }
    };

    const fetchB2aRoadmap = async () => {
        try {
            const res = await fetch("/api/director/b2a-roadmap");
            const data = await res.json();
            setB2aProjects(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingB2a(false);
        }
    };

    useEffect(() => {
        fetchUrgentTasks();
        fetchResolvedTasks();
        fetchB2aRoadmap();
    }, []);

    useEffect(() => {
        fetchKpi();
    }, [startDate, endDate, includeExpected]);

    const handleResolve = async (id: number) => {
        try {
            await fetch("/api/director/urgent-tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            fetchUrgentTasks(); // Refresh pending
            fetchResolvedTasks(); // Refresh history
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8 md:space-y-12">
            {/* SECTION 0: URGENT MARQUEE BANNER */}
            {urgentTasks.length > 0 && (
                <div className="bg-red-600 text-white overflow-hidden py-2.5 rounded-xl flex items-center shadow-lg border-2 border-red-500/50">
                    <div className="flex items-center gap-2 px-3 md:px-5 font-black whitespace-nowrap bg-red-700 h-full py-1 z-10 shadow-[5px_0_15px_rgba(0,0,0,0.3)]">
                        <Flame className="size-4 md:size-5 animate-pulse text-yellow-400" />
                        <span className="text-[10px] md:text-xs uppercase tracking-widest">Bản tin khẩn</span>
                    </div>
                    <div className="flex-1 overflow-hidden relative h-6 flex items-center">
                        <div className="absolute whitespace-nowrap will-change-transform flex items-center gap-10 md:gap-20" style={{ animation: 'marquee 40s linear infinite' }}>
                            {[...urgentTasks, ...urgentTasks].map((t, i) => (
                                <div key={`${t.id}-${i}`} className="text-[10px] md:text-sm font-bold flex items-center gap-2">
                                    <Badge className="bg-white/20 text-white border-none text-[8px] md:text-[9px] h-3.5 md:h-4">#{i % urgentTasks.length + 1}</Badge>
                                    <span className="text-white/90">DỰ ÁN:</span> 
                                    <span className="text-white truncate max-w-[100px] md:max-w-none">{t.duAn?.tenDuAn}</span>
                                    <span className="mx-1 md:mx-2 text-white/50">|</span>
                                    <span className="text-yellow-200 truncate max-w-[150px] md:max-w-none">{t.requestContent || "Cần xử lý gấp"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* SECTION 1: URGENT ACTION CENTER */}
            <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Flame className="text-red-500" />
                    <h3 className="text-xl md:text-2xl font-bold text-slate-800">Cần xử lý gấp</h3>
                </div>

                {urgentTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {urgentTasks.slice(0, 3).map((t, index) => (
                            <Link key={t.id} href={`/du-an/${t.projectId}`} className="block">
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer h-full">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Flame className="size-12 text-red-600" />
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-red-500 text-white border-none text-[10px] font-black uppercase">
                                            Ưu tiên {index + 1}
                                        </Badge>
                                        <span className="text-[10px] text-red-400 font-bold uppercase">
                                            {t.createdAt ? format(new Date(t.createdAt), "dd/MM HH:mm") : ""}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-red-900 truncate mb-1">
                                        {t.duAn?.tenDuAn}
                                    </h4>
                                    <div className="text-[11px] text-red-600 font-semibold mb-1 flex flex-col">
                                        <span>KH: {t.duAn?.khachHang?.ten || "N/A"}</span>
                                        <span>Phụ trách: {t.duAn?.chuyenVien?.name || t.duAn?.am?.name || "N/A"}</span>
                                    </div>
                                    <p className="text-sm text-red-700 line-clamp-2 font-medium bg-white/50 p-1.5 rounded border border-red-100">
                                        {t.requestContent || "Cần hỗ trợ gấp"}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : null}

                <Tabs defaultValue="pending" className="w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <TabsList className="bg-slate-100 p-1 h-auto md:h-10 rounded-xl flex flex-col md:flex-row w-full md:w-auto">
                            <TabsTrigger value="pending" className="rounded-lg px-4 md:px-6 py-2 md:py-0 data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm md:text-base w-full md:w-auto">
                                <AlertCircle className="w-4 h-4 mr-2 text-red-500 shrink-0" />
                                <span className="truncate">Đang chờ xử lý ({urgentTasks.length})</span>
                            </TabsTrigger>
                            <TabsTrigger value="history" className="rounded-lg px-4 md:px-6 py-2 md:py-0 data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm md:text-base w-full md:w-auto">
                                <HistoryIcon className="w-4 h-4 mr-2 text-slate-500 shrink-0" />
                                <span className="truncate">Lịch sử xử lý ({resolvedTasks.length})</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="pending" className="mt-0">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full overflow-x-auto">
                            <Table className="min-w-[800px] md:min-w-full">
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="whitespace-nowrap">Thời gian</TableHead>
                                        <TableHead className="whitespace-nowrap">Nội dung yêu cầu</TableHead>
                                        <TableHead className="whitespace-nowrap">Tên dự án</TableHead>
                                        <TableHead className="whitespace-nowrap">Khách hàng</TableHead>
                                        <TableHead className="whitespace-nowrap">Lĩnh vực</TableHead>
                                        <TableHead className="whitespace-nowrap">Chuyên viên</TableHead>
                                        <TableHead className="text-right whitespace-nowrap">Doanh thu dự kiến</TableHead>
                                        <TableHead className="text-center whitespace-nowrap">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingTasks ? (
                                        <TableRow><TableCell colSpan={8} className="text-center py-8">Đang tải...</TableCell></TableRow>
                                    ) : urgentTasks.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">Không có yêu cầu gấp nào.</TableCell></TableRow>
                                    ) : urgentTasks.map((t: any) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                                {t.createdAt ? format(new Date(t.createdAt), "dd/MM/yyyy HH:mm") : ""}
                                            </TableCell>
                                            <TableCell className="font-bold text-red-600 max-w-[200px] truncate" title={t.requestContent || "Cần hỗ trợ"}>
                                                {t.requestContent || "Cần hỗ trợ"}
                                            </TableCell>
                                            <TableCell className="max-w-[150px]">
                                                <Link href={`/du-an/${t.projectId}`} className="text-blue-600 hover:underline font-semibold truncate block" title={t.duAn?.tenDuAn}>
                                                    {t.duAn?.tenDuAn}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{t.duAn?.khachHang?.ten}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{t.duAn?.sanPham?.nhom || "Không rõ"}</Badge>
                                            </TableCell>
                                            <TableCell>{t.duAn?.chuyenVien?.name || t.duAn?.am?.name || "Chưa phân công"}</TableCell>
                                            <TableCell className="text-right font-semibold text-green-700">
                                                {formatCurrency(t.duAn?.tongDoanhThuDuKien)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button size="sm" variant="outline" className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200" onClick={() => handleResolve(t.id)}>
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    Chưa xử lý
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full overflow-x-auto">
                            <Table className="min-w-[800px] md:min-w-full">
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="whitespace-nowrap">Thời gian yêu cầu</TableHead>
                                        <TableHead className="whitespace-nowrap">Nội dung</TableHead>
                                        <TableHead className="whitespace-nowrap">Dự án</TableHead>
                                        <TableHead className="whitespace-nowrap">Khách hàng</TableHead>
                                        <TableHead className="whitespace-nowrap">Lĩnh vực</TableHead>
                                        <TableHead className="whitespace-nowrap">Chuyên viên</TableHead>
                                        <TableHead className="text-right whitespace-nowrap">Doanh thu</TableHead>
                                        <TableHead className="text-center whitespace-nowrap">Trạng thái</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {resolvedTasks.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">Chưa có lịch sử xử lý.</TableCell></TableRow>
                                    ) : resolvedTasks.map((t: any) => (
                                        <TableRow key={t.id} className="bg-slate-50/30">
                                            <TableCell className="text-xs text-slate-400 whitespace-nowrap">
                                                {t.createdAt ? format(new Date(t.createdAt), "dd/MM/yyyy HH:mm") : ""}
                                            </TableCell>
                                            <TableCell className="text-slate-600 italic line-through decoration-slate-300 max-w-[200px] truncate" title={t.requestContent || "Cần hỗ trợ"}>
                                                {t.requestContent || "Cần hỗ trợ"}
                                            </TableCell>
                                            <TableCell className="max-w-[150px]">
                                                <Link href={`/du-an/${t.projectId}`} className="text-slate-500 hover:underline truncate block" title={t.duAn?.tenDuAn}>
                                                    {t.duAn?.tenDuAn}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-slate-500">{t.duAn?.khachHang?.ten}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-200">{t.duAn?.sanPham?.nhom || "Không rõ"}</Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-500">{t.duAn?.chuyenVien?.name || t.duAn?.am?.name || "Chưa phân công"}</TableCell>
                                            <TableCell className="text-right text-slate-400">
                                                {formatCurrency(t.duAn?.tongDoanhThuDuKien)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1 mx-auto w-fit">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Đã xong
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </section>

            {/* SECTION 2: DYNAMIC KPI CONTROL CENTER */}
            <section className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Target className="text-blue-600" />
                        <h3 className="text-xl md:text-2xl font-bold text-slate-800">Tiến độ HTKH</h3>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 bg-white p-3 md:p-2 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 flex-1 sm:flex-none">
                            <Label htmlFor="start" className="text-[10px] md:text-xs font-black text-slate-500 uppercase shrink-0">Từ:</Label>
                            <SmartDateInput 
                                value={startDate} 
                                onChange={setStartDate} 
                                className="w-full sm:w-[140px] md:w-[160px] h-9 text-xs" 
                            />
                        </div>
                        <div className="flex items-center gap-2 flex-1 sm:flex-none">
                            <Label htmlFor="end" className="text-[10px] md:text-xs font-black text-slate-500 uppercase shrink-0">Đến:</Label>
                            <SmartDateInput 
                                value={endDate} 
                                onChange={setEndDate} 
                                className="w-full sm:w-[140px] md:w-[160px] h-9 text-xs" 
                            />
                        </div>
                        <div className="hidden sm:block h-6 w-px bg-slate-200" />
                        <div className="flex items-center gap-2 pt-2 sm:pt-0">
                            <Switch id="include-expected" checked={includeExpected} onCheckedChange={setIncludeExpected} />
                            <Label htmlFor="include-expected" className="cursor-pointer text-xs md:text-sm font-medium">{includeExpected ? "Đã ký + Kỳ vọng" : "Doanh thu đã ký"}</Label>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs md:text-sm font-bold text-blue-800 uppercase tracking-wider">Mục tiêu (Target)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-black text-blue-900">{formatCurrency(kpiTarget)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs md:text-sm font-bold text-green-800 uppercase tracking-wider">Thực tế đạt được</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-black text-green-900">{formatCurrency(kpiActual)}</div>
                            <div className="mt-2 text-xs md:text-sm font-semibold text-green-700">
                                {kpiTarget > 0 ? ((kpiActual / kpiTarget) * 100).toFixed(1) : 0}% hoàn thành
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs md:text-sm font-bold text-orange-800 uppercase tracking-wider">Khoảng cách cần bù đắp</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-black text-orange-900">{formatCurrency(kpiGap)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Progress Bar */}
                <div className="bg-slate-100 rounded-full h-8 w-full overflow-hidden shadow-inner relative">
                    <div 
                        className={`h-full flex items-center justify-end px-2 text-xs font-bold text-white ${kpiActual >= kpiTarget ? 'bg-green-500' : 'bg-blue-500'} transition-all duration-1000`} 
                        style={{ width: `${Math.min(100, kpiTarget > 0 ? (kpiActual / kpiTarget) * 100 : 0)}%` }}
                    >
                        {kpiTarget > 0 && (kpiActual / kpiTarget * 100) > 5 ? `${((kpiActual / kpiTarget) * 100).toFixed(1)}%` : ''}
                    </div>
                </div>
            </section>

            {/* SECTION 3: B2A EXECUTIVE CARDS */}
            <section className="space-y-6">
                <div className="flex items-center gap-2">
                    <TrendingUp className="text-blue-600" />
                    <h3 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Điều hành dự án Công an</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* CARD 1: ROADMAP BY YEAR */}
                    <ExecutiveCard 
                        title="Phân kỳ theo năm (Roadmap)"
                        projects={b2aProjects}
                        expanded={expandedCard === 'roadmap'}
                        onToggle={() => setExpandedCard(expandedCard === 'roadmap' ? null : 'roadmap')}
                        type="roadmap"
                    />

                    {/* CARD 2: STATUS FUNNEL */}
                    <ExecutiveCard 
                        title="Trạng thái hiện trạng (Funnel)"
                        projects={b2aProjects}
                        expanded={expandedCard === 'funnel'}
                        onToggle={() => setExpandedCard(expandedCard === 'funnel' ? null : 'funnel')}
                        type="funnel"
                    />

                    {/* CARD 3: STRATEGIC PRIORITIES */}
                    <ExecutiveCard 
                        title="Ưu tiên chiến lược (Priorities)"
                        projects={b2aProjects}
                        expanded={expandedCard === 'priorities'}
                        onToggle={() => setExpandedCard(expandedCard === 'priorities' ? null : 'priorities')}
                        type="priorities"
                    />

                    {/* CARD 4: WORKFLOW 7 STEPS */}
                    <ExecutiveCard 
                        title="Tiến độ 7 bước (Workflow)"
                        projects={b2aProjects}
                        expanded={expandedCard === 'workflow'}
                        onToggle={() => setExpandedCard(expandedCard === 'workflow' ? null : 'workflow')}
                        type="workflow"
                    />
                </div>
            </section>
            
            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
            `}</style>
        </div>
    );
}

function ExecutiveCard({ title, projects, expanded, onToggle, type }: any) {
    const [filterValue, setFilterValue] = useState<string | null>(null);

    // Data Processing
    let chartData: any[] = [];
    let filteredProjects = projects;

    if (type === 'roadmap') {
        const yearMap: Record<string, number> = {};
        projects.forEach((p: any) => {
            const year = p.thoiGianDuKien || (p.ngayBatDau ? new Date(p.ngayBatDau).getFullYear().toString() : "N/A");
            yearMap[year] = (yearMap[year] || 0) + 1;
        });
        chartData = Object.entries(yearMap).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
        if (filterValue) {
            filteredProjects = projects.filter((p: any) => {
                const y = p.thoiGianDuKien || (p.ngayBatDau ? new Date(p.ngayBatDau).getFullYear().toString() : "N/A");
                return y === filterValue;
            });
        }
    } else if (type === 'funnel') {
        const statusMap: Record<string, number> = {};
        projects.forEach((p: any) => {
            const status = p.trangThaiHienTai;
            statusMap[status] = (statusMap[status] || 0) + 1;
        });
        chartData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
        if (filterValue) {
            filteredProjects = projects.filter((p: any) => p.trangThaiHienTai === filterValue);
        }
    } else if (type === 'priorities') {
        const trongDiem = projects.filter((p: any) => p.isTrongDiem).length;
        const kyVong = projects.filter((p: any) => p.isKyVong).length;
        chartData = [
            { name: 'Trọng điểm', value: trongDiem, color: '#ef4444' },
            { name: 'Kỳ vọng', value: kyVong, color: '#3b82f6' }
        ];
        if (filterValue) {
            filteredProjects = projects.filter((p: any) => filterValue === 'Trọng điểm' ? p.isTrongDiem : p.isKyVong);
        }
    } else if (type === 'workflow') {
        const stepMap: Record<string, number> = {};
        // Initialize 7 steps
        for(let i=1; i<=7; i++) stepMap[`Bước ${i}`] = 0;
        projects.forEach((p: any) => {
            if (p.hienTaiBuoc) stepMap[p.hienTaiBuoc] = (stepMap[p.hienTaiBuoc] || 0) + 1;
        });
        chartData = Object.entries(stepMap).map(([name, value]) => ({ name, value }));
        if (filterValue) {
            filteredProjects = projects.filter((p: any) => p.hienTaiBuoc === filterValue);
        }
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

    return (
        <Card className="overflow-hidden border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 bg-white group/card">
            <CardHeader className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 pb-4 bg-slate-50/50">
                <CardTitle className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    {type === 'roadmap' && <TrendingUp className="w-5 h-5 text-blue-500" />}
                    {type === 'funnel' && <Target className="w-5 h-5 text-emerald-500" />}
                    {type === 'priorities' && <Star className="w-5 h-5 text-amber-500" />}
                    {type === 'workflow' && <Rocket className="w-5 h-5 text-purple-500" />}
                    {title}
                </CardTitle>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onToggle}
                    className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                    {expanded ? (
                        <><ChevronUp className="w-4 h-4 mr-1" /> Thu gọn</>
                    ) : (
                        <><ChevronDown className="w-4 h-4 mr-1" /> Xem chi tiết</>
                    )}
                </Button>
            </CardHeader>
            <CardContent className="pt-6">
                {/* VISUAL SUMMARY */}
                <div className="h-[180px] sm:h-[200px] w-full">
                    {type === 'roadmap' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} onClick={(data) => { if(data && data.activeLabel) { setFilterValue(String(data.activeLabel)); if(!expanded) onToggle(); } }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64748b'}} />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64748b'}} />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                    {type === 'funnel' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    onClick={(data) => { if(data && data.name) { setFilterValue(String(data.name)); if(!expanded) onToggle(); } }}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: '11px'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                    {type === 'priorities' && (
                        <div className="flex justify-around items-center h-full gap-4">
                            {chartData.map(d => (
                                <div 
                                    key={d.name} 
                                    className="text-center cursor-pointer p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors flex-1 border border-slate-100"
                                    onClick={() => { setFilterValue(d.name); if(!expanded) onToggle(); }}
                                >
                                    <div className="text-4xl font-black mb-1" style={{color: d.color}}>{d.value}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{d.name}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {type === 'workflow' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={chartData} onClick={(data) => { if(data && data.activeLabel) { setFilterValue(String(data.activeLabel)); if(!expanded) onToggle(); } }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} width={60} tick={{fill: '#64748b'}} />
                                <Tooltip cursor={{fill: '#f8fafc'}} />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* EXPANDABLE DATA TABLE */}
                <div className={`mt-6 overflow-hidden transition-all duration-500 ease-in-out ${expanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <h5 className="font-bold text-slate-800 text-sm">
                                Chi tiết {filterValue ? `: ${filterValue}` : ''}
                            </h5>
                            {filterValue && (
                                <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => setFilterValue(null)}>
                                    Hiện tất cả
                                </Button>
                            )}
                        </div>
                        <div className="rounded-lg border border-slate-100 overflow-hidden shadow-sm overflow-x-auto">
                            <Table className="min-w-[400px]">
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="text-[10px] uppercase font-bold py-2 whitespace-nowrap">Dự án</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold py-2 whitespace-nowrap">Khách hàng</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold py-2 text-right whitespace-nowrap">Doanh thu</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold py-2 whitespace-nowrap">Trạng thái</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProjects.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-4 text-xs text-slate-400 italic">Không có dữ liệu</TableCell></TableRow>
                                    ) : filteredProjects.map((p: any) => (
                                        <TableRow key={p.id} className="hover:bg-slate-50 transition-colors">
                                            <TableCell className="py-2">
                                                <Link href={`/du-an/${p.id}`} className="text-[11px] font-bold text-blue-600 hover:underline line-clamp-1">
                                                    {p.tenDuAn}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-[10px] py-2 truncate max-w-[80px]">{p.khachHang?.ten}</TableCell>
                                            <TableCell className="text-[10px] py-2 text-right font-bold text-green-700">
                                                {Math.round(p.tongDoanhThuDuKien || 0).toLocaleString('vi-VN')}
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-white border-slate-200">
                                                    {p.trangThaiHienTai}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
