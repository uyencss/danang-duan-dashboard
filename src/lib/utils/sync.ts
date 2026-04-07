import { libsqlSyncClient } from "@/lib/prisma";

/**
 * Force an immediate sync of the embedded replica with the remote primary.
 * Call this after write operations to ensure the local replica is up-to-date.
 */
export async function syncReplica(): Promise<void> {
  try {
    if (libsqlSyncClient) {
      await libsqlSyncClient.sync();
    }
  } catch (error) {
    console.error("[Turso Sync] Failed to sync embedded replica:", error);
  }
}

/**
 * Wrapper for write operations that auto-syncs after mutation.
 * Ensures the local replica reflects the latest state.
 */
export async function withSync<T>(operation: () => Promise<T>): Promise<T> {
  const result = await operation();
  await syncReplica();
  return result;
}
