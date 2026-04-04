# Task 15 — Dashboard KPI Thời gian
**Phase:** 4 | **Priority:** P0 | **Status:** ✅ Done  
**PRD Ref:** Section 7 View 4 | **Tech Ref:** [tech-stack.md](../tech-stack.md) Section 2.4

---

## Mục tiêu
Line chart hiển thị xu hướng tăng trưởng doanh thu và số dự án theo Tuần/Tháng/Quý/Năm.

---

## Danh sách công việc

### 1. Server Data
- [x] `getKPITimeSeries(granularity)` — aggregate theo time:
  - Granularity: Tuần / Tháng / Quý / Năm
  - Metrics: tổng doanh thu, count dự án mới, count HĐ ký

### 2. Page
- [x] Tạo `src/app/(dashboard)/kpi/page.tsx`

### 3. Granularity Selector
- [x] Dropdown / Tabs: Tuần / Tháng / Quý / Năm
- [x] Optional: date range picker cho custom range

### 4. Revenue Trend Line Chart
- [x] Recharts LineChart — doanh thu theo thời gian
- [x] Tooltip: giá trị + thời điểm. Grid lines

### 5. Project Trend Line Chart
- [x] Recharts LineChart — số dự án mới theo thời gian
- [x] Có thể kết hợp dual-axis hoặc tách 2 charts

### 6. KPI Summary
- [x] So sánh kỳ hiện tại vs kỳ trước: % tăng/giảm

---

## Tiêu chí hoàn thành
- [x] Line charts render đúng data theo granularity
- [x] Switch granularity → chart update đúng
- [x] Tooltip hiển thị đúng
- [x] Responsive trên tablet
