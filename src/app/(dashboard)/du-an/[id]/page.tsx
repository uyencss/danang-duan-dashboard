import { getDuAnDetail } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  History,
  Package,
  Calendar,
  DollarSign,
  AlertCircle,
  FileText,
  MessageSquare,
  MessagesSquare,
  Activity,
  ChevronRight,
  Pencil,
  Star,
  Banknote,
  Users,
  Building2,
  UserCheck,
  Flag,
  Wrench,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TaskLogTable } from "@/components/du-an/task-log-table";
import { QuickUpdateModalTrigger } from "./quick-update-trigger";
import { TrangThaiDuAn } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ProjectComments } from "@/components/du-an/project-comments";
import { ProjectChat } from "@/components/du-an/project-chat";
import { ProjectFiles } from "@/components/du-an/project-files";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { EditProjectTrigger } from "./edit-project-trigger";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  MOI: { label: "Mới", className: "bg-blue-100 text-blue-700" },
  DANG_LAM_VIEC: { label: "Đang làm việc", className: "bg-amber-100 text-amber-700" },
  DA_DEMO: { label: "Đã Demo", className: "bg-purple-100 text-purple-700" },
  DA_GUI_BAO_GIA: { label: "Gửi báo giá", className: "bg-blue-100 text-blue-700" },
  DA_KY_HOP_DONG: { label: "Đã ký HĐ", className: "bg-green-100 text-green-700" },
  THAT_BAI: { label: "Thất bại", className: "bg-red-100 text-red-700" },
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: projectData, error } = await getDuAnDetail(Number(id));
  const project = projectData as any;

  const sessionRes = await (auth.api as any).getSession({ headers: await headers() });
  const currentUser = sessionRes?.user;

  const allSystemUsers = await prisma.user.findMany({
    select: { id: true, name: true }
  });

  const allFiles = project?.nhatKy?.flatMap((nk: any) =>
    nk.files?.map((f: any) => ({ ...f, log: { user: nk.user } })) || []
  ) || [];

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="size-16 bg-red-50 text-[#ba1a1a] rounded-xl flex items-center justify-center border border-red-100">
          <AlertCircle className="size-10" />
        </div>
        <h1 className="text-2xl font-black text-[#191c1e]">{error || "Dự án không tồn tại"}</h1>
        <Link
          href="/du-an"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl h-11 font-bold px-6")}
        >
          <ArrowLeft className="mr-2 size-4" /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[project.trangThaiHienTai] || STATUS_STYLES.MOI;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "CRM & DS Dự án", href: "/du-an" },
          { label: "Chi tiết Dự án" },
        ]}
      />

      {/* Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>

          {/* Title */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-[#0058bc] to-[#0070eb] shadow-[0_8px_16px_rgba(0,180,216,0.25)] border border-blue-400/20 rounded-2xl text-white">
              <Package className="size-7 drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#191c1e] leading-tight">
                {project.tenDuAn}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("px-2 py-1 rounded text-[10px] font-black uppercase", statusStyle.className)}>
                  {statusStyle.label}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">{project.linhVuc}</span>
                <span className="text-[10px] text-slate-400 font-black">• ID: {project.id}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <EditProjectTrigger project={project} />
          <QuickUpdateModalTrigger project={project} />
        </div>
      </div>

      {/* Meta Row - Redesigned Dashboard-style Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-0 bg-white rounded-3xl border border-[#c5c6ce]/20 shadow-xl shadow-slate-200/40 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-100">
        <div className="p-5 flex items-start gap-3 hover:bg-slate-50 transition-colors">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Building2 className="size-4" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Khách hàng</p>
            <p className="font-bold text-[#191c1e] text-sm leading-tight">{project.khachHang.ten}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              {project.khachHang.phanLoai === "CHINH_PHU" ? "Chính phủ/ Sở ban ngành" : project.khachHang.phanLoai === "CONG_AN" ? "Công an" : "Doanh nghiệp"}
            </p>
          </div>
        </div>

        <div className="p-5 flex items-start gap-3 hover:bg-slate-50 transition-colors">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
            <Package className="size-4" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sản phẩm</p>
            <p className="font-bold text-[#191c1e] text-sm leading-tight">{project.sanPham.tenChiTiet}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{project.sanPham.nhom}</p>
          </div>
        </div>

        <div className="p-5 flex items-start gap-3 hover:bg-slate-50 transition-colors">
          <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
            <UserCircle className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AM Phụ trách</p>
            {project.am ? (
              <div className="flex items-center gap-2">
                <p className="font-bold text-[#191c1e] text-sm">{project.am.name}</p>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 italic font-medium">Chưa phân công</span>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Quản lý trực tiếp</p>
          </div>
        </div>

        <div className="p-5 flex items-start gap-3 hover:bg-slate-50 transition-colors">
          <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
            <UserCheck className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chuyên viên hỗ trợ</p>
            {project.chuyenVien ? (
              <div className="flex items-center gap-2">
                <p className="font-bold text-[#191c1e] text-sm">{project.chuyenVien.name}</p>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 italic font-medium">Chưa phân công</span>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Hỗ trợ kỹ thuật</p>
          </div>
        </div>

        <div className="p-5 flex items-center bg-slate-50/30">
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Tiến độ quy trình</p>
              <Flag className="size-3 text-blue-400" />
            </div>
            {project.hienTaiBuoc ? (
              <div className="px-3 py-2 bg-gradient-to-r from-[#0058bc] to-[#0070eb] text-white rounded-2xl shadow-lg shadow-blue-500/20 border border-blue-400/20 flex items-center justify-center">
                <span className="text-[11px] font-black uppercase tracking-tight italic">{project.hienTaiBuoc}</span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic bg-white px-3 py-2 rounded-2xl border border-slate-100 flex items-center justify-center">Chưa bắt đầu</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-[#f2f4f6] p-1 rounded-full border border-[#eceef0] mb-6 h-12 w-full justify-start overflow-x-auto gap-1">
              <TabsTrigger
                value="overview"
                className="rounded-full px-6 h-full font-bold text-[10px] uppercase tracking-widest text-[#8a8d93] data-[state=active]:bg-white data-[state=active]:text-[#191c1e] data-[state=active]:shadow-sm transition-all"
              >
                <Activity className="size-3.5 mr-2" /> Thông tin chung
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="rounded-full px-6 h-full font-bold text-[10px] uppercase tracking-widest text-[#8a8d93] data-[state=active]:bg-white data-[state=active]:text-[#191c1e] data-[state=active]:shadow-sm transition-all"
              >
                <History className="size-3.5 mr-2" /> Nhật ký ({project.nhatKy?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="rounded-full px-6 h-full font-bold text-[10px] uppercase tracking-widest text-[#8a8d93] data-[state=active]:bg-white data-[state=active]:text-[#191c1e] data-[state=active]:shadow-sm transition-all"
              >
                <MessageSquare className="size-3.5 mr-2" /> Thảo luận ({project.binhLuan?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="rounded-full px-6 h-full font-bold text-[10px] uppercase tracking-widest text-[#8a8d93] data-[state=active]:bg-white data-[state=active]:text-[#191c1e] data-[state=active]:shadow-sm transition-all"
              >
                <MessagesSquare className="size-3.5 mr-2" /> Chat
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="rounded-full px-6 h-full font-bold text-[10px] uppercase tracking-widest text-[#8a8d93] data-[state=active]:bg-white data-[state=active]:text-[#191c1e] data-[state=active]:shadow-sm transition-all"
              >
                <FileText className="size-3.5 mr-2" /> Tài liệu ({allFiles.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card className="border-[#c5c6ce]/10 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="bg-[#f2f4f6] border-b border-[#eceef0] py-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0058bc]/10 text-[#0058bc] rounded-lg">
                      <FileText className="size-4" />
                    </div>
                    <CardTitle className="text-base font-black text-[#191c1e]">Đặc tả Dự án</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#44474d] uppercase tracking-widest">
                        Doanh thu theo tháng
                      </label>
                      <p className="font-mono text-sm font-bold text-[#0058bc]">
                        {project.doanhThuTheoThang?.toLocaleString() || "0"} <span className="text-[10px] opacity-60">Tr.đ</span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <span className="bg-[#0058bc]/10 text-[#0058bc] text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-widest">
                        {project.khachHang.phanLoai === "CHINH_PHU" ? "Chính phủ/ Sở ban ngành" : project.khachHang.phanLoai === "CONG_AN" ? "Công an" : "Doanh nghiệp"}
                      </span>
                      <div className="flex items-center gap-2 text-xl font-black text-[#0058bc]">
                        <DollarSign className="size-4 text-green-600" />
                        {project.tongDoanhThuDuKien.toLocaleString()}
                        <span className="text-xs text-slate-400 uppercase font-bold">Tr.đ</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#44474d] uppercase tracking-widest">
                        Ngày bắt đầu
                      </label>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-[#0058bc]" />
                        <span className="text-sm font-bold text-[#191c1e]">
                          {new Date(project.ngayBatDau).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#44474d] uppercase tracking-widest">
                        Chăm sóc cuối
                      </label>
                      <span className={cn(
                        "text-sm font-bold",
                        project.ngayChamsocCuoiCung ? "text-[#191c1e]" : "text-[#ba1a1a]"
                      )}>
                        {project.ngayChamsocCuoiCung
                          ? new Date(project.ngayChamsocCuoiCung).toLocaleDateString("vi-VN")
                          : "Chưa chăm sóc"}
                      </span>
                    </div>
                  </div>

                  {/* Time context */}
                  <div className="mt-8 p-4 bg-[#0058bc]/5 rounded-xl border border-[#0058bc]/10 flex flex-wrap gap-4">
                    {[
                      { label: "Tuần", value: project.tuan },
                      { label: "Tháng", value: project.thang },
                      { label: "Quý", value: project.quy },
                      { label: "Năm", value: project.nam },
                    ].map((item) => (
                      <div key={item.label} className="flex flex-col items-center min-w-[60px]">
                        <span className="text-[9px] font-black text-[#0058bc]/60 uppercase">{item.label}</span>
                        <span className="text-xl font-black text-[#0058bc] leading-none">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="pt-2">
              <TaskLogTable logs={project.nhatKy} />
            </TabsContent>

            <TabsContent value="comments" className="pt-2">
              <ProjectComments
                projectId={project.id}
                comments={project.binhLuan as any}
                currentUser={currentUser}
                allSystemUsers={allSystemUsers}
              />
            </TabsContent>

            <TabsContent value="chat" className="pt-2">
              <ProjectChat
                projectId={project.id}
                currentUser={
                  currentUser
                    ? {
                      id: currentUser.id,
                      name: currentUser.name,
                      role: currentUser.role,
                    }
                    : null
                }
              />
            </TabsContent>

            <TabsContent value="documents" className="pt-2">
              <ProjectFiles files={allFiles} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Financial Card */}
          <div className="bg-gradient-to-br from-[#0058bc] to-[#0d2a52] text-white p-6 rounded-xl shadow-[0_10px_20px_rgba(0,180,216,0.15)] relative overflow-hidden border border-blue-400/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/5 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none"></div>
            <p className="relative z-10 text-xs font-black uppercase tracking-widest text-cyan-200/70 mb-2 drop-shadow-sm">
              Doanh thu dự kiến
            </p>
            <h2 className="text-4xl font-black text-white leading-none">
              {project.tongDoanhThuDuKien.toLocaleString()} <span className="text-xl text-white/60">Tr.đ</span>
            </h2>
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50 text-xs uppercase font-bold">Trạng thái HĐ</span>
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase", statusStyle.className)}>
                  {statusStyle.label}
                </span>
              </div>
              {project.maHopDong && (
                <div className="flex justify-between">
                  <span className="text-white/50 text-xs uppercase font-bold">Mã HĐ</span>
                  <span className="font-mono text-xs font-bold">{project.maHopDong}</span>
                </div>
              )}
            </div>
          </div>

          {/* Key Project Status - Trong Diem */}
          <div className={cn(
            "p-4 rounded-xl flex items-center justify-center gap-3 border shadow-sm",
            project.isTrongDiem
              ? "bg-red-50 border-red-200 text-red-600"
              : "bg-blue-50/50 border-blue-100/50 text-blue-600/30"
          )}>
            <Star className={cn("size-6", project.isTrongDiem ? "fill-current" : "")} />
            {project.isTrongDiem && (
              <span className="font-black uppercase tracking-widest text-sm">
                Dự án Trọng điểm
              </span>
            )}
          </div>

          {/* Key Project Status - Ky Vong */}
          <div className={cn(
            "p-4 rounded-xl flex items-center justify-center gap-3 border shadow-sm",
            project.isKyVong
              ? "bg-emerald-50 border-emerald-200 text-emerald-600"
              : "bg-blue-50/50 border-blue-100/50 text-blue-600/30"
          )}>
            <Banknote className={cn("size-6", project.isKyVong ? "fill-emerald-100/50" : "")} />
            {project.isKyVong && (
              <span className="font-black uppercase tracking-widest text-sm">
                Dự án Kỳ vọng
              </span>
            )}
          </div>

          {/* Health Card */}
          <Card className="border-[#c5c6ce]/10 shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-black text-[#44474d] uppercase tracking-widest">
                Sức khỏe Dự án
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="p-4 bg-red-50/50 rounded-xl border border-red-100/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-[#ba1a1a]/60 uppercase">Chăm sóc cuối</span>
                  <AlertCircle className="size-4 text-[#ba1a1a] animate-pulse" />
                </div>
                <span className="text-lg font-black text-[#ba1a1a]">
                  {project.ngayChamsocCuoiCung
                    ? new Date(project.ngayChamsocCuoiCung).toLocaleDateString("vi-VN")
                    : "Chưa chăm sóc"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center font-black text-lg">
                  {project.nhatKy?.length || 0}
                </div>
                <div>
                  <p className="text-sm font-black text-[#191c1e]">Lượt nhật ký</p>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Tổng số cập nhật tiến độ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
