"use server";

/**
 * Server Actions for "Dữ liệu nguồn" (Source Data) Tab
 * ────────────────────────────────────────────────────────
 * CRUD + Excel import/export + Master rebuild for Bảng 1–4.
 */

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { revalidatePath, revalidateTag } from "next/cache";
import { SourceType, TrangThaiDuAn, PhanLoaiKH, LoaiDoanhThu } from "@prisma/client";
import { extractTimeFields } from "@/lib/utils/time-extract";
import { cacheInvalidate } from "@/lib/cache";
import { syncMasterRevenue, syncMasterRevenueMany, rebuildAllMasterRevenue } from "@/lib/utils/master-revenue-sync";
import {
  generateCloudDistributeMonthlyView,
  generateEContractMonthlyView,
  generatePipelineMonthlyView,
  generateMasterMonthlyView,
  type MonthlyRevenueView,
} from "@/lib/utils/source-revenue-engine";

// ── Types ──────────────────────────────────────────────────────────
export interface SourceDataRow {
  id: number;
  tenDuAn: string;
  khachHang: string;
  phanLoaiKH: string;
  nhomSP: string;
  tenSP: string;
  amName: string | null;
  cvName: string | null;
  tongDoanhThu: number;
  doanhThuTheoThang: number;
  maHopDong: string | null;
  trangThai: string;
  sourceType: string;
  soKy1GoiCuoc: number | null;
  ngayBatDau: string;
  ngayKetThuc: string | null;
  loaiDoanhThu?: string;
  thangGhiNhan?: string;
  // 12-month revenue columns
  months: MonthlyRevenueView;
  totalNam: number; // Sum of all 12 months
}

