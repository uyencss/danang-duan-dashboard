"use server";

// Reloaded to sync Prisma Client
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LinhVuc, TrangThaiDuAn, PhanLoaiKH } from "@prisma/client";
import { extractTimeFields } from "@/lib/utils/time-extract";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import fs from "fs/promises";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { syncReplica } from "@/lib/utils/sync";
import { ablyServerClient } from "@/lib/realtime";
import { getCurrentUser, requireRole } from "@/lib/auth-utils";
import { checkPermission } from "@/lib/rbac-server";
import { withCache, cacheInvalidate } from "@/lib/cache";

// ── Schema for the NEW creation flow ────────────────────────────────
// Customer can be an existing ID or a new inline entry
// Product can be an existing ID or a new inline entry
const CreateDuAnSchema = z.object({
  tenDuAn: z.string().min(5, "Tên dự án tối thiểu 5 ký tự"),

  // Customer – either select existing or create new
  customerId: z.number().optional(),         // existing customer ID
  customerName: z.string().optional(),        // new customer name
  customerPhanLoai: z.nativeEnum(PhanLoaiKH).optional(),
  customerDiaChi: z.string().optional(),

  // Product – either select existing or create new
  productId: z.number().optional(),           // existing product ID
  productNhom: z.string().optional(),         // new product group name
  productTenChiTiet: z.string().optional(),   // new product detail name
  productMoTa: z.string().optional(),         // new product description

  tongDoanhThuDuKien: z.coerce.number().min(0, "Doanh thu không được âm"),
  doanhThuTheoThang: z.coerce.number().optional().default(0),
  maHopDong: z.string().optional().or(z.literal("")),
  ngayBatDau: z.coerce.date({ required_error: "Vui lòng chọn ngày bắt đầu" }),
  ngayKetThuc: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.date().optional().nullable(),
  ),

  amId: z.string().optional().or(z.literal("")),
  amHoTroId: z.string().optional().or(z.literal("")),
  chuyenVienId: z.string().optional().or(z.literal("")),
  cvHoTro1Id: z.string().optional().or(z.literal("")),
  cvHoTro2Id: z.string().optional().or(z.literal("")),
  trangThaiHienTai: z.nativeEnum(TrangThaiDuAn).optional(),
  isTrongDiem: z.boolean().optional().default(false),
  isKyVong: z.boolean().optional().default(false),
}).refine(
  (data) => data.customerId || data.customerName,
  { message: "Vui lòng chọn hoặc nhập tên khách hàng", path: ["customerId"] }
).refine(
  (data) => data.productId || (data.productNhom && data.productTenChiTiet),
  { message: "Vui lòng chọn hoặc nhập sản phẩm (cần nhóm SP và tên chi tiết)", path: ["productId"] }
);

// ── Legacy schema for update (keeping backward compatibility) ───────
const DuAnSchema = z.object({
  customerId: z.number().min(1, "Vui lòng chọn khách hàng"),
  productId: z.number().min(1, "Vui lòng chọn sản phẩm"),
  amId: z.string().optional().or(z.literal("")),
  amHoTroId: z.string().optional().or(z.literal("")),
  chuyenVienId: z.string().optional().or(z.literal("")),
  cvHoTro1Id: z.string().optional().or(z.literal("")),
  cvHoTro2Id: z.string().optional().or(z.literal("")),
  tenDuAn: z.string().min(5, "Tên dự án tối thiểu 5 ký tự"),
  linhVuc: z.enum(["CHINH_PHU", "DOANH_NGHIEP", "CONG_AN", "B2B_B2G", "B2A"]),
  tongDoanhThuDuKien: z.coerce.number().min(0, "Doanh thu không được âm"),
  doanhThuTheoThang: z.coerce.number().optional().default(0),
  maHopDong: z.string().optional().or(z.literal("")),
  ngayBatDau: z.coerce.date({ required_error: "Vui lòng chọn ngày bắt đầu" }),
  ngayKetThuc: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.date().optional().nullable(),
  ),
  isTrongDiem: z.boolean().optional().default(false),
  isKyVong: z.boolean().optional().default(false),
  trangThaiHienTai: z.nativeEnum(TrangThaiDuAn).optional(),
});

