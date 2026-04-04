# Task 16 — Dashboard Top Địa bàn (Premium Redesign)
**Phase:** 4 | **Priority:** P0 | **Status:** ✅ Done (Redesigned)  
**PRD Ref:** Section 7 View 5 | **Tech Ref:** [tech-stack.md](../tech-stack.md) Section 2.4

---

## Mục tiêu
Redesign giao diện Dashboard Địa Bàn theo phong cách Enterprise Slate cao cấp, bổ sung các chỉ số KPI tổng quan và cải thiện trực quan hóa dữ liệu (Treemap, Bar Chart, Leaderboard).

---

## Danh sách công việc

### 1. Server Data
- [x] `getDiaBanAnalytics()` — group by diaBan:
  - Tổng doanh thu, Số dự án, Số HĐ ký, Count nhân viên
  - Top performer mỗi địa bàn

### 2. Premium Layout & UI
- [x] Nâng cấp `src/app/(dashboard)/dia-ban/dia-ban-client.tsx`
- [x] Bổ sung 4 thẻ KPI Summary: Tổng Doanh Thu, Tổng Hợp Đồng, Dự Án Đang Chạy, Tỉ Lệ Thành Công.
- [x] Sử dụng bảng màu MobiFone (Blue, Sky, Emerald, Amber).

### 3. Territory Matrix / Treemap (Enhanced)
- [x] Recharts Treemap — kích thước theo doanh thu, hỗ trợ border-radius và hover effects.
- [x] Tooltip cao cấp với thông tin chi tiết địa bàn.

### 4. Bảng Vàng Cá Nhân (Leaderboard)
- [x] Thiết kế lại bảng xếp hạng cá nhân (Trophy icon, Ranking badges, Progress bars cho hiệu suất).
- [x] Highlight Top 3 với màu sắc Vàng (1), Bạc (2), Đồng (3).
- [x] Filter mượt mà theo từng District.

### 5. Xếp Hạng Khu Vực
- [x] Bar chart ngang: so sánh doanh thu giữa các địa bàn với nhãn tên đậm và bo góc bar.

---

## Tiêu chí hoàn thành
- [x] Giao diện hiện đại, bóng bẩy (Enterprise Slate style).
- [x] Hiển thị đầy đủ các chỉ số KPI tổng hợp.
- [x] Treemap và Bar chart hoạt động chính xác.
- [x] Bảng Vàng hiển thị đúng thứ hạng và hiệu suất.
- [x] Tính năng filter theo địa bàn hoạt động trơn tru.
- [x] Tối ưu hiển thị trên các kích thước màn hình.
