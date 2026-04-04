import { getDashboardOverview, getAMPerformance } from "./dashboard-actions";
import { KPICard } from "@/components/dashboard/kpi-card";
import { StatusFunnel } from "@/components/dashboard/status-funnel";
import { 
  Package2, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  History,
  User as UserIcon,
  Search
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await getDashboardOverview();
  const amPerf = await getAMPerformance();

  if (result.error || !result.stats || !result.statusCounts || !result.topUrgent) {
    return (
      <div className="p-12 text-center bg-red-50 text-red-500 rounded-[2.5rem] border border-red-100/50 shadow-2xl shadow-red-100/20">
         <AlertTriangle className="size-12 mx-auto mb-4 opacity-50" />
         <p className="text-xl font-black">{result.error || "Không thể tải dữ liệu thống kê"}</p>
         <p className="text-sm font-medium opacity-70 italic mt-1">Vui lòng kiểm tra kết nối database hoặc quyền truy cập của bạn.</p>
      </div>
    );
  }

  const { stats, statusCounts, topUrgent } = result;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="space-y-2">
           <h1 className="text-4xl font-black tracking-tighter text-[#003466]">Chào mừng trở lại!</h1>
           <p className="text-gray-500 font-medium">Hệ thống theo dõi tiến độ dự án tập trung - MobiFone Đà Nẵng</p>
        </div>
        
        <div className="flex items-center gap-3">
             <Link 
                href="/du-an" 
                className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl h-12 font-bold px-6 border-gray-100 shadow-sm")}
             >
                <Search className="mr-2 size-4" /> Danh sách dự án
             </Link>
             <Link 
                href="/du-an/tao-moi" 
                className={cn(buttonVariants({ variant: "default" }), "bg-primary shadow-lg shadow-primary/20 rounded-2xl font-bold h-12 px-6")}
             >
                <Package2 className="mr-2 size-4" /> Khởi tạo Dự án
             </Link>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <KPICard 
            title="TỔNG DỰ ÁN" 
            value={stats.totalProjects} 
            icon={Package2} 
            description="Đang hoạt động" 
            trend="+12%" 
         />
         <KPICard 
            title="DOANH THU" 
            value={`${stats.totalRevenue.toLocaleString()} Tr.đ`} 
            icon={DollarSign} 
            description="Kỳ vọng tổng" 
            variant="success"
         />
         <KPICard 
            title="ĐÃ KÝ HỢP ĐỒNG" 
            value={stats.signedProjects} 
            icon={CheckCircle2} 
            description="Thành công" 
            variant="warning"
         />
         <KPICard 
            title="CẦN CHĂM SÓC GẤP" 
            value={stats.urgentCare} 
            icon={AlertTriangle} 
            description="QUÁ 15 NGÀY" 
            variant="urgent"
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Center Column - Funnel Chart */}
         <div className="lg:col-span-2">
            <StatusFunnel data={statusCounts} />
         </div>

         {/* Side Column - Xếp hạng AM */}
         <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] border-none shadow-2xl shadow-gray-200/20 overflow-hidden h-full flex flex-col">
                <div className="bg-gray-50/50 p-8 border-b border-gray-50">
                    <div className="flex items-center gap-2 mb-1">
                       <TrendingUp className="size-4 text-green-600" />
                       <h2 className="text-xl font-black text-[#003466]">Khu vực & Nhân sự</h2>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Ranking top 5 theo doanh thu</p>
                </div>
                
                <div className="flex-1 overflow-auto p-4 py-6">
                    <Table>
                      <TableBody>
                         {amPerf.data?.slice(0, 5).map((am: any, i: number) => (
                             <TableRow key={i} className="hover:bg-gray-50 border-none group transition-all">
                                <TableCell className="py-4 pl-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("size-8 rounded-xl flex items-center justify-center font-black text-xs", i === 0 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-400")}>
                                            {i + 1}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-800">{am.name}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">{am.signed} HĐ ký</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <div className="flex flex-col items-end">
                                        <div className="font-black text-[#003466]">{am.revenue.toLocaleString()} Tr.đ</div>
                                        <Badge className="text-[9px] bg-green-100 text-green-700 border-none h-4 px-1">{am.count} DA</Badge>
                                    </div>
                                </TableCell>
                             </TableRow>
                         ))}
                      </TableBody>
                    </Table>
                </div>

                <div className="p-6 bg-gray-50/30 border-t border-gray-50">
                    <Link 
                        href="/admin/nhan-vien" 
                        className={cn(buttonVariants({ variant: "ghost" }), "w-full rounded-2xl h-12 text-blue-600 hover:text-blue-700 font-bold flex items-center justify-center")}
                    >
                        Xem chi tiết nhân sự <ArrowRight className="size-4 ml-2" />
                    </Link>
                </div>
            </div>
         </div>
      </div>

      {/* TOP Dự án cần chăm sóc gấp Section */}
      <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
             <div className="size-8 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                 <History className="size-5" />
             </div>
             <h2 className="text-2xl font-black text-[#003466]">Độ Ưu tiên: Cần chăm sóc ngay</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {topUrgent.map((p, i) => (
                 <Card key={i} className="rounded-[2.5rem] border-none shadow-xl shadow-gray-200/20 bg-white group hover:scale-105 transition-all duration-500 overflow-hidden">
                    <div className="h-2 w-full bg-red-500/20 group-hover:bg-red-500/80 transition-colors" />
                    <CardContent className="p-8 pt-6 space-y-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.khachHang.ten}</span>
                            <h3 className="text-lg font-black text-[#003466] truncate group-hover:text-primary transition-colors">{p.tenDuAn}</h3>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                             <div className="flex items-center gap-2">
                                 <div className="size-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                     <UserIcon className="size-3" />
                                 </div>
                                 <span className="text-[11px] font-bold text-gray-600">{p.am.name}</span>
                             </div>
                             <Badge className="bg-red-50 text-red-700 border-none animate-pulse font-black text-[9px] uppercase">URGENT</Badge>
                        </div>

                        <Separator className="bg-gray-100/50" />

                        <div className="flex items-center justify-between">
                            <Link 
                                href={`/du-an/${p.id}`} 
                                className="text-gray-400 hover:text-primary font-bold text-xs flex items-center h-6"
                            >
                                Chi tiết <ArrowRight className="size-3 ml-1" />
                            </Link>
                            <span className="text-[10px] font-black text-red-400 uppercase italic">
                                {p.ngayChamsocCuoiCung ? `${Math.floor((new Date().getTime() - new Date(p.ngayChamsocCuoiCung).getTime())/(1000*60*60*24))} NGÀY TRƯỚC` : "CHƯA CS"}
                            </span>
                        </div>
                    </CardContent>
                 </Card>
             ))}
          </div>
      </div>
    </div>
  );
}

function Separator({ className }: { className?: string }) {
    return <div className={cn("h-px w-full", className)} />;
}
