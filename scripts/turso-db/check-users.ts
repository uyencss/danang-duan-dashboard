import { createClient } from "@libsql/client";

async function main() {
    const tursoClient = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    const { rows } = await tursoClient.execute(`SELECT id, email, role FROM "user"`);
    console.log(rows);
    tursoClient.close();
}

main().catch(console.error);
