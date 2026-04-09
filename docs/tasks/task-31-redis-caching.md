# Task 31 — Redis Caching Layer
**Phase:** 8 (Infrastructure & Performance)
**Priority:** P1
**Status:** 🔲 To Do
**PRD Ref:** Non-functional Requirements — Performance
**Tech Ref:** [tech-stack.md](../tech-stack.md) — Next.js 16, Docker, Turso

---

## Bối cảnh & Vấn đề hiện tại

Ứng dụng hiện tại truy vấn database trực tiếp cho mỗi request, kể cả các data ít thay đổi (master data, RBAC config, dashboard overview). Điều này gây:

1. **Database load không cần thiết** — Các query lặp đi lặp lại cho cùng data (khách hàng options, sản phẩm options, user list, RBAC permissions) mỗi khi user navigate hoặc mở form.
2. **Dashboard overview chậm** — API `/api/dashboard/overview` phải fetch toàn bộ dự án + KPI rồi tính toán metrics mỗi lần load. Kết quả chỉ thay đổi khi có mutation (tạo/sửa dự án).
3. **RBAC config query lặp** — `unstable_cache` của Next.js chỉ cache 30s và bị invalidate khi deploy. Redis cache sẽ persist qua deployments.
4. **Thiếu centralized caching** — Hiện tại dùng `unstable_cache` rải rác, không có cache layer thống nhất với TTL quản lý tập trung.

---

## Giải pháp

### 31.1 — Thêm Redis Container vào Docker Compose

Thêm service `redis` (Alpine-based) vào `docker-compose.yml`:
- Image: `redis:7-alpine`
- Port: 6379 (internal network only)
- Memory limit: 256MB với `maxmemory-policy allkeys-lru`
- Volume: `redis-data` cho persistence
- Network: `backend` (cùng network với web service)

### 31.2 — Redis Client Singleton (`src/lib/redis.ts`)

Tạo Redis client singleton pattern tương tự `prisma.ts`:
- Sử dụng `ioredis` package (mature, TypeScript support, auto-reconnect)
- Singleton pattern với global caching (tránh HMR leak trong dev)
- Graceful fallback: nếu Redis unavailable, log warning và bypass cache (app vẫn hoạt động)
- Connection config qua env vars: `REDIS_URL` (default: `redis://redis:6379`)

### 31.3 — Cache Utility Layer (`src/lib/cache.ts`)

Tạo utility functions thống nhất cho caching:
- `cacheGet<T>(key)` — Get cached value (deserialize JSON)
- `cacheSet(key, value, ttlSeconds)` — Set with TTL
- `cacheInvalidate(...patterns)` — Invalidate by key patterns (hỗ trợ wildcard)
- `withCache<T>(key, ttl, fetcher)` — Cache-aside pattern: check cache → miss → fetch → store

### 31.4 — Áp dụng Cache cho các Queries

| Query | Cache Key Pattern | TTL | Invalidation Trigger |
|-------|------------------|-----|---------------------|
| Dashboard overview | `dashboard:overview` | 60s | Create/Update/Delete dự án, KPI |
| Khách hàng options | `options:khachhang` | 300s | Create/Update/Delete khách hàng |
| Sản phẩm options | `options:sanpham` | 300s | Create/Update/Delete sản phẩm |
| Sản phẩm groups | `options:sanpham-groups` | 300s | Create/Update/Delete sản phẩm |
| User options | `options:users` | 300s | Create/Update/Delete user |
| RBAC permissions | `rbac:permissions` | 600s | Update role/menu permissions |
| RBAC role configs | `rbac:role-configs` | 600s | Update role config |
| RBAC menu items | `rbac:menu-items` | 600s | Update menu items |

### 31.5 — Cache Invalidation Strategy

**Write-through invalidation:** Mỗi mutation (create/update/delete) sẽ gọi `cacheInvalidate()` với các key liên quan ngay sau khi write thành công, TRƯỚC `revalidatePath()`.

Pattern:
```typescript
// Trong server action mutation
await prisma.khachHang.create({ data: ... });
await cacheInvalidate("options:khachhang");  // Invalidate cache
revalidatePath("/admin/khach-hang");          // Invalidate Next.js cache
await syncReplica();                          // Sync Turso replica
```

---

## Files Changed

| File | Action |
|------|--------|
| `docker-compose.yml` | UPDATE — Thêm Redis service + volume |
| `package.json` | UPDATE — Thêm `ioredis` dependency |
| `.env.example` | UPDATE — Thêm `REDIS_URL` |
| `src/lib/redis.ts` | CREATE — Redis client singleton |
| `src/lib/cache.ts` | CREATE — Cache utility layer |
| `src/app/api/dashboard/overview/route.ts` | UPDATE — Wrap với withCache |
| `src/app/(dashboard)/du-an/actions.ts` | UPDATE — Cache invalidation cho mutations + cache cho options |
| `src/app/(dashboard)/admin/khach-hang/actions.ts` | UPDATE — Cache invalidation |
| `src/app/(dashboard)/admin/san-pham/actions.ts` | UPDATE — Cache invalidation |
| `src/app/(dashboard)/admin/users/actions.ts` | UPDATE — Cache invalidation |
| `src/lib/rbac-server.ts` | UPDATE — Replace unstable_cache với Redis cache |

---

## Verification

```bash
# 1. Build thành công
npm run build

# 2. Docker build + run (bao gồm Redis container)
docker compose build && docker compose up -d

# 3. Kiểm tra Redis container đang chạy
docker exec danang-dashboard-redis redis-cli ping
# Expected: PONG

# 4. Kiểm tra cache hoạt động (sau khi load dashboard)
docker exec danang-dashboard-redis redis-cli keys '*'
# Expected: dashboard:overview, options:*, rbac:*

# 5. Kiểm tra cache invalidation (sau khi tạo dự án mới)
# → dashboard:overview key sẽ bị xoá

# 6. Test graceful fallback (stop Redis, app vẫn hoạt động)
docker stop danang-dashboard-redis
# → App vẫn load bình thường (bypass cache, query DB trực tiếp)
```

---

## Kết quả mong đợi

- **Dashboard load**: Giảm ~80% thời gian response (cache hit thay vì query + calculate)
- **Form load** (tạo/sửa dự án): Giảm ~60% thời gian (options đã cached)
- **RBAC check**: Giảm ~90% thời gian (cached 10 phút thay vì 30s)
- **Database load**: Giảm đáng kể số lượng query/phút nhờ cache layer
- **Graceful degradation**: App vẫn hoạt động bình thường nếu Redis down
- **Docker image**: Thêm ~30MB cho Redis Alpine container (rất nhẹ)
