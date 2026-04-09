/*
  Warnings:

  - You are about to drop the column `name` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `path` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `menuId` on the `MenuPermission` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `MenuPermission` table. All the data in the column will be lost.
  - You are about to drop the column `isStatic` on the `RoleConfig` table. All the data in the column will be lost.
  - Added the required column `href` to the `MenuItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `MenuItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `label` to the `MenuItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `menuKey` to the `MenuPermission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `MenuPermission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `label` to the `RoleConfig` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MenuItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "icon" TEXT,
    "section" TEXT NOT NULL DEFAULT 'main',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MenuItem" ("createdAt", "icon", "id", "isActive", "updatedAt") SELECT "createdAt", "icon", "id", "isActive", "updatedAt" FROM "MenuItem";
DROP TABLE "MenuItem";
ALTER TABLE "new_MenuItem" RENAME TO "MenuItem";
CREATE UNIQUE INDEX "MenuItem_key_key" ON "MenuItem"("key");
CREATE INDEX "MenuItem_section_sortOrder_idx" ON "MenuItem"("section", "sortOrder");
CREATE TABLE "new_MenuPermission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "menuKey" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MenuPermission_menuKey_fkey" FOREIGN KEY ("menuKey") REFERENCES "MenuItem" ("key") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MenuPermission" ("canCreate", "canDelete", "canEdit", "canView", "createdAt", "id", "updatedAt") SELECT "canCreate", "canDelete", "canEdit", "canView", "createdAt", "id", "updatedAt" FROM "MenuPermission";
DROP TABLE "MenuPermission";
ALTER TABLE "new_MenuPermission" RENAME TO "MenuPermission";
CREATE INDEX "MenuPermission_role_idx" ON "MenuPermission"("role");
CREATE UNIQUE INDEX "MenuPermission_menuKey_role_key" ON "MenuPermission"("menuKey", "role");
CREATE TABLE "new_RoleConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT 'purple',
    "updatedBy" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_RoleConfig" ("createdAt", "description", "id", "role", "updatedAt") SELECT "createdAt", "description", "id", "role", "updatedAt" FROM "RoleConfig";
DROP TABLE "RoleConfig";
ALTER TABLE "new_RoleConfig" RENAME TO "RoleConfig";
CREATE UNIQUE INDEX "RoleConfig_role_key" ON "RoleConfig"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
