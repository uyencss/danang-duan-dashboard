# Task 27 — File Upload Storage & Image Resize
**Phase:** 6 (Infrastructure & Observability)
**Priority:** P1
**Status:** 🔲 To Do
**PRD Ref:** NFR-03 (File Management & Storage)

---

## Bối cảnh & Vấn đề hiện tại

Upload file hiện tại (`src/app/(dashboard)/du-an/actions.ts` → `createTaskLog`) ghi file vào `public/uploads/` — thư mục này thuộc build artifact của Next.js và **sẽ bị mất mỗi khi rebuild/redeploy Docker container**. Ngoài ra, file được serve trực tiếp qua static files của Next.js, không có kiểm soát truy cập hay tracking.

### Vấn đề cụ thể:
1. **Mất dữ liệu**: `public/uploads/` nằm trong Docker image, không được mount volume → file biến mất khi container recreate.
2. **Không resize ảnh**: Ảnh gốc (có thể 5-10MB) được lưu nguyên, tốn storage và bandwidth.
3. **Không có API serve**: File được serve qua Next.js static, không có auth check hay download tracking.
4. **Base64 qua Server Action**: File hiện tại được encode base64 rồi gửi qua Server Action — giới hạn kích thước và tốn memory.

---

## Mục tiêu

1. **Chuyển upload directory** từ `public/uploads/` sang `uploads/` ở project root, được mount vào Docker container qua volume.
2. **Tạo API route** để upload file (POST) và serve file (GET) với auth check.
3. **Lưu metadata vào DB** (model `FileDinhKem` đã có sẵn) — cập nhật để lưu thêm `storagePath`.
4. **Auto-resize ảnh** (JPEG/PNG/WebP) xuống tối đa 200-500KB trước khi lưu.
5. **Đảm bảo Docker volume mount** hoạt động và file persist qua deploy.

---

## Công nghệ & Thư viện

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| **sharp** | ^0.33.x | Image resize/compress — fastest Node.js image processing library |
| Next.js API Routes | built-in | POST upload + GET serve endpoints |
| Prisma `FileDinhKem` | existing | DB metadata tracking |

> **Tại sao Sharp?** Sharp sử dụng libvips (C-based) — nhanh hơn 4-5x so với các thư viện JS thuần như jimp. Hỗ trợ JPEG, PNG, WebP, AVIF và có API đơn giản cho resize + compress.

---

## Cấu trúc thư mục

```
danang-dashboard/
├── uploads/                       # ← THƯ MỤC MỚI (git-ignored, Docker volume mounted)
│   ├── 2026/
│   │   ├── 04/
│   │   │   ├── abc123-report.pdf
│   │   │   ├── def456-photo.webp  # ← Ảnh đã resize
│   │   │   └── ...
│   │   └── 05/
│   └── ...
├── public/uploads/                # ← XOÁ (deprecated, không dùng nữa)
```

File được tổ chức theo `YYYY/MM/` để tránh thư mục quá lớn.

---

## Danh sách công việc

### 1. Cài đặt Dependencies
- [ ] Cài `sharp`:
  ```bash
  npm install sharp
  ```
- [ ] Đảm bảo `sharp` hoạt động trên Alpine Linux (Docker image `node:20-alpine`):
  ```dockerfile
  # Thêm vào Dockerfile nếu cần
  RUN apk add --no-cache vips-dev
  ```

### 2. Tạo Upload Config Module (`src/lib/upload/config.ts`)
- [ ] Định nghĩa constants:
  ```typescript
  export const UPLOAD_CONFIG = {
    BASE_DIR: process.env.UPLOAD_DIR || './uploads',
    MAX_FILE_SIZE: 20 * 1024 * 1024,         // 20MB raw upload limit
    IMAGE_MAX_SIZE_KB: 500,                   // Target: 200-500KB sau resize
    IMAGE_MIN_SIZE_KB: 200,                   // Không resize nếu dưới 200KB  
    IMAGE_MAX_DIMENSION: 1920,                // Max width/height px
    ALLOWED_MIME_TYPES: [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/csv',
    ],
  };
  ```

