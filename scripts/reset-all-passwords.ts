/**
 * reset-all-passwords.ts
 * Resets every user's password to a given value using Better-Auth's own
 * password hasher, writing directly to the Turso remote database.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/reset-all-passwords.ts
 *   npm run reset-passwords
 */
import { betterAuth } from "better-auth";
import { createClient } from "@libsql/client";

const NEW_PASSWORD = "12345";

async function main() {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
        throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env");
    }

    // Use Better-Auth's own hasher so the format is exactly what the app expects
    const authInstance = betterAuth({
        baseURL: "http://localhost:3000",
        database: { type: "sqlite", db: ":memory:" } as any,
        emailAndPassword: { enabled: true },
    });
    const ctx = await authInstance.$context;
    const newHash = await ctx.password.hash(NEW_PASSWORD);
    console.log("Hash generated (partial):", newHash.slice(0, 30) + "...");

    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const { rows } = await client.execute(
        `SELECT id, userId FROM "account" WHERE "providerId" = 'credential'`
    );

    if (rows.length === 0) {
        console.log("No credential accounts found.");
        client.close();
        return;
    }

    console.log(`Found ${rows.length} account(s). Resetting passwords to "${NEW_PASSWORD}"...`);

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
