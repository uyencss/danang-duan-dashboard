"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PhanLoaiKH } from "@prisma/client";

// Zod Schema for Validation
const KhachHangSchema = z.object({
  ten: z.string().min(2, "Tên khách hàng tối thiểu 2 ký tự"),
  phanLoai: z.nativeEnum(PhanLoaiKH),
  diaChi: z.string().optional(),
  soDienThoai: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, "Số điện thoại không đúng định dạng VN").optional().or(z.literal("")),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
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

export async function createKhachHang(data: any) {
  try {
    const validated = KhachHangSchema.parse(data);
    
    await prisma.khachHang.create({
      data: {
        ...validated,
        diaChi: validated.diaChi || null,
        soDienThoai: validated.soDienThoai || null,
        email: validated.email || null,
      },
    });

    revalidatePath("/admin/khach-hang");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Lỗi hệ thống khi tạo khách hàng" };
  }
}

export async function updateKhachHang(id: number, data: any) {
  try {
    const validated = KhachHangSchema.parse(data);
    
    await prisma.khachHang.update({
      where: { id },
      data: {
        ...validated,
        diaChi: validated.diaChi || null,
        soDienThoai: validated.soDienThoai || null,
        email: validated.email || null,
      },
    });

    revalidatePath("/admin/khach-hang");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Lỗi hệ thống khi cập nhật khách hàng" };
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
