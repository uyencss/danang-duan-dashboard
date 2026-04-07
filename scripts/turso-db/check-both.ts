import { createClient } from "@libsql/client";
import "dotenv/config";

async function main() {
  console.log("Verifying LOCAL Database...");
  try {
    const localClient = createClient({ url: process.env.LOCAL_DATABASE_URL || "file:./dev.db" });
    const localRes = await localClient.execute("SELECT count(*) as count FROM DuAn");
    console.log(`✅ Local 'DuAn' count: ${localRes.rows[0].count}`);
  } catch (err) {
    console.error("❌ Error checking local:", err.message);
  }

  console.log("\nVerifying REMOTE Turso Database...");
  try {
    const remoteClient = createClient({ url: process.env.DATABASE_URL! });
    const remoteRes = await remoteClient.execute("SELECT count(*) as count FROM DuAn");
    console.log(`✅ Remote 'DuAn' count: ${remoteRes.rows[0].count}`);
  } catch (err) {
    console.error("❌ Error checking remote:", err.message);
  }
}

main();