### 3. Tạo Image Resize Utility (`src/lib/upload/image-resize.ts`)
- [ ] Implement hàm `resizeImageIfNeeded(buffer, mimeType)`:
  - Nếu file **không phải ảnh** → return buffer gốc, không xử lý.
  - Nếu file ảnh **đã ≤ 200KB** → return buffer gốc (không cần resize).
  - Nếu file ảnh **> 500KB** → resize progressive:
    1. Giảm dimension xuống max 1920px (giữ tỷ lệ).
    2. Compress JPEG quality 85 → 75 → 65 cho đến khi ≤ 500KB.
    3. Convert PNG sang WebP nếu output vẫn > 500KB.
  - Return `{ buffer, mimeType, wasResized }`.
- [ ] Hỗ trợ formats: JPEG, PNG, WebP, GIF (GIF chỉ resize, không compress animation).

### 4. Tạo Upload API Route — POST (`src/app/api/uploads/route.ts`)
- [ ] Accept `multipart/form-data` (sử dụng `request.formData()`).
- [ ] Validate:
  - Auth check (require login).
  - File size ≤ 20MB.
  - MIME type trong allowed list.
- [ ] Process flow:
  1. Nhận file từ FormData.
  2. Nếu là ảnh → chạy `resizeImageIfNeeded()`.
  3. Tạo filename: `{timestamp}-{uuid}-{sanitized-original-name}`.
  4. Tạo thư mục `uploads/YYYY/MM/` nếu chưa có.
  5. Ghi file vào disk (trong `uploads/YYYY/MM/`).
  6. **KHÔNG tạo record DB ở đây** — chỉ return `{ fileName, filePath, size, type }`.
- [ ] Response: JSON với thông tin file đã upload.

### 5. Tạo File Serve API Route — GET (`src/app/api/uploads/[...path]/route.ts`)
- [ ] Nhận path param → resolve sang file thực trên disk.
- [ ] Security:
  - Validate path không chứa `..` (directory traversal).
  - Kiểm tra file tồn tại.
  - Optional: Auth check (require login để download).
- [ ] Set đúng `Content-Type` header dựa trên file extension.
- [ ] Set `Content-Disposition` header cho non-image files (trigger download).
- [ ] Stream file response (không đọc toàn bộ vào memory).

### 6. Cập nhật Prisma Schema (`prisma/schema.prisma`)
- [ ] Thêm field `storagePath` vào model `FileDinhKem`:
  ```prisma
  model FileDinhKem {
    id        Int      @id @default(autoincrement())
    logId     Int
    name      String   // Tên gốc file
    filePath  String   // Chỉ lưu relative path: 2026/04/abc123-file.pdf
    type      String   // MIME type
    size      Int      // Size in bytes (sau resize nếu là ảnh)
    createdAt DateTime @default(now())
  
    log NhatKyCongViec @relation(fields: [logId], references: [id], onDelete: Cascade)
    
    @@index([logId])
  }
  ```
- [ ] Chạy migration: `npx prisma migrate dev --name add-file-storage-path`

### 7. Cập nhật `createTaskLog` Server Action
- [ ] **Thay đổi flow upload**: Thay vì nhận base64 qua Server Action, client sẽ:
  1. Upload file trước qua `POST /api/uploads` → nhận lại metadata.
  2. Gọi `createTaskLog` với metadata files (không có base64).
- [ ] Cập nhật schema `files` param:
  ```typescript
  files?: { 
    name: string,
    type: string, 
    size: number, 
    filePath: string  // Chỉ lưu relative path
  }[]
  ```
- [ ] Xoá code ghi file trong `createTaskLog` (dòng 452-474 hiện tại).
- [ ] Chỉ tạo record `FileDinhKem` trong DB với thông tin đã có.

### 8. Cập nhật Client Component (`quick-update-modal.tsx`)
- [ ] Thay đổi flow upload:
  ```typescript
  // TRƯỚC: Convert file sang base64 rồi gửi qua Server Action
  // SAU: Upload file qua API route, nhận metadata, rồi gửi metadata qua Server Action
  ```
- [ ] Implement upload progress indicator.
- [ ] Hiển thị preview ảnh (thumbnail) sau khi upload.
- [ ] Xử lý lỗi upload (file quá lớn, type không hỗ trợ).

### 9. Cập nhật File Display Components
- [ ] Cập nhật `src/components/du-an/task-log-table.tsx` (line 213):
  - Đổi `href={file.url}` thành sử dụng URL API mới `/api/uploads/...`.
- [ ] Cập nhật `src/app/(dashboard)/du-an/tracking-tab.tsx` (line 94):
  - Tương tự đổi URL.
- [ ] Thêm image preview cho file ảnh (thumbnail inline).

