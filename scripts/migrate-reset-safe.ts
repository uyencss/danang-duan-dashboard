import { spawnSync } from "node:child_process";
import { copyFile } from "node:fs/promises";
import { loadScriptEnv, runMandatoryDbBackup } from "../prisma/db-safety";

loadScriptEnv();

async function main() {
  const backup = await runMandatoryDbBackup({
    operation: "migrate-reset",
    getPreflightData: async () => ({
      command: "prisma migrate reset --force",
      nodeEnv: process.env.NODE_ENV ?? "undefined",
    }),
  });

  const reset = spawnSync("npx", ["prisma", "migrate", "reset", "--force"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (reset.status !== 0) {
    if (backup.backupKind === "sqlite" && backup.sqlitePath) {
      await copyFile(backup.backupPath, backup.sqlitePath);
      console.error("Reset failed. Database restored from backup.");
    }
    process.exit(reset.status ?? 1);
  }

  const seed = spawnSync("npm", ["run", "seed"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (seed.status !== 0 && backup.backupKind === "sqlite" && backup.sqlitePath) {
    await copyFile(backup.backupPath, backup.sqlitePath);
    console.error("Seed failed after reset. Database restored from backup.");
  }

  process.exit(seed.status ?? 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
