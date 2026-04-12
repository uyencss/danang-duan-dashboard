/**
 * Synchronize data from mobi_prod to mobi_dev
 */
import { execSync } from 'child_process';
import { logger } from '../../src/lib/logger';

async function syncDatabases() {
  logger.info({ msg: 'Starting database copy from mobi_prod to mobi_dev' });
  const isDockerProd = process.env.DATABASE_URL?.includes('db:5432');
  const prodUrl = process.env.DATABASE_URL || 'postgresql://postgres:Pg_Secure_2026DbPwV2@localhost:5432/mobi_prod';
  const devUrl = prodUrl.replace('mobi_prod', 'mobi_dev');

  try {
    // Terminate connections to mobi_dev before dropping
    const termDevCmd = `docker compose exec -T db psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'mobi_dev';"`;
    try { execSync(termDevCmd, { stdio: 'ignore' }); } catch (e) { }

    // Recreate dev database
    const dropCmd = `docker compose exec -T db psql -U postgres -c "DROP DATABASE IF EXISTS mobi_dev;"`;
    const createCmd = `docker compose exec -T db psql -U postgres -c "CREATE DATABASE mobi_dev;"`;

    execSync(dropCmd, { stdio: 'inherit' });
    execSync(createCmd, { stdio: 'inherit' });

    // Sync data
    const syncCmd = `docker compose exec -T db sh -c "pg_dump -U postgres mobi_prod | psql -U postgres -d mobi_dev"`;
    execSync(syncCmd, { stdio: 'inherit' });

    logger.info({ msg: 'Database sync complete' });
  } catch (err) {
    logger.error({ msg: 'Database sync failed. Executing via docker compose might be unavailable.', error: err });
    process.exit(1);
  }
}
syncDatabases();