// ═══════════════════════════════════════════════════════════════════
// CREATE – now supports inline customer / product creation
// ═══════════════════════════════════════════════════════════════════
export async function createDuAn(data: any) {
  try {
    await requireRole("ADMIN", "USER", "AM", "CV");
    const validated = CreateDuAnSchema.parse(data);

    // ── Resolve customer ID ──
    let resolvedCustomerId = validated.customerId;
    if (!resolvedCustomerId && validated.customerName) {
      // Try to find existing customer by name first
      const existing = await prisma.khachHang.findFirst({
        where: { ten: validated.customerName },
      });
      if (existing) {
        resolvedCustomerId = existing.id;
        // Optionally update address/phanLoai if provided
        if (validated.customerPhanLoai || validated.customerDiaChi) {
          await prisma.khachHang.update({
            where: { id: existing.id },
            data: {
              ...(validated.customerPhanLoai && { phanLoai: validated.customerPhanLoai }),
              ...(validated.customerDiaChi && { diaChi: validated.customerDiaChi }),
            },
          });
        }
      } else {
        // Create NEW customer
        const newCustomer = await prisma.khachHang.create({
          data: {
            ten: validated.customerName,
            phanLoai: validated.customerPhanLoai || PhanLoaiKH.DOANH_NGHIEP,
            diaChi: validated.customerDiaChi || null,
          },
        });
        resolvedCustomerId = newCustomer.id;
      }
    }

    if (!resolvedCustomerId) {
      return { error: "Vui lòng chọn hoặc nhập tên khách hàng" };
    }

    // ── Derive linhVuc from customer phanLoai ──
    let resolvedLinhVuc: LinhVuc = LinhVuc.DOANH_NGHIEP;
    if (validated.customerPhanLoai) {
      // PhanLoaiKH and LinhVuc have the same values
      resolvedLinhVuc = validated.customerPhanLoai as unknown as LinhVuc;
    } else if (resolvedCustomerId) {
      // For existing customers, read their phanLoai
      const customer = await prisma.khachHang.findUnique({
        where: { id: resolvedCustomerId },
        select: { phanLoai: true },
      });
      if (customer) {
        resolvedLinhVuc = customer.phanLoai as unknown as LinhVuc;
      }
    }

    // ── Resolve product ID ──
    let resolvedProductId = validated.productId;
    if (!resolvedProductId && validated.productNhom && validated.productTenChiTiet) {
      // Try to find existing product by group + detail name
      const existing = await prisma.sanPham.findFirst({
        where: {
          nhom: validated.productNhom,
          tenChiTiet: validated.productTenChiTiet,
        },
      });
      if (existing) {
        resolvedProductId = existing.id;
      } else {
        // Create NEW product
        const newProduct = await prisma.sanPham.create({
          data: {
            nhom: validated.productNhom,
            tenChiTiet: validated.productTenChiTiet,
            moTa: validated.productMoTa || null,
          },
        });
        resolvedProductId = newProduct.id;
      }
    }

    if (!resolvedProductId) {
      return { error: "Vui lòng chọn hoặc nhập sản phẩm" };
    }

    // ── Create the project ──
    const { tuan, thang, quy, nam } = extractTimeFields(validated.ngayBatDau);

    const project = await prisma.duAn.create({
      data: {
        tenDuAn: validated.tenDuAn,
        linhVuc: resolvedLinhVuc,
        customerId: resolvedCustomerId,
        productId: resolvedProductId,
        tongDoanhThuDuKien: validated.tongDoanhThuDuKien,
        doanhThuTheoThang: validated.doanhThuTheoThang || 0,
        maHopDong: validated.maHopDong || null,
        ngayBatDau: validated.ngayBatDau,
        ngayKetThuc: validated.ngayKetThuc || null,
        tuan,
        thang,
        quy,
        nam,
        amId: validated.amId || null,
        amHoTroId: validated.amHoTroId || null,
        chuyenVienId: validated.chuyenVienId || null,
        cvHoTro1Id: validated.cvHoTro1Id || null,
        cvHoTro2Id: validated.cvHoTro2Id || null,
        isTrongDiem: validated.isTrongDiem,
        isKyVong: validated.isKyVong,
        trangThaiHienTai: validated.trangThaiHienTai || TrangThaiDuAn.MOI,
        ngayChamsocCuoiCung: new Date(),
      } as any,
    });

    await cacheInvalidate("dashboard:overview", "options:khachhang", "options:sanpham", "options:sanpham-groups");
    revalidatePath("/du-an");
    revalidatePath("/quan-ly-am");
    revalidatePath("/quan-ly-cv");
    revalidatePath("/kpi");
    revalidatePath("/dia-ban");
    revalidatePath("/admin/khach-hang");
    revalidatePath("/admin/san-pham");
    await syncReplica();
    return { success: true, id: project.id };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.errors[0].message };
    console.error("Create Project Error:", error);
    return { error: "Lỗi hệ thống khi tạo dự án" };
  }
}

