"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Users, TrendingUp, FileCheck, DollarSign, Search, X, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsData {
    id: string;
    name: string;
    diaBan: string;
    role: string;
    revenue: number;
    signedRevenue: number;
    otherRevenue: number;
    contracts: number;
    projects: number;
}

type SortField = "signedRevenue" | "otherRevenue" | "contracts" | "convRate" | null;
type SortDir = "asc" | "desc";

const ROLE_LABELS: Record<string, string> = {
    AM: "Account Manager",
    CV: "Chuyên viên",
    USER: "Nhân viên",
};

export function NhanSuDashboardClient({ initialData }: { initialData: AnalyticsData[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const [selectedValue, setSelectedValue] = useState(() => {
        const type = searchParams.get("type") || "all";
        const val = searchParams.get("value") || "all";
        return type === 'all' ? 'all' : `${type}-${val}`;
    });

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
            params.set("year", "2026");
            params.set("value", val);
        }
        router.push(`/nhan-su?${params.toString()}`);
    };

    // Toggle sort: click once = desc, click again = asc, click again = clear
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDir === "desc") {
                setSortDir("asc");
            } else {
                setSortField(null);
                setSortDir("desc");
            }
        } else {
            setSortField(field);
            setSortDir("desc");
        }
    };

    // Compute conversion rates and apply filters + sort
    const processedData = useMemo(() => {
        const withConv = initialData.map(item => ({
            ...item,
            convRate: item.projects > 0 ? (item.contracts / item.projects) * 100 : 0,
        }));

        // Role filter
        let filtered = withConv;
        if (roleFilter !== "all") {
            filtered = filtered.filter(item => item.role === roleFilter);
        }

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(term) ||
                item.diaBan.toLowerCase().includes(term)
            );
        }

        // Sort
        if (sortField) {
            filtered.sort((a, b) => {
                let aVal: number, bVal: number;
                if (sortField === "convRate") {
                    aVal = a.convRate;
                    bVal = b.convRate;
                } else if (sortField === "contracts") {
                    aVal = a.contracts;
                    bVal = b.contracts;
                } else {
                    aVal = a[sortField] || 0;
                    bVal = b[sortField] || 0;
                }
                return sortDir === "desc" ? bVal - aVal : aVal - bVal;
            });
        } else {
            // Default sort by total revenue desc
            filtered.sort((a, b) => (b.signedRevenue + b.otherRevenue) - (a.signedRevenue + a.otherRevenue));
        }

        return filtered;
    }, [initialData, roleFilter, searchTerm, sortField, sortDir]);

    // Summary KPIs
    const totalUsers = initialData.length;
    const totalAMs = initialData.filter(d => d.role === "AM").length;
    const totalCVs = initialData.filter(d => d.role === "CV").length;
    const totalSignedRevenue = initialData.reduce((sum, d) => sum + (d.signedRevenue || 0), 0);
    const totalOtherRevenue = initialData.reduce((sum, d) => sum + (d.otherRevenue || 0), 0);
    const totalContracts = initialData.reduce((sum, d) => sum + (d.contracts || 0), 0);
    const totalProjects = initialData.reduce((sum, d) => sum + (d.projects || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Region */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#0D1F3C] tracking-tight">Tổng Hợp Nhân Sự</h1>
                    <p className="text-slate-500 mt-1 font-medium">Bảng vàng xếp hạng AM & Chuyên viên theo hiệu suất</p>
                </div>
                <div className="flex bg-white/50 border border-gray-200/60 p-1.5 rounded-2xl shadow-sm">
                    <Select onValueChange={handleFilterChange} value={selectedValue}>
                        <SelectTrigger className="w-[180px] border-none bg-transparent shadow-none font-bold text-gray-700">
                            <SelectValue placeholder="Toàn thời gian" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                            <SelectItem value="all" className="font-bold cursor-pointer">Toàn thời gian</SelectItem>
                            <SelectItem value="quy-1" className="font-bold cursor-pointer">Quý 1 / 2026</SelectItem>
                            <SelectItem value="quy-2" className="font-bold cursor-pointer">Quý 2 / 2026</SelectItem>
                            <SelectItem value="quy-3" className="font-bold cursor-pointer">Quý 3 / 2026</SelectItem>
                            <SelectItem value="quy-4" className="font-bold cursor-pointer">Quý 4 / 2026</SelectItem>
                            <SelectItem value="thang-1" className="font-bold cursor-pointer">Tháng 1 / 2026</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard icon={<Users className="size-5" />} label="Tổng Nhân Sự" value={`${totalUsers}`} sub={`${totalAMs} AM · ${totalCVs} CV`} color="blue" />
                <KpiCard icon={<DollarSign className="size-5" />} label="DT Đã Ký" value={`${totalSignedRevenue.toLocaleString()}`} sub="Triệu đồng" color="emerald" />
                <KpiCard icon={<TrendingUp className="size-5" />} label="DT Dự Kiến" value={`${totalOtherRevenue.toLocaleString()}`} sub="Triệu đồng" color="orange" />
                <KpiCard icon={<FileCheck className="size-5" />} label="Hợp Đồng Ký" value={`${totalContracts}`} sub={`/ ${totalProjects} dự án`} color="purple" />
            </div>

            {/* Main Leaderboard Table */}
            <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden">
                <div className="p-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-50 mb-2 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 rounded-2xl">
                            <Trophy className="size-6 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#0D1F3C]">Theo Dõi Nhân Sự</h2>
                            <p className="text-slate-500 font-medium text-sm">Xếp hạng tổng hợp AM & Chuyên viên theo hiệu suất kinh doanh</p>
                        </div>
                    </div>
                    {/* Search */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm nhân sự..."
                            className="w-full h-[42px] pl-10 pr-10 bg-[#f7f9fb] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0058bc]/20 font-medium placeholder:text-slate-300 border-none"
                        />
                        {searchTerm && (
                            <button type="button" onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200">
                                <X className="size-3.5 text-slate-400" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="px-4 pb-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="w-16 font-black text-[#0D1F3C] text-xs uppercase tracking-widest text-center">Rank</TableHead>
                                <TableHead className="font-black text-[#0D1F3C] text-xs uppercase tracking-widest">Nhân sự / District</TableHead>

                                {/* Vai trò - with filter */}
                                <TableHead className="text-center font-black text-[#0D1F3C] text-xs uppercase tracking-widest w-32">
                                    <RoleFilterDropdown value={roleFilter} onChange={setRoleFilter} />
                                </TableHead>

                                {/* DT Đã Ký - sortable */}
                                <TableHead className="text-right w-36">
                                    <SortableHeader
                                        label="DT Đã Ký"
                                        active={sortField === "signedRevenue"}
                                        dir={sortField === "signedRevenue" ? sortDir : null}
                                        onClick={() => handleSort("signedRevenue")}
                                    />
                                </TableHead>

                                {/* DT Khác - sortable */}
                                <TableHead className="text-right w-32">
                                    <SortableHeader
                                        label="DT Dự Kiến"
                                        active={sortField === "otherRevenue"}
                                        dir={sortField === "otherRevenue" ? sortDir : null}
                                        onClick={() => handleSort("otherRevenue")}
                                    />
                                </TableHead>

                                {/* Hợp đồng - sortable */}
                                <TableHead className="text-center w-28">
                                    <SortableHeader
                                        label="Hợp đồng"
                                        active={sortField === "contracts"}
                                        dir={sortField === "contracts" ? sortDir : null}
                                        onClick={() => handleSort("contracts")}
                                        align="center"
                                    />
                                </TableHead>

                                {/* Hiệu suất - sortable */}
                                <TableHead className="text-right w-28">
                                    <SortableHeader
                                        label="Hiệu suất"
                                        active={sortField === "convRate"}
                                        dir={sortField === "convRate" ? sortDir : null}
                                        onClick={() => handleSort("convRate")}
                                    />
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-20 text-slate-400 italic">
                                        {searchTerm || roleFilter !== "all" ? "Không tìm thấy nhân sự phù hợp" : "Chưa ghi nhận dữ liệu nhân sự"}
                                    </TableCell>
                                </TableRow>
                            ) : processedData.map((staff, index) => {
                                const roleColor = staff.role === "AM"
                                    ? "text-[#0058bc] bg-blue-50 border-blue-100"
                                    : staff.role === "CV"
                                        ? "text-purple-600 bg-purple-50 border-purple-100"
                                        : "text-slate-500 bg-slate-50 border-slate-200";
                                return (
                                    <TableRow key={staff.id} className="group border-gray-50/50 hover:bg-slate-50/80 transition-all">
                                        {/* Rank */}
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

                                        {/* Nhân sự / District */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-white group-hover:text-[#0058bc] shadow-inner transition-colors text-sm">
                                                    {staff.name.split(" ").map(n => n[0]).slice(-2).join("").toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-[#0D1F3C] group-hover:text-[#0058bc] transition-colors">{staff.name}</span>
                                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{staff.diaBan}</span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Vai trò */}
                                        <TableCell className="text-center">
                                            <span className={cn(
                                                "inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-black border",
                                                roleColor
                                            )}>
                                                {ROLE_LABELS[staff.role] || staff.role}
                                            </span>
                                        </TableCell>

                                        {/* DT Đã Ký */}
                                        <TableCell className="text-right">
                                            <span className="text-lg font-[900] text-[#0D1F3C]">
                                                {(staff.signedRevenue || 0).toLocaleString()}
                                                <span className="ml-1 text-[10px] text-slate-400">Tr.đ</span>
                                            </span>
                                        </TableCell>

                                        {/* DT Khác */}
                                        <TableCell className="text-right">
                                            <span className="text-sm font-bold text-orange-600">
                                                {(staff.otherRevenue || 0).toLocaleString()}
                                            </span>
                                        </TableCell>

                                        {/* Hợp đồng */}
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-2 bg-[#f7f9fb] px-3 py-1 rounded-full group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all">
                                                <Users className="size-3 text-slate-400" />
                                                <span className="font-black text-slate-600 text-xs">{staff.contracts}/{staff.projects}</span>
                                            </div>
                                        </TableCell>

                                        {/* Hiệu suất */}
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full rounded-full transition-all duration-1000", staff.convRate > 50 ? "bg-emerald-500" : "bg-orange-500")}
                                                        style={{ width: `${Math.min(staff.convRate, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-500">{staff.convRate.toFixed(1)}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}

// ── Sortable Column Header ──
function SortableHeader({ label, active, dir, onClick, align = "right" }: {
    label: string;
    active: boolean;
    dir: SortDir | null;
    onClick: () => void;
    align?: "left" | "center" | "right";
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex items-center gap-1.5 font-black text-xs uppercase tracking-widest transition-colors w-full",
                align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start",
                active ? "text-[#0058bc]" : "text-[#0D1F3C] hover:text-[#0058bc]"
            )}
        >
            {label}
            {active && dir === "desc" ? (
                <ArrowDown className="size-3.5" />
            ) : active && dir === "asc" ? (
                <ArrowUp className="size-3.5" />
            ) : (
                <ChevronsUpDown className="size-3.5 text-slate-300" />
            )}
        </button>
    );
}

// ── Role Filter Dropdown ──
function RoleFilterDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    const options = [
        { value: "all", label: "Tất cả" },
        { value: "AM", label: "Account Manager" },
        { value: "CV", label: "Chuyên viên" },
        { value: "USER", label: "Nhân viên" },
    ];
    const selected = options.find(o => o.value === value);

    return (
        <div className="relative inline-block">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={cn(
                    "inline-flex items-center gap-1.5 font-black text-xs uppercase tracking-widest transition-colors",
                    value !== "all" ? "text-[#0058bc]" : "text-[#0D1F3C] hover:text-[#0058bc]"
                )}
            >
                Vai trò
                {value !== "all" && (
                    <span className="text-[9px] bg-[#0058bc] text-white px-1.5 py-0.5 rounded-md normal-case tracking-normal font-bold">
                        {selected?.label}
                    </span>
                )}
                <ChevronsUpDown className="size-3.5 text-slate-300" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden min-w-[160px] animate-in fade-in-0 zoom-in-95 origin-top duration-150">
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={cn(
                                    "w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-all",
                                    opt.value === value
                                        ? "bg-[#0058bc] text-white font-bold"
                                        : "hover:bg-slate-50 text-[#0D1F3C] font-medium"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ── KPI Summary Card ──
function KpiCard({ icon, label, value, sub, color }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub: string;
    color: "blue" | "emerald" | "orange" | "purple";
}) {
    const colorMap = {
        blue: "from-[#0058bc]/10 to-blue-50 text-[#0058bc]",
        emerald: "from-emerald-500/10 to-emerald-50 text-emerald-600",
        orange: "from-orange-500/10 to-orange-50 text-orange-600",
        purple: "from-purple-500/10 to-purple-50 text-purple-600",
    };
    const iconBgMap = {
        blue: "bg-[#0058bc]/10 text-[#0058bc]",
        emerald: "bg-emerald-100 text-emerald-600",
        orange: "bg-orange-100 text-orange-600",
        purple: "bg-purple-100 text-purple-600",
    };

    return (
        <div className={cn("rounded-2xl p-5 bg-gradient-to-br", colorMap[color])}>
            <div className="flex items-center gap-3 mb-3">
                <div className={cn("p-2 rounded-xl", iconBgMap[color])}>{icon}</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            </div>
            <p className="text-2xl font-[900] text-[#0D1F3C]">{value}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">{sub}</p>
        </div>
    );
}
