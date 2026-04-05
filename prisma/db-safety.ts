import { access, copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config as loadEnv } from "dotenv";

export function loadScriptEnv(): void {
  loadEnv({ path: ".env.local" });
  loadEnv();
}

function timestampForFileName(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function maskDatabaseUrl(databaseUrl: string): string {
  return databaseUrl.replace(/:[^:@/]+@/, ":***@");
}

function getDatabaseUrlOrThrow(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("DATABASE_URL is missing. Refusing destructive operation.");
  }
  return value;
}

function resolveSqlitePath(databaseUrl: string): string | null {
  if (!databaseUrl.startsWith("file:")) {
    return null;
  }

  const rawPath = databaseUrl.replace(/^file:/, "");
  if (!rawPath) {
    return null;
  }

  return path.resolve(process.cwd(), rawPath);
}

type BackupOptions = {
  operation: string;
  getPreflightData?: () => Promise<Record<string, unknown>>;
  getLogicalSnapshot?: () => Promise<Record<string, unknown>>;
};

export type BackupResult = {
  preflightReportPath: string;
  backupPath: string;
  backupKind: "sqlite" | "logical";
  sqlitePath?: string;
};

export async function runMandatoryDbBackup(options: BackupOptions): Promise<BackupResult> {
  const databaseUrl = getDatabaseUrlOrThrow();
  const timestamp = timestampForFileName();
  const backupDir = path.resolve(process.cwd(), ".backups", options.operation);

  await mkdir(backupDir, { recursive: true });

  const preflightData = options.getPreflightData ? await options.getPreflightData() : {};
  const preflightReportPath = path.join(backupDir, `${timestamp}-preflight.json`);

  await writeFile(
    preflightReportPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        operation: options.operation,
        databaseUrl: maskDatabaseUrl(databaseUrl),
        ...preflightData,
      },
      null,
      2,
    ),
    "utf-8",
  );

  const sqlitePath = resolveSqlitePath(databaseUrl);

  if (sqlitePath) {
    await access(sqlitePath);
    const backupDbPath = path.join(backupDir, `${timestamp}-sqlite-backup.db`);
    await copyFile(sqlitePath, backupDbPath);
    console.log(`Backup created: ${backupDbPath}`);
    console.log(`Preflight report: ${preflightReportPath}`);
    return {
      preflightReportPath,
      backupPath: backupDbPath,
      backupKind: "sqlite",
      sqlitePath,
    };
  }

  if (options.getLogicalSnapshot) {
    const logicalSnapshot = await options.getLogicalSnapshot();
    const logicalSnapshotPath = path.join(backupDir, `${timestamp}-logical-snapshot.json`);
    await writeFile(logicalSnapshotPath, JSON.stringify(logicalSnapshot, null, 2), "utf-8");
    console.log(`Logical backup created: ${logicalSnapshotPath}`);
    console.log(`Preflight report: ${preflightReportPath}`);
    return {
      preflightReportPath,
      backupPath: logicalSnapshotPath,
      backupKind: "logical",
    };
  }

  throw new Error(
    "Refusing destructive operation: DATABASE_URL is not file-based and no logical snapshot handler was provided.",
  );
}
