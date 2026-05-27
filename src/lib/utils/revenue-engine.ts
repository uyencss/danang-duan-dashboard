/**
 * Revenue Amortization Engine
 * ─────────────────────────────────────────────────────────────
 * Distributes a contract's total revenue across calendar months
 * using a DAILY PRO-RATA rule:
 *   dailyRate = tongDoanhThu / totalContractDays
 *   monthSlice = overlappingDays × dailyRate
 *
 * LoaiDoanhThu logic:
 *   - KY_MOI: the slice falls in the same month+year as ngayBatDau
 *   - DUY_TRI: every other month
 *
 * Invariant: sum of all doanhThuPhanBo === tongDoanhThu (rounding adjusted on last slice)
 */

export interface RevenueSlice {
  thangBaoCao: number;
  namBaoCao: number;
  soNgayActive: number;
  doanhThuPhanBo: number;
  loaiDoanhThu: "KY_MOI" | "DUY_TRI";
}

export interface ContractInput {
  id: number;
  tongDoanhThuDuKien: number;
  ngayBatDau: Date | string;
  ngayKetThuc: Date | string | null;
  amId?: string | null;
  chuyenVienId?: string | null;
}

/**
 * Returns the number of days in a given month (1-indexed month).
 */
function daysInMonth(year: number, month: number): number {
  // month is 1-indexed; Date constructor month is 0-indexed
  // Day 0 of next month = last day of current month
  return new Date(year, month, 0).getDate();
}

/**
 * Computes the number of calendar days between two dates (inclusive on both ends).
 * Uses UTC dates stripped to midnight to avoid timezone issues.
 */
function daysBetweenInclusive(start: Date, end: Date): number {
  const s = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const e = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((e - s) / 86_400_000) + 1;
}

/**
 * Core function: generates the monthly revenue schedule for a contract.
 *
 * @param contract - The contract/project data
 * @returns Array of RevenueSlice, one per calendar month the contract spans.
 *          Returns empty array if the contract has no end date or zero revenue.
 */
export function generateRevenueSchedule(contract: ContractInput): RevenueSlice[] {
  const start = new Date(contract.ngayBatDau);
  const end = contract.ngayKetThuc ? new Date(contract.ngayKetThuc) : null;

  // Contracts without end date or with zero revenue produce no distribution
  if (!end || contract.tongDoanhThuDuKien <= 0) return [];

  // Normalize to local dates (strip time component)
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  // End date must be >= start date
  if (endDate < startDate) return [];

  const totalDays = daysBetweenInclusive(startDate, endDate);
  const dailyRate = contract.tongDoanhThuDuKien / totalDays;

  const startMonth = startDate.getMonth() + 1; // 1-indexed
  const startYear = startDate.getFullYear();

  const slices: RevenueSlice[] = [];
  let runningTotal = 0;

  // Walk through each calendar month from start to end
  let curYear = startDate.getFullYear();
  let curMonth = startDate.getMonth(); // 0-indexed for Date constructor

  while (true) {
    const monthStart = new Date(curYear, curMonth, 1);
    const lastDayOfMonth = daysInMonth(curYear, curMonth + 1); // curMonth is 0-indexed, daysInMonth expects 1-indexed
    const monthEnd = new Date(curYear, curMonth, lastDayOfMonth);

    // Overlap: max(contractStart, monthStart) to min(contractEnd, monthEnd)
    const overlapStart = startDate > monthStart ? startDate : monthStart;
    const overlapEnd = endDate < monthEnd ? endDate : monthEnd;

    if (overlapStart <= overlapEnd) {
      const overlappingDays = daysBetweenInclusive(overlapStart, overlapEnd);
      const reportMonth = curMonth + 1; // 1-indexed
      const reportYear = curYear;

      // Determine type: KY_MOI if this is the contract start month
      const isStartMonth = reportMonth === startMonth && reportYear === startYear;
      const loaiDoanhThu = isStartMonth ? "KY_MOI" as const : "DUY_TRI" as const;

      let revenue = Math.round(overlappingDays * dailyRate * 100) / 100;
      runningTotal += revenue;

      slices.push({
        thangBaoCao: reportMonth,
        namBaoCao: reportYear,
        soNgayActive: overlappingDays,
        doanhThuPhanBo: revenue, // will be adjusted on the last slice
        loaiDoanhThu,
      });
    }

    // If we've passed the contract end date's month, stop
    if (curYear > endDate.getFullYear() || (curYear === endDate.getFullYear() && curMonth >= endDate.getMonth())) {
      break;
    }

    // Advance to next month
    curMonth++;
    if (curMonth > 11) {
      curMonth = 0;
      curYear++;
    }
  }

  // Rounding adjustment: ensure sum === tongDoanhThu exactly
  if (slices.length > 0) {
    const diff = Math.round((contract.tongDoanhThuDuKien - runningTotal) * 100) / 100;
    if (Math.abs(diff) > 0.001) {
      slices[slices.length - 1].doanhThuPhanBo =
        Math.round((slices[slices.length - 1].doanhThuPhanBo + diff) * 100) / 100;
    }
  }

  return slices;
}
