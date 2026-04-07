# Task 24: CI/CD Pipeline & Multi-Server Deployment via Tailscale

**Status:** Completed
**Date:** 2026-04-08

## Objective
Establish a fully automated, continuous deployment (CD) pipeline using GitHub Actions that deploys the application across multiple server instances over a secure Tailscale network, seamlessly load-balanced via Cloudflare Tunnels.

## Requirements
1. **Automated Trigger**: Pushing to the `master` branch should trigger the deployment.
2. **Secure Access**: Deployment must happen via Tailscale, avoiding the need to expose the servers to the public internet.
3. **Multi-Node Deployment**: The pipeline must support deploying to multiple instances simultaneously (e.g., `100.68.79.40` and `100.73.101.28`).
4. **Environment Portability**: The application `.env` variables and secrets must automatically sync from GitHub Actions to the destination servers, even if deploying to a brand-new machine.
5. **Load Balancing Compatibility**: Ensure that Next.js static asset serving works smoothly behind Cloudflare Tunnel load balancing, preventing CSS `404` errors caused by random build hashes.

## Implementation Details

### GitHub Actions Workflow (`deploy.yml`)
- Created `.github/workflows/deploy.yml` configured to trigger on `push` to `master`.
- Integrated `tailscale/github-action@v2` allowing the GitHub runner to seamlessly join the Tailscale network.
- Used `appleboy/ssh-action` with multiple comma-separated Tailscale IPs (`100.68.79.40,100.73.101.28`) to orchestrate dual-deployments in parallel.

### Secret Management & Auto-Cloning
- Configured GitHub Secrets: `TAILSCALE_AUTHKEY`, `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, and all environment variables.
- Designed the deployment script to intelligently auto-clone the repository using the built-in `GITHUB_TOKEN` if the project directory doesn't exist on a new node.
- Injected a dynamic Bash script generation block (`cat <<EOF > .env`) to automatically recreate the ignored `.env` file on the remote machines pulling variables securely from GitHub Secrets.

### Cloudflare Tunnel Port Binding Fix
- Removed the `3000:3000` host port binding in `docker-compose.yml`.
- By keeping the application on the internal Docker `backend` network, we eliminated port allocation conflicts (e.g., "Address already in use") and increased overall system security since the app is exclusively reachable via Cloudflare.

### Deterministic Next.js Build IDs
- **Problem**: Next.js defaults to random Build IDs. When Cloudflare load balanced between the two independently built server containers, requests for CSS assets originating from Server A's HTML could be routed to Server B, causing 404 missing asset errors.
- **Solution**:
  - Injected `BUILD_ID="${{ github.sha }}"` into the servers' `.env` files via GitHub Actions.
  - Passed `BUILD_ID` to the Next.js `Dockerfile` as an `ARG` and `ENV`.
  - Configured `generateBuildId` in `next.config.ts` to return this deterministic Git SHA.
  - As a result, both independent container builds produce mathematically identical static output directories and paths, fixing the CSS 404s completely.

## Final Review
- Both instances successfully cloned and spun up using a single authenticated SSH key (`~/.ssh/github_actions`).
- Multi-node redundancy is verified.
- Static assets serve successfully regardless of which instance Cloudflare routes the request to, creating a stable high-availability setup.
