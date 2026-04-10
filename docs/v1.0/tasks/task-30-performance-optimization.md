# Task 30 — Performance Optimization (Docker Resources, Bundle & Prefetch)
**Phase:** 8 (Infrastructure & Performance)
**Priority:** P1
**Status:** 🔲 To Do
**PRD Ref:** Non-functional Requirements — Performance
**Tech Ref:** [tech-stack.md](../tech-stack.md) — Next.js 16, Docker

---

## Bối cảnh & Vấn đề hiện tại

Ứng dụng hiện tại load chậm khi chuyển giữa các menu trong dashboard. Nguyên nhân chính:

1. **Docker resources quá thấp** — Container web chỉ được cấp 1 CPU / 1GB RAM (reservation 0.5 CPU / 512MB). Node.js + Next.js cần nhiều tài nguyên hơn cho SSR + client hydration.
2. **Next.js chưa tối ưu bundle** — `next.config.ts` gần như trống, không bật `output: "standalone"`, không có `optimizePackageImports` cho các thư viện nặng (lucide-react, recharts, date-fns).
3. **Không có Standalone Output** — Dockerfile copy toàn bộ `node_modules` (~300MB+) thay vì dùng standalone output (~30MB).
4. **Không prefetch routes** — Khi user click sidebar menu, Next.js mới bắt đầu fetch bundle cho page đó → chậm. Cần prefetch tất cả route bundles ngay khi user load trang lần đầu.
5. **Thiếu per-route loading skeletons** — Chỉ có 1 `loading.tsx` ở root `(dashboard)/`, các sub-routes chưa có → không có instant feedback khi navigate.

---

## Giải pháp

### 30.1 — Tăng Docker Resources (4 CPU / 8GB RAM)

Cập nhật `docker-compose.yml`:
- **limits:** 4 CPU, 8GB RAM
- **reservations:** 2 CPU, 4GB RAM

### 30.2 — Tối ưu Next.js Config

Cập nhật `next.config.ts`:
- `output: "standalone"` — Tạo minimal production build, loại bỏ node_modules không cần thiết
- `compress: true` — Bật gzip compression tại Node.js level
- `optimizePackageImports` — Tree-shake thư viện nặng: `lucide-react`, `recharts`, `date-fns`, `@tanstack/react-table`, `@tiptap/react`, `@radix-ui/react-avatar`

### 30.3 — Cập nhật Dockerfile cho Standalone Output

Thay đổi production stage để copy standalone output thay vì toàn bộ node_modules:
- Copy `.next/standalone` → nhẹ hơn ~10x
- Copy `.next/static` và `public` riêng
- Chạy `node server.js` thay vì `npm start`

### 30.4 — Prefetch All Routes on Initial Load

Tạo component `PrefetchRoutes` sử dụng `next/link` với `prefetch={true}` cho tất cả sidebar routes. Component render hidden links → Next.js tự động prefetch tất cả route bundles ngay khi page load lần đầu.

### 30.5 — Per-Route Loading Skeletons

Thêm `loading.tsx` cho từng route group lớn:
- `/du-an/loading.tsx` — Skeleton cho bảng dự án
- `/kpi/loading.tsx` — Skeleton cho chart KPI
- `/dia-ban/loading.tsx` — Skeleton cho địa bàn charts
- `/quan-ly-am/loading.tsx` — Skeleton cho bảng AM
- `/quan-ly-cv/loading.tsx` — Skeleton cho bảng CV
- `/admin/*/loading.tsx` — Skeleton cho admin pages

---

## Files Changed

| File | Action |
|------|--------|
| `docker-compose.yml` | UPDATE — Tăng CPU/RAM limits |
| `next.config.ts` | UPDATE — standalone + optimizePackageImports |
| `Dockerfile` | UPDATE — Standalone output build |
| `package.json` | UPDATE — start script for standalone |
| `src/components/layout/prefetch-routes.tsx` | CREATE — Hidden prefetch component |
| `src/app/(dashboard)/dashboard-wrapper.tsx` | UPDATE — Add PrefetchRoutes |
| `src/app/(dashboard)/du-an/loading.tsx` | CREATE |
| `src/app/(dashboard)/kpi/loading.tsx` | CREATE |
| `src/app/(dashboard)/dia-ban/loading.tsx` | CREATE |
| `src/app/(dashboard)/quan-ly-am/loading.tsx` | CREATE |
| `src/app/(dashboard)/quan-ly-cv/loading.tsx` | CREATE |
| `src/app/(dashboard)/admin/users/loading.tsx` | CREATE |
| `src/app/(dashboard)/admin/san-pham/loading.tsx` | CREATE |
| `src/app/(dashboard)/admin/khach-hang/loading.tsx` | CREATE |
| `src/app/(dashboard)/admin/kpi/loading.tsx` | CREATE |
| `src/app/(dashboard)/admin/roles/loading.tsx` | CREATE |
| `src/app/(dashboard)/admin/du-an-da-xoa/loading.tsx` | CREATE |
| `src/app/(dashboard)/du-an/tracking/loading.tsx` | CREATE |

---

## Verification

```bash
# 1. Build thành công
npm run build

# 2. Kiểm tra standalone output
ls -la .next/standalone/

# 3. Docker build + run
docker compose build && docker compose up -d

# 4. Kiểm tra resource allocation
docker stats danang-dashboard-web
```

---

## Kết quả mong đợi

- **Page navigation**: Gần như instant khi chuyển menu (bundles đã được prefetch)
- **Initial load**: Có loading skeleton ngay lập tức khi truy cập route
- **Docker**: Container có đủ CPU/RAM để xử lý SSR nhanh
- **Bundle size**: Giảm đáng kể nhờ tree-shaking + standalone output
- **Docker image size**: Giảm ~60-70% nhờ standalone output (loại bỏ node_modules)
