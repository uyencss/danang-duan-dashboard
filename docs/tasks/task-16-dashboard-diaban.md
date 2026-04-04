# Task 16 — Dashboard Top Địa bàn
**Phase:** 4 | **Priority:** P0 | **Status:** ✅ Done  
**PRD Ref:** Section 7 View 5 | **Tech Ref:** [tech-stack.md](../tech-stack.md) Section 2.4

---

## Mục tiêu
Matrix/Treemap chart hiển thị địa bàn sinh lời nhất và nhân viên xuất sắc theo từng địa bàn.

---

## Danh sách công việc

### 1. Server Data
- [x] `getDiaBanAnalytics()` — group by diaBan:
  - Tổng doanh thu, Số dự án, Số HĐ ký, Count nhân viên
  - Top performer mỗi địa bàn

### 2. Page
- [x] Tạo `src/app/(dashboard)/dia-ban/page.tsx`

### 3. Territory Matrix / Treemap
- [x] Recharts Treemap hoặc Heatmap — kích thước theo doanh thu
- [x] Color intensity theo hiệu suất (conversion rate)
- [x] Tooltip: tên địa bàn, doanh thu, số dự án

### 4. Top Staff Ranking Table
- [x] DataTable: Tên NV, Địa bàn, Doanh thu, HĐ ký, Tỷ lệ thành công
- [x] Filter: theo Địa bàn
- [x] Highlight top 3 overall

### 5. Territory Comparison
- [x] Bar chart ngang: so sánh doanh thu giữa các địa bàn

---

## Tiêu chí hoàn thành
- [x] Treemap/Matrix render đúng dữ liệu theo địa bàn
- [x] Ranking table hiển thị đúng top staff
- [x] Filter by địa bàn hoạt động
- [x] Responsive trên tablet
