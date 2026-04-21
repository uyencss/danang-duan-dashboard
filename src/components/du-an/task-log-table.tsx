"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Pencil, 
  Trash2, 
  Clock, 
  MessageSquareQuote,
  User as UserIcon,
  Calendar,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateNhatKy, deleteNhatKy, revokeStepLog } from "@/app/(dashboard)/du-an/actions";
import { cn } from "@/lib/utils";
import { TrangThaiDuAn } from "@prisma/client";
import { format } from "date-fns";
import { SmartDateInput } from "@/components/ui/smart-date-input";


interface TaskLogTableProps {
  logs: any[];
}

export function TaskLogTable({ logs }: TaskLogTableProps) {
  const [editingLog, setEditingLog] = useState<any>(null);
  const [newContent, setNewContent] = useState("");
  const [newStatus, setNewStatus] = useState<TrangThaiDuAn>(TrangThaiDuAn.MOI);
  const [newDate, setNewDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Sort logs by time (newest first)
  const sortedLogs = [...(logs || [])].sort((a, b) => 
    new Date(b.ngayGio).getTime() - new Date(a.ngayGio).getTime()
  );

  const STATUS_LABELS: Record<string, string> = {
    MOI: "Mới",
    DANG_LAM_VIEC: "Đang làm việc",
    DA_DEMO: "Đã demo",
    DA_GUI_BAO_GIA: "Đã gửi báo giá",
    DA_KY_HOP_DONG: "Đã ký hợp đồng",
    THAT_BAI: "Thất bại",
  };

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
    const colorClass = colors[state] || "bg-gray-100 text-gray-600";
    return <Badge className={cn("text-[10px] font-black border-none px-2 py-0.5", colorClass)}>{STATUS_LABELS[state] || state}</Badge>;
  };

  const handleEditClick = (log: any) => {
    setEditingLog(log);
    setNewContent(log.noiDungChiTiet);
    setNewStatus(log.trangThaiMoi);
    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
    const d = new Date(log.ngayGio);
    const offset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - offset).toISOString().slice(0, 16);
    setNewDate(localISOTime);
  };

  const handleUpdate = async () => {
    if (!newContent.trim()) return;
    setLoading(true);
    const result = await updateNhatKy(editingLog.id, newContent, newStatus, new Date(newDate));
    if (result.success) {
      toast.success("Cập nhật nhật ký thành công");
      setEditingLog(null);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleRevoke = async () => {
    if (!editingLog?.id) return;
    if (!confirm(`Bạn có chắc muốn thu hồi bước "${editingLog.buoc}"? Dự án sẽ quay lại bước trước đó.`)) return;
    
    setLoading(true);
    const result = await revokeStepLog(editingLog.id);
    if (result.success) {
      toast.success("Đã thu hồi bước thành công!");
      setEditingLog(null);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa nhật ký này?")) return;
    const result = await deleteNhatKy(id);
    if (result.success) {
      toast.success("Đã xóa nhật ký");
    } else {
      toast.error(result.error);
    }
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
        <MessageSquareQuote className="size-10 mb-2 opacity-20" />
        <p className="font-medium text-sm">Chưa có nhật ký công việc nào.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#eceef0] shadow-sm w-full">
      <div className="overflow-x-auto">
        <Table className="table-fixed w-full min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-[#f8fafc] hover:bg-[#f8fafc]">
              <TableHead className="w-[160px] text-[10px] font-black uppercase text-[#44474d] tracking-widest pl-6 py-4">Thời gian</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-[#44474d] tracking-widest py-4">Nội dung cập nhật</TableHead>
              <TableHead className="w-[200px] text-[10px] font-black uppercase text-[#44474d] tracking-widest py-4 text-center">Người cập nhật</TableHead>
              <TableHead className="w-[120px] text-[10px] font-black uppercase text-[#44474d] tracking-widest pr-6 py-4 text-center">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLogs.map((log) => (
              <TableRow 
                key={log.id} 
                className={cn(
                  "hover:bg-slate-50/50 border-b border-[#f2f4f6] group transition-all",
                  log.status === "REJECTED" && "bg-slate-100/80 grayscale-[0.3] opacity-80",
                  log.status === "PENDING" && "bg-amber-50/30"
                )}
              >
                <TableCell className="pl-6 py-4 align-top">
                  <div className="flex flex-col gap-1 pr-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#191c1e]">
                      <Clock className="size-3 text-[#0058bc]" />
                      {new Date(log.ngayGio).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 ml-4.5">
                      {new Date(log.ngayGio).toLocaleDateString('vi-VN')}
                    </span>
                    <div className="mt-1 ml-4.5">
                      {getStatusBadge(log.trangThaiMoi)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4 align-top">
                  <div className="whitespace-normal break-words overflow-hidden text-sm font-medium text-slate-700 leading-relaxed pr-8">
                    {log.buoc && (
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={cn(
                            "text-[10px] uppercase font-black px-2 py-0.5 rounded-lg flex items-center gap-1",
                            log.status === "REJECTED" 
                              ? "bg-red-50 text-red-600 border-red-200" 
                              : log.status === "PENDING"
                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                        )}>
                          <CheckCircle2 className="size-3" />
                          {log.buoc}
                        </Badge>

                        {log.status === "REJECTED" && (
                          <div className="flex flex-col items-center gap-0 ml-auto mr-4">
                            <Badge className="bg-[#ba1a1a] text-white border-none text-[10px] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="size-3" />
                              Không duyệt
                            </Badge>
                          </div>
                        )}
                        
                        {log.status === "PENDING" && (
                          <div className="flex flex-col items-center gap-0 ml-auto mr-4">
                            <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <Clock className="size-3" />
                              Chờ duyệt
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                    {log.noiDungChiTiet}
                    {log.files && log.files.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {log.files.map((file: any) => (
                           <a 
                             key={file.id} 
                             href={`/api/uploads/${(file as any).url || (file as any).filePath?.replace('/uploads/', '')}`} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             download={file.name}
                             className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-[#0058bc] rounded-md text-[10px] font-bold border border-blue-100 hover:bg-blue-100 transition-colors"
                           >
                             <FileText className="size-3" />
                             {file.name}
                           </a>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4 align-top text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="size-7 bg-[#0058bc]/10 rounded-full flex items-center justify-center text-[#0058bc] shrink-0">
                      <UserIcon className="size-3.5" />
                    </div>
                    <span className="text-[11px] font-black text-[#191c1e] truncate">{log.user?.name || "Hệ thống"}</span>
                  </div>
                </TableCell>
                <TableCell className="pr-6 py-4 align-top text-center">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8 rounded-lg hover:bg-[#0058bc]/10 hover:text-[#0058bc]"
                      onClick={() => handleEditClick(log)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8 rounded-lg hover:bg-red-50 hover:text-red-500"
                      onClick={() => handleDelete(log.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingLog} onOpenChange={(open) => !open && setEditingLog(null)}>
        <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="px-6 py-4 bg-[#f2f4f6] border-b border-[#eceef0]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#0058bc]/10 text-[#0058bc] rounded-lg">
                <Pencil className="size-4" />
              </div>
              <DialogTitle className="text-lg font-black text-[#191c1e]">Chỉnh sửa Nhật ký</DialogTitle>
            </div>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trạng thái mới</label>
                <Select onValueChange={(v) => setNewStatus(v as TrangThaiDuAn)} value={newStatus}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Chọn trạng thái">
                      {newStatus ? (STATUS_LABELS[newStatus] || newStatus) : "Chọn trạng thái"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Thời gian ghi nhận</label>
                <SmartDateInput 
                  value={newDate}
                  onChange={setNewDate}
                  showTime={true}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nội dung chi tiết</label>
              <Textarea 
                value={newContent} 
                onChange={(e) => setNewContent(e.target.value)}
                className="min-h-[180px] rounded-2xl border-slate-200 focus:ring-[#0058bc] text-sm font-medium leading-relaxed"
                placeholder="Nhập nội dung nhật ký chi tiết..."
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <div className="flex-1">
              {editingLog?.buoc && editingLog?.status === "APPROVED" && (
                <Button 
                  variant="outline" 
                  onClick={handleRevoke}
                  disabled={loading}
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold px-4"
                >
                  <RotateCcw className="size-3.5 mr-2" />
                  Thu hồi bước
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setEditingLog(null)} className="rounded-xl font-bold text-slate-500">Hủy</Button>
              <Button 
                disabled={loading || !newContent.trim()} 
                onClick={handleUpdate}
                className="rounded-xl bg-[#0058bc] text-white px-8 font-black shadow-lg shadow-blue-200"
              >
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
