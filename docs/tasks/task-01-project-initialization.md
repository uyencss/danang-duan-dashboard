# Task 01 — Project Initialization
**Phase:** 1 (Initialization & DB Schema)  
**Priority:** P0  
**Status:** ✅ Done  
**PRD Ref:** Section 10 — Phase 1  
**Tech Ref:** [tech-stack.md](../tech-stack.md) — Section 2.1, 2.2, 2.3

---

## Mục tiêu

Khởi tạo dự án Next.js 16 với toàn bộ dependencies theo tech stack đã định nghĩa. Đảm bảo project chạy được với `pnpm dev`.

---

## Danh sách công việc

### 1. Khởi tạo Next.js

- [ ] Chạy `npx create-next-app@latest ./ --typescript --tailwind --app --src-dir --turbopack`
- [ ] Verify cấu trúc thư mục App Router: `src/app/`
- [ ] Đảm bảo `pnpm dev` chạy thành công trên `localhost:3000`

### 2. Cài đặt Dependencies

- [ ] Cài shadcn/ui: `npx shadcn@latest init`
- [ ] Cài Prisma: `pnpm add prisma @prisma/client` + `npx prisma init --datasource-provider sqlite`
- [ ] Cài Recharts: `pnpm add recharts`
- [ ] Cài Better Auth: `pnpm add better-auth`
- [ ] Cài Form Stack: `pnpm add react-hook-form @hookform/resolvers zod@^3.23.8`
- [ ] Cài Utilities: `pnpm add date-fns lucide-react sonner`

### 3. Cấu hình Tailwind CSS v4

- [ ] Cấu hình `globals.css` với `@theme` directive theo MobiFone theme:
  - Primary: `#0D1F3C`, `#1A3A6B`, `#0058BC`, `#0070EB`, `#007AFF`
  - Surface: `#F8FAFC`, `#F2F4F6`, `#FFFFFF`
  - Semantic: success, warning, danger, info
  - Font: `Inter`
  - Radius tokens: sm, md, lg, xl
- [ ] Verify Tailwind hoạt động đúng (render 1 element có color)

### 4. Cấu hình Dev Tooling

- [ ] ESLint flat config (v9)
- [ ] Prettier (v4)
- [ ] Verify TypeScript strict mode

### 5. Cấu trúc thư mục

- [ ] Tạo cấu trúc routing theo tech-stack.md Section 2.1:
  ```
  src/app/
  ├── (auth)/login/page.tsx
  ├── (auth)/register/page.tsx
  ├── (dashboard)/layout.tsx
  ├── (dashboard)/page.tsx
  ├── api/
  ├── layout.tsx
  └── globals.css
  ```
- [ ] Tạo thư mục cho shared code:
  ```
  src/
  ├── lib/          # Prisma client, auth config, utilities
  ├── components/   # Shared UI components
  └── types/        # TypeScript types
  ```

---

## Tiêu chí hoàn thành

- [ ] `pnpm dev` khởi chạy thành công
- [ ] Tailwind MobiFone theme render đúng colors
- [ ] Prisma client initialized (chưa cần schema)
- [ ] Cấu trúc thư mục đầy đủ
- [ ] Không có lỗi TypeScript/ESLint
