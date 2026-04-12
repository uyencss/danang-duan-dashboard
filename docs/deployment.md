# Deployment & Operations Guide
**Version:** 1.2.0 | **Updated:** 2026-04-12

This document outlines how the Danang Dashboard is built, shipped, and monitored in the production environment.

## 1. CI/CD Architecture (GitHub Actions)
Code is continuously deployed to our server(s) using GitHub Actions. 
- Pushes to the `main` branch trigger the `deploy.yml` workflow.
- The workflow builds the application, bundles it via Docker, and securely pushes it to the deployment server.

## 2. Docker Infrastructure

The application runs as a multi-container Docker Compose stack. All services communicate over an internal `backend` bridge network.

### 2.1 Service Topology

| Service | Container Name | Image | Purpose |
|---------|---------------|-------|---------|
| `init-perms` | danang-dashboard-perms | alpine:latest | One-shot: set file/directory permissions |
| `sqld` | danang-dashboard-db | ghcr.io/tursodatabase/libsql-server:latest | Self-hosted libSQL database server |
| `redis` | danang-dashboard-redis | redis:7-alpine | Cache & session store |
| `web` | danang-dashboard-web | Custom Dockerfile | Next.js application |
| `cloudflared` | danang-dashboard-tunnel | cloudflare/cloudflared:latest | Cloudflare Tunnel client |

### 2.2 Startup Order

```
init-perms (completed) → sqld (healthy) → redis (healthy) → web → cloudflared
```

### 2.3 Network Architecture

```
Internet (HTTPS)
    │
    ▼
Cloudflare Edge Network
    │
    ▼
cloudflared (tunnel client)
    ├── dashboard.gpsdna.io.vn → web:3000
    └── turso.gpsdna.io.vn    → sqld:8080
    
Internal Docker Network ("backend"):
    web:3000 ←→ redis:6379
    web:3000 ←→ sqld:8080
```

## 3. Database: Self-Hosted sqld (libSQL Server)

### 3.1 Overview

We use a **self-hosted `sqld`** (the open-source libSQL server by Turso) as our database engine. It runs as a Docker container within the same `docker-compose.yml` stack, replacing the previous Turso Cloud managed service.

### 3.2 Connection Architecture

| Environment | URL | Path | Latency |
|-------------|-----|------|---------|
| **Production** (`web` container) | `http://sqld:8080` | Internal Docker network | < 1ms |
| **Development** (local laptop) | `https://turso.gpsdna.io.vn` | Cloudflare Tunnel → sqld:8080 | ~50-100ms |

### 3.3 Database Namespaces

sqld supports multiple database namespaces within a single instance:

| Namespace | Purpose | Accessed By |
|-----------|---------|-------------|
| `default` | **Production** data | Docker `web` container |
| `dev` | **Development** data | Developer laptop via Cloudflare Tunnel |

> ⚠️ **Critical:** Never run destructive Prisma commands (`prisma migrate reset`, `prisma db push --force-reset`) against the production namespace. Always verify your `DATABASE_URL` before running migrations.

### 3.4 Data Persistence

- Database files are stored in the Docker named volume `postgres-data`, mapped to `/var/lib/postgresql/data` inside the container.
- Volumes persist across container restarts and `docker-compose down`.

### 3.5 Backup Strategy

```bash
# Export a full SQL dump using pg_dump
docker exec danang-dashboard-db pg_dump -U postgres mobi_prod > backup-$(date +%Y%m%d).sql
```

### 3.6 PostgreSQL Authentication

Postgres uses standard role-based authentication. The password is automatically generated in GitHub Actions and injected into the `.env` file on the server. There are no PEM files or JWT keys to manage.

### 3.7 Database Sync (Dev ↔ Prod)

Built-in scripts enable controlled data flow between database namespaces:

| Command | Direction | Safety |
|---------|-----------|--------|
| `pnpm db:sync:prod-to-dev` | Prod → Dev | Confirmation prompt before overwriting dev |
| `pnpm db:sync:dev-to-prod` | Dev → Prod | Auto-backup + double confirmation |
| `pnpm db:backup` | Any namespace | Point-in-time SQL dump |

## 4. Cloudflare Tunnel Configuration

The `cloudflared` container establishes a persistent tunnel to Cloudflare's edge network. We route two endpoints:

| Hostname | Target (Internal) | Layer | Purpose |
|----------|--------|-------|---------|
| `dashboard.gpsdna.io.vn` | `http://web:3000` | HTTP | Web application |
| `db.gpsdna.io.vn` | `tcp://db:5432` | TCP | Database access (for local development) |

### 4.1 Configuring the TCP Tunnel Route

Because Postgres uses a raw TCP connection (not HTTP), Cloudflare requires a TCP route that developers must dial into using `cloudflared access tcp`:
1. Trong Cloudflare Zero Trust: Add Public Hostname: `db.gpsdna.io.vn` → `tcp://db:5432`
2. Tạo Access Policy yêu cầu đăng nhập email
3. Lập trình viên chạy lệnh local: `cloudflared access tcp --hostname db.gpsdna.io.vn --url localhost:5433`

## 5. Server Logs & Monitoring
We use **Pino** for robust file-system logging.
- **Location:** Inside the server, logs are generally mapped to a volume (e.g., `./logs/app.log`).
- **Log Levels:** 
  - `error`: For exceptions and failed API requests.
  - `info`: For general system events (users logging in, data exported).
- **Troubleshooting:** If the app returns a 500 status code, immediately SSH into the server and run `tail -f logs/error.log` to view the stack trace in real-time.

### 5.1 Postgres Health Check

```bash
# Check if Postgres is accepting connections
docker exec danang-dashboard-db pg_isready -U postgres -d mobi_prod
```

## 6. Rollback Procedure
If a bad commit takes down production:
1. Revert the commit on GitHub (`git revert <commit-hash>`).
2. Push to `main`.
3. GitHub Actions will rebuild and deploy the reverted, stable codebase.

### 6.1 Database Rollback

If a bad migration corrupts the database:
1. Stop the web container: `docker-compose stop web`
2. Restore from the latest `.sql` dump: `cat backup.sql | docker exec -i danang-dashboard-db psql -U postgres -d mobi_prod`
3. Restart: `docker-compose up -d`

## 7. CI/CD — GitHub Actions Deploy Flow

The `deploy.yml` workflow handles the full deployment including Postgres password injection:

```yaml
# Key steps in deploy.yml:
1. Connect to server via Tailscale + SSH
2. git pull / clone latest code
3. Write .env from GitHub Secrets (POSTGRES_PASSWORD, DATABASE_URL, etc.)
4. docker compose up -d --build
```

### GitHub Actions Secrets Required

| Secret | Value | Description |
|--------|-------|-------------|
| `POSTGRES_PASSWORD` | `<secure-random-password>` | Assigned to postgres user |
| `DATABASE_URL` | `postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/mobi_prod` | Internal Docker network URL |
| `BETTER_AUTH_SECRET` | `<random>` | Auth session secret |
| `BETTER_AUTH_URL` | `https://dashboard.gpsdna.io.vn` | Public auth URL |
| `CLOUDFLARE_TUNNEL_TOKEN` | `eyJ...` | Tunnel auth |
| *(+ Ably, SMTP, etc.)* | | |

## 8. Environment Variables Reference

### Production (Server `.env` — auto-written by `deploy.yml`)

| Variable | Example Value | Description |
|----------|--------------|-------------|
| `POSTGRES_PASSWORD` | `<secure>` | Postgres admin password |
| `DATABASE_URL` | `postgresql://postgres:pass@db:5432/mobi_prod` | Prisma-compatible DB URL (internal Docker) |
| `BETTER_AUTH_SECRET` | `<random>` | Auth session encryption secret |
| `BETTER_AUTH_URL` | `https://dashboard.gpsdna.io.vn` | Public-facing auth URL |
| `ABLY_API_KEY` | `xxx.yyy:zzz` | Real-time messaging |
| `CLOUDFLARE_TUNNEL_TOKEN` | `eyJ...` | Tunnel authentication |
| `REDIS_URL` | `redis://redis:6379` | Redis connection (internal Docker) |

### Development (Local `.env`)

| Variable | Example Value | Description |
|----------|--------------|-------------|
| `DATABASE_URL` | `postgresql://postgres:pass@localhost:5433/mobi_dev` | Local TCP proxy connection via Cloudflare Access |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Local auth URL |
