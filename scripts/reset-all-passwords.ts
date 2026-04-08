/**
 * reset-all-passwords.ts
 * Resets every user's password to a given value by hashing it the same
 * way Better-Auth does (scrypt via the `@better-auth/node` path) and
 * then writing the new hash directly to the remote Turso database.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/reset-all-passwords.ts
 */

import { createClient } from "@libsql/client";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const NEW_PASSWORD = "12345";

// Better-Auth default scrypt parameters
const SALT_BYTES = 16;
const KEY_LEN = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES).toString("hex");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const derivedKey = (await (scryptAsync as any)(password, salt, KEY_LEN, {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
    })) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
        throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env");
    }

    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Fetch all credential accounts (users who have email/password)
    const { rows } = await client.execute(
        `SELECT id, userId FROM "account" WHERE "providerId" = 'credential'`
    );

    if (rows.length === 0) {
        console.log("No credential accounts found.");
        return;
    }

    console.log(`Found ${rows.length} account(s). Resetting passwords to "${NEW_PASSWORD}"...`);

    const newHash = await hashPassword(NEW_PASSWORD);

    for (const row of rows) {
        const accountId = row[0] as string;
        const userId = row[1] as string;
        await client.execute({
            sql: `UPDATE "account" SET "password" = ? WHERE "id" = ?`,
            args: [newHash, accountId],
        });
        console.log(`  ✓ Reset password for account ${accountId} (userId: ${userId})`);
    }

    console.log(`\n✅ Done! All ${rows.length} user(s) can now log in with "${NEW_PASSWORD}".`);
    client.close();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
