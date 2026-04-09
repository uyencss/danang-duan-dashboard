"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { syncReplica } from "@/lib/utils/sync";
import { requireRole } from "@/lib/auth-utils";
import { cacheInvalidate } from "@/lib/cache";

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
        return { data: groups.map((g: any) => g.nhom) };
    } catch (error) {
        return { error: "Lỗi khi lấy nhóm sản phẩm" };
    }
}

export async function createSanPham(data: any) {
  try {
    await requireRole("ADMIN", "USER");
    const validated = SanPhamSchema.parse(data);
    await prisma.sanPham.create({ data: validated });
    await cacheInvalidate("options:sanpham", "options:sanpham-groups");
    revalidatePath("/admin/san-pham");
    await syncReplica();
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.errors[0].message };
    return { error: "Lỗi hệ thống khi tạo sản phẩm" };
  }
}

export async function updateSanPham(id: number, data: any) {
  try {
    await requireRole("ADMIN", "USER");
    const validated = SanPhamSchema.parse(data);
    await prisma.sanPham.update({ where: { id }, data: validated });
    await cacheInvalidate("options:sanpham", "options:sanpham-groups");
    revalidatePath("/admin/san-pham");
    await syncReplica();
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.errors[0].message };
    return { error: "Lỗi hệ thống khi cập nhật sản phẩm" };
  }
}

export async function toggleSanPhamStatus(id: number, isActive: boolean) {
  try {
    await requireRole("ADMIN", "USER");
    await prisma.sanPham.update({ where: { id }, data: { isActive } });
    await cacheInvalidate("options:sanpham", "options:sanpham-groups");
    revalidatePath("/admin/san-pham");
    await syncReplica();
    return { success: true };
  } catch (error) {
    return { error: "Lỗi khi thay đổi trạng thái" };
  }
}

export async function deleteSanPham(id: number) {
  try {
    await requireRole("ADMIN", "USER");
    const count = await prisma.duAn.count({ where: { productId: id } });
    if (count > 0) return { error: "Không thể xóa! Sản phẩm này đang được sử dụng trong dự án." };
    await prisma.sanPham.delete({ where: { id } });
    await cacheInvalidate("options:sanpham", "options:sanpham-groups");
    revalidatePath("/admin/san-pham");
    await syncReplica();
    return { success: true };
  } catch (error) {
    return { error: "Lỗi khi xóa sản phẩm" };
  }
}
