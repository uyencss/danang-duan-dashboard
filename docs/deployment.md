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

- Database files are stored in the Docker named volume `sqld-data`, mapped to `/var/lib/sqld` inside the container.
- Volumes persist across container restarts and `docker-compose down` (unless `--volumes` flag is used).

### 3.5 Backup Strategy

```bash
# Copy the sqld data volume to a backup location
docker cp danang-dashboard-db:/var/lib/sqld ./backups/sqld-$(date +%Y%m%d)

# Or use sqld's built-in dump endpoint
curl -H "Authorization: Bearer ${TOKEN}" http://localhost:8080/v1/dump > backup.sql
```

### 3.6 JWT Authentication & Key Management

sqld is protected by Ed25519 JWT authentication. Keys are stored **in the project folder** (`sqld-keys/`) and synced to production via GitHub Actions Secrets.

```yaml
# docker-compose.yml — sqld service
sqld:
  environment:
    - SQLD_AUTH_JWT_KEY_FILE=/etc/sqld/sqld_jwt_public.pem
  volumes:
    - ./sqld-keys/sqld_jwt_public.pem:/etc/sqld/sqld_jwt_public.pem:ro
```

**Key lifecycle:**

```
Developer generates keys locally:
  sqld-keys/sqld_jwt_private.pem  → signs JWT tokens
  sqld-keys/sqld_jwt_public.pem   → verifies JWT tokens
                │
                │ Copy contents to GitHub Secrets:
                │   SQLD_JWT_PUBLIC_KEY = <public key file contents>
                │   TURSO_AUTH_TOKEN   = <generated prod JWT token>
                │
                ▼
deploy.yml (on push to master):
  1. SSH into server
  2. echo "$SQLD_JWT_PUBLIC_KEY" > sqld-keys/sqld_jwt_public.pem
  3. Write .env from secrets
  4. docker compose up -d
```

> **Note:** The `*.pem` rule in `.gitignore` prevents PEM files from ever being committed. The `sqld-keys/README.md` (which IS committed) explains the key setup process for new team members.

### 3.7 Database Sync (Dev ↔ Prod)

Built-in scripts enable controlled data flow between database namespaces:

| Command | Direction | Safety |
|---------|-----------|--------|
| `pnpm db:sync:prod-to-dev` | Prod → Dev | Confirmation prompt before overwriting dev |
| `pnpm db:sync:dev-to-prod` | Dev → Prod | Auto-backup + double confirmation |
| `pnpm db:backup` | Any namespace | Point-in-time SQL dump |

## 4. Cloudflare Tunnel Configuration

The `cloudflared` container establishes a persistent tunnel to Cloudflare's edge network. Two hostnames are routed through this tunnel:

| Hostname | Target | Purpose |
|----------|--------|---------|
| `dashboard.gpsdna.io.vn` | `http://web:3000` | Web application |
| `turso.gpsdna.io.vn` | `http://sqld:8080` | Database access (for local development) |

### 4.1 Configuring Tunnel Routes

Routes are configured via the Cloudflare Zero Trust Dashboard:
1. Go to **Networks → Tunnels → Your Tunnel → Public Hostname**
2. Add a hostname mapping: `turso.gpsdna.io.vn` → `http://sqld:8080`
3. *(Optional)* Add a Cloudflare Access policy for additional security

## 5. Server Logs & Monitoring
We use **Pino** for robust file-system logging.
- **Location:** Inside the server, logs are generally mapped to a volume (e.g., `./logs/app.log`).
- **Log Levels:** 
  - `error`: For exceptions and failed API requests.
  - `info`: For general system events (users logging in, data exported).
- **Troubleshooting:** If the app returns a 500 status code, immediately SSH into the server and run `tail -f logs/error.log` to view the stack trace in real-time.

### 5.1 sqld Health Check

```bash
# Check if sqld is healthy
curl http://localhost:8080/health

# Check sqld logs
docker logs danang-dashboard-db --tail 50

# Inside Docker network
docker exec danang-dashboard-web curl http://sqld:8080/health
```

## 6. Rollback Procedure
If a bad commit takes down production:
1. Revert the commit on GitHub (`git revert <commit-hash>`).
2. Push to `main`.
3. GitHub Actions will rebuild and deploy the reverted, stable codebase.

### 6.1 Database Rollback

If a bad migration corrupts the database:
1. Stop the web container: `docker-compose stop web`
2. Restore from the latest backup: `docker cp ./backups/sqld-<date>/. danang-dashboard-db:/var/lib/sqld/`
3. Restart: `docker-compose up -d`

## 7. CI/CD — GitHub Actions Deploy Flow

The `deploy.yml` workflow handles the full deployment including sqld key provisioning:

```yaml
# Key steps in deploy.yml:
1. Connect to server via Tailscale + SSH
2. git pull / clone latest code
3. mkdir -p sqld-keys
4. echo "$SQLD_JWT_PUBLIC_KEY" > sqld-keys/sqld_jwt_public.pem  # Write key from secret
5. Write .env from GitHub Secrets (DATABASE_URL, TURSO_AUTH_TOKEN, etc.)
6. docker compose up -d --build
```

### GitHub Actions Secrets Required

| Secret | Value | Description |
|--------|-------|-------------|
| `SQLD_JWT_PUBLIC_KEY` | Contents of `sqld_jwt_public.pem` | Written to server as PEM file |
| `DATABASE_URL` | `http://sqld:8080` | Internal Docker network URL |
| `TURSO_DATABASE_URL` | `http://sqld:8080` | Same as DATABASE_URL for prod |
| `TURSO_AUTH_TOKEN` | `eyJ...` | Prod JWT token |
| `BETTER_AUTH_SECRET` | `<random>` | Auth session secret |
| `BETTER_AUTH_URL` | `https://dashboard.gpsdna.io.vn` | Public auth URL |
| `CLOUDFLARE_TUNNEL_TOKEN` | `eyJ...` | Tunnel auth |
| *(+ Ably, SMTP, etc.)* | | |

## 8. Environment Variables Reference

### Production (Server `.env` — auto-written by `deploy.yml`)

| Variable | Example Value | Description |
|----------|--------------|-------------|
| `DATABASE_URL` | `http://sqld:8080` | Prisma-compatible DB URL (internal Docker) |
| `TURSO_DATABASE_URL` | `http://sqld:8080` | libSQL client URL (internal Docker) |
| `TURSO_AUTH_TOKEN` | `eyJ...` | JWT token for sqld authentication |
| `BETTER_AUTH_SECRET` | `<random>` | Auth session encryption secret |
| `BETTER_AUTH_URL` | `https://dashboard.gpsdna.io.vn` | Public-facing auth URL |
| `ABLY_API_KEY` | `xxx.yyy:zzz` | Real-time messaging |
| `CLOUDFLARE_TUNNEL_TOKEN` | `eyJ...` | Tunnel authentication |
| `REDIS_URL` | `redis://redis:6379` | Redis connection (internal Docker) |

### Development (Local `.env`)

| Variable | Example Value | Description |
|----------|--------------|-------------|
| `DATABASE_URL` | `https://turso.gpsdna.io.vn` | DB URL via Cloudflare Tunnel |
| `TURSO_DATABASE_URL` | `https://turso.gpsdna.io.vn` | libSQL URL via Cloudflare Tunnel |
| `TURSO_AUTH_TOKEN` | `eyJ...` | JWT token for dev database |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Local auth URL |
