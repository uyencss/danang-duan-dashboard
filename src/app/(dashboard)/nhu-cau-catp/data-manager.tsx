"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Download, Plus, Pencil, Save, X, Trash2 } from "lucide-react";
import { updatePoliceSurvey, createPoliceSurvey, deletePoliceSurvey, deleteAllPoliceSurveys } from "./actions";

export function DataManager({ data }: { data: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleExport = () => {
    // Convert data to Excel readable format
    const wsData = data.map(row => ({
      "Tên Đơn vị": row.tenDonVi,
      "Người Khảo sát": row.nguoiKhaoSat,
      "Chức vụ": row.chucVu,
      "Đã có Camera": row.daCoCamera,
      "Nhu cầu Camera": row.nhuCauCamera ? "Có" : "Không",
      "Mục đích Camera": row.mucDichCamera,
      "Khu vực Camera": row.khuVucCamera,
      "Đã có Kiosk": row.daCoKiosk,
      "Nhu cầu Kiosk": row.nhuCauKiosk ? "Có" : "Không",
      "Mục đích Kiosk": row.mucDichKiosk,
      "Đã có Truyền thanh": row.daCoTruyenThanh,
      "Nhu cầu Truyền thanh": row.nhuCauTruyenThanh ? "Có" : "Không",
      "Mục đích Truyền thanh": row.mucDichTruyenThanh,
      "Khu vực Truyền thanh": row.khuVucTruyenThanh,
      "Đề xuất khác": row.deXuatKhac,
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KhaoSatCATP");
    XLSX.writeFile(wb, "DuLieu_KhaoSat_CATP.xlsx");
    toast.success("Đã tải xuống file Excel");
  };

  const handleEdit = (row: any) => {
    setEditingId(row.id);
    setFormData({ ...row });
  };

  const handleCreateNew = () => {
    setEditingId('new');
    setFormData({
      tenDonVi: "",
      nguoiKhaoSat: "",
      chucVu: "",
      daCoCamera: "",
      nhuCauCamera: false,
      mucDichCamera: "",
      khuVucCamera: "",
      daCoKiosk: "",
      nhuCauKiosk: false,
      mucDichKiosk: "",
      daCoTruyenThanh: "",
      nhuCauTruyenThanh: false,
      mucDichTruyenThanh: "",
      khuVucTruyenThanh: "",
      deXuatKhac: "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!formData.tenDonVi) {
      toast.error("Tên đơn vị là bắt buộc!");
      return;
    }

    setIsSaving(true);
    let res;
    if (editingId === 'new') {
      res = await createPoliceSurvey(formData);
    } else {
      res = await updatePoliceSurvey(editingId as number, formData);
    }

    if (res.success) {
      toast.success(editingId === 'new' ? "Đã thêm mới thành công" : "Cập nhật thành công");
      setEditingId(null);
    } else {
      toast.error(res.error || "Gặp lỗi khi lưu dữ liệu");
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa dữ liệu của đơn vị này?")) return;
    const res = await deletePoliceSurvey(id);
    if (res.success) toast.success("Đã xóa bản ghi");
    else toast.error(res.error || "Không thể xóa");
  };

  const handleDeleteAll = async () => {
    if (!confirm("CẢNH BÁO: Bạn có chắc chắn muốn XÓA TOÀN BỘ dữ liệu khảo sát? Hành động này không thể hoàn tác!")) return;
    
    // Add a secondary confirmation just to be safe
    if (!confirm("Xác nhận lại lần cuối: Tiến hành xóa SẠCH toàn bộ Data gốc?")) return;

    const res = await deleteAllPoliceSurveys();
    if (res.success) toast.success("Đã xóa toàn bộ dữ liệu khảo sát.");
    else toast.error(res.error || "Gặp lỗi khi xóa toàn bộ dữ liệu.");
  };

  const renderCell = (row: any, fieldName: string, isBoolean = false) => {
    const isEditing = editingId === row.id;

    if (isEditing) {
      if (isBoolean) {
        return (
          <Checkbox
            checked={formData[fieldName] || false}
            onCheckedChange={(checked) => setFormData({ ...formData, [fieldName]: checked === true })}
            className="border-slate-300"
          />
        );
      }
      return (
        <Input
          value={formData[fieldName] || ""}
          onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
          className="h-8 text-sm min-w-[200px]"
        />
      );
    }

    if (isBoolean) {
      return row[fieldName] ? "Có" : "Không";
    }
    
    return <span className="whitespace-normal break-words leading-snug min-w-[120px] max-w-[280px] block py-0.5">{row[fieldName] || "—"}</span>;
  };

  // Add the new row to display if we are creating one
  const renderData = editingId === 'new' ? [{ id: 'new', ...formData }, ...data] : data;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 border bg-white text-[#0070eb] border-[#0070eb] hover:bg-slate-50">
        <Database className="w-4 h-4 mr-2" />
        Quản lý Data
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] bg-slate-50 rounded-t-2xl p-0 flex flex-col shadow-2xl border-t border-slate-200">
        <SheetHeader className="p-6 border-b border-slate-200 bg-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <SheetTitle className="text-xl text-slate-800 flex items-center gap-2">
                <Database className="w-5 h-5 text-[#0070eb]" />
                Quản lý / Edit Data Gốc
              </SheetTitle>
              <SheetDescription className="text-slate-500">
                Cho phép xem, chỉnh sửa trực tiếp dữ liệu tháo từ Form và xuất báo cáo.
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExport} className="border-green-600 text-green-700 hover:bg-green-50 shadow-sm hidden sm:flex">
                <Download className="w-4 h-4 mr-2" /> Tải Excel
              </Button>
              <Button onClick={handleCreateNew} disabled={editingId !== null} className="bg-[#0070eb] text-white hover:bg-blue-700 shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Thêm Mới
              </Button>
              <Button variant="destructive" onClick={handleDeleteAll} disabled={data.length === 0 || editingId !== null} className="bg-red-500 hover:bg-red-600 shadow-sm">
                <Trash2 className="w-4 h-4 mr-2 hidden sm:block" /> Xóa Toàn Bộ
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 w-full bg-slate-50 relative overflow-y-auto overflow-x-auto min-h-0" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <table className="w-full min-w-[1200px] border-collapse bg-white text-sm">
            <TableHeader className="bg-slate-100">
              <TableRow>
                <TableHead className="w-24 text-slate-700 font-bold sticky top-0 bg-slate-200 z-30 shadow-sm border-b border-slate-300">Thao tác</TableHead>
                <TableHead className="text-slate-700 font-bold sticky top-0 bg-slate-200 z-30 shadow-sm border-b border-slate-300">Tên Đơn vị</TableHead>
                <TableHead className="text-slate-700 font-bold sticky top-0 bg-slate-200 z-30 shadow-sm border-b border-slate-300">Người Khảo sát</TableHead>
                <TableHead className="text-slate-700 font-bold sticky top-0 bg-slate-200 z-30 shadow-sm border-b border-slate-300">Chức vụ</TableHead>
                {/* Camera */}
                <TableHead className="text-blue-700 font-bold sticky top-0 bg-blue-100 z-30 shadow-sm border-b border-slate-300 border-l border-slate-300">Cam - Hiện trạng</TableHead>
                <TableHead className="text-blue-700 font-bold sticky top-0 bg-blue-100 z-30 shadow-sm border-b border-slate-300">Cam - Nhu cầu mới</TableHead>
                <TableHead className="text-blue-700 font-bold sticky top-0 bg-blue-100 z-30 shadow-sm border-b border-slate-300">Cam - Mục đích</TableHead>
                <TableHead className="text-blue-700 font-bold sticky top-0 bg-blue-100 z-30 shadow-sm border-b border-slate-300 border-r border-slate-300">Cam - Khu vực</TableHead>
                {/* Kiosk */}
                <TableHead className="text-purple-700 font-bold sticky top-0 bg-purple-100 z-30 shadow-sm border-b border-slate-300">Kiosk - Hiện trạng</TableHead>
                <TableHead className="text-purple-700 font-bold sticky top-0 bg-purple-100 z-30 shadow-sm border-b border-slate-300">Kiosk - Nhu cầu mới</TableHead>
                <TableHead className="text-purple-700 font-bold sticky top-0 bg-purple-100 z-30 shadow-sm border-b border-slate-300 border-r border-slate-300">Kiosk - Mục đích</TableHead>
                {/* Truyền thanh */}
                <TableHead className="text-pink-700 font-bold sticky top-0 bg-pink-100 z-30 shadow-sm border-b border-slate-300">Loa - Hiện trạng</TableHead>
                <TableHead className="text-pink-700 font-bold sticky top-0 bg-pink-100 z-30 shadow-sm border-b border-slate-300">Loa - Nhu cầu mới</TableHead>
                <TableHead className="text-pink-700 font-bold sticky top-0 bg-pink-100 z-30 shadow-sm border-b border-slate-300">Loa - Mục đích</TableHead>
                <TableHead className="text-pink-700 font-bold sticky top-0 bg-pink-100 z-30 shadow-sm border-b border-slate-300 border-r border-slate-300">Loa - Khu vực</TableHead>
                <TableHead className="text-slate-700 font-bold sticky top-0 bg-slate-200 z-30 shadow-sm border-b border-slate-300">Đề xuất khác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderData.map((row) => {
                const isEditing = editingId === row.id;

                return (
                  <TableRow key={row.id} className={isEditing ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-slate-50"}>
                    <TableCell className={`align-top border-b border-slate-200 ${isEditing ? "bg-blue-100" : ""}`}>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={handleSave} disabled={isSaving} className="text-green-700 hover:text-green-800 hover:bg-green-200 h-8 w-8">
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={handleCancel} disabled={isSaving} className="text-slate-600 hover:text-slate-800 hover:bg-slate-300 h-8 w-8">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(row)} disabled={editingId !== null} className="text-blue-700 hover:text-blue-800 hover:bg-blue-200 h-8 w-8">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(row.id)} disabled={editingId !== null} className="text-red-600 hover:text-red-800 hover:bg-red-200 h-8 w-8">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell className="font-medium text-slate-800 border-b border-r border-slate-100 align-top">
                      {renderCell(row, "tenDonVi")}
                    </TableCell>
                    <TableCell className="border-b border-r border-slate-100 align-top">{renderCell(row, "nguoiKhaoSat")}</TableCell>
                    <TableCell className="border-b border-r border-slate-100 align-top">{renderCell(row, "chucVu")}</TableCell>
                    
                    {/* Camera */}
                    <TableCell className="bg-blue-50/20 border-b border-l border-slate-200 align-top">{renderCell(row, "daCoCamera")}</TableCell>
                    <TableCell className="bg-blue-50/20 font-medium text-blue-700 border-b border-slate-200 align-top">{renderCell(row, "nhuCauCamera", true)}</TableCell>
                    <TableCell className="bg-blue-50/20 border-b border-slate-200 align-top">{renderCell(row, "mucDichCamera")}</TableCell>
                    <TableCell className="bg-blue-50/20 border-b border-r border-slate-200 align-top">{renderCell(row, "khuVucCamera")}</TableCell>
                    
                    {/* Kiosk */}
                    <TableCell className="bg-purple-50/20 border-b border-slate-200 align-top">{renderCell(row, "daCoKiosk")}</TableCell>
                    <TableCell className="bg-purple-50/20 font-medium text-purple-700 border-b border-slate-200 align-top">{renderCell(row, "nhuCauKiosk", true)}</TableCell>
                    <TableCell className="bg-purple-50/20 border-b border-r border-slate-200 align-top">{renderCell(row, "mucDichKiosk")}</TableCell>

                    {/* Truyền thanh */}
                    <TableCell className="bg-pink-50/20 border-b border-slate-200 align-top">{renderCell(row, "daCoTruyenThanh")}</TableCell>
                    <TableCell className="bg-pink-50/20 font-medium text-pink-700 border-b border-slate-200 align-top">{renderCell(row, "nhuCauTruyenThanh", true)}</TableCell>
                    <TableCell className="bg-pink-50/20 border-b border-slate-200 align-top">{renderCell(row, "mucDichTruyenThanh")}</TableCell>
                    <TableCell className="bg-pink-50/20 border-b border-r border-slate-200 align-top">{renderCell(row, "khuVucTruyenThanh")}</TableCell>

                    {/* Other */}
                    <TableCell className="border-b border-slate-200 align-top">{renderCell(row, "deXuatKhac")}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
