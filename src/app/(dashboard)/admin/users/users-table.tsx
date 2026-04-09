"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  RowSelectionState,
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
  Search,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Lock,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserCog,
  GraduationCap,
  Users,
  RefreshCw,
} from "lucide-react";
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
import { deleteUser, resetUserPassword, bulkCreateUsers, bulkUpdateRole } from "./actions";
import * as React from "react";
import * as XLSX from "xlsx";

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
import { Checkbox } from "@/components/ui/checkbox";
import { UserRole } from "@prisma/client";
import { UserFormDialog } from "./user-form-dialog";
import { toggleUserStatus } from "./actions";
import { toast } from "sonner";
import { ROLE_METADATA } from "@/lib/rbac";
import type { AppRole } from "@/lib/rbac";

const ROLE_FILTER_TABS: { label: string; value: string; icon: React.ElementType }[] = [
  { label: "Tất cả", value: "ALL", icon: Users },
  { label: "Admin", value: "ADMIN", icon: ShieldCheck },
  { label: "Chuyên viên QT", value: "USER", icon: UserCog },
  { label: "AM", value: "AM", icon: ShieldAlert },
  { label: "Chuyên viên", value: "CV", icon: GraduationCap },
];

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_METADATA[role as AppRole];
  if (!meta) return <Badge variant="outline">{role}</Badge>;

  const Icon = role === "ADMIN" ? ShieldCheck :
               role === "USER" ? UserCog :
               role === "AM" ? ShieldAlert :
               GraduationCap;

  return (
    <Badge
      variant="outline"
      className={`${meta.badgeColor} ${meta.textColor} ${meta.borderColor}`}
    >
      <Icon className="size-3 mr-1" />
      {meta.label}
    </Badge>
  );
}

