# Turso 500M Row Read Optimization — Full Assessment

## 1. Summary of Changes Made

Two files were modified:

| File | What changed |
|---|---|
| `prisma/schema.prisma` | Added **7 new indexes** across 5 models (mostly `@@index([updatedAt])` and composite sorting indexes) |
| `dashboard-actions.ts` | Rewrote `getDashboardOverview()` and `getKPITimeSeries()` to use `count`, `aggregate`, `groupBy` instead of `findMany` → in-memory reduce |

---

## 2. Assessment of Schema Index Changes

### ✅ All 7 indexes are correct and well-targeted

| Index Added | Query it optimizes | Verdict |
|---|---|---|
| `User @@index([updatedAt])` | `getUserList()` → `orderBy: { updatedAt: 'desc' }` | ✅ Good — avoids full User sort scan |
| `KhachHang @@index([updatedAt])` | `getKhachHangList()` → `orderBy: { updatedAt: 'desc' }` | ✅ Good |
| `DuAn @@index([updatedAt])` | `getDuAnList()` → `orderBy: { updatedAt: 'desc' }` | ✅ Good — DuAn is the largest table |
| `DuAn @@index([tenDuAn])` | `getDuAnList()` → `where: { tenDuAn: { contains: ... } }` | ⚠️ Partial — SQLite `contains` = `LIKE '%x%'` which **cannot use B-tree indexes** for infix search. Only helps if the query becomes `startsWith`. Still harmless to keep. |
| `SanPham @@index([nhom, tenChiTiet])` | `getSanPhamList()` → `orderBy: [{ nhom: 'asc' }, { tenChiTiet: 'asc' }]` | ✅ Good — covering index for the sort |
| `NhatKyCongViec @@index([projectId, ngayGio])` | `getDuAnDetail()` → `nhatKy: { orderBy: { ngayGio: 'desc' } }` | ✅ Excellent — composite index means SQLite seeks to projectId then reads in order |
| `BinhLuan @@index([projectId, createdAt])` | `getDuAnDetail()` → `binhLuan: { orderBy: { createdAt: 'desc' } }` | ✅ Excellent |

> [!NOTE]
> The `DuAn @@index([tenDuAn])` won't help with `contains` (LIKE '%x%') searches on SQLite. But it doesn't hurt and will help if you later add prefix search (`startsWith`). Keep it.

### Missing Index: `DuAn @@index([isPendingDelete])`

Every call to `getDuAnList()` filters by `isPendingDelete: true/false`. Without an index, SQLite scans the entire DuAn table on that boolean. Given DuAn is your largest table, **this should be added**.

---

## 3. Assessment of `dashboard-actions.ts` Rewrites

### `getDashboardOverview()` — ✅ Excellent rewrite

**Before (old code):**
```typescript
const projects = await prisma.duAn.findMany({
    where: whereClause,
    include: { khachHang: true, am: true }  // 3 tables joined
});
const totalProjects = projects.length;
const totalRevenue = projects.reduce(...);
const signedProjects = projects.filter(...).length;
const urgentCare = projects.filter(...).length;
const statusCounts = /* 6x filter passes */;
const topUrgent = projects.filter(...).sort(...).slice(0, 5);
```

**After (new code):**
```typescript
const totalProjects = await prisma.duAn.count({ where });        // 1 row read
const revAgg = await prisma.duAn.aggregate({ _sum });             // 1 row read
const signedProjects = await prisma.duAn.count({ where+status }); // 1 row read
const urgentCare = await prisma.duAn.count({ where: urgentWhere }); // 1 row read
const statusGroups = await prisma.duAn.groupBy({ by: ['trangThaiHienTai'] }); // ~6 rows
const topUrgent = await prisma.duAn.findMany({ take: 5, include }); // 5 × 3 = 15 rows
const totalCustomers = await prisma.khachHang.count();             // 1 row read
```

| Metric | Before (1,000 projects) | After |
|---|---|---|
| Row reads per call | ~3,000 (1k DuAn + 1k KhachHang + 1k User from includes) | **~26** |
| Row reads × 100 dashboard loads | **300,000** | **2,600** |

> [!IMPORTANT]
> This single rewrite alone saves **~297,000 row reads per 100 dashboard loads**. This is the highest-impact change in the entire PR.

### `getKPITimeSeries()` — ✅ Good rewrite

Replaced `findMany` → in-memory map with two `groupBy` queries. At 1,000 projects, this drops from ~1,000 row reads to ~24 (12 months × 2 groups).

---

## 4. 🛑 Remaining Hotspots That Still Burn Row Reads

Here are the functions that were **NOT fixed** and still load entire tables:

