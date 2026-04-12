# Database Design — MobiFone Project Tracker
**Version:** 1.4.0 | **Updated:** 2026-04-12  
**ORM:** Prisma v7.6.x | **Database:** Self-hosted PostgreSQL 17 via Docker


---

## 1. Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ DuAn : "AM"
    User ||--o{ DuAn : "CV"
    User ||--o{ NhatKyCongViec : "creates"
    User ||--o{ BinhLuan : "writes"
    User ||--o{ TinNhan : "sends"
    KhachHang ||--o{ DuAn : "has"
    SanPham ||--o{ DuAn : "uses"
    DuAn ||--o{ NhatKyCongViec : "logs"
    DuAn ||--o{ BinhLuan : "comments"
    DuAn ||--o{ TinNhan : "chat"
    BinhLuan ||--o{ BinhLuan : "reply"
    MenuItem ||--o{ MenuPermission : "grants"
    MenuPermission }o--|| User : "role-based"
```

---

## 2. Enums

```prisma
enum UserRole {
  ADMIN        // Quản trị viên (Admin) — Full system access, user management
  USER         // Quản trị viên (Chuyên viên) — Full access, similar to ADMIN
  AM           // Account Manager — Restricted to: Dashboard, CRM, Khách hàng, KPI, Tạo dự án
  CV           // Chuyên viên — Restricted to: Dashboard, CRM, Khách hàng, KPI, Tạo dự án
}

enum PhanLoaiKH {
  CHINH_PHU    // Sở, Ban, Ngành
  DOANH_NGHIEP // Doanh nghiệp tư nhân
  CONG_AN      // Công an (B2A)
}

enum TrangThaiDuAn {
  MOI              // Mới
  DANG_LAM_VIEC    // Đang làm việc
  DA_DEMO          // Đã demo
  DA_GUI_BAO_GIA   // Đã gửi báo giá
  DA_KY_HOP_DONG   // Đã ký hợp đồng
  THAT_BAI         // Thất bại
}

enum LinhVuc {
  CHINH_PHU      // Chính phủ/ Sở ban ngành
  DOANH_NGHIEP   // Doanh nghiệp
  CONG_AN        // Công an
}

enum LoaiTinNhan {
  TEXT       // Tin nhắn văn bản
  SYSTEM     // Tin nhắn hệ thống (status changed, user joined...)
}
```

---

## 3. Table Definitions

### 3.1 User (Nhân viên)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| name | String | required | Họ tên |
| email | String | unique | Email đăng nhập |
| hashedPassword | String | required | Mật khẩu mã hóa |
| role | UserRole | default: USER | Vai trò |
| diaBan | String? | nullable | Tổ 1, Tổ 2... |
| avatarUrl | String? | nullable | Ảnh đại diện |
| isActive | Boolean | default: true | Trạng thái tài khoản |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Indexes:** `email`, `role`, `diaBan`

### 3.2 Session (Better Auth)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK | Session ID |
| userId | String | FK → User | User sở hữu |
| token | String | unique | Session token |
| expiresAt | DateTime | required | Hết hạn |

### 3.3 KhachHang (Khách hàng — Master Data)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, auto | |
| ten | String | required | Sở Y tế, Bệnh viện... |
| phanLoai | PhanLoaiKH | required | Chính phủ / DN / Công an |
| diaChi | String? | nullable | Địa chỉ |
| soDienThoai | String? | nullable | SĐT |
| email | String? | nullable | Email liên hệ |
| dauMoiTiepCan | String? | nullable | Đầu mối tiếp cận |
| soDienThoaiDauMoi | String? | nullable | SĐT Đầu mối |
| ngaySinhDauMoi | DateTime? | nullable | Ngày sinh Đầu mối |
| lanhDaoDonVi | String? | nullable | Lãnh đạo đơn vị |
| soDienThoaiLanhDao | String? | nullable | SĐT Lãnh đạo |
| ngaySinhLanhDao | DateTime? | nullable | Ngày sinh Lãnh đạo |
| ngayThanhLap | DateTime? | nullable | Ngày thành lập |
| ngayKyNiem | DateTime? | nullable | Ngày kỷ niệm |
| ghiChu | String? | nullable | Ghi chú thêm |
| isActive | Boolean | default: true | |

**Indexes:** `phanLoai`, `ten`

### 3.4 SanPham (Sản phẩm — Master Data)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, auto | |
| nhom | String | required | Cloud, IOC, Hóa đơn ĐT... |
| tenChiTiet | String | required | Tên chi tiết |
| moTa | String? | nullable | Mô tả |
| isActive | Boolean | default: true | |

**Indexes:** `nhom`

### 3.5 DuAn (Project Master — CORE)

| ID | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, auto | |
| customerId | Int | FK → KhachHang | Khách hàng |
| productId | Int | FK → SanPham | Sản phẩm |
| amId | String? | FK → User (SetNull) | AM phụ trách |
| amHoTroId | String? | FK → User (SetNull) | AM Hỗ trợ |
| chuyenVienId | String? | FK → User (SetNull) | Chuyên viên |
| cvHoTro1Id | String? | FK → User (SetNull) | Chuyên viên hỗ trợ 1 |
| cvHoTro2Id | String? | FK → User (SetNull) | Chuyên viên hỗ trợ 2 |
| tenDuAn | String | required | Tên mô tả dự án |
| linhVuc | LinhVuc | default: CHINH_PHU | Lĩnh vực |
| tongDoanhThuDuKien | Float | default: 0 | Triệu đồng |
| doanhThuTheoThang | Float? | default: 0 | Mức doanh thu tháng |
| maHopDong | String? | nullable | Mã hợp đồng |
| ngayBatDau | DateTime | required | Ngày bắt đầu |
| ngayKetThuc | DateTime? | nullable | Ngày kết thúc |
| isTrongDiem | Boolean | default: false | Dự án trọng điểm |
| isPendingDelete | Boolean | default: false | Cờ xóa mềm (Recycle Bin) |
| deleteRequestedAt | DateTime? | nullable | Thời điểm yêu cầu xóa |
| tuan | Int | auto-calc | Week number |
| thang | Int | auto-calc | 1-12 |
| quy | Int | auto-calc | 1-4 |
| nam | Int | auto-calc | Year |
| ngayChamsocCuoiCung | DateTime? | nullable | CSKH cuối |
| trangThaiHienTai | TrangThaiDuAn | default: MOI | Status |

**Indexes:** `customerId`, `productId`, `amId`, `chuyenVienId`, `trangThaiHienTai`, `linhVuc`, `(nam,quy,thang)`, `ngayChamsocCuoiCung`

### 3.6 NhatKyCongViec (Task Detail — DETAIL)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, auto | |
| projectId | Int | FK → DuAn, CASCADE | Dự án cha |
| userId | String | FK → User, CASCADE | Người tạo |
| ngayGio | DateTime | default: now() | Thời điểm |
| trangThaiMoi | TrangThaiDuAn | required | Trạng thái mới |
| noiDungChiTiet | String | required | Nội dung chi tiết |

> **⚡ Trigger:** Tạo NhatKyCongViec → cập nhật `DuAn.ngayChamsocCuoiCung` + `DuAn.trangThaiHienTai`

### 3.7 BinhLuan (Comments — Thread)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, auto | |
| projectId | Int | FK → DuAn, CASCADE | Dự án |
| userId | String | FK → User, CASCADE | Người viết |
| content | String | required | Nội dung |
| parentId | Int? | FK → BinhLuan (self) | Reply thread |

### 3.8 TinNhan (Chat Message — Real-time)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, auto | |
| projectId | Int | FK → DuAn, CASCADE | Dự án (chat channel) |
| userId | String | FK → User, CASCADE | Người gửi |
| content | String | required | Nội dung tin nhắn |
| type | LoaiTinNhan | default: TEXT | Loại tin nhắn (TEXT/SYSTEM) |
| isEdited | Boolean | default: false | Đã sửa? |
| isDeleted | Boolean | default: false | Đã xóa mềm? |
| createdAt | DateTime | auto | Thời điểm gửi |
| updatedAt | DateTime | auto | Thời điểm cập nhật |

**Indexes:** `(projectId, createdAt)` (compound — phục vụ cursor pagination), `userId`

> **📝 Note:** `TinNhan` khác `BinhLuan` ở chỗ: TinNhan là chat liên tục dạng messenger (flat, không thread), còn BinhLuan là threaded discussion theo chủ đề.

### 3.9 ChiTieuKpi (KPI Tracker)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, auto | |
| nam | Int | required | Năm |
| thang | Int | required | Tháng |
| anNinhMang | Float | default: 0 | Mục tiêu An Ninh Mạng |
| giaiPhapCntt | Float | default: 0 | Mục tiêu Giải pháp CNTT |
| duAnCds | Float | default: 0 | Mục tiêu Dự án CĐS |
| cnsAnNinh | Float | default: 0 | Mục tiêu CNS An Ninh |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Indexes:** `nam`, `(nam, thang)` (unique)

### 3.10 RBAC — Current Implementation (Static Config)

The current RBAC system uses a static configuration file (`src/lib/rbac.ts`) rather than database tables. Roles are stored as the `role` field on the `User` table, and route-to-role mappings are defined in code:

```typescript
// src/lib/rbac.ts — Route permission config
export type AppRole = "ADMIN" | "USER" | "AM" | "CV";

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  { pattern: "/",               roles: ["ADMIN", "USER", "AM", "CV"] },
  { pattern: "/du-an",          roles: ["ADMIN", "USER", "AM", "CV"] },
  { pattern: "/admin/khach-hang", roles: ["ADMIN", "USER", "AM", "CV"] },
  { pattern: "/admin/kpi",      roles: ["ADMIN", "USER", "AM", "CV"] },
  { pattern: "/kpi",            roles: ["ADMIN", "USER"] },
  { pattern: "/dia-ban",        roles: ["ADMIN", "USER"] },
  { pattern: "/admin/users",    roles: ["ADMIN", "USER"] },
  // ...more routes
];
```

**Role Metadata** is also stored in `rbac.ts` with labels, descriptions, and badge colors for UI rendering.

### 3.11 RBAC — Database Models (Dynamic Role Management)

The application uses dynamic, admin-configurable role permissions without code changes, incorporating the following models:

#### MenuItem (Registry of all menu/routes)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, auto | |
| key | String | unique | Identifier, e.g. "dashboard", "crm-du-an" |
| label | String | required | Display name, e.g. "Dashboard Tổng quan" |
| href | String | required | Route path, e.g. "/" |
| icon | String? | nullable | Lucide icon name |
| section | String | default: "main" | "main" or "admin" |
| sortOrder | Int | default: 0 | Display order |
| isActive | Boolean | default: true | Active/inactive toggle |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

**Indexes:** `(section, sortOrder)`

#### MenuPermission (Join table: Role ↔ MenuItem)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, auto | |
| role | String | required | "ADMIN", "USER", "AM", "CV" |
| menuItemId | Int | FK → MenuItem, CASCADE | Linked menu |
| createdAt | DateTime | auto | |

**Indexes:** `(role, menuItemId)` (unique)

#### RoleConfig (Role metadata in DB)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, auto | |
| role | String | unique | Role key |
| label | String | required | Vietnamese display name |
| description | String? | nullable | Role description |
| badgeColor | String? | nullable | Tailwind class |
| textColor | String? | nullable | Tailwind class |
| borderColor | String? | nullable | Tailwind class |
| isSystem | Boolean | default: false | Cannot be deleted |
| createdAt | DateTime | auto | |
| updatedAt | DateTime | auto | |

---

## 4. Business Rules

### 4.1 Auto-extract Time Fields
```typescript
import { getWeek, getMonth, getQuarter, getYear } from "date-fns";

export function extractTimeFields(date: Date) {
  return {
    tuan: getWeek(date, { weekStartsOn: 1 }),
    thang: getMonth(date) + 1,
    quy: getQuarter(date),
    nam: getYear(date),
  };
}
```

### 4.2 Task Log → Update Parent (Transaction)
```typescript
async function createTaskLog(data: TaskLogInput) {
  return prisma.$transaction([
    prisma.nhatKyCongViec.create({ data: { ...data, ngayGio: data.ngayGio ?? new Date() } }),
    prisma.duAn.update({
      where: { id: data.projectId },
      data: {
        ngayChamsocCuoiCung: data.ngayGio ?? new Date(),
        trangThaiHienTai: data.trangThaiMoi,
      },
    }),
  ]);
}
```

### 4.3 Smart Alert — 15-Day Rule
```typescript
import { differenceInDays } from "date-fns";

export function isNeedsCare(lastCare: Date | null): boolean {
  if (!lastCare) return true;
  return differenceInDays(new Date(), lastCare) > 15;
}
```

---

## 5. Migration Strategy

### 5.1 Development (via Cloudflare TCP Tunnel → Postgres)
```bash
# Local dev connects to self-hosted PostgreSQL through Cloudflare TCP Tunnel
# DATABASE_URL=postgresql://postgres:<pass>@localhost:5433/mobi_dev
npx prisma migrate dev --name init
npx prisma db push
```

### 5.2 Production (Internal Docker Network → Postgres)
```bash
# Production web container connects internally
# DATABASE_URL=postgresql://postgres:<pass>@db:5432/mobi_prod
npx prisma migrate deploy
```

### 5.3 Self-Hosted PostgreSQL Architecture

Cả production và development đều sử dụng **self-hosted PostgreSQL 17** chạy trong Docker Compose. Không còn sử dụng libSQL/Turso.

| Aspect | Detail |
|--------|--------|
| **Database Engine** | PostgreSQL 17 (`postgres:17-alpine`) |
| **Data Storage** | Docker named volume `postgres-data` → `/var/lib/postgresql/data` |
| **Prod Connection** | `postgresql://...db:5432` (internal Docker network, < 1ms) |
| **Dev Connection** | `cloudflared access tcp` qua `db.gpsdna.io.vn` |
| **Authentication** | Standard Username/Password (no JWTs) |
| **Database Separation** | `mobi_prod` database (prod) + `mobi_dev` database (dev) |
| **Reads/Writes** | Standard Postgres TCP connection via Prisma |
| **Cost** | $0 (self-hosted on existing VPS) |

**Environment Variables (Production — Docker `web` container):**
```env
POSTGRES_PASSWORD="<secure-password>"
DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/mobi_prod"
```

**Environment Variables (Development — Local machine):**
```env
# Sau khi chạy: cloudflared access tcp --hostname db.gpsdna.io.vn --url localhost:5433
DATABASE_URL="postgresql://postgres:<secure-password>@localhost:5433/mobi_dev"
```

**Client Configuration:**
`src/lib/prisma.ts` được đơn giản hóa hoàn toàn, chỉ khởi tạo `PrismaClient` chuẩn không cần bất kỳ HTTP adapter nào:

```typescript
import { PrismaClient } from "@prisma/client";
export const prisma = globalThis.prisma ?? new PrismaClient();
```

**Consistency Model:**

| Scenario | Behavior |
|----------|----------|
| Truy xuất dữ liệu | Fully consistent (ACID compliant Postgres) |
| Dev vs Prod | 2 database độc lập (`mobi_prod`, `mobi_dev`) trong cùng 1 cluster |
| Chat messages | Real-time qua Ably — không phụ thuộc DB sync |
| System Logs | File System (`logs/app.log`) bằng Pino — không lưu trong DB |

### 5.4 Database Sync (Dev ↔ Prod)

Để đảm bảo đồng nhất môi trường, dự án sử dụng các script đồng bộ giữa hai database `mobi_prod` và `mobi_dev`:

| Command | Direction | Use Case |
|---------|-----------|----------|
| `pnpm db:sync:prod-to-dev` | Prod → Dev | Seed dev bằng cách copy toàn bộ data từ `mobi_prod` sang `mobi_dev` (pg_dump) |
| `pnpm db:sync:dev-to-prod` | Dev → Prod | Migrate data lên prod (có auto-backup) |
| `pnpm db:backup` | Any database | Tạo file SQL dump |

### 5.5 Security

Bảo mật truy cập database:
1. **Prod:** Database container không export port 5432 ra ngoài host, chỉ truy cập được nội bộ trong mạng `backend` Docker. Mật khẩu được deploy qua GitHub Actions Secrets (`POSTGRES_PASSWORD`).
2. **Dev:** Cloudflare Zero Trust bảo vệ DNS `db.gpsdna.io.vn`. Developer phải xác thực với Cloudflare Access (Email OTP/Azure AD) thì `cloudflared access tcp` mới được phép thiết lập đường ống (tunnel) tới port 5432.

---

## 6. Seed Data

Sample seed includes:
- 1 Admin + 1 USER + AM/CV users with different `diaBan` and roles
- 6 Khách hàng (mix Chính phủ, DN, Công an)
- 6 Sản phẩm (Cloud, IOC, Camera AI, mInvoice...)
- 3 Dự án mẫu with varied statuses
- 5 NhatKyCongViec entries forming a timeline
- 3 BinhLuan entries with reply thread

**Implemented Dynamic RBAC:**
- MenuItem seed: all sidebar routes registered in the MenuItem table, supports `isActive` toggles and `sortOrder`.
- MenuPermission seed: default role-menu assignments mapped directly to UI (Matrix).
- RoleConfig seed: system roles with Vietnamese labels and configurable metadata.
