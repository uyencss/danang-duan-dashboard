"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Layers } from "lucide-react";

export function TimeFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentYear = searchParams.get("y") ?? "2026";
    const currentQuarter = searchParams.get("q") ?? "all";
    const currentMonth = searchParams.get("m") ?? "all";

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "all") {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        // When changing year or quarter, we might want to reset the smaller granularity?
        // But for now let's keep them if they make sense.
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap items-center gap-3 bg-white/50 p-2 rounded-2xl backdrop-blur-sm border border-white/20 shadow-sm">
            {/* Year Filter */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm border border-slate-100">
                <Calendar className="size-4 text-slate-400" />
                <Select value={currentYear} onValueChange={(v) => v && updateFilter("y", v)}>
                    <SelectTrigger className="border-none shadow-none bg-transparent h-7 p-0 focus:ring-0 font-bold text-slate-700 w-[60px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Quarter Filter */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm border border-slate-100">
                <Layers className="size-4 text-slate-400" />
                <Select value={currentQuarter} onValueChange={(v) => v && updateFilter("q", v)}>
                    <SelectTrigger className="border-none shadow-none bg-transparent h-7 p-0 focus:ring-0 font-bold text-slate-700 w-[100px]">
                        <SelectValue placeholder="Quý">
                            {currentQuarter === "all" ? "Tất cả Quý" : `Quý ${currentQuarter}`}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả Quý</SelectItem>
                        <SelectItem value="1">Quý 1</SelectItem>
                        <SelectItem value="2">Quý 2</SelectItem>
                        <SelectItem value="3">Quý 3</SelectItem>
                        <SelectItem value="4">Quý 4</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm border border-slate-100">
                <Clock className="size-4 text-slate-400" />
                <Select value={currentMonth} onValueChange={(v) => v && updateFilter("m", v)}>
                    <SelectTrigger className="border-none shadow-none bg-transparent h-7 p-0 focus:ring-0 font-bold text-slate-700 w-[110px]">
                        <SelectValue placeholder="Tháng">
                            {currentMonth === "all" ? "Tất cả Tháng" : `Tháng ${currentMonth}`}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả Tháng</SelectItem>
                        {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>Tháng {i + 1}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