### Hotspot 1: `getAMPerformance()` — 🔴 CRITICAL
**File:** [dashboard-actions.ts:143](file:///Users/uyenuyen/Desktop/SHARED_WORKING/danang-dashboard/src/app/(dashboard)/dashboard-actions.ts#L143)

```typescript
const projects = await prisma.duAn.findMany({
    where: projectFilter   // Only filters by `nam` → loads ALL projects for the year
});
```

**Cost:** With 1,000 projects/year → **1,000 row reads per call**. This function is called on every dashboard filter change.

**Why it can't easily be converted to groupBy:** The revenue calculation logic (monthly × months_passed, respecting ngayKetThuc) is too complex for SQL aggregation. This is a legitimate case where in-memory processing is necessary.

**Fix:** Use `select` to narrow columns (currently loading all 25+ columns when you only need ~8):
```typescript
const projects = await prisma.duAn.findMany({
    where: projectFilter,
    select: {
        amId: true, amHoTroId: true, chuyenVienId: true,
        cvHoTro1Id: true, cvHoTro2Id: true,
        tongDoanhThuDuKien: true, doanhThuTheoThang: true,
        thang: true, quy: true, nam: true,
        trangThaiHienTai: true, ngayKetThuc: true
    }
});
```
> This doesn't reduce row reads (SQLite reads whole rows regardless), but it **reduces data transfer from Turso edge to your server**, cutting latency and bandwidth.

### Hotspot 2: `getDiaBanAnalytics()` — 🔴 CRITICAL
**File:** [dashboard-actions.ts:435](file:///Users/uyenuyen/Desktop/SHARED_WORKING/danang-dashboard/src/app/(dashboard)/dashboard-actions.ts#L435)

Same pattern — loads all projects for the year. Same complex revenue logic. Already uses `select` (good!), but still unbounded.

### Hotspot 3: `getAMManagementData()` — 🟡 HIGH
**File:** [quan-ly-am/actions.ts:46](file:///Users/uyenuyen/Desktop/SHARED_WORKING/danang-dashboard/src/app/(dashboard)/quan-ly-am/actions.ts#L46)

```typescript
const projects = await prisma.duAn.findMany({
    where: { nam: contextYear }   // Loads ALL columns of ALL projects for the year
});
```
**Identical** pattern to `getAMPerformance`. Loads full rows without `select`.

### Hotspot 4: `getCVManagementData()` — 🟡 HIGH
**File:** [quan-ly-cv/actions.ts:46](file:///Users/uyenuyen/Desktop/SHARED_WORKING/danang-dashboard/src/app/(dashboard)/quan-ly-cv/actions.ts#L46)

Clone of AM management. Same full-table load.

### Hotspot 5: `getDuAnList()` — 🟠 MEDIUM
**File:** [du-an/actions.ts:323](file:///Users/uyenuyen/Desktop/SHARED_WORKING/danang-dashboard/src/app/(dashboard)/du-an/actions.ts#L323)

```typescript
const data = await prisma.duAn.findMany({
    where: whereClause,
    include: {
        khachHang: true, sanPham: true,
        am: true, amHoTro: true, chuyenVien: true,
        cvHoTro1: true, cvHoTro2: true,
        nhatKy: { orderBy: { ngayGio: 'desc' }, select: {...} },
        _count: { select: { nhatKy: true, binhLuan: true } }
    },
    orderBy: { updatedAt: 'desc' }
    // ⚠️ NO take/skip — loads ALL projects
});
```

**Cost per call:** With 1,000 projects and 7 related tables included:
- 1,000 DuAn + 1,000 KhachHang + 1,000 SanPham + 5,000 User lookups + all NhatKy records
- Estimated: **~10,000–20,000 row reads per call**

### Hotspot 6: `comment-actions.ts` — 🟡 MEDIUM
**File:** [comment-actions.ts:49](file:///Users/uyenuyen/Desktop/SHARED_WORKING/danang-dashboard/src/app/(dashboard)/du-an/[id]/comment-actions.ts#L49)

```typescript
const allUsers = await prisma.user.findMany({ select: { id: true, name: true }});
```
Loads **all users** just to check @mentions in a comment. With 50 users this is fine; with 500+ it's wasteful.

### Hotspot 7: `getHoanThanhKeHoachData()` — 🟡 MEDIUM
**File:** [dashboard-actions.ts:600-614](file:///Users/uyenuyen/Desktop/SHARED_WORKING/danang-dashboard/src/app/(dashboard)/dashboard-actions.ts#L600-L614)

```typescript
const kpis = await prisma.chiTieuKpi.findMany({ where: { nam: 2026 } });   // 12 rows — fine
const projects = await prisma.duAn.findMany({
    where: { nam: 2026 },
    select: { ... }   // 6 columns
});
// Returns BOTH arrays raw to the client for client-side computation
```
Loads all projects for the year into the browser. Client-side computation is fine for small datasets but wasteful at scale.

---

## 5. Row Read Budget Modeling

Assuming your app has **1,000 projects**, **100 customers**, **50 users**, **30 products**, and **10 daily active users**:

### Per-Day Row Read Estimate (After Current Changes)

| Function | Calls/day | Reads per call | Daily total |
|---|---|---|---|
| `getDashboardOverview` ✅ | 30 | ~26 | 780 |
| `getKPITimeSeries` ✅ | 15 | ~24 | 360 |
| `getAMPerformance` 🔴 | 20 | ~1,050 | 21,000 |
| `getDiaBanAnalytics` 🔴 | 10 | ~1,050 | 10,500 |
| `getDuAnList` 🟠 | 50 | ~10,000 | **500,000** |
| `getDuAnDetail` | 30 | ~200 | 6,000 |
| `getAMManagementData` 🟡 | 10 | ~1,000 | 10,000 |
| `getCVManagementData` 🟡 | 10 | ~1,000 | 10,000 |
| `getHoanThanhKeHoachData` 🟡 | 5 | ~1,000 | 5,000 |
| Admin pages (users/products/customers) | 10 | ~100 | 1,000 |
| Chat + Comments | 20 | ~50 | 1,000 |
| **DAILY TOTAL** | | | **~565,640** |

### Monthly Projection

| Scenario | Monthly reads | % of 500M limit |
|---|---|---|
| Current (10 DAU) | ~17M | **3.4%** ✅ |
| Growth (50 DAU) | ~85M | **17%** ✅ |
| Growth (100 DAU) | ~170M | **34%** ⚠️ |
| Growth (200 DAU) | ~340M | **68%** 🟠 |
| Without today's fixes (10 DAU) | ~100M+ | **20%+** 🛑 |

> [!WARNING]  
> You are safe at your current scale (10 DAU). But **`getDuAnList()` is your single biggest threat** — it accounts for ~88% of daily reads. Adding pagination to that function alone would drop your total by 80%.

---

## 6. Recommended Additional Improvements (Priority Order)

### Priority 1: Add Pagination to `getDuAnList()` 🔴
**Impact: Drops daily reads from ~565K to ~75K**

```typescript
// In du-an/actions.ts, getDuAnList()
const PAGE_SIZE = 30;
const page = params?.page || 1;

const [data, total] = await Promise.all([
    prisma.duAn.findMany({
        where: whereClause,
        include: { ... },
        orderBy: { updatedAt: 'desc' },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.duAn.count({ where: whereClause })
]);

return { data, total, page, pageSize: PAGE_SIZE };
```

### Priority 2: Add `select` to AM/CV Management Queries 🟡
**Impact: Reduces data transfer, no row read change but faster queries**

Add `select` with only the 10-12 needed fields to:
- [quan-ly-am/actions.ts:46](file:///Users/uyenuyen/Desktop/SHARED_WORKING/danang-dashboard/src/app/(dashboard)/quan-ly-am/actions.ts#L46)
- [quan-ly-cv/actions.ts:46](file:///Users/uyenuyen/Desktop/SHARED_WORKING/danang-dashboard/src/app/(dashboard)/quan-ly-cv/actions.ts#L46)

### Priority 3: Add `@@index([isPendingDelete])` to DuAn 🟡
**Every `getDuAnList()` filters on this boolean — an index avoids a full scan.**

### Priority 4: Limit NhatKy included in `getDuAnList()` 🟡
Currently includes ALL log entries per project in the list view. Add `take: 1` since the list only shows the latest:

```typescript
nhatKy: {
    orderBy: { ngayGio: 'desc' },
    take: 1,   // ← Only need latest for list view
    select: { ngayGio: true, noiDungChiTiet: true, trangThaiMoi: true }
},
```

### Priority 5: Server-Side Caching for Analytics 🟢
Dashboard analytics data doesn't change second-by-second. Use Next.js `unstable_cache` or manual TTL caching:

```typescript
import { unstable_cache } from 'next/cache';

const getCachedDashboard = unstable_cache(
    async (userId: string, role: string) => {
        // ... your getDashboardOverview logic
    },
    ['dashboard-overview'],
    { revalidate: 300 }  // Cache for 5 minutes
);
```

This alone could reduce your daily reads by 70-90% for analytics endpoints.

### Priority 6: Consolidate Duplicate Full-Table Scans 🟢
`getAMPerformance`, `getDiaBanAnalytics`, `getAMManagementData`, and `getCVManagementData` all do `prisma.duAn.findMany({ where: { nam: year } })` — the exact same query. Consider a shared cached data layer that loads projects once and feeds all four functions.

---

## 7. Final Verdict

| Question | Answer |
|---|---|
| **Are the schema changes suitable?** | ✅ Yes — all 7 indexes correctly target actual query patterns |
| **Are the dashboard-actions rewrites correct?** | ✅ Yes — `getDashboardOverview` and `getKPITimeSeries` are now excellent |
| **Will you stay within 500M with current changes?** | ✅ At 10 DAU, easily (~3.4% usage) |
| **What's the biggest remaining risk?** | `getDuAnList()` without pagination = 88% of all reads |
| **What should you do next?** | Add pagination to `getDuAnList()` (Priority 1) and cache analytics (Priority 5) |

> [!TIP]
> The changes made are **correct and impactful** — the `getDashboardOverview` rewrite alone gives you a ~100x improvement. But the job isn't done: **pagination on `getDuAnList()` is the single biggest win remaining**. After that, you'll be comfortably within limits even at 200 DAU.
