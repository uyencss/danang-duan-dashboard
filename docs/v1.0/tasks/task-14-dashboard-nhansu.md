# Task 14 — Dashboard Tổng hợp Nhân sự
**Phase:** 4 | **Priority:** P0 | **Status:** ✅ Done  
**PRD Ref:** Section 7 View 3 | **Tech Ref:** [tech-stack.md](../tech-stack.md) Section 2.4

---

## Mục tiêu
Bar chart so sánh Doanh thu và Số HĐ theo AM/Chuyên viên, group by thời gian.

---

## Danh sách công việc

### 1. Server Data
- [x] `getNhanSuAnalytics(timeFilter)` — group by AM/CV:
  - Doanh thu tổng, Số HĐ, Số dự án
  - Filter: Tháng / Quý / Năm (sử dụng tuan/thang/quy/nam fields)

### 2. Page
- [x] Tạo `src/app/(dashboard)/nhan-su/page.tsx`

### 3. Time Filter
- [x] Dropdown chọn: Tháng / Quý / Năm + giá trị cụ thể (VD: Q1/2026)

### 4. Revenue Bar Chart
- [x] Recharts BarChart (grouped) — doanh thu theo từng AM/CV
- [x] Color-coded bars, tooltip chi tiết

### 5. Contracts Bar Chart
- [x] Recharts BarChart — số HĐ ký theo từng AM/CV

### 6. Summary Table
- [x] DataTable bổ sung: Tên NV, Địa bàn, Doanh thu, HĐ, Dự án, Ranking

---

## Tiêu chí hoàn thành
- [x] Bar charts render đúng dữ liệu group by staff
- [x] Time filter hoạt động đúng (Tháng/Quý/Năm)
- [x] Summary table khớp với chart data
- [x] Responsive trên tablet
