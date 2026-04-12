# Deployment & Operations Guide

This document outlines how the Danang Dashboard is built, shipped, and monitored in the production environment.

## 1. CI/CD Architecture (GitHub Actions)
Code is continuously deployed to our server(s) using GitHub Actions. 
- Pushes to the `main` branch trigger the `deploy.yml` workflow.
- The workflow builds the application, bundles it via Docker, and securely pushes it to the deployment server.

## 2. Docker Infrastructure
The application runs inside a Docker container for consistency across staging and production.
- **Dockerfile:** Optimizes the Next.js standalone build to minimize image size and improve performance.
- The container securely passes runtime environment variables upon startup.

## 3. Database: Turso (libSQL)
- We utilize Turso for our database. 
- Production utilizes a **Direct Stateless HTTP** connection to the Turso Cloud. This ensures maximum stability and reliability when routing server traffic through secure proxies (like Cloudflare or Tailscale), bypassing the WebSocket drops that occur with embedded replica syncs.

## 4. server Logs & Monitoring
We use **Winston** for robust file-system logging.
- **Location:** Inside the server, logs are generally mapped to a volume (e.g., `./logs/app.log`).
- **Log Levels:** 
  - `error`: For exceptions and failed API requests.
  - `info`: For general system events (users logging in, data exported).
- **Troubleshooting:** If the app returns a 500 status code, immediately SSH into the server and run `tail -f logs/error.log` to view the stack trace in real-time.

## 5. Rollback Procedure
If a bad commit takes down production:
1. Revert the commit on GitHub (`git revert <commit-hash>`).
2. Push to `main`.
3. GitHub Actions will rebuild and deploy the reverted, stable codebase.
