"use server";

// Re-triggered sync to resolve Prisma Client argument mismatch
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PhanLoaiKH } from "@prisma/client";

// Zod Schema for Validation
const KhachHangSchema = z.object({
  ten: z.string().min(2, "Tên khách hàng tối thiểu 2 ký tự"),
  phanLoai: z.nativeEnum(PhanLoaiKH),
  diaChi: z.string().optional().or(z.literal("")),
  dauMoiTiepCan: z.string().optional().or(z.literal("")),
  soDienThoaiDauMoi: z.string().optional().or(z.literal("")),
  ngaySinhDauMoi: z.string().optional().or(z.literal("")),
  lanhDaoDonVi: z.string().optional().or(z.literal("")),
  soDienThoaiLanhDao: z.string().optional().or(z.literal("")),
  ngaySinhLanhDao: z.string().optional().or(z.literal("")),
  ngayThanhLap: z.string().optional().or(z.literal("")),
  ngayKyNiem: z.string().optional().or(z.literal("")),
  ghiChu: z.string().optional().or(z.literal("")),
});

export async function getKhachHangList(params?: { search?: string, phanLoai?: string }) {
  try {
    const whereClause: any = {};
    
    if (params?.search) {
      whereClause.ten = { contains: params.search };
    }
    
    if (params?.phanLoai && params.phanLoai !== "ALL") {
      whereClause.phanLoai = params.phanLoai as PhanLoaiKH;
    }

    const data = await prisma.khachHang.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { duAns: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    return { data };
  } catch (error) {
    console.error("Fetch DB error:", error);
    return { error: "Lỗi khi tải danh sách khách hàng" };
  }
}

const toSafeDate = (val?: string) => {
  if (!val || val.trim() === "") return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

export async function createKhachHang(data: any) {
  try {
    const validated = KhachHangSchema.parse(data);
    
    // Convert date strings to Date objects safely
    const dataToSave: any = {
      ...validated,
      ngaySinhDauMoi: toSafeDate(validated.ngaySinhDauMoi),
      ngaySinhLanhDao: toSafeDate(validated.ngaySinhLanhDao),
      ngayThanhLap: toSafeDate(validated.ngayThanhLap),
      ngayKyNiem: toSafeDate(validated.ngayKyNiem),
    };
    
    await prisma.khachHang.create({
      data: dataToSave,
    });

    revalidatePath("/admin/khach-hang");
    return { success: true };
  } catch (error: any) {
    console.error("Create KhachHang Error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: `Lỗi hệ thống: ${error?.message || "Không thể tạo khách hàng"}` };
  }
}

export async function updateKhachHang(id: number, data: any) {
  try {
    const validated = KhachHangSchema.parse(data);
    
    const dataToUpdate: any = {
      ...validated,
      ngaySinhDauMoi: toSafeDate(validated.ngaySinhDauMoi),
      ngaySinhLanhDao: toSafeDate(validated.ngaySinhLanhDao),
      ngayThanhLap: toSafeDate(validated.ngayThanhLap),
      ngayKyNiem: toSafeDate(validated.ngayKyNiem),
    };
    
    await prisma.khachHang.update({
      where: { id },
      data: dataToUpdate,
    });

    revalidatePath("/admin/khach-hang");
    return { success: true };
  } catch (error: any) {
    console.error("Update KhachHang Error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: `Lỗi hệ thống: ${error?.message || "Không thể cập nhật khách hàng"}` };
  }
}

export async function toggleKhachHangStatus(id: number, isActive: boolean) {
  try {
    await prisma.khachHang.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath("/admin/khach-hang");
    return { success: true };
  } catch (error) {
    return { error: "Lỗi khi thay đổi trạng thái" };
  }
}

export async function deleteKhachHang(id: number) {
  try {
    // Check for existing projects
    const count = await prisma.duAn.count({
      where: { customerId: id }
    });

    if (count > 0) {
      return { error: "Không thể xóa! Khách hàng này đang có dự án liên quan. Bạn nên tắt trạng thái hoạt động thay vì xóa." };
    }

    await prisma.khachHang.delete({
      where: { id },
    });

    revalidatePath("/admin/khach-hang");
    return { success: true };
  } catch (error) {
    return { error: "Lỗi khi xóa khách hàng" };
  }
}
