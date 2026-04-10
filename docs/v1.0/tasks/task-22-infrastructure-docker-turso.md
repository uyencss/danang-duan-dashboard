# Task 22 — Infrastructure, DB Safety & Turso Sync
**Phase:** 5 (DevOps & Security)
**Priority:** P1
**Status:** ✅ Done
**PRD Ref:** NFR-04, NFR-05, NFR-06

---

## Mục tiêu

Hỗ trợ hệ thống chạy liên tục và có thể scale/deploy trên Cloud hiệu quả thông qua cấu trúc Docker hóa. Cài đặt các công cụ Tunnel (Cloudflare) để publish ứng dụng ra môi trường public an toàn, nâng cấp hệ thống cảnh báo "Database Safety" để ngăn chặn developer reset dữ liệu khi chưa sao lưu, và thiết lập script đồng bộ SQLite DEV DB đến Production (Turso).

---

## Danh sách công việc

### 1. Database Safety & Seed Enhancements
- [x] Tạo module `db-safety.ts` cấm chạy `prisma db push` / `migrate reset` nếu chứa dữ liệu Production hoặc chưa bật cờ `SEED_RESET=true`.
- [x] Implement scripts: `migrate-reset-safe.ts` chạy `backup` cơ sở dữ liệu SQLite mỗi lần reset.
- [x] Sửa `seed.ts` không overwrite dữ liệu nếu đã có accounts hoặc dự án (chống phá vỡ môi trường Test).

### 2. Xây dựng Docker Container & Compose
- [x] Tạo `Dockerfile` tối ưu dựa trên Node 22 (tách package manager `pnpm`, chia layer build và run cho Next.js).
- [x] Cấu hình `.dockerignore` để bỏ qua `node_modules`, `prisma/dev.db`...
- [x] Chèn `cloudflare-tunnel` service vào `docker-compose.yml` để trỏ vào mạng nội bộ 3000 (Next.js app).
- [x] Đặt file `.env` config an toàn.

### 3. Tích hợp Turso DB Upload Scripts
- [x] Tách thư mục `scripts/` thành nhóm `turso-db`, `diagnostics`, `db-management`.
- [x] Viết script `upload-to-turso.ts`: Upload raw file `.db` local SQLite thẳng lên remote Turso SQL Server thay vì load data từ `json`.
- [x] Create các tiện ích: `check-both.ts`, `check-all-tables.ts` kiểm tra tính nhất quán giữa Local SQLite DB và Turso (production) để track counts và schema.

### 4. Auth Proxy Config
- [x] Cấu hình Better Auth edge functions để catch session thông qua mạng Cloudflare (fix lỗi BaseURL resolution).

---

## Tiêu chí hoàn thành
- [x] Có thể chạy dự án 1 click qua `docker-compose up -d`.
- [x] Lệnh `npx prisma db push` sẽ thông báo Check Safety trước khi thực hiện.
- [x] Có Tunnel Cloudflare cấp HTTPS SSL không cần cài đặt Nginx hay NGINX Proxy Manager.
- [x] DB Dev và DB Turso sync số liệu sau khi gọi `check-both.ts`.
