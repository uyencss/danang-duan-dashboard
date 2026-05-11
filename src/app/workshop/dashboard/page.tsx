"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getWorkshopData } from "../workshop-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download, Users, Lightbulb, BarChart3, Filter, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

const CATEGORY_LABELS: Record<string, string> = {
  MAN: "MAN (Con người)",
  METHOD: "METHOD (Phương pháp)",
  MATERIAL: "MATERIAL (Nguyên vật liệu)",
  MACHINE: "MACHINE (Máy móc)",
  MARKET: "MARKET (Thị trường)",
};

export default function WorkshopDashboard() {
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    const result = await getWorkshopData();
    setData(result);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const chartData = useMemo(() => {
    if (!data?.stats?.byCategory) return [];
    return Object.entries(data.stats.byCategory).map(([name, value]) => ({
      name: CATEGORY_LABELS[name] || name,
      value,
    }));
  }, [data]);

  const filteredIdeas = useMemo(() => {
    if (!data?.ideas) return [];
    if (filter === "ALL") return data.ideas;
    return data.ideas.filter((i: any) => i.category === filter);
  }, [data, filter]);

  const handleExportExcel = () => {
    if (!data?.ideas) return;
    
    const exportData = data.ideas.map((i: any) => ({
      "Thời gian": format(new Date(i.createdAt), "HH:mm:ss dd/MM/yyyy"),
      "Người gửi": i.participantName || "Ẩn danh",
      "Phân loại 5M": CATEGORY_LABELS[i.category] || i.category,
      "Nội dung": i.content,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ideas");
    XLSX.writeFile(wb, `Workshop_Ideas_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-10 w-10 text-blue-500 animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest">Đang khởi tạo Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2">
            DASHBOARD <span className="text-blue-500">HỘI THẢO</span>
          </h1>
          <div className="flex items-center space-x-3 text-slate-500">
             <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-bold uppercase">LIVE</span>
             <p className="text-sm font-medium">Tư duy đảo ngược - TT KD GPS Đà Nẵng</p>
             {isRefreshing && <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />}
          </div>
        </div>
        <div className="flex space-x-4">
          <Button 
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 px-8 shadow-lg shadow-emerald-900/20 transition-all hover:scale-105"
          >
            <Download className="mr-2 h-5 w-5" /> XUẤT BÁO CÁO EXCEL
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Lightbulb className="h-20 w-20 text-blue-500" />
          </div>
          <CardContent className="pt-8 relative z-10">
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Tổng ý tưởng</p>
            <p className="text-6xl font-black text-white tracking-tighter">{data.stats.totalIdeas}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="h-20 w-20 text-purple-500" />
          </div>
          <CardContent className="pt-8 relative z-10">
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Số lượt gửi</p>
            <p className="text-6xl font-black text-white tracking-tighter">{data.stats.totalParticipants}</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 bg-slate-900 border-slate-800 shadow-2xl">
          <CardHeader className="pb-0 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" /> Phân bổ theo mô hình 5M
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[140px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle" 
                    iconType="circle" 
                    formatter={(val) => <span className="text-[10px] font-bold uppercase text-slate-400">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Live Ticker */}
      <div className="bg-blue-900/20 border border-blue-500/20 rounded-2xl p-6 overflow-hidden relative">
         <div className="flex items-center space-x-6">
            <div className="shrink-0 flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                <span className="text-blue-400 text-xs font-black uppercase tracking-widest">Vừa cập nhật:</span>
            </div>
            <div className="flex-1 overflow-hidden">
                <div className="flex space-x-12 animate-marquee">
                    {data.ideas.slice(0, 8).map((idea: any, idx: number) => (
                        <div key={idx} className="flex items-center space-x-3 shrink-0">
                            <span className="font-black text-blue-500 text-xs bg-blue-500/10 px-2 py-0.5 rounded uppercase">{idea.category}</span>
                            <span className="text-slate-300 font-medium italic text-sm">"{idea.content.substring(0, 80)}{idea.content.length > 80 ? '...' : ''}"</span>
                            <span className="text-slate-600 text-[10px]">— {idea.participantName || 'Ẩn danh'}</span>
                        </div>
                    ))}
                    {data.ideas.length === 0 && <span className="text-slate-500 italic text-sm uppercase font-bold">Chờ đón những ý tưởng đầu tiên từ các đội...</span>}
                </div>
            </div>
         </div>
      </div>

      {/* Main Table Section */}
      <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 py-6 px-8 bg-slate-900/50">
          <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center">
            <span className="bg-blue-600 w-2 h-6 mr-3 rounded-full"></span>
            Chi tiết danh sách ý tưởng
          </CardTitle>
          <div className="flex items-center space-x-4">
             <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-1">
                <Filter className="h-3 w-3 text-slate-500 mr-2" />
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px] border-none bg-transparent h-8 text-xs font-bold text-slate-300 focus:ring-0">
                        <SelectValue placeholder="Lọc theo 5M" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-white">
                        <SelectItem value="ALL" className="text-xs font-bold">Tất cả phân loại</SelectItem>
                        {Object.entries(CATEGORY_LABELS).map(([val, lab]) => (
                            <SelectItem key={val} value={val} className="text-xs font-bold">{lab}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-auto custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-900 z-10">
                <TableRow className="border-slate-800 hover:bg-slate-900">
                  <TableHead className="w-[100px] py-6 px-8 text-slate-500 font-black uppercase text-[10px] tracking-widest">Thời gian</TableHead>
                  <TableHead className="w-[180px] py-6 text-slate-500 font-black uppercase text-[10px] tracking-widest">Người gửi</TableHead>
                  <TableHead className="w-[180px] py-6 text-slate-500 font-black uppercase text-[10px] tracking-widest">Phân loại 5M</TableHead>
                  <TableHead className="py-6 text-slate-500 font-black uppercase text-[10px] tracking-widest">Nội dung ý tưởng đảo ngược</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIdeas.map((idea: any) => (
                  <TableRow key={idea.id} className="border-slate-800/50 hover:bg-slate-800/30 transition-all duration-200">
                    <TableCell className="px-8 font-mono text-[10px] text-slate-600">
                      {format(new Date(idea.createdAt), "HH:mm:ss")}
                    </TableCell>
                    <TableCell className="font-bold text-slate-200">
                      {idea.participantName || <span className="text-slate-600 font-normal italic opacity-50">Ẩn danh</span>}
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          idea.category === 'MAN' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                          idea.category === 'METHOD' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          idea.category === 'MATERIAL' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                          idea.category === 'MACHINE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                      }`}>
                          {idea.category}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300 leading-relaxed py-4 pr-8 text-sm font-medium">
                      {idea.content}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredIdeas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2 opacity-30">
                            <Lightbulb className="h-10 w-10 text-slate-500" />
                            <p className="text-slate-400 italic text-sm font-bold uppercase tracking-widest">Đang chờ ý tưởng đầu tiên...</p>
                        </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
}
