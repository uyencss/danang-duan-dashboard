"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Search,
  Package,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SanPhamFormDialog } from "./san-pham-form-dialog";
import { toggleSanPhamStatus, deleteSanPham } from "./actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ProductsTable({ data }: { data: any[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [openForm, setOpenForm] = React.useState(false);
  const [selectedSP, setSelectedSP] = React.useState<any>(null);
  const [deleteSP, setDeleteSP] = React.useState<any>(null);

  const handleDelete = async (id: number) => {
    const result = await deleteSanPham(id);
    if (result.success) toast.success("Đã xóa sản phẩm!");
    else toast.error(result.error);
  };

  const handleToggle = async (id: number, current: boolean) => {
    const result = await toggleSanPhamStatus(id, !current);
    if (result.success) toast.success("Đã cập nhật trạng thái!");
    else toast.error(result.error);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "nhom",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Nhóm SP
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <Badge variant="secondary" className="font-bold">{row.getValue("nhom")}</Badge>,
    },
    {
      accessorKey: "tenChiTiet",
      header: "Tên chi tiết",
      cell: ({ row }) => <div className="font-medium text-gray-800">{row.getValue("tenChiTiet")}</div>,
    },
    {
      accessorKey: "moTa",
      header: "Mô tả",
      cell: ({ row }) => <div className="text-gray-500 text-xs truncate max-w-[250px]">{row.getValue("moTa") || "---"}</div>,
    },
    {
      accessorKey: "_count.duAns",
      header: "Dự án",
      cell: ({ row }) => <Badge variant="outline">{row.original._count.duAns}</Badge>,
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Switch 
          checked={row.getValue("isActive")} 
          onCheckedChange={() => handleToggle(row.original.id, row.original.isActive)} 
        />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const sp = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
               onClick={() => {
                 setSelectedSP(sp);
                 setOpenForm(true);
               }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Sửa
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                onClick={() => setDeleteSP(sp)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center bg-white px-3 py-1.5 rounded-xl border border-gray-100 w-full max-w-sm shadow-sm">
          <Search className="size-4 text-gray-400 mr-2" />
          <Input
            placeholder="Tìm sản phẩm..."
            value={(table.getColumn("tenChiTiet")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("tenChiTiet")?.setFilterValue(event.target.value)}
            className="border-none bg-transparent h-6 focus-visible:ring-0 text-sm shadow-none p-0"
          />
        </div>
        
        <Button 
          className="bg-gradient-to-r from-[#0058bc] to-blue-500 hover:from-blue-600 hover:to-cyan-500 text-white font-bold shadow-lg shadow-blue-500/30 rounded-xl border-none"
          onClick={() => {
            setSelectedSP(null);
            setOpenForm(true);
          }}
        >
          <Plus className="mr-2 size-4" /> Thêm Sản phẩm
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs uppercase text-gray-500 font-black">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-400">
                  Không tìm thấy sản phẩm.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <SanPhamFormDialog 
        open={openForm} 
        setOpen={setOpenForm} 
        data={selectedSP} 
        key={selectedSP?.id || "product-create"}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteSP} onOpenChange={(open) => !open && setDeleteSP(null)}>
        <AlertDialogContent>
           <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa sản phẩm</AlertDialogTitle>
              <AlertDialogDescription>
                Dữ liệu sản phẩm <strong className="text-red-600">{deleteSP?.tenChiTiet}</strong> sẽ bị xóa vĩnh viễn. 
                Bạn không thể xóa nếu sản phẩm này đã được gắn vào dự án.
              </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
              <AlertDialogCancel>Bỏ qua</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 focus:ring-red-600 text-white" onClick={() => {
                if (deleteSP) {
                  handleDelete(deleteSP.id);
                  setDeleteSP(null);
                }
              }}>
                Đồng ý xóa
              </AlertDialogAction>
           </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