// ═══════════════════════════════════════════════════════════════════
// UPDATE – legacy flow (select from existing)
// ═══════════════════════════════════════════════════════════════════
export async function updateDuAn(id: number, data: any) {
    try {
        await requireRole("ADMIN", "USER", "AM", "CV");
        const validated = DuAnSchema.parse(data);
        const { tuan, thang, quy, nam } = extractTimeFields(validated.ngayBatDau);

        await prisma.duAn.update({
            where: { id },
            data: {
                ...validated,
                amId: validated.amId || null,
                amHoTroId: validated.amHoTroId || null,
                chuyenVienId: validated.chuyenVienId || null,
                cvHoTro1Id: validated.cvHoTro1Id || null,
                cvHoTro2Id: validated.cvHoTro2Id || null,
                tuan,
                thang,
                quy,
                nam,
                isTrongDiem: validated.isTrongDiem,
                isKyVong: validated.isKyVong,
                trangThaiHienTai: validated.trangThaiHienTai || undefined,
                ngayBatDau: validated.ngayBatDau,
                ngayKetThuc: validated.ngayKetThuc || null,
            } as any,
        });

        await cacheInvalidate("dashboard:overview");
        revalidatePath("/du-an");
        revalidatePath("/quan-ly-am");
        revalidatePath("/quan-ly-cv");
        revalidatePath("/kpi");
        revalidatePath("/dia-ban");
        revalidatePath(`/du-an/${id}`);
        await syncReplica();
        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) return { error: error.errors[0].message };
        console.error("Update Project Error:", error);
        return { error: "Lỗi hệ thống khi cập nhật dự án" };
    }
}

export async function updateNhatKy(id: number, content: string, status?: TrangThaiDuAn, date?: Date) {
    try {
        await requireRole("ADMIN", "USER", "AM", "CV");
        await prisma.nhatKyCongViec.update({
            where: { id },
            data: { 
                noiDungChiTiet: content,
                trangThaiMoi: status || undefined,
                ngayGio: date || undefined
            }
        });
        revalidatePath("/du-an/[id]", "page");
        await syncReplica();
        return { success: true };
    } catch (error) {
        console.error("Update Log Error:", error);
        return { error: "Lỗi hệ thống khi cập nhật nhật ký" };
    }
}

/**
 * Hàm hỗ trợ tính toán lại bước hiện tại cao nhất của dự án dựa trên các nhật ký đã được duyệt.
 */
async function updateProjectHighestStep(projectId: number, tx: any) {
    const approvedLogs = await tx.nhatKyCongViec.findMany({
        where: {
            projectId,
            status: "APPROVED",
            buoc: { not: null }
        },
        select: { buoc: true }
    });

    let highestStep = null;
    let maxLevel = -1;

    for (const log of approvedLogs) {
        const match = (log.buoc as string).match(/Bước (\d+)/);
        if (match) {
            const level = parseInt(match[1]);
            if (level > maxLevel) {
                maxLevel = level;
                highestStep = log.buoc;
            }
        }
    }

    await tx.duAn.update({
        where: { id: projectId },
        data: { hienTaiBuoc: highestStep }
    });
}

