# Task 26 — File System Logging with Monthly Rotation
**Phase:** 6 (Infrastructure & Observability)
**Priority:** P1
**Status:** ✅ Done
**PRD Ref:** NFR-04 (Bảo mật & Vận hành)

---

## Mục tiêu

Triển khai hệ thống logging toàn diện ghi mọi hoạt động server-side (API requests, request body, response status, server actions, errors) ra file system với log rotation tự động mỗi 1 tháng. Áp dụng các best practices công nghiệp hiện đại (structured JSON logging, correlation IDs, sensitive data redaction).

---

## Công nghệ & Thư viện

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| **pino** | ^9.x | Structured JSON logger — fastest Node.js logger, industry standard |
| **pino-pretty** | ^13.x | Dev-only readable log formatting |
| **rotating-file-stream** | ^3.x | Log rotation theo thời gian (monthly) với nén gzip |
| **uuid** (hoặc `crypto.randomUUID`) | built-in | Correlation/Request ID |

> **Tại sao Pino?** Winston đã cũ và chậm hơn 5-10x. Pino là tiêu chuẩn công nghiệp hiện tại (được Fastify, NestJS, và nhiều enterprise project sử dụng). Output JSON structured giúp dễ dàng parse bằng công cụ log aggregation sau này (ELK, Grafana Loki, v.v.).

---

## Cấu trúc thư mục Logs

```
danang-dashboard/
├── logs/                          # ← Thư mục log (git-ignored)
│   ├── app.log                    # Log hiện tại (active)
│   ├── app.2026-03.log.gz         # Log tháng trước (compressed)
│   ├── app.2026-02.log.gz         # ...
│   └── error.log                  # Error-only log (active)
```

Mỗi file log sẽ chứa **structured JSON**, mỗi dòng 1 JSON object (NDJSON format):

```json
{
  "level": 30,
  "time": 1712649600000,
  "pid": 1,
  "hostname": "danang-dashboard-web",
  "reqId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "msg": "POST /api/admin/email/send",
  "method": "POST",
  "url": "/api/admin/email/send",
  "statusCode": 200,
  "responseTime": 142,
  "body": { "to": "***@***.vn", "subject": "Test notification" },
  "userAgent": "Mozilla/5.0 ...",
  "ip": "10.0.0.1",
  "userId": "user_abc123"
}
```

---

## Danh sách công việc

### 1. Cài đặt Dependencies
- [ ] Cài `pino`, `pino-pretty`, `rotating-file-stream`:
  ```bash
  npm install pino rotating-file-stream
  npm install -D pino-pretty @types/rotating-file-stream
  ```

### 2. Tạo Logger Core Module (`src/lib/logger.ts`)
- [ ] Tạo singleton Pino logger instance.
- [ ] Cấu hình **2 transport targets**:
  - **File transport**: Ghi ra `logs/app.log` thông qua `rotating-file-stream` với rotation monthly.
  - **Console transport**: `pino-pretty` cho dev, raw JSON cho production.
