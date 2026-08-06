import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Users2, Package2 } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BoardOverview } from "@/components/dashboard/board-overview";
import { AMPerformanceTab } from "@/components/dashboard/am-dashboard";

export default function DashboardLoading() {
  const emptyBoardData = {
    revenueMetrics: {
      dtTongDuAn: 0,
      dtThangDaKyValue: 0,
      dtThangDaKyPerc: 0,
      dtDuKienThangValue: 0,
      dtDuKienThangPerc: 0,
      dtTheoQuyValue: 0,
      dtTheoQuyPerc: 0,
      dtDuKienQuyValue: 0,
      dtDuKienQuyPerc: 0,
      dtTheoNamValue: 0,
      dtTheoNamPerc: 0,
      dtDuKienNamValue: 0,
      dtDuKienNamPerc: 0
    },
    projectMetrics: {
      tongSoDuAn: 0,
      duAnTrongDiem: 0,
      duAnKyVong: 0,
      hienTrangThang: [
        { label: "Mới", count: 0 },
        { label: "Đang làm việc", count: 0 },
        { label: "Đã demo", count: 0 },
        { label: "Đã gửi báo giá", count: 0 },
        { label: "Đã ký HĐ", count: 0 },
        { label: "Thất bại", count: 0 }
      ],
      thongKeTheoBuoc: [],
      canhBaoTheoTo: [
        { label: "Tổ 1", count: 0 },
        { label: "Tổ 2", count: 0 },
        { label: "Tổ 3", count: 0 },
        { label: "Tổ dự án", count: 0 }
      ]
    }
  };

  const emptyAmPerf = [
    {
      id: "dummy-1",
      name: "Đang tải...",
      soLuongTiepCan: 0,
      soHopDongDaKy: 0,
      doanhThuDaKy: 0,
      doanhThuKyVong: 0,
      doanhThuDuKienThang: 0
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Breadcrumb items={[]} />
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[#191c1e] tracking-tight mb-1">
            Dashboard Tổng quan
          </h2>
          <p className="text-[#44474d] text-sm md:text-base font-medium">
            Đang tải dữ liệu...
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 opacity-50 pointer-events-none">
          <Link
            href="#"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-full font-bold px-4 md:px-6 py-2 md:py-2.5 h-auto md:h-[38px] border-[#c5c6ce] text-[#191c1e] hover:bg-[#eceef0] text-xs md:text-sm"
            )}
          >
            Danh sách dự án
          </Link>
          <Link
            href="#"
            className="px-4 md:px-6 py-2 md:py-2.5 h-auto md:h-[38px] rounded-full bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-bold text-[11px] md:text-[13px] flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Package2 className="size-4" />
            Tạo dự án mới
          </Link>
        </div>
      </section>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-[#f2f4f6] p-1 rounded-2xl w-fit gap-1 shadow-sm border border-[#eceef0]">
          <TabsTrigger value="overview" className="rounded-xl px-6 py-2 text-xs font-black uppercase tracking-tight flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#0058bc] data-[state=active]:shadow-sm transition-all">
            <LayoutDashboard className="size-3.5" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="am" className="rounded-xl px-6 py-2 text-xs font-black uppercase tracking-tight flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#0058bc] data-[state=active]:shadow-sm transition-all">
            <Users2 className="size-3.5" />
            Dashboard AM
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-10 m-0 focus-visible:outline-none pt-4">
          <div className="opacity-80">
            <BoardOverview data={emptyBoardData} />
          </div>
        </TabsContent>

        <TabsContent value="am" className="m-0 focus-visible:outline-none">
          <div className="opacity-80">
            <AMPerformanceTab amPerf={emptyAmPerf} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
