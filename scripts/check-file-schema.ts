import { createClient } from "@libsql/client";
import "dotenv/config";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const client = createClient({ url, authToken });
  
  try {
    const rs = await client.execute("PRAGMA table_info(FileDinhKem)");
    console.log(rs.rows);
  } finally {
    client.close();
  }
}
main();
