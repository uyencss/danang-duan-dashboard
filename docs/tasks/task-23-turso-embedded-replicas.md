# Task 23 — Turso Embedded Replicas & Multi-Instance Sync
**Phase:** 6 (Infrastructure — Embedded Replicas)
**Priority:** P0
**Status:** ⏳ Todo
**PRD Ref:** NFR-05, NFR-06, NFR-07

---

## Mục tiêu

Chuyển từ kết nối trực tiếp đến Turso Cloud DB sang **Turso Embedded Replicas** — một file SQLite cục bộ được tự động đồng bộ từ remote Turso primary. Mỗi instance ứng dụng sẽ đọc từ file local (microsecond latency, miễn phí, không giới hạn), và ghi sẽ được tự động chuyển tiếp lên cloud primary rồi sync ngược xuống tất cả các replica.

**Lý do:**
- Ứng dụng sẽ chạy **2 instances** — cần dữ liệu nhất quán giữa các instance
- **Tối ưu free tier** — Đọc local không tính vào giới hạn 500M row reads
- **3GB/month sync** trong free tier đủ cho dự án (dự kiến sử dụng < 2MB/tháng)
- **Backup tự nhiên** — Mỗi instance có file `.db` vật lý trên disk

---

## Danh sách công việc

### 1. Cấu trúc lại Environment Variables
- [ ] Tách `DATABASE_URL` thành `TURSO_DATABASE_URL` (remote URL) và `TURSO_AUTH_TOKEN` (auth token)
- [ ] Thêm `LOCAL_REPLICA_PATH` cho đường dẫn file local replica (mặc định: `file:./data/local-replica.db`)
- [ ] Thêm `TURSO_SYNC_PERIOD` cho chu kỳ đồng bộ tự động (mặc định: 60 giây)
- [ ] Giữ `DATABASE_URL` legacy cho Prisma CLI migrations

### 2. Migrate `src/lib/prisma.ts` sang Embedded Replica
- [ ] Cập nhật `createClient()` từ `@libsql/client` với các params: `url` (local file), `syncUrl` (remote), `authToken`, `syncPeriod`
- [ ] Hỗ trợ dual-mode: Embedded Replica khi có `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`, fallback direct connection khi chỉ có `DATABASE_URL`
- [ ] Export `libsqlClient` để sử dụng cho manual sync

### 3. Tạo Sync Utility
- [ ] Tạo `src/lib/utils/sync.ts` với helper `syncReplica()` — force sync ngay lập tức
- [ ] Tạo wrapper `withSync()` cho write operations tự động sync sau mutation
- [ ] Thêm error handling và logging cho sync failures

### 4. Cập nhật Server Actions
- [ ] Thêm `syncReplica()` vào `src/actions/project.actions.ts` (create, update, delete)
- [ ] Thêm `syncReplica()` vào `src/actions/tasklog.actions.ts` (createTaskLog)
- [ ] Thêm `syncReplica()` vào `src/actions/admin.actions.ts` (tất cả CRUD mutations)
- [ ] Thêm `syncReplica()` vào `src/actions/chat.actions.ts` (send, edit, delete message)

### 5. Docker Infrastructure cho 2 Instances
- [ ] Cập nhật `Dockerfile` — tạo thư mục `/app/data` cho local replica
- [ ] Cập nhật `docker-compose.yml` — 2 services `web-instance-1` (port 3000) và `web-instance-2` (port 3001)
- [ ] Cấu hình Docker volumes riêng cho mỗi instance (`replica-data-1`, `replica-data-2`)
- [ ] Pass environment variables mới vào cả 2 containers
- [ ] Tạo script `scripts/init-replica.ts` — force full sync khi container khởi động lần đầu

### 6. Cập nhật `prisma.config.ts`
- [ ] Đảm bảo Prisma CLI vẫn sử dụng `DATABASE_URL` (remote) cho migrations
- [ ] Giữ backward compatible với workflow hiện tại

### 7. Diagnostics & Health Check
- [ ] Tạo `scripts/diagnostics/check-replica-health.ts` — kiểm tra trạng thái sync giữa local replica và remote
- [ ] Cập nhật `scripts/diagnostics/check-both.ts` — hỗ trợ kiểm tra embedded replica
- [ ] Log sync metrics (last sync time, rows synced) để monitor bandwidth usage

### 8. Documentation Update
- [ ] Cập nhật `docs/architecture.md` — thêm Embedded Replica architecture diagram
- [ ] Cập nhật `docs/database-design.md` — thêm migration strategy mới
- [ ] Cập nhật `docs/prd.md` — thêm NFR cho multi-instance và embedded replicas

---

## Tiêu chí hoàn thành

- [ ] App đọc dữ liệu từ file local (kiểm tra bằng latency < 1ms)
- [ ] Ghi dữ liệu được forward lên Turso cloud và sync ngược về local
- [ ] 2 instances chạy đồng thời, dữ liệu nhất quán sau sync period
- [ ] Docker volumes persist replica file qua container restarts
- [ ] Prisma migrations vẫn chạy đúng với remote Turso
- [ ] Bandwidth sử dụng < 100MB/tháng (dựa trên ước tính ~2MB/tháng)
- [ ] `check-replica-health.ts` báo cáo trạng thái sync chính xác

---

## Ghi chú kỹ thuật

### Consistency Model
| Scenario | Behavior |
|----------|----------|
| Read sau khi write (cùng instance) | Consistent ngay lập tức (local sync) |
| Read sau khi write (khác instance) | Eventually consistent (trong `TURSO_SYNC_PERIOD` giây) |
| Chat messages | Real-time qua Ably, không phụ thuộc sync period |

### Bandwidth Estimation
- Dữ kiện: ~3,700 write operations/tháng × ~300B trung bình = ~1.1MB/tháng
- 2 instances = ~2.2MB/tháng (0.07% của 3GB free tier)

### Rollback
Nếu có vấn đề, revert về direct connection chỉ cần:
1. Xóa `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `LOCAL_REPLICA_PATH` khỏi `.env`
2. Revert `src/lib/prisma.ts` về version cũ
3. Xóa Docker volumes
- **Thời gian rollback:** ~15 phút
