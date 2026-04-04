# Task Index — MobiFone Project Tracker
**Updated:** 2026-04-04  
**PRD:** [prd.md](../prd.md) | **Tech:** [tech-stack.md](../tech-stack.md) | **DB:** [database-design.md](../database-design.md)

---

## Tổng quan

18 tasks chia theo 5 phases, mỗi task map trực tiếp đến functional requirements (FR) trong PRD.

---

## Phase 1 — Initialization & DB Schema

| # | Task | FR Ref | Priority | Status |
|---|------|--------|----------|--------|
| 01 | [Project Initialization](./task-01-project-initialization.md) | — | P0 | ✅ Done |
| 02 | [Database Schema & Seed](./task-02-database-schema.md) | All FR | P0 | ✅ Done |
| 03 | [Authentication & Authorization](./task-03-auth-system.md) | NFR-04 | P0 | ✅ Done |

## Phase 2 — Layout & Master Data CRUD

| # | Task | FR Ref | Priority | Status |
|---|------|--------|----------|--------|
| 04 | [Layout & Sidebar Navigation](./task-04-layout-sidebar.md) | — | P0 | ✅ Done |
| 05 | [CRUD Khách hàng](./task-05-master-data-khachhang.md) | FR-01, FR-04 | P0 | ✅ Done |
| 06 | [CRUD Sản phẩm](./task-06-master-data-sanpham.md) | FR-02, FR-04 | P0 | ✅ Done |
| 07 | [Quản lý Nhân viên](./task-07-master-data-nhanvien.md) | FR-03, FR-04 | P0 | ✅ Done |

## Phase 3 — Project Master & Task Logs

| # | Task | FR Ref | Priority | Status |
|---|------|--------|----------|--------|
| 08 | [Tạo Dự án mới](./task-08-project-creation.md) | FR-05, FR-06 | P0 | ✅ Done |
| 09 | [Danh sách Dự án](./task-09-project-list.md) | FR-07, FR-09, FR-16–18 | P0 | ✅ Done |
| 10 | [1-Click Update Modal](./task-10-quick-update-modal.md) | FR-09, FR-10, FR-11 | P0 | ✅ Done |
| 11 | [Chi tiết Dự án](./task-11-project-detail.md) | FR-08, FR-12, FR-15 | P0 | ✅ Done |
| 12 | [Bình luận Dự án](./task-12-project-comments.md) | FR-13, FR-14, FR-15 | P1 | ✅ Done |

## Phase 4 — Analytics & Dashboards

| # | Task | FR Ref | Priority | Status |
|---|------|--------|----------|--------|
| 13 | [Dashboard Tổng quan](./task-13-dashboard-tongquan.md) | View 1 | P0 | ✅ Done |
| 14 | [Dashboard Nhân sự](./task-14-dashboard-nhansu.md) | View 3 | P0 | ✅ Done |
| 15 | [Dashboard KPI Thời gian](./task-15-dashboard-kpi.md) | View 4 | P0 | ✅ Done |
| 16 | [Dashboard Địa bàn](./task-16-dashboard-diaban.md) | View 5 | P0 | ⏳ Todo |

## Phase 5 — Optimization & Real-time

| # | Task | FR Ref | Priority | Status |
|---|------|--------|----------|--------|
| 17 | [Thông báo Thời gian thực](./task-17-realtime-notifications.md) | NFR-03 | P1 | ✅ Done |
| 18 | [Chat Dự án Thời gian thực](./task-18-project-chat.md) | FR-19 ~ FR-22 | P1 | ⏳ Todo |

---

## Dependency Graph

```
Phase 1: [01] → [02] → [03]
Phase 2: [04] → [05, 06, 07] (parallel)
Phase 3: [08] → [09] → [10, 11] (parallel) → [12]
Phase 4: [13, 14, 15, 16] (parallel, depend on Phase 3 data)
Phase 5: [17] → [18] (chat depends on real-time infra from 17)
```

> **Note:** View 2 (CRM & DS Dự án) đã được tích hợp vào Task 09 (Danh sách Dự án) vì về bản chất là cùng một trang DataGrid.

---

## Cách sử dụng

1. Implement theo thứ tự Phase (1 → 2 → 3 → 4)
2. Trong mỗi Phase, follow dependency graph
3. Tick checkbox `[x]` khi hoàn thành từng subtask
4. Cập nhật Status trong bảng trên: `⏳ Todo` → `🔄 In Progress` → `✅ Done`
