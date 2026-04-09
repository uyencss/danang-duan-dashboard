import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const urls = [
  process.env.TURSO_DATABASE_URL,
  process.env.DATABASE_URL,
  process.env.LOCAL_REPLICA_PATH,
].filter(Boolean) as string[];

async function main() {
  for (const url of [...new Set(urls)]) {
    console.log(`Creating FileDinhKem table on ${url}...`);
    const client = createClient({
      url,
      authToken: url.startsWith("libsql") ? process.env.TURSO_AUTH_TOKEN : undefined,
    });
    
    try {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS FileDinhKem (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          logId INTEGER NOT NULL,
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          type TEXT NOT NULL,
          size INTEGER NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (logId) REFERENCES NhatKyCongViec (id) ON DELETE CASCADE
        )
      `);
      
      await client.execute(`
        CREATE INDEX IF NOT EXISTS FileDinhKem_logId_idx ON FileDinhKem (logId)
      `);

      console.log(`Success: Table FileDinhKem created on ${url}`);
    } catch (error) {
      console.error(`Error on ${url}:`, error);
    } finally {
      client.close();
    }
  }
}

main();
