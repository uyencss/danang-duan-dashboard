/**
 * Creates the admin@mobifone.vn user with password admin123 directly in Turso.
 * Safe to run even if the user was previously deleted.
 */
import { createClient } from "@libsql/client";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const EMAIL = "admin@mobifone.vn";
const NAME = "Admin Lãnh đạo";
const PASSWORD = "admin123";
const ROLE = "ADMIN";
const DIA_BAN = "Tất cả";

function generateId(len = 32) {
    return randomBytes(len).toString("base64url").slice(0, len);
}

async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const dk = (await (scryptAsync as any)(password, salt, 64, { N: 16384, r: 8, p: 1 })) as Buffer;
    return `${salt}:${dk.toString("hex")}`;
}

async function main() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Check if user already exists
    const { rows } = await client.execute({ sql: `SELECT id FROM "user" WHERE email = ?`, args: [EMAIL] });

    if (rows.length > 0) {
        console.log(`User already exists (id: ${rows[0][0]}), updating password instead...`);
        const userId = rows[0][0] as string;
        const hash = await hashPassword(PASSWORD);
        await client.execute({ sql: `UPDATE "account" SET password = ? WHERE userId = ? AND providerId = 'credential'`, args: [hash, userId] });
        // also ensure role is ADMIN
        await client.execute({ sql: `UPDATE "user" SET role = ?, diaBan = ?, emailVerified = 1 WHERE id = ?`, args: [ROLE, DIA_BAN, userId] });
        console.log(`✅ Password updated for ${EMAIL} → "${PASSWORD}"`);
        client.close();
        return;
    }

    const now = new Date().toISOString();
    const userId = generateId(32);
    const accountId = generateId(32);
    const hash = await hashPassword(PASSWORD);

    // Insert user
    await client.execute({
        sql: `INSERT INTO "user" (id, name, email, emailVerified, role, diaBan, isActive, createdAt, updatedAt)
          VALUES (?, ?, ?, 1, ?, ?, 1, ?, ?)`,
        args: [userId, NAME, EMAIL, ROLE, DIA_BAN, now, now],
    });

    // Insert credential account
    await client.execute({
        sql: `INSERT INTO "account" (id, userId, accountId, providerId, password, createdAt, updatedAt)
          VALUES (?, ?, ?, 'credential', ?, ?, ?)`,
        args: [accountId, userId, userId, hash, now, now],
    });

    console.log(`✅ Created admin user ${EMAIL} with password "${PASSWORD}" (userId: ${userId})`);
    client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