// ── Get Source Data by Type ────────────────────────────────────────
export async function getSourceDataByType(
  sourceType: "PIPELINE" | "CLOUD_DISTRIBUTE" | "ECONTRACT_INVOICE",
  year: number
): Promise<{ data: SourceDataRow[]; error?: string }> {
  try {
    const user = await requireRole("ADMIN", "USER");
    if (!user) return { data: [], error: "Yêu cầu đăng nhập" };

    const projects = await prisma.duAn.findMany({
      where: {
        sourceType: sourceType as SourceType,
        isPendingDelete: false,
      },
      include: {
        khachHang: { select: { ten: true, phanLoai: true } },
        sanPham: { select: { nhom: true, tenChiTiet: true } },
        am: { select: { name: true } },
        chuyenVien: { select: { name: true } },
        invoiceRecords: sourceType === "ECONTRACT_INVOICE"
          ? {
              where: { namGhiNhan: year },
              select: {
                thangGhiNhan: true,
                namGhiNhan: true,
                doanhThuTheoThang: true,
              },
            }
          : false,
        revenueSlices: {
          where: { namBaoCao: year },
          select: {
            thangBaoCao: true,
            namBaoCao: true,
            doanhThuPhanBo: true,
            isManualEdit: true,
            loaiDoanhThu: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const rows: SourceDataRow[] = projects.map((p) => {
      let months: MonthlyRevenueView;

      switch (sourceType) {
        case "PIPELINE":
          months = generatePipelineMonthlyView();
          break;
        case "CLOUD_DISTRIBUTE":
          months = generateCloudDistributeMonthlyView(
            p.ngayBatDau,
            p.doanhThuTheoThang || 0,
            p.soKy1GoiCuoc || 0,
            year
          );
          break;
        case "ECONTRACT_INVOICE":
          months = generateEContractMonthlyView(
            p.invoiceRecords || [],
            year
          );
          break;
        default:
          months = generatePipelineMonthlyView();
      }

      // Apply manual overrides
      const masterView = generateMasterMonthlyView(
        {
          sourceType: p.sourceType,
          ngayBatDau: p.ngayBatDau,
          doanhThuTheoThang: p.doanhThuTheoThang,
          soKy1GoiCuoc: p.soKy1GoiCuoc,
          invoiceRecords: p.invoiceRecords || [],
        },
        p.revenueSlices,
        year
      );

      const totalNam = Object.values(masterView).reduce(
        (sum, val) => sum + val,
        0
      );

      const firstInvoice = p.invoiceRecords?.[0];
      const thangGhiNhan = firstInvoice ? `Tháng ${firstInvoice.thangGhiNhan}` : "-";

      return {
        id: p.id,
        tenDuAn: p.tenDuAn,
        khachHang: p.khachHang.ten,
        phanLoaiKH: p.khachHang.phanLoai,
        nhomSP: p.sanPham.nhom,
        tenSP: p.sanPham.tenChiTiet,
        amName: p.am?.name || null,
        cvName: p.chuyenVien?.name || null,
        tongDoanhThu: p.tongDoanhThuDuKien,
        doanhThuTheoThang: p.doanhThuTheoThang || 0,
        maHopDong: p.maHopDong,
        trangThai: p.trangThaiHienTai,
        sourceType: p.sourceType,
        soKy1GoiCuoc: p.soKy1GoiCuoc,
        ngayBatDau: p.ngayBatDau.toISOString(),
        ngayKetThuc: p.ngayKetThuc?.toISOString() || null,
        thangGhiNhan,
        months: masterView,
        totalNam,
      };
    });

    // ── Bảng 2 deduplication ────────────────────────────────────────
    // For Cloud-Distribute: deduplicate by
    // (maHopDong + tenSP + tongDoanhThu + ngayBatDau + ngayKetThuc).
    // When duplicates are found, merge into one row — keep first row's
    // metadata and don't double-count revenues (they are identical).
    if (sourceType === "CLOUD_DISTRIBUTE") {
      const cloudMap = new Map<
        string,
        SourceDataRow & { _count: number }
      >();

      for (const row of rows) {
        const key = [
          (row.maHopDong || "").trim().toLowerCase(),
          (row.tenSP || "").trim().toLowerCase(),
          String(row.tongDoanhThu),
          row.ngayBatDau,
          row.ngayKetThuc || "",
        ].join("||");

        const existing = cloudMap.get(key);
        if (!existing) {
          cloudMap.set(key, { ...row, _count: 1 });
        } else {
          // Duplicate row — same contract, product, revenue, dates.
          // Monthly distribution is identical, so just skip it.
          existing._count += 1;
        }
      }

      // Re-build rows from the deduplicated map
      const dedupedRows: SourceDataRow[] = Array.from(cloudMap.values()).map(
        ({ _count, ...row }) => row
      );

      return { data: dedupedRows };
    }

    return { data: rows };
  } catch (error: any) {
    console.error("[SourceData] getSourceDataByType error:", error);
    return { data: [], error: error.message };
  }
}

// ── Source priority for deduplication ──────────────────────────────
const SOURCE_PRIORITY_MAP: Record<string, number> = {
  ECONTRACT_INVOICE: 1,
  CLOUD_DISTRIBUTE: 2,
  PIPELINE: 3,
};

// ── Get Master Revenue Data (Bảng 4) ──────────────────────────────
// Deduplicates by maHopDong: each unique contract code appears once,
// with monthly revenues consolidated using source priority.
export async function getMasterRevenueData(year: number): Promise<{
  data: SourceDataRow[];
  error?: string;
}> {
  try {
    const user = await requireRole("ADMIN", "USER");
    if (!user) return { data: [], error: "Yêu cầu đăng nhập" };

    // Fetch all master revenue rows for the year
    const masterRows = await prisma.masterRevenue.findMany({
      where: {
        nam: year,
        duAn: { isPendingDelete: false },
      },
      include: {
        duAn: {
          select: {
            id: true,
            tenDuAn: true,
            tongDoanhThuDuKien: true,
            doanhThuTheoThang: true,
            maHopDong: true,
            trangThaiHienTai: true,
            sourceType: true,
            soKy1GoiCuoc: true,
            ngayBatDau: true,
            ngayKetThuc: true,
            khachHang: { select: { ten: true, phanLoai: true } },
            sanPham: { select: { nhom: true, tenChiTiet: true } },
            am: { select: { name: true } },
            chuyenVien: { select: { name: true } },
          },
        },
      },
    });

    // ── Step 1: Consolidate same-source rows for the same contract/month ──
    type ProjectInfo = typeof masterRows[0]["duAn"];
    interface ConsolidatedRow {
      project: ProjectInfo;
      sourceType: string;
      loaiDoanhThu: string;
      thang: number;
      doanhThu: number;
    }

    const consolidated = new Map<string, ConsolidatedRow>();
    for (const row of masterRows) {
      const contractKey = row.duAn.maHopDong
        ? `hd:${row.duAn.maHopDong}`
        : `pid:${row.projectId}`;
      const key = `${row.sourceType}:${contractKey}:${row.thang}`;

      const existing = consolidated.get(key);
      if (!existing) {
        consolidated.set(key, {
          project: row.duAn,
          sourceType: row.sourceType,
          loaiDoanhThu: row.loaiDoanhThu,
          thang: row.thang,
          doanhThu: row.doanhThu,
        });
      } else {
        existing.doanhThu += row.doanhThu;
      }
    }

    // ── Step 2: Cross-source dedup per contract/month ──
    // Keep only the highest-priority source for each contract + month
    const deduped = new Map<string, ConsolidatedRow>();
    for (const row of consolidated.values()) {
      const contractKey = row.project.maHopDong
        ? `hd:${row.project.maHopDong}`
        : `pid:${row.project.id}`;
      const dedupeKey = `${contractKey}:${row.thang}`;

      const existing = deduped.get(dedupeKey);
      if (!existing) {
        deduped.set(dedupeKey, row);
      } else {
        const existingPri = SOURCE_PRIORITY_MAP[existing.sourceType] ?? 99;
        const newPri = SOURCE_PRIORITY_MAP[row.sourceType] ?? 99;
        if (newPri < existingPri) {
          deduped.set(dedupeKey, row);
        }
      }
    }

    // ── Step 3: Group by contract code into one row per mã hợp đồng ──
    interface ContractEntry {
      project: ProjectInfo;
      sourceType: string;
      sourcePriority: number;
      loaiDoanhThu: string;
      months: MonthlyRevenueView;
    }

    const contractMap = new Map<string, ContractEntry>();
    for (const row of deduped.values()) {
      const contractKey = row.project.maHopDong
        ? `hd:${row.project.maHopDong}`
        : `pid:${row.project.id}`;

      if (!contractMap.has(contractKey)) {
        contractMap.set(contractKey, {
          project: row.project,
          sourceType: row.sourceType,
          sourcePriority: SOURCE_PRIORITY_MAP[row.sourceType] ?? 99,
          loaiDoanhThu: row.loaiDoanhThu,
          months: {
            month1: 0, month2: 0, month3: 0, month4: 0,
            month5: 0, month6: 0, month7: 0, month8: 0,
            month9: 0, month10: 0, month11: 0, month12: 0,
          },
        });
      }

      const entry = contractMap.get(contractKey)!;

      // Use the project info from the highest-priority source
      const rowPri = SOURCE_PRIORITY_MAP[row.sourceType] ?? 99;
      if (rowPri < entry.sourcePriority) {
        entry.project = row.project;
        entry.sourceType = row.sourceType;
        entry.sourcePriority = rowPri;
        entry.loaiDoanhThu = row.loaiDoanhThu;
      }

      // Accumulate monthly revenue
      if (row.thang >= 1 && row.thang <= 12) {
        const key = `month${row.thang}` as keyof MonthlyRevenueView;
        entry.months[key] += row.doanhThu;
      }
    }

    // ── Step 4: Build final SourceDataRow[] ──
    const rows: SourceDataRow[] = Array.from(contractMap.entries()).map(
      ([_contractKey, { project, sourceType, loaiDoanhThu, months }]) => {
        const totalNam = Object.values(months).reduce(
          (sum, val) => sum + val,
          0
        );

        return {
          id: project.id,
          tenDuAn: project.tenDuAn,
          khachHang: project.khachHang.ten,
          phanLoaiKH: project.khachHang.phanLoai,
          nhomSP: project.sanPham.nhom,
          tenSP: project.sanPham.tenChiTiet,
          amName: project.am?.name || null,
          cvName: project.chuyenVien?.name || null,
          tongDoanhThu: project.tongDoanhThuDuKien,
          doanhThuTheoThang: project.doanhThuTheoThang || 0,
          maHopDong: project.maHopDong,
          trangThai: project.trangThaiHienTai,
          sourceType,
          soKy1GoiCuoc: project.soKy1GoiCuoc,
          ngayBatDau: project.ngayBatDau.toISOString(),
          ngayKetThuc: project.ngayKetThuc?.toISOString() || null,
          loaiDoanhThu,
          months,
          totalNam,
        };
      }
    );

    return { data: rows };
  } catch (error: any) {
    console.error("[SourceData] getMasterRevenueData error:", error);
    return { data: [], error: error.message };
  }
}

// ── Rebuild Master Revenue (Admin action) ─────────────────────────
export async function rebuildMasterData(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const user = await requireRole("ADMIN");
    if (!user) return { success: false, error: "Yêu cầu quyền Admin" };

    const result = await rebuildAllMasterRevenue();

    await cacheInvalidate("dashboard:overview");
    (revalidateTag as any)("dashboard-overview");
    revalidatePath("/du-an/du-lieu-nguon");

    return {
      success: true,
      message: `Đã rebuild thành công: ${result.sliceCount} bản ghi từ ${result.projectCount} dự án.`,
    };
  } catch (error: any) {
    console.error("[SourceData] rebuildMasterData error:", error);
    return { success: false, error: error.message };
  }
}

// ── Import Excel for Source Data ───────────────────────────────────
export async function importSourceExcel(
  rows: any[],
  sourceType: "PIPELINE" | "CLOUD_DISTRIBUTE" | "ECONTRACT_INVOICE"
): Promise<{ success: boolean; count?: number; message?: string; error?: string }> {
  try {
    const user = await requireRole("ADMIN", "USER");
    if (!user) return { success: false, error: "Yêu cầu đăng nhập" };

    // Validate: Block "Đã ký hợp đồng" — only for Pipeline (Bảng 1)
    // Bảng 2 (Cloud) và Bảng 3 (EContract) là dự án đã ký nên cho phép
    if (sourceType === "PIPELINE") {
      for (const row of rows) {
        if (row.trangThaiKhoiTao === "Đã ký hợp đồng") {
          return {
            success: false,
            error:
              "Đối với những dự án 'Đã ký hợp đồng' vui lòng quản trị viên để cập nhật.",
          };
        }
      }
    }

    const batchId = `BATCH_SRC_${sourceType}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    let successCount = 0;

    // Status mapping
    const trangThaiMap: Record<string, TrangThaiDuAn> = {
      "Mới": TrangThaiDuAn.MOI,
      "Đang làm việc": TrangThaiDuAn.DANG_LAM_VIEC,
      "Đã demo": TrangThaiDuAn.DA_DEMO,
      "Đã gửi báo giá": TrangThaiDuAn.DA_GUI_BAO_GIA,
      "Đã ký hợp đồng": TrangThaiDuAn.DA_KY_HOP_DONG,
      "Thất bại": TrangThaiDuAn.THAT_BAI,
    };

    const phanLoaiMap: Record<string, PhanLoaiKH> = {
      "Chính phủ/Sở ban ngành": PhanLoaiKH.CHINH_PHU,
      "Doanh nghiệp": PhanLoaiKH.DOANH_NGHIEP,
      "Công an": PhanLoaiKH.CONG_AN,
    };

    // Pre-fetch existing customers and products (same pattern as excel-actions.ts)
    const uniqueKHNames = new Set<string>();
    const uniqueSPKeys = new Set<string>();

    rows.forEach((row) => {
      if (row.khachHangName) uniqueKHNames.add(row.khachHangName.trim());
      if (row.nhomSanPham && row.tenSanPham) {
        uniqueSPKeys.add(`${row.nhomSanPham.trim()}|${row.tenSanPham.trim()}`);
      }
    });

    const existingKHs = await prisma.khachHang.findMany({
      where: { ten: { in: Array.from(uniqueKHNames) } },
    });
    const khMap = new Map<string, { id: number; linhVuc: string }>();
    existingKHs.forEach((kh) =>
      khMap.set(kh.ten.toLowerCase(), { id: kh.id, linhVuc: kh.phanLoai })
    );

    const existingSPs = await prisma.sanPham.findMany();
    const spMap = new Map<string, number>();
    existingSPs.forEach((sp) =>
      spMap.set(`${sp.nhom}|${sp.tenChiTiet}`.toLowerCase(), sp.id)
    );

    // Create missing customers & products
    for (const name of uniqueKHNames) {
      if (!khMap.has(name.toLowerCase())) {
        const sampleRow = rows.find(
          (r: any) => r.khachHangName?.trim() === name
        );
        const pl =
          phanLoaiMap[sampleRow?.phanLoaiKH] || PhanLoaiKH.DOANH_NGHIEP;
        const newKH = await prisma.khachHang.create({
          data: { 
            ten: name, 
            phanLoai: pl,
            diaChi: sampleRow?.diaChi?.toString().trim() || null
          },
        });
        khMap.set(name.toLowerCase(), {
          id: newKH.id,
          linhVuc: pl,
        });
      }
    }

    for (const key of uniqueSPKeys) {
      if (!spMap.has(key.toLowerCase())) {
        const [nhom, ten] = key.split("|");
        const sampleRow = rows.find(
          (r: any) =>
            `${r.nhomSanPham?.trim()}|${r.tenSanPham?.trim()}`.toLowerCase() === key.toLowerCase()
        );
        const newSP = await prisma.sanPham.create({
          data: { 
            nhom, 
            tenChiTiet: ten,
            moTa: sampleRow?.moTaSanPham?.toString().trim() || null
          },
        });
        spMap.set(key.toLowerCase(), newSP.id);
      }
    }

    // Pre-fetch users for AM/CV name → ID lookup
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
    });
    const userNameMap = new Map<string, string>(); // name.lowercase → userId
    allUsers.forEach((u) => {
      if (u.name) userNameMap.set(u.name.toLowerCase().trim(), u.id);
      // Also map by email prefix for partial matches
      if (u.email) userNameMap.set(u.email.toLowerCase().trim(), u.id);
    });

    // Helper: resolve user name/id to actual userId
    const resolveUserId = (val: string | null | undefined): string | null => {
      if (!val) return null;
      const trimmed = val.trim();
      if (!trimmed) return null;
      // Try exact name match first
      const byName = userNameMap.get(trimmed.toLowerCase());
      if (byName) return byName;
      // Try partial match (user might have been truncated in Excel)
      for (const [name, id] of userNameMap.entries()) {
        if (name.startsWith(trimmed.toLowerCase()) || trimmed.toLowerCase().startsWith(name)) {
          return id;
        }
      }
      // Check if it's already a valid user ID format
      const directUser = allUsers.find((u) => u.id === trimmed);
      if (directUser) return directUser.id;
      return null; // Not found — skip instead of FK error
    };

    // Process rows in chunks
    const chunkSize = 20;
    const createdProjectIds: number[] = [];

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);

      const preparedData = chunk
        .map((row: any) => {
          if (!row.tenDuAn) return null;
          const khInfo = khMap.get(row.khachHangName?.trim().toLowerCase());
          const spId = spMap.get(
            `${row.nhomSanPham?.trim()}|${row.tenSanPham?.trim()}`.toLowerCase()
          );
          if (!khInfo || !spId) return null;

          const ngayBatDau = parseExcelDateUTC(row.ngayBatDau);
          const ngayKetThuc = row.ngayKetThuc
            ? parseExcelDateUTC(row.ngayKetThuc)
            : null;
          const { tuan, thang, quy, nam } = extractTimeFields(ngayBatDau);
          const trangThai =
            trangThaiMap[row.trangThaiKhoiTao] || TrangThaiDuAn.MOI;

          return {
            duAnData: {
              tenDuAn: row.tenDuAn,
              linhVuc: khInfo.linhVuc as any,
              customerId: khInfo.id,
              productId: spId,
              tongDoanhThuDuKien: safeParseFloat(row.tongDoanhThu),
              doanhThuTheoThang: safeParseFloat(row.dtTheoThang),
              maHopDong: row.maHopDong || null,
              ngayBatDau,
              ngayKetThuc,
              tuan,
              thang,
              quy,
              nam,
              amId: resolveUserId(row.amId),
              amHoTroId: resolveUserId(row.amHoTro1Id),
              chuyenVienId: resolveUserId(row.chuyenVienId),
              cvHoTro1Id: resolveUserId(row.cvHoTro1Id),
              cvHoTro2Id: resolveUserId(row.cvHoTro2Id),
              isTrongDiem: row.isTrongDiem === "Có",
              isKyVong: row.isKyVong === "Có",
              trangThaiHienTai: trangThai,
              ngayChamsocCuoiCung: new Date(),
              sourceType: sourceType as SourceType,
              soKy1GoiCuoc: parseInt(row.soKy1GoiCuoc) || null,
              batchId,
            },
            trangThai,
            invoiceData:
              sourceType === "ECONTRACT_INVOICE"
                ? extractInvoiceData(
                    row,
                    ngayBatDau,
                    safeParseFloat(row.tongDoanhThu),
                    safeParseFloat(row.dtTheoThang)
                  )
                : null,
          };
        })
        .filter(Boolean);

      if (preparedData.length === 0) continue;

      await prisma.$transaction(
        async (tx) => {
          await Promise.all(
            preparedData.map(async (item: any) => {
              const duAn = await tx.duAn.create({ data: item.duAnData });
              createdProjectIds.push(duAn.id);

              // Create log entry
              await tx.nhatKyCongViec.create({
                data: {
                  projectId: duAn.id,
                  userId: user.id,
                  trangThaiMoi: item.trangThai,
                  noiDungChiTiet: `Import dữ liệu nguồn ${sourceType} [${batchId}]`,
                  ngayGio: new Date(),
                  status: "APPROVED",
                },
              });

              // For EContract: create invoice records
              if (item.invoiceData && item.invoiceData.length > 0) {
                await tx.invoiceRecord.createMany({
                  data: item.invoiceData.map((inv: any) => ({
                    projectId: duAn.id,
                    thangGhiNhan: inv.thang,
                    namGhiNhan: inv.nam,
                    doanhThuTheoThang: inv.doanhThu,
                    batchId,
                  })),
                });
              }

              successCount++;
            })
          );
        },
        { timeout: 60000 }
      );
    }

    // Sync MasterRevenue for all created projects in bulk
    await syncMasterRevenueMany(createdProjectIds);

    await cacheInvalidate(
      "dashboard:overview",
      "options:khachhang",
      "options:sanpham"
    );
    (revalidateTag as any)("dashboard-overview");
    revalidatePath("/du-an");
    revalidatePath("/du-an/du-lieu-nguon");

    return {
      success: true,
      count: successCount,
      message: `Đã import thành công ${successCount} dự án vào ${getSourceLabel(sourceType)}.`,
    };
  } catch (error: any) {
    console.error("[SourceData] importSourceExcel error:", error);
    return { success: false, error: `Lỗi hệ thống: ${error.message}` };
  }
}

// ── Recall Source Batch ────────────────────────────────────────────
export async function recallSourceBatch(
  sourceType: "PIPELINE" | "CLOUD_DISTRIBUTE" | "ECONTRACT_INVOICE"
): Promise<{ success: boolean; count?: number; message?: string; error?: string }> {
  try {
    const user = await requireRole("ADMIN", "USER");
    if (!user) return { success: false, error: "Yêu cầu đăng nhập" };

    // Find latest batch for this source type
    const latestLog = await prisma.nhatKyCongViec.findFirst({
      where: {
        noiDungChiTiet: {
          startsWith: `Import dữ liệu nguồn ${sourceType} [BATCH_SRC_`,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestLog) {
      return {
        success: false,
        error: "Không tìm thấy batch nào để thu hồi.",
      };
    }

    const match = latestLog.noiDungChiTiet.match(/\[(BATCH_SRC_.*?)\]/);
    if (!match)
      return { success: false, error: "Dữ liệu nhật ký không hợp lệ." };

    const batchId = match[1];

    // Find all projects in this batch
    const batchProjects = await prisma.duAn.findMany({
      where: { batchId },
      select: { id: true },
    });

    const projectIds = batchProjects.map((p) => p.id);

    if (projectIds.length === 0) {
      return { success: false, error: "Không tìm thấy dự án nào để thu hồi." };
    }

    // Delete in chunks
    const delChunkSize = 100;
    for (let i = 0; i < projectIds.length; i += delChunkSize) {
      const chunk = projectIds.slice(i, i + delChunkSize);
      await prisma.duAn.deleteMany({ where: { id: { in: chunk } } });
    }

    await cacheInvalidate("dashboard:overview");
    (revalidateTag as any)("dashboard-overview");
    revalidatePath("/du-an");
    revalidatePath("/du-an/du-lieu-nguon");

    return {
      success: true,
      count: projectIds.length,
      message: `Đã thu hồi ${projectIds.length} dự án từ ${getSourceLabel(sourceType)}.`,
    };
  } catch (error: any) {
    console.error("[SourceData] recallSourceBatch error:", error);
    return { success: false, error: error.message };
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function parseExcelDateUTC(val: any): Date {
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
  if (!val) return new Date();

  const str = val.toString().trim();

  // Excel serial date number
  if (/^\d+(\.\d+)?$/.test(str)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const days = parseFloat(str);
    return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
  }

  // DD/MM/YYYY or DD-MM-YYYY → UTC midnight
  const parts = str.split(/[\/\-]/);
  if (parts.length === 3) {
    const year = parseInt(parts[2]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[0]);
    const d = new Date(Date.UTC(year, month, day));
    if (!isNaN(d.getTime())) return d;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  return new Date();
}

function safeParseFloat(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const str = val.toString().replace(/,/g, ".").trim();
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

function getSourceLabel(sourceType: string): string {
  switch (sourceType) {
    case "PIPELINE":
      return "Bảng 1 (Pipeline)";
    case "CLOUD_DISTRIBUTE":
      return "Bảng 2 (Cloud-Distribute)";
    case "ECONTRACT_INVOICE":
      return "Bảng 3 (EContract-Invoice)";
    default:
      return sourceType;
  }
}

function extractInvoiceData(
  row: any,
  ngayBatDau: Date,
  tongDoanhThu: number,
  doanhThuTheoThang?: number
): Array<{ thang: number; nam: number; doanhThu: number }> {
  const thangStr = row.thangGhiNhan?.toString() || "";
  const match = thangStr.match(/\d+/);
  const thang = match ? parseInt(match[0]) : 1; // default to January if not parseable

  const nam = ngayBatDau.getUTCFullYear();
  const doanhThu = typeof doanhThuTheoThang === "number" ? doanhThuTheoThang : safeParseFloat(row.dtTheoThang);

  return [{ thang, nam, doanhThu }];
}
