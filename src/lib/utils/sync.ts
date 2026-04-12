/**
 * Postgres does not require manual syncs.
 * This is a no-op shim to satisfy existing imports.
 */
export async function syncReplica(): Promise<void> {
  // No-op for Postgres
}

/**
 * Wrapper for write operations.
 */
export async function withSync<T>(operation: () => Promise<T>): Promise<T> {
  const result = await operation();
  // No-op for Postgres
  return result;
}
