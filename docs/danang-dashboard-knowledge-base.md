# Danang Dashboard — Tài liệu Kiến thức Toàn diện

> **Mục đích:** Tài liệu này mô tả chi tiết từng nghiệp vụ, từng trang, từng tab, từng chức năng của hệ thống Dashboard quản lý dự án kinh doanh CNTT tại Đà Nẵng. Dùng làm nguồn kiến thức nền tảng cho AI khi làm việc với codebase này.

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Mục đích
Dashboard quản lý dự án kinh doanh CNTT cho một chi nhánh VNPT tại Đà Nẵng. Hệ thống theo dõi:
- **Pipeline dự án** (CRM): Từ tiếp cận khách hàng → demo → báo giá → ký hợp đồng
- **Doanh thu**: Tính toán, phân bổ doanh thu theo tháng/quý/năm từ 3 nguồn dữ liệu
- **KPI**: So sánh doanh thu thực tế vs chỉ tiêu KPI được giao
- **Nhân sự**: Quản lý hiệu suất AM (Account Manager) và CV (Chuyên viên)

### 1.2 Tech Stack
| Thành phần | Công nghệ |
|---|---|
| Framework | **Next.js 16** (App Router, Server Actions, RSC) |
| Language | **TypeScript** |
| Database | **PostgreSQL** (Prisma ORM 7.x) |
| Auth | **better-auth** (email/password, session-based) |
| Styling | **Tailwind CSS 4** + **shadcn/ui** |
| Charts | **Recharts** |
| State | React Hook Form + Zod validation |
| Realtime | **Ably** (chat/notifications) |
| Cache | **Redis** (ioredis) + Next.js `unstable_cache` |
| Logging | **Pino** + rotating file stream |
| Notifications | Telegram Bot + Email (Nodemailer) |
| Deployment | Docker + Docker Compose |

### 1.3 Cấu trúc thư mục chính
```
src/
├── app/
│   ├── (auth)/              # Login, Register
│   ├── (dashboard)/         # Toàn bộ dashboard (protected)
│   │   ├── page.tsx         # Trang chủ Dashboard Tổng quan
│   │   ├── du-an/           # CRM & Danh sách dự án
│   │   │   ├── [id]/        # Chi tiết dự án
│   │   │   ├── tao-moi/     # Tạo dự án mới
│   │   │   ├── du-lieu-nguon/ # Dữ liệu nguồn (4 bảng)
│   │   │   └── tracking/    # Theo dõi quy trình
│   │   ├── kpi/             # Biểu đồ KPI thời gian
│   │   ├── dia-ban/         # Phân tích theo địa bàn
│   │   ├── quan-ly-am/      # Quản lý AM
│   │   ├── quan-ly-cv/      # Quản lý Chuyên viên
│   │   ├── giam-doc-theo-doi/ # Dashboard Giám đốc
│   │   ├── nhu-cau-catp/    # Khảo sát nhu cầu Công an
│   │   └── admin/           # Quản trị hệ thống
│   │       ├── users/       # Quản lý người dùng
│   │       ├── khach-hang/  # Quản lý khách hàng
│   │       ├── san-pham/    # Quản lý sản phẩm
│   │       ├── kpi/         # Giao chỉ tiêu KPI
│   │       ├── roles/       # RBAC & Phân quyền menu
│   │       └── du-an-da-xoa/ # Dự án đã xóa
│   ├── api/                 # API Routes
│   ├── vr360/               # Trang VR360 (standalone)
│   └── workshop/            # Workshop 5M (standalone)
├── components/
│   ├── dashboard/           # Components biểu đồ dashboard
│   ├── du-an/               # Components chi tiết dự án
│   ├── layout/              # Sidebar, Header, Breadcrumb
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── auth.ts              # better-auth config
│   ├── prisma.ts            # Prisma client singleton
│   ├── rbac.ts              # RBAC definitions (client)
│   ├── rbac-server.ts       # RBAC queries (server)
│   ├── redis.ts             # Redis client
│   ├── cache.ts             # Cache invalidation helpers
│   └── utils/
│       ├── master-revenue-sync.ts   # Bảng 4 sync engine
│       ├── source-revenue-engine.ts # Revenue calc per source
│       ├── revenue-engine.ts        # Pipeline amortization
│       └── ct-metrics.ts            # CT metrics calculation
└── contexts/                # React contexts
```

---

## 2. HỆ THỐNG PHÂN QUYỀN (RBAC)

### 2.1 Các vai trò (Roles)

