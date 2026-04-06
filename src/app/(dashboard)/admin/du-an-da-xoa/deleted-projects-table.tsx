"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Trash2, RotateCcw } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { approveDeleteDuAn, restoreDuAn } from "@/app/(dashboard)/du-an/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DeletedProjectsTable({ data }: { data: any[] }) {
  const [deleteProject, setDeleteProject] = React.useState<any>(null);
  const [restoreProject, setRestoreProject] = React.useState<any>(null);

  const handleApproveDelete = async (id: number) => {
    const res = await approveDeleteDuAn(id);
    if (res.success) {
      toast.success("Đã xóa dự án vĩnh viễn!");
    } else {
      toast.error(res.error || "Xóa thất bại");
    }
  };

  const handleRestore = async (id: number) => {
    const res = await restoreDuAn(id);
    if (res.success) {
      toast.success("Đã khôi phục dự án thành công!");
    } else {
      toast.error(res.error || "Khôi phục thất bại");
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => (
        <span className="text-sm text-slate-400 font-medium">{row.index + 1}</span>
      ),
    },
    {
      accessorKey: "khachHang",
      header: "Khách hàng & Dự án",
      cell: ({ row }) => (
        <div className="max-w-[300px] whitespace-normal">
          <span className="font-bold text-[13px] text-[#191c1e] leading-tight line-clamp-2">
            {(row.original as any).khachHang?.ten}
          </span>
          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{(row.original as any).tenDuAn}</p>
        </div>
      ),
    },
    {
      accessorKey: "deleteRequestedAt",
      header: "Ngày gửi yêu cầu",
      cell: ({ row }) => {
        const date = (row.original as any).deleteRequestedAt;
        if (!date) return "—";
        return <span className="text-sm">{new Date(date).toLocaleDateString("vi-VN")}</span>;
      },
    },
    {
      id: "actions",
      header: "Tùy chọn",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button 
            className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors" 
            title="Khôi phục"
            onClick={() => setRestoreProject(row.original)}
          >
            <RotateCcw className="size-4" />
          </button>
          <button 
            className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 transition-colors" 
            title="Xóa vĩnh viễn"
            onClick={() => setDeleteProject(row.original)}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#f8fbfe]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-blue-100/50 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-11 text-[10px] font-black tracking-widest text-[#0058bc] uppercase">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors border-b-slate-100/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <p className="text-sm font-medium">Không có yêu cầu xóa dự án nào</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProject} onOpenChange={(open) => !open && setDeleteProject(null)}>
        <AlertDialogContent>
           <AlertDialogHeader>
              <AlertDialogTitle>Xóa vĩnh viễn dự án này?</AlertDialogTitle>
              <AlertDialogDescription>
                Dự án <strong className="text-red-600">{deleteProject?.tenDuAn}</strong> sẽ bị xóa vĩnh viễn khỏi toàn bộ hệ thống. Thao tác này KHÔNG THỂ hoàn tác!
              </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 focus:ring-red-600 text-white" onClick={() => {
                if (deleteProject) {
                  handleApproveDelete(deleteProject.id);
                  setDeleteProject(null);
                }
              }}>
                Chấp nhận xóa
              </AlertDialogAction>
           </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation */}
      <AlertDialog open={!!restoreProject} onOpenChange={(open) => !open && setRestoreProject(null)}>
        <AlertDialogContent>
           <AlertDialogHeader>
              <AlertDialogTitle>Khôi phục dự án?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn khôi phục dự án <strong className="text-blue-600">{restoreProject?.tenDuAn}</strong> trở lại danh sách hoạt động?
              </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction className="bg-blue-600 focus:ring-blue-600 text-white" onClick={() => {
                if (restoreProject) {
                  handleRestore(restoreProject.id);
                  setRestoreProject(null);
                }
              }}>
                Khôi phục
              </AlertDialogAction>
           </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