export function UsersTable({ data }: { data: any[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [openForm, setOpenForm] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [userToBeDeleted, setUserToBeDeleted] = React.useState<any>(null);
  const [roleFilter, setRoleFilter] = React.useState("ALL");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [bulkRoleDialogOpen, setBulkRoleDialogOpen] = React.useState(false);
  const [bulkTargetRole, setBulkTargetRole] = React.useState<UserRole>(UserRole.CV);

  const handleToggle = async (id: string, current: boolean) => {
    const result = await toggleUserStatus(id, current);
    if (result.success) toast.success("Đã cập nhật trạng thái!");
    else toast.error(result.error);
  };

  const filteredData = React.useMemo(() => {
    if (roleFilter === "ALL") return data;
    return data.filter((u) => u.role === roleFilter);
  }, [data, roleFilter]);

  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Họ tên
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col ml-4">
            <span className="font-bold text-gray-800">{row.getValue("name")}</span>
            <span className="text-xs text-gray-400">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Quyền hạn",
      cell: ({ row }) => <RoleBadge role={row.getValue("role") as string} />,
    },
    {
      accessorKey: "diaBan",
      header: "Tổ",
      cell: ({ row }) => (
        <div className="flex items-center text-xs text-gray-500">
            {row.getValue("diaBan") || "Chưa phân công"}
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex flex-col gap-1.5 min-w-[100px]">
                <div className="flex items-center gap-2">
                    <Switch 
                        checked={user.isActive} 
                        onCheckedChange={() => handleToggle(user.id, user.isActive)} 
                    />
                    {user.isActive ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[9px] px-1.5 h-4 uppercase font-black">Active</Badge>
                    ) : (
                        <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-none text-[9px] px-1.5 h-4 uppercase font-black">Hold</Badge>
                    )}
                </div>
                {user.banned && (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none text-[9px] px-1.5 h-4 uppercase font-black w-fit">Banned</Badge>
                )}
            </div>
          );
      }
    },
    {
        accessorKey: "lastLoginAt",
        header: "Sử dụng cuối",
        cell: ({ row }) => {
            const date = row.getValue("lastLoginAt") as Date;
            return <div className="text-[10px] text-gray-400 font-mono">{date ? new Date(date).toLocaleString('vi-VN') : "Chưa đăng nhập"}</div>;
        }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
               onClick={() => {
                 setSelectedUser(user);
                 setOpenForm(true);
               }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
               onClick={async () => {
                 const res = await resetUserPassword(user.id);
                 if (res.success) toast.success("Đã reset mật khẩu về 123456");
                 else toast.error(res.error);
               }}
              >
                <Lock className="mr-2 h-4 w-4" /> Reset mật khẩu
              </DropdownMenuItem>
              
              <DropdownMenuItem
                className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                onClick={() => {
                  setUserToBeDeleted(user);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Xóa tài khoản
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters, rowSelection },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleBulkRoleUpdate = async () => {
    const ids = selectedRows.map((r) => r.original.id);
    const toastId = toast.loading(`Đang cập nhật role cho ${ids.length} tài khoản...`);
    const res = await bulkUpdateRole(ids, bulkTargetRole);
    if (res.success) {
      toast.success(`Đã cập nhật role cho ${res.count} tài khoản`, { id: toastId });
      setRowSelection({});
      setBulkRoleDialogOpen(false);
    } else {
      toast.error(res.error, { id: toastId });
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Role Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100 w-fit">
        {ROLE_FILTER_TABS.map((tab) => {
          const isActive = roleFilter === tab.value;
          const count = tab.value === "ALL" ? data.length : data.filter((u) => u.role === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setRoleFilter(tab.value);
                setRowSelection({});
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? "bg-white text-[#003466] shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
              }`}
            >
              <tab.icon className="size-3.5" />
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                isActive ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white px-3 py-1.5 rounded-xl border border-gray-100 w-full max-w-sm shadow-sm font-medium">
            <Search className="size-4 text-gray-400 mr-2" />
            <Input
              placeholder="Tìm theo tên hoặc email..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
              className="border-none bg-transparent h-6 focus-visible:ring-0 text-sm shadow-none p-0"
            />
          </div>

          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                {selectedCount} đã chọn
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-indigo-200 hover:bg-indigo-50 text-indigo-700 h-8 text-xs font-bold"
                onClick={() => setBulkRoleDialogOpen(true)}
              >
                <RefreshCw className="mr-1.5 size-3" /> Đổi role
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap justify-end">
            <a href="/Mau_Danh_Sach_Nhan_Vien.csv" download>
                <Button 
                    type="button"
                    variant="outline"
                    className="rounded-xl border-green-200 hover:bg-green-50 text-green-700 hover:text-green-800 h-10 px-4 font-bold flex items-center shadow-sm"
                >
                    <Download className="mr-2 size-4" />
                    <span className="hidden sm:inline">Mẫu Excel</span>
                </Button>
            </a>
            
            <Button 
                variant="outline"
                className="rounded-xl border-gray-200 hover:bg-gray-50 h-10 px-4 font-bold flex items-center shadow-sm relative group"
            >
                <Upload className="mr-2 size-4 text-gray-500 group-hover:text-blue-500 transition-colors" />
                <span className="hidden sm:inline">Tải lên danh sách</span>
                <span className="sm:hidden">Tải lên</span>
                <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".xlsx,.xls,.csv"
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = async (evt) => {
                                try {
                                    const bstr = evt.target?.result;
                                    const wb = XLSX.read(bstr, { type: 'binary' });
                                    const wsname = wb.SheetNames[0];
                                    const ws = wb.Sheets[wsname];
                                    const dataArr = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];

                                    const rows = dataArr.slice(1);
                                    const usersToCreate = rows.map(row => ({
                                        name: row[0],
                                        email: row[1],
                                        password: row[2]?.toString() || "123456",
                                        role: row[3] || "USER",
                                        diaBan: row[4]
                                    })).filter(u => u.name && u.email);

                                    if (usersToCreate.length === 0) {
                                        toast.error("Không tìm thấy dữ liệu hợp lệ trong file");
                                        return;
                                    }

                                    const toastId = toast.loading(`Đang xử lý ${usersToCreate.length} tài khoản...`);
                                    const res = await bulkCreateUsers(usersToCreate);
                                    
                                    if (res.success) {
                                        toast.success(`Đã tạo thành công ${res.results?.successCount}/${res.results?.total} tài khoản`, { id: toastId });
                                        if (res.results?.errorCount > 0) {
                                            console.error("Lỗi khi tạo một số tài khoản:", res.results.errors);
                                        }
                                    } else {
                                        toast.error(res.error || "Lỗi khi tải lên danh sách", { id: toastId });
                                    }
                                } catch (err) {
                                    console.error("Parse error:", err);
                                    toast.error("Lỗi khi đọc file. Vui lòng kiểm tra định dạng file.");
                                }
                            };
                            reader.readAsBinaryString(file);
                        }
                    }}
                />
            </Button>
            <Button 
            className="bg-gradient-to-r from-[#0058bc] to-blue-500 hover:from-blue-600 hover:to-cyan-500 text-white font-bold shadow-lg shadow-blue-500/30 rounded-xl border-none h-10"
            onClick={() => {
                setSelectedUser(null);
                setOpenForm(true);
            }}
            >
            <UserPlus className="mr-2 size-4" /> Tạo tài khoản mới
            </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-black uppercase text-gray-400">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-400">
                  Không tìm thấy tài khoản.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Hiển thị</span>
          <select
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span>/ {table.getFilteredRowModel().rows.length} tài khoản</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            className="h-9 w-9 p-0 rounded-lg border-gray-200 disabled:opacity-40"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            className="h-9 px-3 rounded-lg border-gray-200 font-medium text-sm gap-1 disabled:opacity-40"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Trước</span>
          </Button>

          <div className="flex items-center gap-1 px-2">
            <span className="text-sm font-bold text-gray-700">
              {table.getState().pagination.pageIndex + 1}
            </span>
            <span className="text-sm text-gray-400">/</span>
            <span className="text-sm text-gray-500">
              {table.getPageCount()}
            </span>
          </div>

          <Button
            variant="outline"
            className="h-9 px-3 rounded-lg border-gray-200 font-medium text-sm gap-1 disabled:opacity-40"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="hidden sm:inline">Sau</span>
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            className="h-9 w-9 p-0 rounded-lg border-gray-200 disabled:opacity-40"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
      
      {/* Dialogs */}
      <UserFormDialog 
        open={openForm} 
        setOpen={setOpenForm} 
        data={selectedUser} 
        key={selectedUser?.id || "user-create"}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-red-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-700 text-left">Xác nhận xóa tài khoản?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 text-left">
              Bạn đang thực hiện xóa tài khoản của <span className="font-bold text-gray-900">{userToBeDeleted?.name}</span>. 
              Hành động này sẽ xóa vĩnh viễn quyền truy cập và dữ liệu liên quan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 rounded-xl font-black shadow-lg shadow-red-200"
              onClick={async () => {
                const res = await deleteUser(userToBeDeleted?.id);
                if (res.success) {
                  toast.success("Đã xóa tài khoản vĩnh viễn");
                  setDeleteDialogOpen(false);
                } else {
                  toast.error(res.error);
                }
              }}
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Role Update Dialog */}
      <AlertDialog open={bulkRoleDialogOpen} onOpenChange={setBulkRoleDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-indigo-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-[#003466] text-left">
              Đổi role hàng loạt
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 text-left">
              Bạn đang thay đổi role cho <span className="font-bold text-gray-900">{selectedCount}</span> tài khoản.
              Chọn role mới bên dưới.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {(Object.keys(ROLE_METADATA) as AppRole[]).map((role) => {
              const meta = ROLE_METADATA[role];
              const isSelected = bulkTargetRole === role;
              return (
                <button
                  key={role}
                  onClick={() => setBulkTargetRole(role as UserRole)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? `${meta.borderColor} ${meta.badgeColor} ring-2 ring-offset-1 ring-blue-400`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className={`text-xs font-black ${isSelected ? meta.textColor : "text-gray-600"}`}>
                    {meta.label}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{meta.description.slice(0, 60)}...</p>
                </button>
              );
            })}
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold">Hủy</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-gradient-to-r from-[#0058bc] to-blue-500 rounded-xl font-black shadow-lg"
              onClick={handleBulkRoleUpdate}
            >
              Xác nhận đổi role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
