import { createClient } from "@libsql/client";
import "dotenv/config";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const client = createClient({ url, authToken });
  
  try {
    console.log("Dropping column 'url' from FileDinhKem on Remote Database...");
    await client.execute("ALTER TABLE FileDinhKem DROP COLUMN url");
    console.log("Column dropped successfully.");
  } catch (error: any) {
    console.error("Failed to drop column:", error.message);
  } finally {
    client.close();
  }
}
main();
