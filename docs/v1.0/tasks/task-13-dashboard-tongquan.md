# Task 13 — Dashboard Tổng quan
**Phase:** 4 | **Priority:** P0 | **Status:** ✅ Done
**PRD Ref:** Section 7 View 1 | **Tech Ref:** [tech-stack.md](../tech-stack.md) Section 2.4

---

## Mục tiêu
Dashboard tổng quan: Funnel chart, KPI cards, conversion rates, AM/CV performance table.

---

## Danh sách công việc

### 1. Server Data
- [x] `getDashboardOverview()` — count dự án theo trạng thái, tổng doanh thu, tổng HĐ, tổng dự án, conversion rates, top 5 cần CSKH
- [x] `getAMPerformance()` — group by AM: count dự án, doanh thu, HĐ ký, % conversion

### 2. Dashboard Page
- [x] Tạo `src/app/(dashboard)/page.tsx` — responsive grid layout

### 3. KPI Cards
- [x] Component `kpi-card.tsx` — 4 cards: Tổng dự án, Doanh thu, HĐ đã ký, Cần CSKH gấp (RED)

### 4. Status Funnel Chart
- [x] Recharts FunnelChart: MOI → DANG_LAM_VIEC → DA_DEMO → DA_GUI_BAO_GIA → DA_KY_HOP_DONG
- [x] Tooltip: count + % tổng. THAT_BAI hiển thị riêng

### 5. Conversion Rates
- [x] Hiển thị tỷ lệ chuyển đổi giữa từng giai đoạn (progress bar / arrow) - *Included in Funnel Logic*

### 6. AM/CV Performance Table
- [x] Columns: Tên AM, Số dự án, Doanh thu, HĐ ký, Tỷ lệ thành công. Sort by doanh thu DESC

### 7. Smart Alert Summary
- [x] TOP dự án cần CSKH gấp: tên, KH, AM, số ngày. Link đến detail. Badge RED

---

## Tiêu chí hoàn thành
- [x] KPI Cards số liệu đúng
- [x] Funnel Chart render đúng
- [x] Conversion rates tính đúng
- [x] AM table ranking đúng
- [x] Responsive trên tablet
