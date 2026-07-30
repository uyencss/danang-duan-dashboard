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
            year,
            p.tongDoanhThuDuKien || 0
          );
          break;
        case "ECONTRACT_INVOICE": {
          // Filter invoices for selected year for monthly view
          const yearInvoices = (p.invoiceRecords || []).filter(
            (inv: any) => inv.namGhiNhan === year
          );
          months = generateEContractMonthlyView(yearInvoices, year);
        }
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
          tongDoanhThuDuKien: p.tongDoanhThuDuKien,
          invoiceRecords: sourceType === "ECONTRACT_INVOICE"
            ? (p.invoiceRecords || []).filter((inv: any) => inv.namGhiNhan === year)
            : p.invoiceRecords || [],
        },
        p.revenueSlices,
        year
      );

      const totalNam = Object.values(masterView).reduce(
        (sum, val) => sum + val,
        0
      );

      // For Bảng 3: show tháng ghi nhận from ALL invoices (not just current year)
      const allInvoices = p.invoiceRecords || [];
      const thangGhiNhanList = allInvoices.map(
        (inv: any) => `T${inv.thangGhiNhan}/${inv.namGhiNhan}`
      );
      const thangGhiNhan = thangGhiNhanList.length > 0
        ? thangGhiNhanList.join(", ")
        : "-";

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
      if (!row.duAn) continue;
      const spName = row.duAn?.sanPham?.tenChiTiet?.trim().toLowerCase() || "";
      const startDate = row.duAn?.ngayBatDau ? new Date(row.duAn.ngayBatDau).getTime() : "";
      const contractKey = row.duAn?.maHopDong
        ? `hd:${row.duAn.maHopDong}:dt:${row.duAn.tongDoanhThuDuKien}:sp:${spName}:bd:${startDate}`
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
      const spName = row.project?.sanPham?.tenChiTiet?.trim().toLowerCase() || "";
      const startDate = row.project?.ngayBatDau ? new Date(row.project.ngayBatDau).getTime() : "";
      const contractKey = row.project?.maHopDong
        ? `hd:${row.project.maHopDong}:dt:${row.project.tongDoanhThuDuKien}:sp:${spName}:bd:${startDate}`
        : `pid:${row.project?.id || 'unknown'}`;
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
      const spName = row.project?.sanPham?.tenChiTiet?.trim().toLowerCase() || "";
      const startDate = row.project?.ngayBatDau ? new Date(row.project.ngayBatDau).getTime() : "";
      const contractKey = row.project?.maHopDong
        ? `hd:${row.project.maHopDong}:dt:${row.project.tongDoanhThuDuKien}:sp:${spName}:bd:${startDate}`
        : `pid:${row.project?.id || 'unknown'}`;

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
    const rows: SourceDataRow[] = Array.from(contractMap.entries())
      .filter(([_, entry]) => entry.project != null)
      .map(([_, { project, sourceType, loaiDoanhThu, months }]) => {
        const totalNam = Object.values(months).reduce(
          (sum, val) => sum + val,
          0
        );

        return {
          id: project.id,
          tenDuAn: project.tenDuAn,
          khachHang: project.khachHang?.ten || "",
          phanLoaiKH: project.khachHang?.phanLoai || "",
          nhomSP: project.sanPham?.nhom || "",
          tenSP: project.sanPham?.tenChiTiet || "",
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
  sourceType: "PIPELINE" | "CLOUD_DISTRIBUTE" | "ECONTRACT_INVOICE",
  skipRevalidate: boolean = false
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

    const normalizeStr = (val: any) => {
      if (!val) return "";
      return val.toString().replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
    };

    // Pre-fetch existing customers and products (same pattern as excel-actions.ts)
    const uniqueKHNames = new Set<string>();
    const uniqueSPKeys = new Set<string>();

    rows.forEach((row) => {
      const kh = normalizeStr(row.khachHangName);
      if (kh) uniqueKHNames.add(kh);
      const nhomSP = normalizeStr(row.nhomSanPham);
      const tenSP = normalizeStr(row.tenSanPham);
      if (nhomSP && tenSP) {
        uniqueSPKeys.add(`${nhomSP}|${tenSP}`);
      }
    });

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

    // ── IMPORT DEDUP: Pre-fetch existing projects OUTSIDE transaction ──
    // This avoids holding a long transaction lock while reading.
    // Dedup key (6 trường — KHÔNG thay đổi trừ khi người dùng yêu cầu):
    //   maHopDong + tenSP + tongDoanhThu + ngayBatDau + ngayKetThuc + soKy1GoiCuoc
    const makeDedupeKey = (
      maHopDong: string | null,
      tenSP: string,
      tongDT: number,
      ngayBD: Date | string,
      ngayKT: Date | string | null,
      soKy: number | null
    ) => {
      return [
        (maHopDong || "").trim().toLowerCase(),
        (tenSP || "").trim().toLowerCase(),
        String(Math.round(tongDT)),
        new Date(ngayBD).toISOString(),
        ngayKT ? new Date(ngayKT).toISOString() : "",
        String(soKy || 0),
      ].join("||");
    };

    const existingProjects = await prisma.duAn.findMany({
      where: {
        sourceType: sourceType as SourceType,
        isPendingDelete: false,
      },
      select: {
        id: true,
        maHopDong: true,
        tongDoanhThuDuKien: true,
        ngayBatDau: true,
        ngayKetThuc: true,
        soKy1GoiCuoc: true,
        sanPham: { select: { tenChiTiet: true } },
        // Bảng 3: cần thangGhiNhan để dedup theo tháng
        invoiceRecords: sourceType === "ECONTRACT_INVOICE"
          ? { select: { thangGhiNhan: true }, take: 1 }
          : false,
      },
    });

    const existingKeyToId = new Map<string, number>();
    for (const p of existingProjects) {
      let key = makeDedupeKey(
        p.maHopDong,
        p.sanPham?.tenChiTiet || "",
        p.tongDoanhThuDuKien,
        p.ngayBatDau,
        p.ngayKetThuc,
        p.soKy1GoiCuoc
      );
      // Bảng 3: thêm thangGhiNhan vào key (mỗi tháng = 1 record riêng)
      if (sourceType === "ECONTRACT_INVOICE") {
        const inv = (p as any).invoiceRecords?.[0];
        key += `||${inv?.thangGhiNhan ?? ""}`;
      }
      if (!existingKeyToId.has(key)) {
        existingKeyToId.set(key, p.id);
      }
    }

    console.log(`[Import Dedup] Found ${existingKeyToId.size} existing unique records for ${sourceType}`);

    // Collect existing project IDs that need doanhThuTheoThang updates
    const updatesToApply: Array<{ id: number; doanhThuTheoThang: number; soKy1GoiCuoc: number | null }> = [];

    // Process rows in chunks INSIDE a single transaction to ensure atomicity
    const chunkSize = 1000;
    const createdProjectIds: number[] = [];
    let skippedCount = 0;

    // Track seen keys within THIS import batch for within-batch dedup
    const batchSeenKeys = new Set<string>();

    await prisma.$transaction(
      async (tx) => {
        // --- 1. SYNC CUSTOMERS & PRODUCTS INSIDE TRANSACTION ---
        const existingKHs = uniqueKHNames.size > 0 
          ? await tx.khachHang.findMany({
              where: {
                OR: Array.from(uniqueKHNames).map(name => ({
                  ten: { equals: name, mode: "insensitive" }
                }))
              }
            })
          : [];
        const khMap = new Map<string, { id: number; linhVuc: string }>();
        existingKHs.forEach((kh) =>
          khMap.set(kh.ten.toLowerCase(), { id: kh.id, linhVuc: kh.phanLoai })
        );

        for (const name of uniqueKHNames) {
          if (!khMap.has(name.toLowerCase())) {
            const sampleRow = rows.find(
              (r: any) => normalizeStr(r.khachHangName) === name
            );
            const pl = phanLoaiMap[sampleRow?.phanLoaiKH] || PhanLoaiKH.DOANH_NGHIEP;
            const newKH = await tx.khachHang.create({
              data: { 
                ten: name, 
                phanLoai: pl,
                diaChi: normalizeStr(sampleRow?.diaChi) || null
              },
            });
            khMap.set(name.toLowerCase(), { id: newKH.id, linhVuc: pl });
          }
        }

        const existingSPs = await tx.sanPham.findMany();
        const spMap = new Map<string, number>();
        existingSPs.forEach((sp) =>
          spMap.set(`${sp.nhom}|${sp.tenChiTiet}`.toLowerCase(), sp.id)
        );

        for (const key of uniqueSPKeys) {
          if (!spMap.has(key.toLowerCase())) {
            const [nhom, ten] = key.split("|");
            const sampleRow = rows.find(
              (r: any) =>
                `${normalizeStr(r.nhomSanPham)}|${normalizeStr(r.tenSanPham)}`.toLowerCase() === key.toLowerCase()
            );
            const newSP = await tx.sanPham.create({
              data: { 
                nhom, 
                tenChiTiet: ten,
                moTa: normalizeStr(sampleRow?.moTaSanPham) || null
              },
            });
            spMap.set(key.toLowerCase(), newSP.id);
          }
        }

        // --- 2. PROCESS ROWS ---
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);

          const preparedData = chunk
            .map((row: any) => {
              if (!row.tenDuAn) return null;
              const khInfo = khMap.get(normalizeStr(row.khachHangName).toLowerCase());
              const spId = spMap.get(
                `${normalizeStr(row.nhomSanPham)}|${normalizeStr(row.tenSanPham)}`.toLowerCase()
              );
              if (!khInfo || !spId) return null;

              const ngayBatDau = parseExcelDateUTC(row.ngayBatDau);
              const ngayKetThuc = row.ngayKetThuc
                ? parseExcelDateUTC(row.ngayKetThuc)
                : null;
              const { tuan, thang, quy, nam } = extractTimeFields(ngayBatDau);
              const trangThai =
                trangThaiMap[row.trangThaiKhoiTao] || TrangThaiDuAn.MOI;

              // ── DEDUP CHECK: Skip if already exists in DB or earlier in this batch ──
              const tenSP = normalizeStr(row.tenSanPham);
              let dedupeKey = makeDedupeKey(
                row.maHopDong || null,
                tenSP,
                safeParseFloat(row.tongDoanhThu),
                ngayBatDau,
                ngayKetThuc,
                parseInt(row.soKy1GoiCuoc) || null
              );
              // Bảng 3: thêm thangGhiNhan vào dedup key
              // Mỗi tháng ghi nhận là 1 record riêng biệt cho cùng 1 hợp đồng
              if (sourceType === "ECONTRACT_INVOICE") {
                const tgMatch = row.thangGhiNhan?.toString().match(/\d+/);
                dedupeKey += `||${tgMatch ? tgMatch[0] : ""}`;
              }

              if (existingKeyToId.has(dedupeKey)) {
                // Record already exists — skip creation but update revenue fields
                const existingId = existingKeyToId.get(dedupeKey)!;
                const newDtTheoThang = safeParseFloat(row.dtTheoThang);
                const newSoKy = parseInt(row.soKy1GoiCuoc) || null;
                updatesToApply.push({
                  id: existingId,
                  doanhThuTheoThang: newDtTheoThang,
                  soKy1GoiCuoc: newSoKy,
                });
                skippedCount++;
                return null;
              }
              // Within-batch dedup: skip if seen earlier in this import
              if (batchSeenKeys.has(dedupeKey)) {
                skippedCount++;
                return null;
              }
              batchSeenKeys.add(dedupeKey);

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
            .filter((x): x is NonNullable<typeof x> => x !== null);

          if (preparedData.length === 0) continue;

          // DEBUG: Log dtTheoThang stats for Bảng 3 import
          if (sourceType === "ECONTRACT_INVOICE") {
            const dtValues = preparedData.map((item: any) => item.duAnData.doanhThuTheoThang);
            const nonZero = dtValues.filter((v: number) => v > 0);
            const totalDT = dtValues.reduce((s: number, v: number) => s + v, 0);
            console.log(`[IMPORT DEBUG] Bảng 3 batch: ${preparedData.length} rows`);
            console.log(`[IMPORT DEBUG] dtTheoThang: ${nonZero.length} non-zero, ${dtValues.length - nonZero.length} zero`);
            console.log(`[IMPORT DEBUG] Sum dtTheoThang: ${totalDT.toLocaleString()}`);
            // Log first 3 rows raw values
            for (let di = 0; di < Math.min(3, preparedData.length); di++) {
              const d = preparedData[di].duAnData;
              console.log(`[IMPORT DEBUG] Row ${di}: tongDT=${d.tongDoanhThuDuKien}, dtThang=${d.doanhThuTheoThang}`);
            }
            // Log invoice data for first 3
            for (let di = 0; di < Math.min(3, preparedData.length); di++) {
              const inv = preparedData[di].invoiceData;
              console.log(`[IMPORT DEBUG] Invoice ${di}:`, JSON.stringify(inv));
            }
          }

          // Bulk insert projects
          const createdDuAns = await tx.duAn.createManyAndReturn({
            data: preparedData.map((item: any) => item.duAnData),
          });

          const newIds = createdDuAns.map((d: any) => d.id);
          createdProjectIds.push(...newIds);

          // Bulk insert logs
          await tx.nhatKyCongViec.createMany({
            data: createdDuAns.map((duAn: any, idx: number) => ({
              projectId: duAn.id,
              userId: user.id,
              trangThaiMoi: preparedData[idx]!.trangThai,
              noiDungChiTiet: `Import dữ liệu nguồn ${sourceType} [${batchId}]`,
              ngayGio: new Date(),
              status: "APPROVED",
            })),
          });

          // Bulk insert invoices
          const invoicesToCreate: any[] = [];
          for (let idx = 0; idx < preparedData.length; idx++) {
            const item = preparedData[idx]!;
            const duAnId = createdDuAns[idx].id;
            if (item.invoiceData && item.invoiceData.length > 0) {
              invoicesToCreate.push(
                ...item.invoiceData.map((inv: any) => ({
                  projectId: duAnId,
                  thangGhiNhan: inv.thang,
                  namGhiNhan: inv.nam,
                  doanhThuTheoThang: inv.doanhThu,
                  batchId,
                }))
              );
            }
          }
          if (invoicesToCreate.length > 0) {
            await tx.invoiceRecord.createMany({
              data: invoicesToCreate,
            });
          }

          successCount += preparedData.length;
        }
      },
      { timeout: 600000 } // 10 minutes timeout to handle large files
    );

    console.log(`[Import] Created ${successCount} new, Skipped ${skippedCount} duplicates, Updating ${updatesToApply.length} existing records`);

    // ── Apply dedup updates to existing records (OUTSIDE transaction for performance) ──
    // Update doanhThuTheoThang and soKy1GoiCuoc for records that were skipped by dedup
    // This ensures the latest Excel values are reflected in revenue calculations
    const updatedProjectIds: number[] = [];
    if (updatesToApply.length > 0) {
      const UPDATE_CHUNK = 100;
      for (let i = 0; i < updatesToApply.length; i += UPDATE_CHUNK) {
        const chunk = updatesToApply.slice(i, i + UPDATE_CHUNK);
        await Promise.all(
          chunk.map((upd) =>
            prisma.duAn.update({
              where: { id: upd.id },
              data: {
                doanhThuTheoThang: upd.doanhThuTheoThang,
                soKy1GoiCuoc: upd.soKy1GoiCuoc,
              },
            })
          )
        );
        updatedProjectIds.push(...chunk.map((u) => u.id));
      }
      console.log(`[Import] Updated ${updatedProjectIds.length} existing records with new revenue values`);
    }

    // Sync MasterRevenue for all created AND updated projects in bulk.
    // MUST be awaited to prevent connection pool exhaustion and Serverless freezes
    // when processing multiple chunks sequentially.
    const allProjectIdsToSync = [...createdProjectIds, ...updatedProjectIds];
    await syncMasterRevenueMany(allProjectIdsToSync);

    if (!skipRevalidate) {
      await cacheInvalidate(
        "dashboard:overview",
        "options:khachhang",
        "options:sanpham"
      );
      (revalidateTag as any)("dashboard-overview");
      revalidatePath("/du-an");
      revalidatePath("/du-an/du-lieu-nguon");
    }

    const updatedCount = updatedProjectIds.length;
    return {
      success: true,
      count: successCount + updatedCount,
      message: `Đã import thành công ${successCount} dự án mới${updatedCount > 0 ? `, cập nhật ${updatedCount} dự án` : ""} vào ${getSourceLabel(sourceType)}${skippedCount > 0 ? ` (${skippedCount - updatedCount} bản ghi giống hệt đã bỏ qua)` : ""}. Toàn bộ dữ liệu doanh thu đã được đồng bộ hoàn tất.`,
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

  // namGhiNhan = năm hiện tại (năm upload), KHÔNG phải năm ngayBatDau
  const nam = new Date().getFullYear();

  // Doanh thu ghi nhận = dtTheoThang (DT theo tháng) — ghi nhận đúng giá trị từ Excel
  const doanhThu = typeof doanhThuTheoThang === "number" ? doanhThuTheoThang : safeParseFloat(row.dtTheoThang);

  return [{ thang, nam, doanhThu }];
}

