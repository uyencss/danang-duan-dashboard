/**
 * reset-admin-password.ts
 * Creates or resets admin@mobifone.vn using Better-Auth's own password hasher,
 * writing directly to the Turso remote database.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/reset-admin-password.ts
 */
import { betterAuth } from "better-auth";
import { createClient } from "@libsql/client";
import { randomBytes } from "node:crypto";

const EMAIL = "admin@mobifone.vn";
const NAME = "Admin Lãnh đạo";
const PASSWORD = "admin123";
const ROLE = "ADMIN";
const DIA_BAN = "Tất cả";

function generateId(len = 32) {
    return randomBytes(len).toString("base64url").slice(0, len);
}

async function main() {
    const tursoClient = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Use Better-Auth's own hasher to get the exact same format as the app uses
    const authInstance = betterAuth({
        baseURL: "http://localhost:3000",
        database: { type: "sqlite", db: ":memory:" } as any,
        emailAndPassword: { enabled: true },
    });
    const ctx = await authInstance.$context;
    const hash = await ctx.password.hash(PASSWORD);
    console.log("Hash (partial):", hash.slice(0, 30) + "...");

    const now = new Date().toISOString();

    // Check if user already exists
    const { rows } = await tursoClient.execute({
        sql: `SELECT id FROM "user" WHERE email = ?`,
        args: [EMAIL],
    });

    if (rows.length > 0) {
        const userId = rows[0][0] as string;
        console.log(`User exists (id: ${userId}), updating password & role...`);
        await tursoClient.execute({
            sql: `UPDATE "account" SET password = ? WHERE userId = ? AND providerId = 'credential'`,
            args: [hash, userId],
        });
        await tursoClient.execute({
            sql: `UPDATE "user" SET role = ?, diaBan = ?, emailVerified = 1 WHERE id = ?`,
            args: [ROLE, DIA_BAN, userId],
        });
    } else {
        console.log("User not found, creating...");
        const userId = generateId(32);
        const accountId = generateId(32);
        await tursoClient.execute({
            sql: `INSERT INTO "user" (id, name, email, emailVerified, role, diaBan, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, 1, ?, ?, 1, ?, ?)`,
            args: [userId, NAME, EMAIL, ROLE, DIA_BAN, now, now],
        });
        await tursoClient.execute({
            sql: `INSERT INTO "account" (id, userId, accountId, providerId, password, createdAt, updatedAt)
            VALUES (?, ?, ?, 'credential', ?, ?, ?)`,
            args: [accountId, userId, userId, hash, now, now],
        });
    }

    console.log(`\n✅ ${EMAIL} is ready. Login with: ${PASSWORD}`);
    tursoClient.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
