import { getDuAnDetail } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  History, 
  MapPin, 
  Package, 
  User as UserIcon, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  AlertCircle,
  FileText,
  MessageSquare,
  Activity,
  UserCheck2,
  ChevronRight,
  Pencil
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TaskLogTimeline } from "@/components/du-an/task-log-timeline";
import { QuickUpdateModalTrigger } from "./quick-update-trigger";
import { TrangThaiDuAn } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ProjectComments } from "@/components/du-an/project-comments";
import { Separator } from "@/components/ui/separator";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: project, error } = await getDuAnDetail(Number(id));
  
  const sessionRes = await (auth.api as any).getSession({
    headers: await headers()
  });
  const currentUser = sessionRes?.user;

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="size-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center border border-red-100 shadow-xl shadow-red-100/50">
           <AlertCircle className="size-10" />
        </div>
        <h1 className="text-2xl font-black text-[#003466]">{error || "Dự án không tồn tại"}</h1>
        <Link 
            href="/du-an" 
            className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl h-12 font-bold px-6 shadow-sm border-gray-100")}
        >
            <ArrowLeft className="mr-2 size-4" /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  const getStatusBadge = (state: TrangThaiDuAn) => {
    if (!state) return null;
    const colors: any = {
        MOI: "bg-gray-100 text-gray-600",
        DANG_LAM_VIEC: "bg-blue-100 text-blue-600",
        DA_DEMO: "bg-purple-100 text-purple-600",
        DA_GUI_BAO_GIA: "bg-yellow-100 text-yellow-700",
        DA_KY_HOP_DONG: "bg-green-100 text-green-700",
        THAT_BAI: "bg-red-100 text-red-600",
    };
    const colorClass = colors[state] || "bg-gray-100";
    return <Badge className={cn("text-xs font-black border-none px-3 uppercase", colorClass)}>{state?.replace(/_/g, ' ') || '...'}</Badge>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Dynamic Breadcrumbs & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex flex-col gap-2">
            <Link href="/du-an" className="flex items-center text-xs text-gray-400 font-bold hover:text-primary transition-colors">
                 DANH SÁCH DỰ ÁN <ChevronRight className="size-3 mx-1" /> CHI TIẾT
            </Link>
            <div className="flex items-center gap-4">
               <div className="p-3 bg-gradient-to-br from-primary to-blue-700 rounded-3xl text-white shadow-xl shadow-primary/20">
                    <Package className="size-8" />
               </div>
               <div>
                  <h1 className="text-4xl font-black tracking-tighter text-[#003466] leading-tight">
                    {project.tenDuAn}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                     <Badge className="bg-primary/10 text-primary border-none text-[10px] uppercase font-black">{project.linhVuc}</Badge>
                     <span className="text-[10px] text-gray-400 font-black">•</span>
                     <span className="text-[11px] font-bold text-gray-400">ID: {project.id}</span>
                  </div>
               </div>
            </div>
        </div>

        <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-2xl border-gray-100 shadow-sm h-12 font-bold px-6">
                <Pencil className="size-4 mr-2" /> Chỉnh sửa
             </Button>
             <QuickUpdateModalTrigger project={project} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-gray-100/50 p-1.5 rounded-[2rem] border border-gray-100 mb-8 h-14 w-full justify-start overflow-auto">
                    <TabsTrigger value="overview" className="rounded-[1.5rem] px-8 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                        <Activity className="size-4 mr-2" /> Thông tin chung
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="rounded-[1.5rem] px-8 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                        <History className="size-4 mr-2" /> Nhật ký ({project.nhatKy?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="rounded-[1.5rem] px-8 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                        <MessageSquare className="size-4 mr-2" /> Bình thảo luận ({project.binhLuan?.length || 0})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <Card className="border-gray-100 shadow-2xl shadow-gray-200/20 rounded-[2.5rem] overflow-hidden border-none ring-1 ring-gray-100">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-50 pb-6">
                             <div className="flex items-center gap-3">
                                 <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                     <FileText className="size-5" />
                                 </div>
                                 <CardTitle className="text-xl font-black text-[#003466]">Đặc tả Dự án</CardTitle>
                             </div>
                        </CardHeader>
                        <CardContent className="p-8">
                             <div className="grid grid-cols-2 gap-y-10 gap-x-12">
                                 <div className="space-y-3">
                                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Khách hàng</label>
                                     <div className="flex flex-col gap-1">
                                         <span className="font-bold text-lg text-gray-800">{project.khachHang.ten}</span>
                                         <Badge className="w-fit bg-gray-100 text-gray-500 border-none text-[10px] uppercase font-bold">{project.khachHang.phanLoai}</Badge>
                                     </div>
                                 </div>
                                 <div className="space-y-3">
                                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm / Dịch vụ</label>
                                     <div className="flex flex-col gap-1">
                                         <span className="font-bold text-lg text-gray-800">{project.sanPham.tenChiTiet}</span>
                                         <span className="text-xs text-gray-400 font-medium italic">Thuộc nhóm: {project.sanPham.nhom}</span>
                                     </div>
                                 </div>
                                 <div className="space-y-3">
                                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AM Phụ trách</label>
                                     <div className="flex items-center gap-2">
                                         <div className="size-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-black">
                                             {project.am.name[0]}
                                         </div>
                                         <span className="font-bold text-gray-800">{project.am.name}</span>
                                     </div>
                                 </div>
                                 <div className="space-y-3">
                                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chuyên viên hỗ trợ</label>
                                     <div className="flex items-center gap-2">
                                        {project.chuyenVien ? (
                                            <>
                                                <div className="size-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-black">
                                                    {project.chuyenVien.name[0]}
                                                </div>
                                                <span className="font-bold text-gray-800">{project.chuyenVien.name}</span>
                                            </>
                                        ) : (
                                            <span className="text-sm font-medium text-gray-400 italic">Chưa phân công</span>
                                        )}
                                     </div>
                                 </div>
                                 <div className="space-y-3">
                                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mã/Số HĐ</label>
                                     <div className="flex items-center gap-2 font-mono text-sm font-bold text-gray-600">
                                         {project.maHopDong || "N/A"} / {project.soHopDong || "N/A"}
                                     </div>
                                 </div>
                                 <div className="space-y-3">
                                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Doanh thu dự kiến</label>
                                     <div className="flex items-center gap-2 text-xl font-black text-[#003466]">
                                         <DollarSign className="size-5 text-green-600" /> {project.tongDoanhThuDuKien.toLocaleString()} <span className="text-xs text-gray-400 uppercase">Tr.đ</span>
                                     </div>
                                 </div>
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="timeline" className="pt-4">
                    <TaskLogTimeline logs={project.nhatKy} />
                </TabsContent>

                <TabsContent value="comments" className="pt-4">
                    <ProjectComments 
                        projectId={project.id} 
                        comments={project.binhLuan as any} 
                        currentUser={currentUser} 
                    />
                </TabsContent>
            </Tabs>
        </div>

        {/* Right Column - Status & Cards */}
        <div className="space-y-8">
            <Card className="border-none shadow-2xl shadow-gray-200/20 rounded-[2.5rem] bg-gradient-to-br from-white to-gray-50/50 overflow-hidden ring-1 ring-gray-100">
                <CardHeader className="pb-4">
                     <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Trạng thái HIỆN TẠI</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col gap-2">
                        {getStatusBadge(project.trangThaiHienTai)}
                        <h2 className="text-2xl font-black text-[#003466] leading-tight">
                            {project.trangThaiHienTai.replace(/_/g, ' ')}
                        </h2>
                    </div>
                    
                    <Separator className="bg-gray-100" />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                <Calendar className="size-4 text-primary" /> Bắt đầu từ
                            </div>
                            <span className="text-sm font-black text-gray-800">{new Date(project.ngayBatDau).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex flex-wrap gap-3 justify-between">
                             <div className="flex flex-col items-center">
                                 <span className="text-[9px] font-black text-primary/60 uppercase">Tuần</span>
                                 <span className="text-lg font-black text-primary leading-none">{project.tuan}</span>
                             </div>
                             <div className="flex flex-col items-center">
                                 <span className="text-[9px] font-black text-primary/60 uppercase">Tháng</span>
                                 <span className="text-lg font-black text-primary leading-none">{project.thang}</span>
                             </div>
                             <div className="flex flex-col items-center">
                                 <span className="text-[9px] font-black text-primary/60 uppercase">Quý</span>
                                 <span className="text-lg font-black text-primary leading-none">{project.quy}</span>
                             </div>
                             <div className="flex flex-col items-center">
                                 <span className="text-[9px] font-black text-primary/60 uppercase">Năm</span>
                                 <span className="text-lg font-black text-primary leading-none">{project.nam}</span>
                             </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-2xl shadow-gray-200/20 rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-gray-100">
                <CardHeader className="pb-4">
                     <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Sức khỏe Dự án</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-6 bg-red-50/50 rounded-[2rem] border border-red-100/50">
                        <div className="flex flex-col gap-2">
                             <div className="flex items-center justify-between">
                                 <span className="text-[10px] font-black text-red-700/60 uppercase">Chăm sóc cuối</span>
                                 <AlertCircle className="size-4 text-red-600 animate-pulse" />
                             </div>
                             <span className="text-xl font-black text-red-700">
                                {project.ngayChamsocCuoiCung ? new Date(project.ngayChamsocCuoiCung).toLocaleDateString('vi-VN') : "Chưa chăm sóc"}
                             </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                         <div className="flex items-center gap-3">
                             <div className="size-10 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center font-black">
                                 {project.nhatKy?.length || 0}
                             </div>
                             <div>
                                 <p className="text-sm font-black text-gray-800">Lượt nhật ký</p>
                                 <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Tổng số cập nhật tiến độ</p>
                             </div>
                         </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