- [ ] Cấu hình log levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`.
- [ ] Dev mode (`NODE_ENV=development`): log level `debug`, console pretty-print.
- [ ] Production mode: log level `info`, chỉ file output (giảm I/O console trong Docker).
- [ ] Implement **sensitive data redaction** cho các fields nhạy cảm:
  - `password`, `token`, `secret`, `authorization`, `cookie`
  - Email addresses → `***@***.vn`
- [ ] Tạo child loggers cho từng module: `logger.child({ module: 'auth' })`, `logger.child({ module: 'email' })`, v.v.

### 3. Cấu hình Log Rotation (`src/lib/logger/rotation.ts`)
- [ ] Sử dụng `rotating-file-stream` với các tham số:
  ```typescript
  {
    interval: '1M',        // Rotate mỗi 1 tháng
    size: '100M',          // Hoặc rotate khi file đạt 100MB
    compress: 'gzip',      // Nén file cũ bằng gzip
    maxFiles: 12,          // Giữ tối đa 12 tháng (1 năm)
    path: './logs',        // Thư mục output
  }
  ```
- [ ] Filename pattern: `app.YYYY-MM.log.gz` cho file đã rotate.
- [ ] Tạo thư mục `logs/` tự động nếu chưa tồn tại (sử dụng `fs.mkdirSync` với `recursive: true`).

### 4. Tạo HTTP Request Logger Middleware (`src/lib/logger/request-logger.ts`)
- [ ] Implement middleware function cho Next.js middleware (`middleware.ts`).
- [ ] Log mỗi request với các thông tin:
  - **Request**: method, URL, headers (redacted), body (redacted nếu chứa sensitive fields), query params.
  - **Response**: status code, response time (ms).
  - **Context**: request ID (UUID), user ID (nếu đã auth), IP address, user agent.
- [ ] Gắn `X-Request-Id` header vào response để trace.
- [ ] Exclude health-check paths, static assets (`/_next/`, `/favicon.ico`, v.v.) khỏi logging.

### 5. Tạo API Route Logger Wrapper (`src/lib/logger/api-logger.ts`)
- [ ] Tạo higher-order function `withLogging(handler)` bọc API route handlers.
- [ ] Auto-log: request body (POST/PUT/PATCH), response status, execution time.
- [ ] Catch và log unhandled errors với full stack trace.
- [ ] Ví dụ sử dụng:
  ```typescript
  // Trước:
  export async function POST(req: Request) { ... }
  
  // Sau:
  export const POST = withLogging(async (req: Request) => { ... });
  ```

### 6. Tạo Server Action Logger (`src/lib/logger/action-logger.ts`)
- [ ] Tạo wrapper `withActionLogging(actionName, actionFn)` cho Server Actions.
- [ ] Log: tên action, params (redacted), execution time, result hoặc error.
- [ ] Ví dụ sử dụng:
  ```typescript
  // Trước:
  export async function getDashboardOverview() { ... }

  // Sau:
  export const getDashboardOverview = withActionLogging(
    'getDashboardOverview', 
    async () => { ... }
  );
  ```

### 7. Cập nhật `.gitignore`
- [ ] Thêm entry `/logs` vào `.gitignore` để ignore toàn bộ thư mục logs.

### 8. Cập nhật Docker Configuration
- [ ] Thêm Docker volume mount `./logs:/app/logs` trong `docker-compose.yml` để persist log ra host.
- [ ] Cập nhật `Dockerfile`: tạo thư mục `/app/logs` với quyền sở hữu cho user `nextjs`.
- [ ] Đảm bảo log files có thể truy cập từ host machine qua volume mount.

### 9. Cấu hình Environment Variables
- [ ] Thêm vào `.env.example`:
  ```env
  # Logging
  LOG_LEVEL=info            # trace | debug | info | warn | error | fatal
  LOG_DIR=./logs            # Thư mục chứa log files
  LOG_ROTATION_INTERVAL=1M  # Chu kỳ rotation (1M = 1 tháng)
  LOG_MAX_FILES=12          # Số file log tối đa giữ lại
  LOG_MAX_SIZE=100M         # Kích thước tối đa 1 file trước khi rotate
  ```

### 10. Tích hợp vào các module hiện tại (Dần dần)
- [ ] Thay thế tất cả `console.log` / `console.error` trong `src/lib/email.ts` bằng logger.
- [ ] Thay thế trong `src/lib/prisma.ts`.
- [ ] Thay thế trong `src/app/(dashboard)/dashboard-actions.ts`.
- [ ] Wrap API routes trong `src/app/api/` bằng `withLogging`.

---

## Cấu trúc file mới

```
src/lib/
├── logger.ts                    # [NEW] Main logger singleton & factory 
├── logger/
│   ├── rotation.ts              # [NEW] Rotating file stream config
│   ├── request-logger.ts        # [NEW] HTTP request/response logging
│   ├── api-logger.ts            # [NEW] API route handler wrapper
│   ├── action-logger.ts         # [NEW] Server action wrapper
│   └── redact.ts                # [NEW] Sensitive data redaction rules
```

---

## Ví dụ Output Log

### Development (pretty-printed)
```
[08:30:15.123] INFO: POST /api/admin/email/send
    reqId: "a1b2c3d4"
    method: "POST"
    body: { to: "***@***.vn", subject: "Thông báo dự án mới" }
    userId: "user_abc"
    responseTime: 142ms
    statusCode: 200
```

### Production (JSON — 1 dòng/entry)
```json
{"level":30,"time":1712649600000,"reqId":"a1b2c3d4","msg":"POST /api/admin/email/send","method":"POST","url":"/api/admin/email/send","body":{"to":"***@***.vn","subject":"Thông báo dự án mới"},"userId":"user_abc","responseTime":142,"statusCode":200}
```

---

## Tiêu chí hoàn thành

- [ ] File `logs/app.log` được tạo và ghi log khi server chạy (cả dev lẫn production).
- [ ] Mọi API request (method, URL, body, status code, response time) đều được ghi log.
- [ ] Server actions có log đầy đủ (tên, params, thời gian xử lý).
- [ ] Sensitive data (password, token, email) được redact tự động.
- [ ] Log rotation hoạt động: file cũ được nén `.gz` và đặt tên theo tháng.
- [ ] Thư mục `logs/` bị ignore trong Git.
- [ ] Docker volume mount hoạt động: log files có thể đọc từ host.
- [ ] Không ảnh hưởng đến performance của ứng dụng (Pino async mode).
- [ ] Environment variables cho phép tuỳ chỉnh log level, rotation interval, v.v.