export async function deleteNhatKy(id: number) {
    try {
        await requireRole("ADMIN", "USER", "AM", "CV");
        
        // Lấy thông tin nhật ký trước khi xóa để kiểm tra nếu là bước quy trình đang chờ duyệt
        const log = await prisma.nhatKyCongViec.findUnique({
            where: { id },
            select: { buoc: true, status: true, projectId: true }
        });

        if (!log) {
            return { error: "Không tìm thấy nhật ký hoặc đã bị xóa" };
        }

        await prisma.$transaction(async (tx) => {
            await tx.nhatKyCongViec.delete({
                where: { id }
            });

            // Nếu nhật ký bị xóa đã được duyệt và có chứa bước quy trình, ta cần tính toán lại bước hiện tại của dự án
            if (log.buoc && log.status === "APPROVED") {
                await updateProjectHighestStep(log.projectId, tx);
            }
        });

        revalidatePath("/du-an/[id]", "page");
        await syncReplica();

        // Nếu là bước quy trình đang chờ duyệt, thông báo cho admin qua Ably
        if (log.buoc && log.status === "PENDING" && ablyServerClient) {
            const channel = ablyServerClient.channels.get("tracking");
            channel.publish("step-deleted", { logId: id }).catch((err) => {
                console.error("Ably publish error (deleteNhatKy):", err);
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Delete Log Error:", error);
        return { error: "Lỗi hệ thống khi xóa nhật ký" };
    }
}

export async function getDuAnList(params?: { 
  search?: string, 
  phanLoaiKH?: string,
  productId?: string,
  trangThai?: string,
  linhVuc?: string,
  amId?: string,
  chuyenVienId?: string,
  urgent?: string,
  hienTaiBuoc?: string,
  phanLoai?: string,
  isDeleted?: boolean,
  page?: number,
  pageSize?: number
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Yêu cầu đăng nhập" };

    const whereClause: any = {
      isPendingDelete: params?.isDeleted === true ? true : false
    };
    
    // Search across multiple fields (Project, Customer, Product)
    if (params?.search) {
      whereClause.OR = [
        { tenDuAn: { contains: params.search, mode: 'insensitive' } },
        { khachHang: { ten: { contains: params.search, mode: 'insensitive' } } },
        { sanPham: { tenChiTiet: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    // Advanced Warning Filter (Urgent: > 10 days)
    if (params?.urgent === 'true') {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      whereClause.ngayChamsocCuoiCung = { lt: tenDaysAgo };
    } else if (params?.urgent === 'false') {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      whereClause.ngayChamsocCuoiCung = { gte: tenDaysAgo };
    }

    // Filters
    if (params?.phanLoaiKH && params.phanLoaiKH !== "ALL") {
      whereClause.khachHang = { ...whereClause.khachHang, phanLoai: params.phanLoaiKH };
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
      whereClause.am = { name: { contains: params.amId, mode: 'insensitive' } };
    }
    if (params?.chuyenVienId && params.chuyenVienId !== "ALL") {
      whereClause.chuyenVien = { name: { contains: params.chuyenVienId, mode: 'insensitive' } };
    }
    if (params?.hienTaiBuoc && params.hienTaiBuoc !== "ALL") {
      whereClause.hienTaiBuoc = { contains: params.hienTaiBuoc };
    }

    // Filter Phân loại (Trọng điểm / Kỳ vọng)
    if (params?.phanLoai && params.phanLoai !== "ALL") {
      if (params.phanLoai === "TRONG_DIEM") {
        whereClause.isTrongDiem = true;
      } else if (params.phanLoai === "KY_VONG") {
        whereClause.isKyVong = true;
      } else if (params.phanLoai === "CA_HAI") {
        whereClause.isTrongDiem = true;
        whereClause.isKyVong = true;
      } else if (params.phanLoai === "BINH_THUONG") {
        whereClause.isTrongDiem = false;
        whereClause.isKyVong = false;
      }
    }

    const pageSize = params?.pageSize || 30;
    const page = params?.page || 1;

    const [data, total] = await Promise.all([
      prisma.duAn.findMany({
        where: whereClause,
        include: {
          khachHang: true,
          sanPham: true,
          am: true,
          amHoTro: true,
          chuyenVien: true,
          cvHoTro1: true,
          cvHoTro2: true,
          nhatKy: {
            orderBy: { ngayGio: 'desc' },
            take: 1,
            select: { ngayGio: true, noiDungChiTiet: true, trangThaiMoi: true }
          },
          _count: {
            select: { nhatKy: true, binhLuan: true }
          }
        } as any,
        orderBy: [
          { isTrongDiem: 'desc' },
          { isKyVong: 'desc' },
          { updatedAt: 'desc' }
        ],
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.duAn.count({ where: whereClause })
    ]);
    
    return { data, total, page, pageSize };
  } catch (error: any) {
    console.error("Fetch Projects Error:", error);
    return { error: `DEV: ${error?.message || "Unknown error"}` };
  }
}

export async function getDuAnDetail(id: number) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Yêu cầu đăng nhập" };

    const project = await prisma.duAn.findUnique({
      where: { id },
      include: {
        khachHang: true,
        sanPham: true,
        am: true,
        amHoTro: true,
        chuyenVien: true,
        cvHoTro1: true,
        cvHoTro2: true,
        nhatKy: {
            orderBy: { ngayGio: 'desc' },
            include: { 
              user: true,
              files: true 
            }
        },
        binhLuan: {
            orderBy: { createdAt: 'desc' },
            include: { user: true }
        }
      } as any
    });

    if (!project) return { error: "Không tìm thấy dự án" };

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
  ngayGio: Date,
  buoc?: string,
  files?: { name: string, type: string, size: number, url: string }[]
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Yêu cầu đăng nhập" };

    const result = await prisma.$transaction(async (tx: any) => {
        const isStepUpdate = !!data.buoc;
        
        // 1. Tạo nhật ký
        const log = await tx.nhatKyCongViec.create({
            data: {
              projectId: data.projectId,
              userId: user.id,
              trangThaiMoi: data.trangThaiMoi,
              noiDungChiTiet: data.noiDungChiTiet,
              ngayGio: data.ngayGio,
              buoc: data.buoc || null,
              status: isStepUpdate ? "PENDING" : "APPROVED",
            }
        });

        // 1.5. Xử lý file đính kèm
        if (data.files && data.files.length > 0) {
            for (const fileData of data.files) {
                await tx.fileDinhKem.create({
                    data: {
                        logId: log.id,
                        name: fileData.name,
                        url: fileData.url,
                        type: fileData.type,
                        size: fileData.size,
                    }
                });
            }
        }

        // 2. Cập nhật dự án - Chỉ cập nhật ngày tương tác cuối nếu ngày mới lớn hơn ngày cũ
        const currentProject = await tx.duAn.findUnique({
            where: { id: data.projectId },
            select: { ngayChamsocCuoiCung: true }
        });

        const existingLastDate = currentProject?.ngayChamsocCuoiCung || new Date(0);
        const finalLastDate = new Date(data.ngayGio) > new Date(existingLastDate) 
            ? data.ngayGio 
            : existingLastDate;

        await tx.duAn.update({
            where: { id: data.projectId },
            data: {
                trangThaiHienTai: data.trangThaiMoi,
                ngayChamsocCuoiCung: finalLastDate,
            }
        });

        // 3. Thông báo
        if (isStepUpdate) {
            const admins = await tx.user.findMany({
                where: {
                    role: { in: ["ADMIN", "USER"] },
                    isActive: true
                }
            });

            const project = await tx.duAn.findUnique({ where: { id: data.projectId } });

            for (const admin of admins) {
                await tx.notification.create({
                    data: {
                        userId: admin.id,
                        title: "Yêu cầu duyệt Bước quy trình",
                        content: `${user.name} đề xuất cập nhật ${data.buoc} cho dự án ${project.tenDuAn}`,
                        type: "APPROVAL_REQUEST",
                        relatedId: String(log.id),
                        projectId: data.projectId,
                    }
                });
            }
        }

        return log;
    });

    await cacheInvalidate("dashboard:overview");
    revalidatePath(`/du-an/${data.projectId}`);
    revalidatePath("/du-an");
    await syncReplica();
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Create Task Log Error:", error);
    return { error: `Lỗi hệ thống: ${error?.message || "Unknown error"}` };
  }
}

export async function getKhachHangOptions() {
  const data = await withCache("options:khachhang", 300, () =>
    prisma.khachHang.findMany({
      where: { isActive: true },
      select: { id: true, ten: true, phanLoai: true, diaChi: true },
      orderBy: { ten: 'asc' },
    })
  );
  return { data };
}

export async function getSanPhamOptions() {
  const data = await withCache("options:sanpham", 300, () =>
    prisma.sanPham.findMany({
      where: { isActive: true },
      select: { id: true, nhom: true, tenChiTiet: true, moTa: true },
      orderBy: [{ nhom: 'asc' }, { tenChiTiet: 'asc' }],
    })
  );
  return { data };
}

export async function getSanPhamGroups() {
  const data = await withCache("options:sanpham-groups", 300, async () => {
    const groups = await prisma.sanPham.groupBy({
      by: ['nhom'],
    });
    return groups.map((g: any) => g.nhom);
  });
  return { data };
}

export async function getUserOptions() {
  const data = await withCache("options:users", 300, () =>
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true }
    })
  );
  return { data };
}

export async function requestDeleteDuAn(id: number) {
  try {
    const user = await requireRole("ADMIN", "USER", "AM", "CV");
    if (!user) return { error: "Yêu cầu đăng nhập" };

    await prisma.duAn.update({
      where: { id },
      data: { isPendingDelete: true, deleteRequestedAt: new Date() }
    });
    await cacheInvalidate("dashboard:overview");
    revalidatePath("/du-an");
    await syncReplica();
    return { success: true };
  } catch (error) {
    return { error: "Xoá thất bại" };
  }
}

export async function approveDeleteDuAn(id: number) {
  try {
    const user = await requireRole("ADMIN", "USER");
    
    // Check dynamic permission for non-admin
    if (user.role !== "ADMIN") {
      // Try both the standard key and the actual path to be safe
      const hasPermByKey = await checkPermission(user.role, "du-an-da-xoa", "canDelete");
      const hasPermByPath = await checkPermission(user.role, "/admin/du-an-da-xoa", "canDelete");
      
      if (!hasPermByKey && !hasPermByPath) {
        return { error: "Bạn không có quyền xoá vĩnh viễn (Phân quyền: Dự án đã xóa - Xóa)" };
      }
    }

    await prisma.duAn.delete({ where: { id }});
    await cacheInvalidate("dashboard:overview");
    revalidatePath("/admin/du-an-da-xoa");
    revalidatePath("/du-an");
    await syncReplica();
    return { success: true };
  } catch (error) {
    console.error("Permanent Delete Error:", error);
    return { error: "Xoá vĩnh viễn thất bại" };
  }
}

export async function restoreDuAn(id: number) {
  try {
    const user = await requireRole("ADMIN", "USER");
    
    // Check dynamic permission for non-admin (restore usually requires Edit permission)
    if (user.role !== "ADMIN") {
      const hasPermByKey = await checkPermission(user.role, "du-an-da-xoa", "canEdit");
      const hasPermByPath = await checkPermission(user.role, "/admin/du-an-da-xoa", "canEdit");
      
      if (!hasPermByKey && !hasPermByPath) {
        return { error: "Bạn không có quyền khôi phục dự án (Phân quyền: Dự án đã xóa - Sửa)" };
      }
    }

    await prisma.duAn.update({
      where: { id },
      data: { isPendingDelete: false, deleteRequestedAt: null }
    });
    await cacheInvalidate("dashboard:overview");
    revalidatePath("/admin/du-an-da-xoa");
    revalidatePath("/du-an");
    await syncReplica();
    return { success: true };
  } catch (error) {
    return { error: "Khôi phục thất bại" };
  }
}

export async function approveStep(logId: number) {
    try {
        const user = await requireRole("ADMIN", "USER");

        const log = await prisma.nhatKyCongViec.findUnique({
            where: { id: logId },
            include: { duAn: true }
        });

        if (!log || !log.buoc) return { error: "Dữ liệu không hợp lệ" };

        await prisma.$transaction(async (tx) => {
            // 1. Phê duyệt nhật ký này
            await tx.nhatKyCongViec.update({
                where: { id: logId },
                data: { status: "APPROVED" }
            });

            // 2. Tính toán lại bước cao nhất đã được duyệt cho dự án này
            // Điều này đảm bảo nếu admin duyệt Bước 2 trước Bước 1, dự án vẫn giữ ở Bước 2
            await updateProjectHighestStep(log.projectId, tx);

            // 3. Tạo thông báo
            await tx.notification.create({
                data: {
                    userId: log.userId,
                    title: "Bước quy trình đã được duyệt",
                    content: `Đề xuất ${log.buoc} của bạn cho dự án ${log.duAn.tenDuAn} đã được phê duyệt.`,
                    type: "APPROVAL_RESULT",
                    projectId: log.projectId,
                }
            });

            // 4. Đánh dấu các yêu cầu duyệt liên quan là đã đọc
            await tx.notification.updateMany({
                where: {
                    relatedId: String(logId),
                    type: "APPROVAL_REQUEST"
                },
                data: { isRead: true }
            });
        });

        await cacheInvalidate("dashboard:overview");
        revalidatePath(`/du-an/${log.projectId}`);
        await syncReplica();

        if (ablyServerClient) {
            const channel = ablyServerClient.channels.get("notifications");
            channel.publish("mark-read-related", { relatedId: String(logId) }).catch(() => {});
        }

        return { success: true };
    } catch (error) {
        return { error: "Duyệt thất bại" };
    }
}

export async function rejectStep(logId: number, reason: string) {
    try {
        const user = await requireRole("ADMIN", "USER");

        const log = await prisma.nhatKyCongViec.findUnique({
            where: { id: logId },
            include: { duAn: true }
        });

        if (!log) return { error: "Không tìm thấy nhật ký" };

        await prisma.$transaction([
            prisma.nhatKyCongViec.update({
                where: { id: logId },
                data: { status: "REJECTED" }
            }),
            prisma.notification.create({
                data: {
                    userId: log.userId,
                    title: "Bước quy trình bị từ chối",
                    content: `Đề xuất ${log.buoc} cho dự án ${log.duAn.tenDuAn} đã bị từ chối. Lý do: ${reason}. Vui lòng cập nhật lại.`,
                    type: "APPROVAL_RESULT",
                    projectId: log.projectId,
                }
            }),
            prisma.notification.updateMany({
                where: {
                    relatedId: String(logId),
                    type: "APPROVAL_REQUEST"
                },
                data: { isRead: true }
            })
        ]);

        revalidatePath(`/du-an/${log.projectId}`);
        await syncReplica();

        if (ablyServerClient) {
            const channel = ablyServerClient.channels.get("notifications");
            channel.publish("mark-read-related", { relatedId: String(logId) }).catch(() => {});
        }

        return { success: true };
    } catch (error) {
        return { error: "Từ chối thất bại" };
    }
}

export async function getNotifications() {
    try {
        const user = await getCurrentUser();
        if (!user) return { data: [] };

        const data = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 20
        });
        return { data };
    } catch (error) {
        return { data: [] };
    }
}

export async function markNotificationRead(id: number) {
    await prisma.notification.update({
        where: { id },
        data: { isRead: true }
    });
    return { success: true };
}

export async function getPendingStepLogs() {
    try {
        const user = await getCurrentUser();
        if (!user || !["ADMIN", "USER"].includes(user.role)) return { data: [] };

        const data = await prisma.nhatKyCongViec.findMany({
            where: { status: "PENDING" },
            include: {
                duAn: true,
                user: true,
                files: true
            },
            orderBy: { createdAt: "desc" }
        });
        return { data };
    } catch (error) {
        console.error("Fetch Pending Logs Error:", error);
    }
}

export async function revokeStepLog(logId: number) {
    try {
        const user = await requireRole("ADMIN", "USER");

        const log = await prisma.nhatKyCongViec.findUnique({
            where: { id: logId },
        });

        if (!log || !log.buoc) {
            return { error: "Nhật ký này không chứa bước quy trình hoặc không tồn tại" };
        }

        const projectId = log.projectId;

        await prisma.$transaction(async (tx) => {
            await tx.nhatKyCongViec.update({
                where: { id: logId },
                data: { status: "REJECTED" }
            });

            // Tính toán lại bước quy trình cao nhất của dự án (loại bỏ bước vừa bị thu hồi)
            await updateProjectHighestStep(projectId, tx);
        });

        revalidatePath(`/du-an/${projectId}`);
        revalidatePath("/du-an");
        await syncReplica();

        return { success: true };
    } catch (error) {
        console.error("Revoke Step Error:", error);
        return { error: "Lỗi hệ thống khi thu hồi bước" };
    }
}

/**
 * Lấy toàn bộ dự án trên hệ thống (không phân trang) để xuất Excel.
 * Bao gồm đầy đủ thông tin khách hàng, sản phẩm, nhân sự và toàn bộ nhật ký.
 */
export async function getAllProjectsForExport() {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "Yêu cầu đăng nhập" };

    const data = await prisma.duAn.findMany({
      where: { 
        isPendingDelete: false 
      },
      include: {
        khachHang: true,
        sanPham: true,
        am: true,
        amHoTro: true,
        chuyenVien: true,
        cvHoTro1: true,
        cvHoTro2: true,
        nhatKy: {
          orderBy: { ngayGio: 'desc' },
          select: { 
            ngayGio: true, 
            noiDungChiTiet: true, 
            trangThaiMoi: true,
            buoc: true 
          }
        },
      } as any,
      orderBy: { updatedAt: 'desc' },
    });
    
    return { data };
  } catch (error: any) {
    console.error("Export Projects Error:", error);
    return { error: `Lỗi khi lấy dữ liệu: ${error?.message}` };
  }
}