### 10. Cập nhật Docker Configuration

#### 10.1 `docker-compose.yml`
- [ ] Thêm volume mount cho uploads:
  ```yaml
  volumes:
    - ./data:/app/data
    - ./logs:/app/logs
    - ./uploads:/app/uploads    # ← THÊM MỚI
  ```

#### 10.2 `Dockerfile`
- [ ] Tạo thư mục `/app/uploads` trong runtime stage:
  ```dockerfile
  RUN mkdir -p /app/data /app/logs /app/uploads && chown -R nextjs:nodejs /app/data /app/logs /app/uploads
  ```

### 11. Cập nhật `.gitignore` và `.dockerignore`
- [ ] Thêm vào `.gitignore`:
  ```
  # User uploads (persisted via Docker volume)
  /uploads
  /public/uploads
  ```
- [ ] Thêm vào `.dockerignore`:
  ```
  uploads/
  public/uploads/
  ```

### 12. Cập nhật Environment Variables
- [ ] Thêm vào `.env.example`:
  ```env
  # File Upload
  UPLOAD_DIR=./uploads              # Thư mục lưu file upload
  UPLOAD_MAX_SIZE=20971520           # 20MB max file size (bytes)
  IMAGE_MAX_KB=500                   # Max KB cho ảnh sau resize
  ```

### 13. Migration cho file cũ (Optional)
- [ ] Tạo script `scripts/migrate-uploads.ts`:
  - Di chuyển file từ `public/uploads/` sang `uploads/YYYY/MM/`.
  - Cập nhật `url` và `storagePath` trong DB cho các record `FileDinhKem` hiện tại.
  - Chạy 1 lần rồi bỏ.

---

## Cấu trúc file mới

```
src/lib/upload/
├── config.ts              # [NEW] Upload configuration constants
├── image-resize.ts        # [NEW] Sharp-based image resize/compress
└── storage.ts             # [NEW] File system read/write utilities

src/app/api/uploads/
├── route.ts               # [NEW] POST - upload file
└── [...path]/
    └── route.ts           # [NEW] GET - serve/download file
```

---

## Flow mới (End-to-End)

```
┌─────────┐     POST /api/uploads      ┌──────────────┐
│  Client  │ ───── multipart/form ─────→│  Upload API  │
│ (Modal)  │                             │  (route.ts)  │
└────┬─────┘                             └──────┬───────┘
     │                                          │
     │                                    ┌─────▼──────┐
     │                                    │ Is Image?  │
     │                                    └─────┬──────┘
     │                                    yes   │   no
     │                                 ┌────────▼────────┐
     │                                 │  Sharp Resize   │
     │                                 │  (200-500KB)    │
     │                                 └────────┬────────┘
     │                                          │
     │                                    ┌─────▼──────────┐
     │                                    │ Write to disk  │
     │                                    │ uploads/YY/MM/ │
     │                                    └────────────────┘
     │                                          │
     │     ← JSON { fileName, url, size } ──────┘
     │filePath, size } ──────┘
     │
     │   createTaskLog({ files: [{ filB insert FileDinhKem
     │
     │     GET /api/uploads/2026/04/abc.webp
     │ ───────────────────────────────────→ Stream file from disk
```

---

## Tiêu chí hoàn thành

- [ ] File upload được lưu vào `uploads/` (project root), **không** phải `public/uploads/`.
- [ ] Docker volume `./uploads:/app/uploads` hoạt động — file persist qua deploy/rebuild.
- [ ] Ảnh tự động resize xuống ≤ 500KB, giữ chất lượng tốt nhất có thể, tối thiểu 200KB.
- [ ] API `POST /api/uploads` accept multipart upload, validate auth + MIME + size.
- [ ] API `GET /api/uploads/[...path]` serve file từ disk với đúng Content-Type.
- [ ] DB model `FileDinhKem` lưu đầy đủ metadata bao gồm `storagePath`.
- [ ] Client component (`quick-update-modal.tsx`) sử dụng API route thay vì base64 Server Action.
- [ ] File display components (`task-log-table.tsx`, `tracking-tab.tsx`) sử dụng URL API mới.
- [ ] `.gitignore` và `.dockerignore` đã cập nhật ignore thư mục `uploads/`.
- [ ] Sharp hoạt động trên Docker (Alpine Linux) — đã test build.
- [ ] Không ảnh hưởng tới các file đã upload cũ (backward compatible hoặc có migration script).
