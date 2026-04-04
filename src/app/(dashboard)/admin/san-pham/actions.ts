"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const SanPhamSchema = z.object({
  nhom: z.string().min(2, "Nhóm sản phẩm tối thiểu 2 ký tự"),
  tenChiTiet: z.string().min(2, "Tên chi tiết tối thiểu 2 ký tự"),
  moTa: z.string().optional().or(z.literal("")),
});

export async function getSanPhamList(params?: { search?: string, nhom?: string }) {
  try {
    const whereClause: any = {};
    if (params?.search) {
      whereClause.tenChiTiet = { contains: params.search };
    }
    if (params?.nhom && params.nhom !== "ALL") {
      whereClause.nhom = params.nhom;
    }

    const data = await prisma.sanPham.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { duAns: true }
        }
      },
      orderBy: [
        { nhom: 'asc' },
        { tenChiTiet: 'asc' }
      ]
    });
    return { data };
  } catch (error) {
    return { error: "Lỗi hệ thống khi tải danh sách sản phẩm" };
  }
}

export async function getSanPhamGroups() {
    try {
        const groups = await prisma.sanPham.groupBy({
            by: ['nhom'],
        });
        return { data: groups.map(g => g.nhom) };
    } catch (error) {
        return { error: "Lỗi khi lấy nhóm sản phẩm" };
    }
}

export async function createSanPham(data: any) {
  try {
    const validated = SanPhamSchema.parse(data);
    await prisma.sanPham.create({ data: validated });
    revalidatePath("/admin/san-pham");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.errors[0].message };
    return { error: "Lỗi hệ thống khi tạo sản phẩm" };
  }
}

export async function updateSanPham(id: number, data: any) {
  try {
    const validated = SanPhamSchema.parse(data);
    await prisma.sanPham.update({ where: { id }, data: validated });
    revalidatePath("/admin/san-pham");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.errors[0].message };
    return { error: "Lỗi hệ thống khi cập nhật sản phẩm" };
  }
}

export async function toggleSanPhamStatus(id: number, isActive: boolean) {
  try {
    await prisma.sanPham.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/san-pham");
    return { success: true };
  } catch (error) {
    return { error: "Lỗi khi thay đổi trạng thái" };
  }
}

export async function deleteSanPham(id: number) {
  try {
    const count = await prisma.duAn.count({ where: { productId: id } });
    if (count > 0) return { error: "Không thể xóa! Sản phẩm này đang được sử dụng trong dự án." };
    await prisma.sanPham.delete({ where: { id } });
    revalidatePath("/admin/san-pham");
    return { success: true };
  } catch (error) {
    return { error: "Lỗi khi xóa sản phẩm" };
  }
}