| Role | Label | Mô tả |
|---|---|---|
| `ADMIN` | Quản trị viên (Admin) | Toàn quyền quản trị hệ thống |
| `USER` | Quản trị viên (Chuyên viên) | Tương đương ADMIN về quyền truy cập trang, nhưng không quản lý user |
| `AM` | Account Manager | Quản lý khách hàng và dự án được giao |
| `CV` | Chuyên viên | Thực hiện dự án được giao |
| `LEADER` | Lãnh đạo | Chỉ xem Dashboard, không tham gia xử lý |

### 2.2 Quyền truy cập trang

| Trang | ADMIN | USER | AM | CV | LEADER |
|---|---|---|---|---|---|
| Dashboard Tổng quan (`/`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| CRM & DS Dự án (`/du-an`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chi tiết dự án (`/du-an/[id]`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tạo dự án (`/du-an/tao-moi`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dữ liệu nguồn (`/du-an/du-lieu-nguon`) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tracking quy trình (`/du-an/tracking`) | ✅ | ✅ | ❌ | ❌ | ❌ |
| KPI (`/kpi`) | ✅ | ✅ | ❌ | ❌ | ✅ |
| Địa bàn (`/dia-ban`) | ✅ | ✅ | ❌ | ❌ | ✅ |
| Quản lý AM (`/quan-ly-am`) | ✅ | ✅ | ❌ | ❌ | ✅ |
| Quản lý CV (`/quan-ly-cv`) | ✅ | ✅ | ❌ | ❌ | ✅ |
| Lãnh đạo theo dõi (`/giam-doc-theo-doi`) | ✅ | ✅ | ❌ | ❌ | ✅ |
| Admin pages (`/admin/*`) | ✅ | ✅ | ❌ | ❌ | ❌ |

### 2.3 RBAC động (Database-driven)
Ngoài `ROUTE_PERMISSIONS` tĩnh, hệ thống còn có bảng `MenuItem` + `MenuPermission` trong database cho phép ADMIN cấu hình quyền CRUD (canView, canCreate, canEdit, canDelete) cho từng menu item theo role — được quản lý tại trang `/admin/roles`.

---

## 3. DATABASE SCHEMA (Prisma)

### 3.1 Các model chính

#### `User` — Người dùng
- Trường quan trọng: `role` (UserRole enum), `diaBan` (tên tổ/nhóm: "Tổ 1", "Tổ 2", "Tổ 3", "Tổ dự án"), `isActive`, `banned`
- Quan hệ: 1 User có thể là AM chính, AM hỗ trợ, CV chính, CV hỗ trợ 1, CV hỗ trợ 2 của nhiều dự án

#### `KhachHang` — Khách hàng
- Phân loại (`PhanLoaiKH`): `CHINH_PHU`, `DOANH_NGHIEP`, `CONG_AN`
- Chứa thông tin: tên, địa chỉ, SĐT, email, đầu mối tiếp cận, lãnh đạo đơn vị, ngày thành lập, ngày kỷ niệm

#### `SanPham` — Sản phẩm CNTT
- `nhom` (nhóm sản phẩm) + `tenChiTiet` (tên chi tiết)
- Ví dụ nhóm: "An ninh mạng", "Giải pháp CNTT", "Cloud/DC", "Dự án CĐS", "CNS An ninh"

#### `DuAn` — Dự án (Model trung tâm)
- **Trạng thái** (`TrangThaiDuAn`): `MOI` → `DANG_LAM_VIEC` → `DA_DEMO` → `DA_GUI_BAO_GIA` → `DA_KY_HOP_DONG` | `THAT_BAI`
- **Lĩnh vực** (`LinhVuc`): `CHINH_PHU`, `DOANH_NGHIEP`, `CONG_AN`
- **Nguồn dữ liệu** (`SourceType`): `PIPELINE`, `CLOUD_DISTRIBUTE`, `ECONTRACT_INVOICE`
- **Flags**: `isTrongDiem` (trọng điểm), `isKyVong` (kỳ vọng), `isPendingDelete` (chờ xóa)
- **Doanh thu**: `tongDoanhThuDuKien` (tổng DT), `doanhThuTheoThang` (DT/tháng)
- **Thời gian**: `tuan`, `thang`, `quy`, `nam` — được extract từ `ngayBatDau`
- **Nhân sự**: amId, amHoTroId, chuyenVienId, cvHoTro1Id, cvHoTro2Id
- **Hợp đồng**: `maHopDong`, `soKy1GoiCuoc` (số kỳ gói cước — dùng cho Bảng 2)

#### `NhatKyCongViec` — Nhật ký công việc (Activity Log)
- Mỗi lần cập nhật trạng thái/bước = 1 record log
- Có `status`: PENDING → APPROVED/REJECTED (workflow duyệt)
- `urgentFlag`: đánh dấu khẩn cấp cần giám đốc xem

#### `BinhLuan` — Bình luận (threaded comments)
- Hỗ trợ reply chain qua `parentId`

#### `TinNhan` — Tin nhắn chat
- Chat realtime trong dự án qua Ably

#### `ChiTieuKpi` — Chỉ tiêu KPI
- Unique theo `(nam, thang)`
- 5 trường KPI: `anNinhMang`, `giaiPhapCntt`, `duAnCds`, `cnsAnNinh`, `cloudDc` (đơn vị: triệu đồng)

#### `RevenueDistribution` — Phân bổ doanh thu (Bảng 1 Pipeline)
- Unique theo `(projectId, thangBaoCao, namBaoCao)`
- Chứa `doanhThuPhanBo`, `loaiDoanhThu` (KY_MOI / DUY_TRI), `isManualEdit`

#### `InvoiceRecord` — Bản ghi hóa đơn (Bảng 3 EContract)
- Mỗi record = doanh thu 1 tháng ghi nhận cho 1 dự án
- `thangGhiNhan` (1-12), `namGhiNhan`, `doanhThuTheoThang`

#### `MasterRevenue` — Bảng tổng hợp doanh thu (Bảng 4)
- Pre-computed từ 3 nguồn, Dashboard query **chỉ từ bảng này**
- Unique theo `(projectId, nam, thang, sourceType)`
- `loaiDoanhThu`: KY_MOI (tháng đầu hợp đồng) / DUY_TRI (các tháng sau)

#### `PoliceSurvey` — Khảo sát nhu cầu Công an
- Dữ liệu khảo sát: Camera, Kiosk, Truyền thanh — có/chưa có, nhu cầu, mục đích

#### `WorkshopIdea` / `WorkshopCleanIdea` — Workshop 5M
- Phân loại theo `FiveMCategory`: MAN, METHOD, MATERIAL, MACHINE, MARKET

---

## 4. HỆ THỐNG DOANH THU — TRÁI TIM CỦA DASHBOARD

### 4.1 Ba nguồn dữ liệu (Bảng 1, 2, 3)

#### Bảng 1: PIPELINE
- **Nguồn**: Dự án tạo thủ công hoặc import Excel
- **Đặc điểm**: Dự án ở mọi trạng thái (từ Mới đến Đã ký)
- **Doanh thu theo tháng**: Không phân bổ tự động. Chỉ có `tongDoanhThuDuKien` tổng thể
- **Khi đã ký**: Dùng `RevenueDistribution` slices (amortization engine) để phân bổ theo tháng
- **Hiển thị 12 cột tháng**: Tất cả = 0 (trừ khi có manual override)

#### Bảng 2: CLOUD_DISTRIBUTE
- **Nguồn**: Import Excel — dự án Cloud/DC đã ký hợp đồng
- **Đặc điểm**: Có `soKy1GoiCuoc` (N tháng) và `doanhThuTheoThang`
- **Công thức phân bổ**: 
  - N-1 tháng đầu: mỗi tháng = `doanhThuTheoThang`
  - Tháng cuối: `tongDoanhThu - doanhThuTheoThang * (soKy - 1)` ← **Last-month adjustment**
  - Bắt đầu từ tháng của `ngayBatDau`, kéo dài `soKy1GoiCuoc` tháng
- **Mục đích last-month**: Đảm bảo tổng 12 tháng = `tongDoanhThu` chính xác

#### Bảng 3: ECONTRACT_INVOICE
- **Nguồn**: Import Excel — dữ liệu hóa đơn đã xuất
- **Đặc điểm**: Mỗi dòng Excel = 1 DuAn riêng biệt, mỗi dòng có `thangGhiNhan` và `dtTheoThang`
- **Doanh thu**: Ghi đúng giá trị `dtTheoThang` từ Excel (kể cả = 0)
- **`namGhiNhan`**: Luôn = năm hiện tại (năm upload), KHÔNG phải năm `ngayBatDau`
- **Dedup key bổ sung**: thêm `thangGhiNhan` (trường thứ 7) vào base dedup key

### 4.2 Bảng 4: MASTER REVENUE (Bảng tổng hợp)
- **Bảng `MasterRevenue`** — pre-computed, Dashboard query **EXCLUSIVELY** từ đây
- **Sync engine**: `src/lib/utils/master-revenue-sync.ts`
- Hàm `generateMasterRows()` tạo rows theo từng source type
- Hàm `syncMasterRevenue()` / `syncMasterRevenueMany()` sync sau mỗi create/update/import
- Hàm `rebuildAllMasterRevenue()` rebuild toàn bộ (Admin action)

### 4.3 Deduplication (Lọc trùng)

> ⚠️ **KHÔNG ĐƯỢC THAY ĐỔI** trừ khi người dùng trực tiếp yêu cầu.

#### Base Dedup Key — 6 trường (dùng chung Bảng 1, 2, 3):
1. `maHopDong` — Mã hợp đồng
2. `tenSanPham` — Tên sản phẩm chi tiết
3. `tongDoanhThu` — Tổng doanh thu (Math.round)
4. `ngayBatDau` — Ngày bắt đầu (ISO string)
5. `ngayKetThuc` — Ngày kết thúc (ISO string)
6. `soKy1GoiCuoc` — Số kỳ gói cước

#### Bảng 3 bổ sung trường thứ 7:
7. `thangGhiNhan` — Tháng ghi nhận (vì mỗi hợp đồng có nhiều dòng/tháng)

#### Quy tắc:
- **Bảng 1 & 2**: 6 trường khớp → trùng, bỏ qua tạo mới (cập nhật `doanhThuTheoThang`)
- **Bảng 3**: 6 trường + thangGhiNhan khớp → trùng; khác thangGhiNhan → record mới
- Bất kỳ 1 trường nào khác → dữ liệu mới, tạo record mới

### 4.4 Cross-source Dedup (trong Bảng 4)
Khi cùng 1 `maHopDong` xuất hiện ở nhiều nguồn, ưu tiên source theo priority:
1. **ECONTRACT_INVOICE** (ưu tiên cao nhất — đã xuất hóa đơn)
2. **CLOUD_DISTRIBUTE** (phân bổ cố định)
3. **PIPELINE** (ước tính — ưu tiên thấp nhất)

### 4.5 Loại doanh thu
- **KY_MOI**: Doanh thu tháng đầu tiên của hợp đồng (tháng bắt đầu)
- **DUY_TRI**: Doanh thu các tháng tiếp theo

---

## 5. CÁC TRANG VÀ CHỨC NĂNG CHI TIẾT

### 5.1 Dashboard Tổng quan (`/`)

**File:** `src/app/(dashboard)/page.tsx`

**2 tab chính:**

#### Tab "Tổng quan" — `BoardOverview`
Hiển thị các metrics chính:

**Revenue Metrics (Doanh thu):**
- **DT Tổng dự án**: = DT năm (đã ký, từ MasterRevenue) + DT dự kiến (chưa ký, active)
- **DT Tháng đã ký**: Tổng MasterRevenue slices của tháng hiện tại cho dự án đã ký
- **DT Dự kiến tháng**: = DT Tháng đã ký + DT các dự án kỳ vọng (isKyVong) trong tháng
- **DT theo quý / năm**: Tương tự logic trên nhưng cho quý/năm
- Mỗi metric có % so với KPI tương ứng

**Project Metrics (Dự án):**
- Tổng số dự án, trọng điểm, kỳ vọng
- **Hiện trạng tháng**: Breakdown theo 6 trạng thái (pie chart)
- **Thống kê theo bước**: Các bước quy trình hiện tại
- **Cảnh báo theo tổ**: Số dự án > 10 ngày chưa chăm sóc, phân theo tổ (Tổ 1, 2, 3, Tổ dự án)

**Dedup đặc biệt trong Dashboard**: Các dự án được dedup theo `tenDuAn` (case-insensitive, trimmed) — giữ dự án có trạng thái cao nhất.

#### Tab "Dashboard AM" — `AMPerformanceTab`
Bảng hiệu suất cho từng AM:
- `soLuongTiepCan`: Số dự án tham gia (chính + hỗ trợ, trừ Thất bại)
- `soHopDongDaKy`: Số dự án đã ký hợp đồng
- `doanhThuDaKy`: Revenue tháng hiện tại cho dự án đã ký (triệu đồng)
- `doanhThuKyVong`: DT tổng dự kiến cho dự án kỳ vọng trong tháng
- `doanhThuDuKienThang`: = doanhThuDaKy + doanhThuKyVong
- Sắp xếp giảm dần theo `doanhThuDuKienThang`

---

### 5.2 CRM & Danh sách Dự án (`/du-an`)

**File:** `src/app/(dashboard)/du-an/page.tsx`

**Chức năng chính:**
- Bảng danh sách dự án với **pagination** (50/trang)
- **Bộ lọc**: Tìm kiếm text, phân loại KH, sản phẩm, trạng thái, lĩnh vực, AM, cần chăm sóc, bước hiện tại, phân loại (trọng điểm/kỳ vọng)
- **Auto Sort** (thứ tự ưu tiên):
  1. Trọng điểm + Kỳ vọng (chưa ký, chưa thất bại)
  2. Trọng điểm
  3. Kỳ vọng
  4. Bình thường
  5. Thất bại
  6. Đã ký hợp đồng (cuối cùng)
  - Cùng mức: ưu tiên mới cập nhật hơn

**Các button:**
- **Dữ liệu nguồn** (ADMIN/USER only): Đi đến trang quản lý 4 bảng dữ liệu
- **Import Excel**: Upload file Excel để tạo/cập nhật hàng loạt dự án
- **+ Tạo dự án**: Tạo dự án đơn lẻ qua form

---

### 5.3 Tạo dự án mới (`/du-an/tao-moi`)

**File:** `src/app/(dashboard)/du-an/tao-moi/project-form.tsx`

**Form đầy đủ bao gồm:**
- Khách hàng (combobox + tạo mới inline)
- Sản phẩm (combobox + tạo mới inline)
- Tên dự án
- Lĩnh vực (tự động theo phân loại KH)
- Trạng thái (dropdown 6 trạng thái)
- Tổng doanh thu dự kiến
- DT theo tháng
- Mã hợp đồng
- Ngày bắt đầu / kết thúc
- Trọng điểm / Kỳ vọng (checkbox)
- Phân công nhân sự: AM chính, AM hỗ trợ, CV chính, CV hỗ trợ 1, CV hỗ trợ 2
- Bước hiện tại (dropdown các bước quy trình)
- Thời gian dự kiến

---

### 5.4 Chi tiết dự án (`/du-an/[id]`)

**File:** `src/app/(dashboard)/du-an/[id]/page.tsx`

**Layout:** 2 cột chính

**Cột trái — Thông tin dự án:**
- Header: Tên, trạng thái, khách hàng, sản phẩm, badges (trọng điểm/kỳ vọng)
- Thông tin tài chính: DT tổng, DT/tháng, mã HĐ
- Nhân sự: AM, CV, và các hỗ trợ
- Timeline: Ngày bắt đầu → kết thúc
- **Quick Update**: Cập nhật nhanh trạng thái/bước + ghi log
- **Edit Project**: Dialog chỉnh sửa đầy đủ thông tin dự án

**Cột phải — Tương tác:**
- **Tab Nhật ký** (`NhatKyCongViec`): Lịch sử cập nhật, có file đính kèm, urgent flag
- **Tab Bình luận** (`BinhLuan`): Threaded comments với reply
- **Tab Chat** (`TinNhan`): Chat realtime qua Ably

**Chức năng đặc biệt:**
- **Xóa dự án**: Soft delete (`isPendingDelete` = true), ADMIN phục hồi được
- **Quick Update Modal**: AM/CV cập nhật bước quy trình, có workflow duyệt (PENDING → APPROVED/REJECTED)

---

### 5.5 Dữ liệu nguồn (`/du-an/du-lieu-nguon`)

**File:** `src/app/(dashboard)/du-an/du-lieu-nguon/`

> **Chỉ ADMIN và USER được truy cập**

**4 tab tương ứng 4 bảng:**

#### Tab "Pipeline" (Bảng 1)
- Hiển thị dự án Pipeline với cột: Tên dự án, Khách hàng, Sản phẩm, AM, CV, Tổng DT, DT/tháng, Mã HĐ, Trạng thái
- 12 cột tháng (T1-T12): Tất cả = 0 (Pipeline không phân bổ tự động)
- **Import Excel**: Upload file Excel theo template Bảng 1
- **Thu hồi batch**: Xóa toàn bộ dự án từ batch import gần nhất

#### Tab "Cloud-Distribute" (Bảng 2)
- Hiển thị dự án Cloud đã ký
- 12 cột tháng: Phân bổ tự động theo công thức `soKy1GoiCuoc` tháng từ `ngayBatDau`
- **Last-month adjustment**: Tháng cuối = `tongDT - dtTheoThang * (soKy - 1)`
- Dedup hiển thị: Gộp các dòng trùng (maHopDong + tenSP + tongDT + ngayBD + ngayKT)

#### Tab "EContract-Invoice" (Bảng 3)
- Hiển thị dự án có hóa đơn
- 12 cột tháng: Đặt `doanhThuTheoThang` vào đúng cột `thangGhiNhan`
- Cột "Tháng ghi nhận": Hiển thị danh sách các tháng (ví dụ: "T1/2026, T2/2026, T3/2026")

#### Tab "Tổng hợp Master" (Bảng 4)
- Aggregated view từ 3 nguồn
- Cross-source dedup: Mỗi mã hợp đồng chỉ hiện 1 lần theo source ưu tiên cao nhất
- **Nút Rebuild**: Admin rebuild toàn bộ MasterRevenue

**Chung cho tất cả tab:**
- Dropdown chọn năm
- Bảng có tổng hàng cuối (sum tất cả cột tháng)
- Cột "Tổng năm": Sum(T1..T12)
- Lazy loading: Chỉ fetch data cho tab đang active

---

### 5.6 Tracking quy trình (`/du-an/tracking`)

> **Chỉ ADMIN và USER**

- Hiển thị danh sách các log cập nhật bước quy trình đang chờ duyệt (`status: PENDING`)
- Admin/USER duyệt (APPROVED) hoặc từ chối (REJECTED) từng log
- Mỗi log hiển thị: Tên dự án, người cập nhật, bước mới, nội dung chi tiết, ngày giờ

---

### 5.7 KPI (`/kpi`)

**File:** `src/app/(dashboard)/kpi/kpi-client.tsx`

> **ADMIN, USER, LEADER**

**Biểu đồ time series:**
- **3 granularity**: Tháng, Quý, Năm (chuyển đổi qua dropdown)
- **3 metric trên biểu đồ**: Doanh thu (triệu), Dự án mới, Hợp đồng đã ký
- **Growth indicators**: % tăng trưởng so với kỳ trước

---

### 5.8 Phân bổ & Địa bàn (`/dia-ban`)

**File:** `src/app/(dashboard)/dia-ban/dia-ban-client.tsx`

> **ADMIN, USER, LEADER**

**2 bảng phân tích:**

**Bảng "Phân bổ theo Địa bàn":**
- Mỗi row = 1 địa bàn (Tổ 1, Tổ 2, Tổ 3, Tổ dự án, Chưa phân công)
- Metrics: Doanh thu (triệu), DT đã ký, DT chưa ký, Số dự án, Số HĐ đã ký, Số nhân viên
- Địa bàn = `User.diaBan` của AM chính

**Bảng "Top Nhân viên":**
- Mỗi row = 1 nhân viên (AM/CV/USER)
- Metrics: Doanh thu, DT đã ký, DT chưa ký, Tổng dự án, HĐ đã ký, Tỷ lệ chuyển đổi (%)
- Sắp xếp giảm dần theo doanh thu

**Bộ lọc thời gian**: Tất cả / Năm / Quý / Tháng

---

### 5.9 Quản lý AM (`/quan-ly-am`)

**File:** `src/app/(dashboard)/quan-ly-am/am-management-table.tsx`

> **ADMIN, USER, LEADER**

- Bảng chi tiết cho từng AM (role = AM)
- Metrics: Dự án phụ trách, DT đã ký, DT dự kiến, tỷ lệ chuyển đổi
- **MasterRevenue-based**: Doanh thu tính từ Bảng 4 theo bộ lọc thời gian
- Bộ lọc: Năm + Quý + Tháng

---

### 5.10 Quản lý Chuyên viên (`/quan-ly-cv`)

**File:** `src/app/(dashboard)/quan-ly-cv/cv-management-table.tsx`

> **ADMIN, USER, LEADER**

- Tương tự Quản lý AM nhưng cho role CV
- Cùng bộ metrics và bộ lọc

---

### 5.11 Lãnh đạo theo dõi (`/giam-doc-theo-doi`)

**File:** `src/app/(dashboard)/giam-doc-theo-doi/giam-doc-client.tsx`

> **ADMIN, USER, LEADER**

**Dashboard executive tập trung:**
- Tổng quan dự án: Tổng, theo trạng thái
- Tổng quan doanh thu: Tháng/Quý/Năm so với KPI
- Danh sách dự án cần chăm sóc (> 10 ngày)
- Dự án urgentFlag chưa giải quyết
- Timeline hoạt động gần nhất

---

### 5.12 Nhu cầu CATP (`/nhu-cau-catp`)

**File:** `src/app/(dashboard)/nhu-cau-catp/dashboard-tabs.tsx`

> **Tất cả roles**

**Khảo sát nhu cầu chuyển đổi số của các đơn vị Công an:**

**Dữ liệu khảo sát (`PoliceSurvey`):**
- Đơn vị, người khảo sát, chức vụ
- 3 lĩnh vực: Camera, Kiosk, Truyền thanh
  - Mỗi lĩnh vực: Đã có chưa, có nhu cầu không, mục đích, khu vực

**Dashboard tabs:**
- Tab tổng quan: Thống kê nhu cầu (% có nhu cầu Camera/Kiosk/Truyền thanh)
- Tab chi tiết: Bảng dữ liệu đầy đủ
- **Upload Excel**: Import dữ liệu khảo sát từ file Excel
- **Data Manager**: Xem/xóa dữ liệu

---

### 5.13 Admin Pages (`/admin/*`)

#### Quản lý Users (`/admin/users`)
- CRUD người dùng: Tạo, sửa, khóa/mở, xóa
- Phân vai trò (ADMIN/USER/AM/CV/LEADER)
- Gán địa bàn (Tổ 1/2/3/Tổ dự án)
- Reset mật khẩu

#### Quản lý Khách hàng (`/admin/khach-hang`)
- CRUD khách hàng
- Phân loại: Chính phủ, Doanh nghiệp, Công an
- Thông tin đầu mối, lãnh đạo, ngày kỷ niệm

#### Quản lý Sản phẩm (`/admin/san-pham`)
- CRUD sản phẩm CNTT
- Phân nhóm sản phẩm

#### Giao chỉ tiêu KPI (`/admin/kpi`)
- CRUD chỉ tiêu KPI theo tháng/năm
- 5 loại KPI: An ninh mạng, Giải pháp CNTT, Dự án CĐS, CNS An ninh, Cloud/DC
- Đơn vị: triệu đồng

#### RBAC & Phân quyền (`/admin/roles`)
- **Role List Panel**: Xem/sửa label, mô tả, màu cho từng role
- **Menu Manager**: CRUD menu items (key, label, href, icon, section, sortOrder)
- **Permission Matrix**: Ma trận quyền role × menu (canView/canCreate/canEdit/canDelete)

#### Dự án đã xóa (`/admin/du-an-da-xoa`)
- Danh sách dự án `isPendingDelete = true`
- Phục hồi hoặc xóa vĩnh viễn

---

### 5.14 Trang đặc biệt (ngoài dashboard)

#### VR360 (`/vr360`)
- Trang giới thiệu sản phẩm VR360
- Standalone page, layout riêng (không sidebar)

#### Workshop 5M (`/workshop/*`)
- **Input** (`/workshop/input`): Form nhập ý tưởng theo 5M (Man, Method, Material, Machine, Market)
- **Vote** (`/workshop/vote`): Bình chọn ý tưởng
- **Dashboard** (`/workshop/dashboard`): Thống kê kết quả workshop
- Standalone, không yêu cầu đăng nhập

---

## 6. QUY TẮC TÍNH TOÁN DOANH THU (MANDATORY)

### 6.1 Active Months Calculation

> ⚠️ **KHÔNG ĐƯỢC THAY ĐỔI** trừ khi có yêu cầu nghiệp vụ mới.

Hàm `getActiveMonths_Utility()` trong `src/app/(dashboard)/dashboard-actions.ts`:

1. Sử dụng khoảng **nửa mở** `[Tháng Bắt đầu, Tháng Kết thúc)`
2. **Loại trừ tháng kết thúc**: Nếu dự án kết thúc trong tháng X, tháng X KHÔNG tính DT
3. **Dự án bán đứt**: Bắt đầu & kết thúc cùng tháng → tính 1 tháng duy nhất
4. Luôn dùng **UTC Midnight** để tính toán

### 6.2 Revenue Calculation (Pipeline Dashboard)

Hàm `calculateEffectiveRevenue_Utility()`:
1. Nếu có `doanhThuTheoThang > 0`: DT = `dtTheoThang × activeMonths` (cap tại `tongDoanhThuDuKien`)
2. Nếu không có DT/tháng (bán đứt): Ghi nhận toàn bộ `tongDoanhThuDuKien` vào tháng bắt đầu

### 6.3 Last-month Adjustment (Cloud-Distribute)

> ⚠️ **KHÔNG ĐƯỢC THAY ĐỔI** trừ khi người dùng trực tiếp yêu cầu.

Công thức: `doanhThuThangCuoi = tongDT - dtTheoThang * (soKy - 1)`

- Đảm bảo tổng DT tất cả tháng = `tongDoanhThu` chính xác
- Chấp nhận chênh lệch nhỏ (~1.35M) giữa Excel và Dashboard

### 6.4 Invoice Revenue (EContract)

> ⚠️ **KHÔNG ĐƯỢC THAY ĐỔI** trừ khi người dùng trực tiếp yêu cầu.

- Mỗi dòng Excel = 1 record DuAn riêng biệt
- DT ghi nhận = `dtTheoThang` từ Excel (kể cả = 0)
- `namGhiNhan` = năm hiện tại (năm upload)
- Tổng DT năm = Σ(dtTheoThang) của tất cả tháng ghi nhận

---

## 7. IMPORT EXCEL FLOW

### 7.1 Pipeline Import
- **File:** `src/app/(dashboard)/du-an/excel-upload-button.tsx`
- Trang: `/du-an`
- Parse Excel → map cột → validate → tạo `DuAn` + `NhatKyCongViec`
- **Block**: Không cho import dự án "Đã ký hợp đồng" qua Pipeline

### 7.2 Source Data Import
- **File:** `src/app/(dashboard)/du-an/du-lieu-nguon/source-data-actions.ts`
- Trang: `/du-an/du-lieu-nguon`
- 3 loại: Pipeline, Cloud-Distribute, EContract-Invoice
- Flow: Parse → Dedup check → Create/Update within transaction → Sync MasterRevenue
- `batchId` tracking: Mỗi lần import tạo unique batchId để hỗ trợ thu hồi
- **Thu hồi batch**: Xóa toàn bộ dự án theo batchId gần nhất

### 7.3 Batch Processing
- Chunk size: 1000 rows/chunk
- Transaction timeout: 600s (10 phút)
- Post-import: `syncMasterRevenueMany()` cho tất cả project IDs
- Cache invalidation: dashboard-overview, options:khachhang, options:sanpham

---

## 8. CACHING & PERFORMANCE

### 8.1 Server-side Cache
- `unstable_cache` (Next.js): KPI data, Dashboard overview, Dia ban analytics (TTL: 5 phút)
- Redis: Cache options (khách hàng, sản phẩm), session data
- Cache key pattern: `dashboard:overview`, `options:khachhang`, `options:sanpham`

### 8.2 Cache Invalidation
- `revalidateTag('dashboard-overview')`: Sau mỗi CRUD dự án
- `revalidatePath('/du-an')`: Sau import/update
- `cacheInvalidate()`: Redis cache delete

### 8.3 SSR Optimization
- Dữ liệu nguồn: Lazy load — chỉ fetch tab đang active
- Pagination: 50 records/page cho danh sách dự án
- `force-dynamic`: Tất cả dashboard pages không cache HTML

---

## 9. REALTIME & NOTIFICATIONS

### 9.1 Ably Realtime
- Chat trong dự án: Tin nhắn realtime
- Typing indicators

### 9.2 Notifications
- In-app notifications (bảng `Notification`)
- Telegram Bot: Gửi alert khi có cập nhật quan trọng
- Email (Nodemailer): Password reset, thông báo

### 9.3 Urgent Flag
- AM/CV đánh dấu log là "khẩn cấp" (`urgentFlag = true`)
- Hiển thị trong trang Giám đốc theo dõi
- Có `isResolved` để đánh dấu đã xử lý
- `directorArchived`: Giám đốc đã archive

---

## 10. TIÊU CHUẨN 10 NGÀY CHĂM SÓC

- Dự án cần chăm sóc = chưa có hoạt động nào trong 10 ngày gần nhất
- Tính từ `ngayChamsocCuoiCung` hoặc log gần nhất hoặc `createdAt`
- Hiển thị cảnh báo trên Dashboard, Giám đốc theo dõi, và bộ lọc "Cần chăm sóc" trong CRM

---

## 11. CÁC FILE QUAN TRỌNG CẦN BIẾT

| File | Mô tả |
|---|---|
| `prisma/schema.prisma` | Database schema — Tất cả models & enums |
| `src/app/(dashboard)/dashboard-actions.ts` | Server actions cho Dashboard chính (825 dòng) |
| `src/app/(dashboard)/du-an/du-lieu-nguon/source-data-actions.ts` | Import/Export dữ liệu nguồn + dedup (1024 dòng) |
| `src/lib/utils/master-revenue-sync.ts` | Bảng 4 sync engine (510 dòng) |
| `src/lib/utils/source-revenue-engine.ts` | Revenue calc per source type (222 dòng) |
| `src/lib/utils/revenue-engine.ts` | Pipeline amortization engine |
| `src/lib/rbac.ts` | RBAC definitions & route permissions |
| `src/app/(dashboard)/du-an/actions.ts` | CRUD dự án |
| `src/app/(dashboard)/du-an/tao-moi/project-form.tsx` | Form tạo/sửa dự án (35K) |
| `src/components/dashboard/board-overview.tsx` | Component Dashboard Tổng quan |
| `src/app/(dashboard)/giam-doc-theo-doi/giam-doc-client.tsx` | Dashboard Giám đốc (42K) |

---

## 12. ĐƠN VỊ TIỀN TỆ

- **Database**: Lưu giá trị gốc bằng **đồng** (VND)
- **Dashboard hiển thị**: Chuyển sang **triệu đồng** (`Math.round(value / 1_000_000)`)
- **KPI (ChiTieuKpi)**: Lưu trực tiếp bằng **triệu đồng** (không cần chia)
- Quy ước: Conversion chỉ xảy ra 1 lần ở output cuối cùng, KHÔNG convert giữa chừng trong tính toán

---

## 13. DOCKER & DEPLOYMENT

- **Docker Compose**: PostgreSQL + Redis + Next.js app
- **Dockerfile**: Multi-stage build (deps → build → runner)
- **Environment**: `.env` cho production, `.env.development` cho local
- Database: PostgreSQL (production), có thể dùng Neon/Supabase serverless
