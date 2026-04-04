"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LinhVuc, TrangThaiDuAn } from "@prisma/client";
import { extractTimeFields } from "@/lib/utils/time-extract";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const DuAnSchema = z.object({
  customerId: z.number().min(1, "Vui lòng chọn khách hàng"),
  productId: z.number().min(1, "Vui lòng chọn sản phẩm"),
  amId: z.string().min(1, "Vui lòng chọn AM phụ trách"),
  chuyenVienId: z.string().optional().or(z.literal("")),
  tenDuAn: z.string().min(5, "Tên dự án tối thiểu 5 ký tự"),
  linhVuc: z.nativeEnum(LinhVuc),
  tongDoanhThuDuKien: z.coerce.number().min(0, "Doanh thu không được âm"),
  soHopDong: z.string().optional().or(z.literal("")),
  maHopDong: z.string().optional().or(z.literal("")),
  ngayBatDau: z.coerce.date({ required_error: "Vui lòng chọn ngày bắt đầu" }),
});

export async function createDuAn(data: any) {
  try {
    const validated = DuAnSchema.parse(data);
    const { tuan, thang, quy, nam } = extractTimeFields(validated.ngayBatDau);

    const project = await prisma.duAn.create({
      data: {
        ...validated,
        tuan,
        thang,
        quy,
        nam,
        trangThaiHienTai: TrangThaiDuAn.MOI,
        ngayBatDau: validated.ngayBatDau,
        ngayChamsocCuoiCung: new Date(),
      },
    });

    revalidatePath("/du-an");
    return { success: true, id: project.id };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.errors[0].message };
    console.error("Create Project Error:", error);
    return { error: "Lỗi hệ thống khi tạo dự án" };
  }
}

export async function getDuAnList(params?: { 
  search?: string, 
  phanLoaiKH?: string,
  productId?: string,
  trangThai?: string,
  linhVuc?: string,
  amId?: string
}) {
  try {
    const sessionRes = await (auth.api as any).getSession({
      headers: await headers()
    });
    const user = sessionRes?.user;
    if (!user) return { error: "Yêu cầu đăng nhập" };

    const whereClause: any = {};
    
    // Permission Logic: User only sees own projects
    if (user.role !== "ADMIN") {
        whereClause.OR = [
            { amId: user.id },
            { chuyenVienId: user.id }
        ];
    }

    // Search
    if (params?.search) {
      whereClause.tenDuAn = { contains: params.search };
    }

    // Filters
    if (params?.phanLoaiKH && params.phanLoaiKH !== "ALL") {
      whereClause.khachHang = { phanLoai: params.phanLoaiKH };
    }
    if (params?.productId && params.productId !== "ALL") {
      whereClause.productId = Number(params.productId);
    }
    if (params?.trangThai && params.trangThai !== "ALL") {
      whereClause.trangThaiHienTai = params.trangThai;
    }
    if (params?.linhVuc && params.linhVuc !== "ALL") {
      whereClause.linhVuc = params.linhVuc;
    }
    if (params?.amId && params.amId !== "ALL") {
      whereClause.amId = params.amId;
    }

    const data = await prisma.duAn.findMany({
      where: whereClause,
      include: {
        khachHang: true,
        sanPham: true,
        am: true,
        chuyenVien: true,
        _count: {
          select: { nhatKy: true, binhLuan: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    return { data };
  } catch (error: any) {
    console.error("Fetch Projects Error:", error);
    return { error: `DEV: ${error?.message || "Unknown error"}` };
  }
}

export async function getDuAnDetail(id: number) {
  try {
    const sessionRes = await (auth.api as any).getSession({
      headers: await headers()
    });
    const user = sessionRes?.user;
    if (!user) return { error: "Yêu cầu đăng nhập" };

    const project = await prisma.duAn.findUnique({
      where: { id },
      include: {
        khachHang: true,
        sanPham: true,
        am: true,
        chuyenVien: true,
        nhatKy: {
            orderBy: { ngayGio: 'desc' },
            include: { user: true }
        },
        binhLuan: {
            orderBy: { createdAt: 'desc' },
            include: { user: true }
        }
      }
    });

    if (!project) return { error: "Không tìm thấy dự án" };

    // Permission Logic
    if (user.role !== "ADMIN" && project.amId !== user.id && project.chuyenVienId !== user.id) {
        return { error: "Bạn không có quyền truy cập dự án này" };
    }

    return { data: project };
  } catch (error: any) {
    console.error("Fetch Project Detail Error:", error);
    return { error: `Lỗi hệ thống: ${error?.message || "Unknown error"}` };
  }
}

export async function createTaskLog(data: { 
  projectId: number, 
  trangThaiMoi: TrangThaiDuAn, 
  noiDungChiTiet: string,
  ngayGio: Date
}) {
  try {
    const sessionRes = await (auth.api as any).getSession({
      headers: await headers()
    });
    const user = sessionRes?.user;
    if (!user) return { error: "Yêu cầu đăng nhập" };

    const result = await prisma.$transaction(async (tx) => {
        // 1. Tạo nhật ký
        const log = await tx.nhatKyCongViec.create({
            data: {
              projectId: data.projectId,
              userId: user.id,
              trangThaiMoi: data.trangThaiMoi,
              noiDungChiTiet: data.noiDungChiTiet,
              ngayGio: data.ngayGio,
            }
        });

        // 2. Cập nhật dự án
        await tx.duAn.update({
            where: { id: data.projectId },
            data: {
                trangThaiHienTai: data.trangThaiMoi,
                ngayChamsocCuoiCung: data.ngayGio,
            }
        });

        return log;
    });

    revalidatePath("/du-an");
    revalidatePath(`/du-an/${data.projectId}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Create Task Log Error:", error);
    return { error: `Lỗi hệ thống: ${error?.message || "Unknown error"}` };
  }
}

export async function getKhachHangOptions() {
  const data = await prisma.khachHang.findMany({ 
    where: { isActive: true }, 
    select: { id: true, ten: true, phanLoai: true } 
  });
  return { data };
}

export async function getSanPhamOptions() {
  const data = await prisma.sanPham.findMany({ 
    where: { isActive: true }, 
    select: { id: true, nhom: true, tenChiTiet: true } 
  });
  return { data };
}

export async function getUserOptions() {
  const data = await prisma.user.findMany({ 
    where: { isActive: true }, 
    select: { id: true, name: true, role: true } 
  });
  return { data };
}
