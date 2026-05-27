/**
 * Unit tests for the Revenue Amortization Engine
 * ─────────────────────────────────────────────────────
 * Run: npx ts-node src/lib/utils/revenue-engine.test.ts
 *
 * Key test case from spec:
 *   Contract: May 17 → June 18, Total 33M
 *   Total days = 33 (May 17-31 = 15 days, June 1-18 = 18 days)
 *   Daily rate = 33/33 = 1M/day
 *   May slice = 15 days × 1M = 15M (KY_MOI)
 *   June slice = 18 days × 1M = 18M (DUY_TRI)
 */

import { generateRevenueSchedule, type ContractInput, type RevenueSlice } from "./revenue-engine";

// ── Helpers ──────────────────────────────────────────
function assertClose(actual: number, expected: number, label: string, tolerance = 0.02) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`❌ ${label}: expected ${expected}, got ${actual} (diff: ${(actual - expected).toFixed(4)})`);
  }
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`❌ ${label}: expected ${expected}, got ${actual}`);
  }
}

function sumSlices(slices: RevenueSlice[]): number {
  return slices.reduce((sum, s) => sum + s.doanhThuPhanBo, 0);
}

let passed = 0;
let failed = 0;
function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e: any) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

// ── Tests ────────────────────────────────────────────
console.log("\n🧪 Revenue Amortization Engine Tests\n");

// ── TEST 1: Specification example ──
runTest("SPEC: May 17 → June 18, 33M → May=15M, June=18M", () => {
  const slices = generateRevenueSchedule({
    id: 1,
    tongDoanhThuDuKien: 33,
    ngayBatDau: new Date(2026, 4, 17), // May 17, 2026
    ngayKetThuc: new Date(2026, 5, 18), // June 18, 2026
  });

  assertEqual(slices.length, 2, "slice count");

  // May slice
  assertEqual(slices[0].thangBaoCao, 5, "May month");
  assertEqual(slices[0].namBaoCao, 2026, "May year");
  assertEqual(slices[0].soNgayActive, 15, "May days (17-31)");
  assertClose(slices[0].doanhThuPhanBo, 15, "May revenue");
  assertEqual(slices[0].loaiDoanhThu, "KY_MOI", "May type");

  // June slice
  assertEqual(slices[1].thangBaoCao, 6, "June month");
  assertEqual(slices[1].namBaoCao, 2026, "June year");
  assertEqual(slices[1].soNgayActive, 18, "June days (1-18)");
  assertClose(slices[1].doanhThuPhanBo, 18, "June revenue");
  assertEqual(slices[1].loaiDoanhThu, "DUY_TRI", "June type");

  // Invariant: sum = total
  assertClose(sumSlices(slices), 33, "sum = total");
});

// ── TEST 2: Single day contract ──
runTest("Single day contract (Jan 15 → Jan 15, 100M)", () => {
  const slices = generateRevenueSchedule({
    id: 2,
    tongDoanhThuDuKien: 100,
    ngayBatDau: new Date(2026, 0, 15),
    ngayKetThuc: new Date(2026, 0, 15),
  });

  assertEqual(slices.length, 1, "slice count");
  assertEqual(slices[0].soNgayActive, 1, "active days");
  assertClose(slices[0].doanhThuPhanBo, 100, "revenue");
  assertEqual(slices[0].loaiDoanhThu, "KY_MOI", "type");
});

// ── TEST 3: Full month contract ──
runTest("Full month: Jan 1 → Jan 31, 62M", () => {
  const slices = generateRevenueSchedule({
    id: 3,
    tongDoanhThuDuKien: 62,
    ngayBatDau: new Date(2026, 0, 1),
    ngayKetThuc: new Date(2026, 0, 31),
  });

  assertEqual(slices.length, 1, "slice count");
  assertEqual(slices[0].soNgayActive, 31, "active days");
  assertClose(slices[0].doanhThuPhanBo, 62, "revenue");
  assertEqual(slices[0].loaiDoanhThu, "KY_MOI", "type");
});

