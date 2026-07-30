# Danang Dashboard — Project Rules

## Công thức lọc trùng dữ liệu nguồn (Tất cả bảng)

**KHÔNG ĐƯỢC THAY ĐỔI** trừ khi người dùng trực tiếp yêu cầu.

### Base Dedup Key — 6 trường (dùng chung cho cả 3 bảng):
1. `maHopDong` — Mã hợp đồng
2. `tenSanPham` — Tên sản phẩm chi tiết
3. `tongDoanhThu` — Tổng doanh thu (làm tròn Math.round)
4. `ngayBatDau` — Ngày bắt đầu
5. `ngayKetThuc` — Ngày kết thúc
6. `soKy1GoiCuoc` — Số kỳ 1 gói cước (tháng)

### Bảng 3 (ECONTRACT_INVOICE) — Bổ sung trường thứ 7:
7. `thangGhiNhan` — Tháng ghi nhận (vì mỗi hợp đồng có **nhiều dòng**, mỗi dòng = 1 tháng ghi nhận)

### Quy tắc:
- **Bảng 1 & 2**: Nếu 6 trường khớp → trùng, bỏ qua tạo mới (cập nhật `doanhThuTheoThang`)
- **Bảng 3**: Nếu 6 trường + thangGhiNhan khớp → trùng, bỏ qua; khác thangGhiNhan → record mới
- Nếu **bất kỳ 1 trường nào khác** → dữ liệu mới, phải tạo record mới
- File: `src/app/(dashboard)/du-an/du-lieu-nguon/source-data-actions.ts`, hàm `makeDedupeKey`

## Last-month adjustment (CLOUD_DISTRIBUTE — Bảng 2)

**KHÔNG ĐƯỢC THAY ĐỔI** trừ khi người dùng trực tiếp yêu cầu.

Công thức doanh thu tháng cuối: `tongDT - dtTheoThang * (soKy - 1)`

- Đảm bảo tổng doanh thu tất cả tháng = `tongDoanhThu` chính xác
- Chấp nhận chênh lệch nhỏ (~1.35M) giữa Excel (sum cột DT theo tháng) và Dashboard (last-month adjusted)
- File: `src/lib/utils/master-revenue-sync.ts`, hàm `generateMasterRows`

## Công thức doanh thu Bảng 3 (ECONTRACT_INVOICE)

**KHÔNG ĐƯỢC THAY ĐỔI** trừ khi người dùng trực tiếp yêu cầu.

- Mỗi dòng Excel = 1 record DuAn riêng biệt, mỗi dòng có 1 `thangGhiNhan` và 1 `dtTheoThang`
- Doanh thu ghi nhận = giá trị `dtTheoThang` từ Excel (ghi đúng giá trị, kể cả = 0)
- `namGhiNhan` = năm hiện tại (năm upload), KHÔNG phải năm ngayBatDau
- Tổng DT năm hiện tại = Tổng dtTheoThang của tất cả tháng ghi nhận trong năm
- File: `src/app/(dashboard)/du-an/du-lieu-nguon/source-data-actions.ts`, hàm `extractInvoiceData`
