FROM node:20-alpine AS base

# Stage 1: Build the source code
FROM base AS builder
# Install necessary packages and timezone data
RUN apk add --no-cache libc6-compat tzdata
ENV TZ=Asia/Ho_Chi_Minh

WORKDIR /app


# Install dependencies
COPY package.json package-lock.json* ./
# Copy Prisma schema for the generate step (it's called in npm ci postinstall)
COPY prisma ./prisma
RUN npm ci

# Copy all files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Bust cache for Next.js build
ARG CACHEBUST=1

# Build Next.js
ARG BUILD_ID
ENV BUILD_ID=${BUILD_ID}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Production image (standalone output)
FROM base AS runner
WORKDIR /app

# Set timezone correctly for the runtime as well
RUN apk add --no-cache tzdata
ENV TZ=Asia/Ho_Chi_Minh

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create data, logs, and uploads directory for Turso, Pino, and file attachments and set permissions
RUN mkdir -p logs uploads && chown -R nextjs:nodejs logs uploads

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone server (includes minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copy static assets (JS/CSS bundles)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy scripts for DB management etc.
COPY --from=builder /app/scripts ./scripts

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Standalone uses server.js directly instead of npm start
CMD ["node", "server.js"]