// ── TEST 4: Cross-year contract ──
runTest("Cross-year: Dec 15, 2025 → Jan 15, 2026, 32M", () => {
  const slices = generateRevenueSchedule({
    id: 4,
    tongDoanhThuDuKien: 32,
    ngayBatDau: new Date(2025, 11, 15), // Dec 15
    ngayKetThuc: new Date(2026, 0, 15), // Jan 15
  });

  assertEqual(slices.length, 2, "slice count");

  // Dec: 15-31 = 17 days
  assertEqual(slices[0].thangBaoCao, 12, "Dec month");
  assertEqual(slices[0].namBaoCao, 2025, "Dec year");
  assertEqual(slices[0].soNgayActive, 17, "Dec days");
  assertEqual(slices[0].loaiDoanhThu, "KY_MOI", "Dec type");

  // Jan: 1-15 = 15 days
  assertEqual(slices[1].thangBaoCao, 1, "Jan month");
  assertEqual(slices[1].namBaoCao, 2026, "Jan year");
  assertEqual(slices[1].soNgayActive, 15, "Jan days");
  assertEqual(slices[1].loaiDoanhThu, "DUY_TRI", "Jan type");

  // Total days: 17 + 15 = 32
  const totalDays = slices.reduce((s, sl) => s + sl.soNgayActive, 0);
  assertEqual(totalDays, 32, "total days");

  // Sum = 32M
  assertClose(sumSlices(slices), 32, "sum = total");
});

// ── TEST 5: Long contract (12 months) ──
runTest("Full year: Jan 1 → Dec 31, 2026, 365M", () => {
  const slices = generateRevenueSchedule({
    id: 5,
    tongDoanhThuDuKien: 365,
    ngayBatDau: new Date(2026, 0, 1),
    ngayKetThuc: new Date(2026, 11, 31),
  });

  assertEqual(slices.length, 12, "12 monthly slices");
  assertEqual(slices[0].loaiDoanhThu, "KY_MOI", "Jan = KY_MOI");
  for (let i = 1; i < 12; i++) {
    assertEqual(slices[i].loaiDoanhThu, "DUY_TRI", `Month ${i + 1} = DUY_TRI`);
  }
  assertClose(sumSlices(slices), 365, "sum = total");
});

// ── TEST 6: No end date → empty ──
runTest("No end date → empty array", () => {
  const slices = generateRevenueSchedule({
    id: 6,
    tongDoanhThuDuKien: 100,
    ngayBatDau: new Date(2026, 0, 1),
    ngayKetThuc: null,
  });

  assertEqual(slices.length, 0, "no slices");
});

// ── TEST 7: Zero revenue → empty ──
runTest("Zero revenue → empty array", () => {
  const slices = generateRevenueSchedule({
    id: 7,
    tongDoanhThuDuKien: 0,
    ngayBatDau: new Date(2026, 0, 1),
    ngayKetThuc: new Date(2026, 5, 30),
  });

  assertEqual(slices.length, 0, "no slices");
});

// ── TEST 8: Rounding invariant for non-divisible numbers ──
runTest("Rounding invariant: 100M / 7 days → sum still = 100", () => {
  const slices = generateRevenueSchedule({
    id: 8,
    tongDoanhThuDuKien: 100,
    ngayBatDau: new Date(2026, 0, 1), // Jan 1
    ngayKetThuc: new Date(2026, 0, 7), // Jan 7
  });

  assertEqual(slices.length, 1, "single month");
  assertClose(sumSlices(slices), 100, "sum = 100 exactly", 0.01);
});

// ── TEST 9: 3-month span with awkward split ──
runTest("3 months: Apr 10 → Jun 20, 100M", () => {
  const slices = generateRevenueSchedule({
    id: 9,
    tongDoanhThuDuKien: 100,
    ngayBatDau: new Date(2026, 3, 10), // Apr 10
    ngayKetThuc: new Date(2026, 5, 20), // Jun 20
  });

  // Apr 10-30 = 21 days, May 1-31 = 31 days, Jun 1-20 = 20 days → total 72 days
  assertEqual(slices.length, 3, "3 slices");
  assertEqual(slices[0].soNgayActive, 21, "Apr days");
  assertEqual(slices[1].soNgayActive, 31, "May days");
  assertEqual(slices[2].soNgayActive, 20, "Jun days");

  const totalDays = slices.reduce((s, sl) => s + sl.soNgayActive, 0);
  assertEqual(totalDays, 72, "total days = 72");

  assertEqual(slices[0].loaiDoanhThu, "KY_MOI", "Apr = KY_MOI");
  assertEqual(slices[1].loaiDoanhThu, "DUY_TRI", "May = DUY_TRI");
  assertEqual(slices[2].loaiDoanhThu, "DUY_TRI", "Jun = DUY_TRI");

  assertClose(sumSlices(slices), 100, "sum = 100");
});

// ── TEST 10: End date before start date → empty ──
runTest("End before start → empty", () => {
  const slices = generateRevenueSchedule({
    id: 10,
    tongDoanhThuDuKien: 50,
    ngayBatDau: new Date(2026, 5, 1),
    ngayKetThuc: new Date(2026, 3, 1),
  });
  assertEqual(slices.length, 0, "no slices");
});

// ── Summary ──
console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed > 0) {
  console.log("⚠️  Some tests FAILED.");
  process.exit(1);
} else {
  console.log("✅ All tests PASSED.");
}
