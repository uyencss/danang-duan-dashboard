import { createClient } from "@libsql/client";
import "dotenv/config";

async function main() {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error("Missing DB URL");
    return;
  }

  // Parse out authToken if embedded in URL
  let finalUrl = url;
  let finalAuth = authToken;

  if (url.includes("authToken=")) {
    const parsed = new URL(url.replace("libsql://", "https://"));
    finalUrl = "libsql://" + parsed.host + parsed.pathname;
    finalAuth = parsed.searchParams.get("authToken") || undefined;
  } else if (!finalAuth && process.env.DATABASE_URL?.includes("authToken=")) {
    const parsed = new URL(process.env.DATABASE_URL.replace("libsql://", "https://"));
    finalAuth = parsed.searchParams.get("authToken") || undefined;
  }

  const client = createClient({ url: finalUrl, authToken: finalAuth });
  
  console.log("Creating RBAC tables on Turso...");

  const sqls = [
    // Role Config
    `CREATE TABLE IF NOT EXISTS "RoleConfig" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "role" TEXT NOT NULL,
      "label" TEXT NOT NULL,
      "description" TEXT,
      "color" TEXT NOT NULL DEFAULT 'purple',
      "updatedBy" TEXT,
      "updatedAt" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "RoleConfig_role_key" ON "RoleConfig"("role");`,
    `CREATE INDEX IF NOT EXISTS "RoleConfig_role_idx" ON "RoleConfig"("role");`,

    // Menu Item
    `CREATE TABLE IF NOT EXISTS "MenuItem" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "key" TEXT NOT NULL,
      "label" TEXT NOT NULL,
      "href" TEXT NOT NULL,
      "icon" TEXT,
      "section" TEXT NOT NULL DEFAULT 'main',
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "MenuItem_key_key" ON "MenuItem"("key");`,
    `CREATE INDEX IF NOT EXISTS "MenuItem_section_sortOrder_idx" ON "MenuItem"("section", "sortOrder");`,

    // Menu Permission
    `CREATE TABLE IF NOT EXISTS "MenuPermission" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "menuKey" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "canView" BOOLEAN NOT NULL DEFAULT 0,
      "canCreate" BOOLEAN NOT NULL DEFAULT 0,
      "canEdit" BOOLEAN NOT NULL DEFAULT 0,
      "canDelete" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "MenuPermission_menuKey_fkey" FOREIGN KEY ("menuKey") REFERENCES "MenuItem" ("key") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS "MenuPermission_role_idx" ON "MenuPermission"("role");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "MenuPermission_menuKey_role_key" ON "MenuPermission"("menuKey", "role");`,
    
    // KhachHang new columns from first migration (if missing)
    // Wrap them in try-catch blocks since ALTER TABLE IF NOT EXISTS is not standard SQLite
  ];

  for (const sql of sqls) {
    try {
      await client.execute(sql);
      console.log(`Executed: ${sql.split('(')[0].trim()}`);
    } catch (e: any) {
      console.error(`Error executing ${sql}:`, e.message);
    }
  }

  // KhachHang Alter columns
  const khachHangColumns = [
    { name: "dauMoiTiepCan", type: "TEXT" },
    { name: "ghiChu", type: "TEXT" },
    { name: "lanhDaoDonVi", type: "TEXT" },
    { name: "ngayKyNiem", type: "DATETIME" },
    { name: "ngaySinhDauMoi", type: "DATETIME" },
    { name: "ngaySinhLanhDao", type: "DATETIME" },
    { name: "ngayThanhLap", type: "DATETIME" },
    { name: "soDienThoaiDauMoi", type: "TEXT" },
    { name: "soDienThoaiLanhDao", type: "TEXT" },
  ];

  for (const col of khachHangColumns) {
    try {
      await client.execute(`ALTER TABLE "KhachHang" ADD COLUMN "${col.name}" ${col.type};`);
      console.log(`Added column ${col.name} to KhachHang`);
    } catch (e: any) {
        if (!e.message.includes("duplicate column name")) {
             console.error(`Failed to add ${col.name}:`, e.message);
        } else {
             console.log(`Column ${col.name} already exists.`);
        }
    }
  }

  // Other Tables
  const otherTables = [
    `CREATE TABLE IF NOT EXISTS "ChiTieuKpi" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "nam" INTEGER NOT NULL,
      "thang" INTEGER NOT NULL,
      "anNinhMang" REAL NOT NULL DEFAULT 0,
      "giaiPhapCntt" REAL NOT NULL DEFAULT 0,
      "duAnCds" REAL NOT NULL DEFAULT 0,
      "cnsAnNinh" REAL NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "Notification" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "userId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "isRead" BOOLEAN NOT NULL DEFAULT 0,
      "type" TEXT NOT NULL,
      "relatedId" TEXT,
      "projectId" INTEGER,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Notification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DuAn" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "FileDinhKem" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "logId" INTEGER NOT NULL,
      "name" TEXT NOT NULL,
      "filePath" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "size" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "FileDinhKem_logId_fkey" FOREIGN KEY ("logId") REFERENCES "NhatKyCongViec" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`
  ];

  for (const sql of otherTables) {
    try {
      await client.execute(sql);
      console.log(`Executed: ${sql.split('(')[0].trim()}`);
    } catch (e: any) {
      console.error(`Error executing ${sql}:`, e.message);
    }
  }

  console.log("Successfully prepared remote Turso schema!");
  process.exit(0);
}

main();
