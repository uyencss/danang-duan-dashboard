/**
 * Source Revenue Engine
 * ─────────────────────────────────────────────────────────────
 * Generates monthly revenue views for each source type (Bảng 1, 2, 3).
 * Returns an object with month1..month12 values for the selected year.
 *
 * Bảng 1 (Pipeline): All months = 0. Only DT tổng and DT dự kiến.
 * Bảng 2 (Cloud-Distribute): Fixed N months from ngayBatDau.
 * Bảng 3 (EContract-Invoice): Historical placement by thangGhiNhan.
 */

export interface MonthlyRevenueView {
  month1: number;
  month2: number;
  month3: number;
  month4: number;
  month5: number;
  month6: number;
  month7: number;
  month8: number;
  month9: number;
  month10: number;
  month11: number;
  month12: number;
}

export const EMPTY_MONTHS: MonthlyRevenueView = {
  month1: 0, month2: 0, month3: 0, month4: 0,
  month5: 0, month6: 0, month7: 0, month8: 0,
  month9: 0, month10: 0, month11: 0, month12: 0,
};

/**
 * Bảng 1 — Pipeline: All months = 0 regardless of year.
 * Revenue info is only in DT tổng dự án / DT dự kiến tháng.
 */
export function generatePipelineMonthlyView(): MonthlyRevenueView {
  return { ...EMPTY_MONTHS };
}

/**
 * Bảng 2 — Cloud-Distribute: Fixed N months from ngayBatDau.
 * Distributes `dtTheoThang` exactly `soKy1GoiCuoc` times
 * starting from the month of `ngayBatDau`.
 * Only shows months that fall within the selected `year`.
 */
export function generateCloudDistributeMonthlyView(
  ngayBatDau: Date | string,
  dtTheoThang: number,
  soKy1GoiCuoc: number,
  year: number,
  tongDoanhThu: number = 0
): MonthlyRevenueView {
  const result = { ...EMPTY_MONTHS };
  if (!ngayBatDau || !dtTheoThang || !soKy1GoiCuoc || soKy1GoiCuoc <= 0) {
    return result;
  }

  const start = new Date(ngayBatDau);
  const startMonth = start.getUTCMonth(); // 0-indexed
  const startYear = start.getUTCFullYear();

  for (let i = 0; i < soKy1GoiCuoc; i++) {
    const totalMonths = startMonth + i;
    const targetMonth = (totalMonths % 12) + 1; // 1-indexed
    const targetYear = startYear + Math.floor(totalMonths / 12);

    if (targetYear === year && targetMonth >= 1 && targetMonth <= 12) {
      const key = `month${targetMonth}` as keyof MonthlyRevenueView;
      // For the last month, calculate the remainder to ensure exact total match
      if (i === soKy1GoiCuoc - 1 && tongDoanhThu > 0) {
        const remainder = tongDoanhThu - (dtTheoThang * (soKy1GoiCuoc - 1));
        result[key] += remainder;
      } else {
        result[key] += dtTheoThang;
      }
    }
  }

  return result;
}

/**
 * Bảng 3 — EContract-Invoice: Historical placement.
 * Places each invoice record's `doanhThuTheoThang` into the
 * exact month column corresponding to `thangGhiNhan`.
 * Only shows records where `namGhiNhan` matches the selected `year`.
 */
export function generateEContractMonthlyView(
  invoiceRecords: Array<{
    thangGhiNhan: number;
    namGhiNhan: number;
    doanhThuTheoThang: number;
  }>,
  year: number
): MonthlyRevenueView {
  const result = { ...EMPTY_MONTHS };
  if (!invoiceRecords || invoiceRecords.length === 0) {
    return result;
  }

  for (const record of invoiceRecords) {
    if (
      record.namGhiNhan === year &&
      record.thangGhiNhan >= 1 &&
      record.thangGhiNhan <= 12
    ) {
      const key = `month${record.thangGhiNhan}` as keyof MonthlyRevenueView;
      result[key] += record.doanhThuTheoThang;
    }
  }

  return result;
}

/**
 * Generates the monthly total (sum of all months) for a given view.
 */
export function sumMonthlyRevenue(view: MonthlyRevenueView): number {
  return Object.values(view).reduce((sum, val) => sum + val, 0);
}

/**
 * Generates a master row by determining the source type and applying
 * the correct revenue calculation logic.
 */
export function generateMasterMonthlyView(
  project: {
    sourceType: string;
    ngayBatDau: Date | string;
    doanhThuTheoThang?: number | null;
    soKy1GoiCuoc?: number | null;
    tongDoanhThuDuKien?: number | null;
    invoiceRecords?: Array<{
      thangGhiNhan: number;
      namGhiNhan: number;
      doanhThuTheoThang: number;
    }>;
  },
  revenueOverrides: Array<{
    thangBaoCao: number;
    namBaoCao: number;
    doanhThuPhanBo: number;
    isManualEdit: boolean;
  }>,
  year: number
): MonthlyRevenueView {
  // Start with source-type-specific calculation
  let baseView: MonthlyRevenueView;

  switch (project.sourceType) {
    case "PIPELINE":
      baseView = generatePipelineMonthlyView();
      break;
    case "CLOUD_DISTRIBUTE":
      baseView = generateCloudDistributeMonthlyView(
        project.ngayBatDau,
        project.doanhThuTheoThang || 0,
        project.soKy1GoiCuoc || 0,
        year,
        project.tongDoanhThuDuKien || 0
      );
      break;
    case "ECONTRACT_INVOICE":
      baseView = generateEContractMonthlyView(
        project.invoiceRecords || [],
        year
      );
      break;
    default:
      baseView = { ...EMPTY_MONTHS };
  }

  // Apply manual overrides from RevenueDistribution
  for (const override of revenueOverrides) {
    if (
      override.isManualEdit &&
      override.namBaoCao === year &&
      override.thangBaoCao >= 1 &&
      override.thangBaoCao <= 12
    ) {
      const key = `month${override.thangBaoCao}` as keyof MonthlyRevenueView;
      baseView[key] = override.doanhThuPhanBo;
    }
  }

  return baseView;
}

/**
 * Parse "Tháng X" string to month number (1-12).
 * Handles: "Tháng 1", "Tháng 12", "tháng 3", "T1", "T12", "1", "12"
 */
export function parseThangGhiNhan(val: any): number | null {
  if (typeof val === "number") {
    return val >= 1 && val <= 12 ? val : null;
  }
  if (!val) return null;

  const str = val.toString().trim();

  // Try direct number
  const direct = parseInt(str);
  if (!isNaN(direct) && direct >= 1 && direct <= 12) return direct;

  // Try "Tháng X" or "tháng X" pattern
  const match = str.match(/[Tt]h[áa]ng\s*(\d{1,2})/);
  if (match) {
    const month = parseInt(match[1]);
    if (month >= 1 && month <= 12) return month;
  }

  // Try "TX" pattern (e.g. "T1", "T12")
  const tMatch = str.match(/^[Tt](\d{1,2})$/);
  if (tMatch) {
    const month = parseInt(tMatch[1]);
    if (month >= 1 && month <= 12) return month;
  }

  return null;
}
