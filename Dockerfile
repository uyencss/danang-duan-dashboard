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

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Production image
FROM base AS runner
WORKDIR /app

# Set timezone correctly for the runtime as well
RUN apk add --no-cache tzdata
ENV TZ=Asia/Ho_Chi_Minh

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create data directory for Turso Embedded Replica and set permissions
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Copy built assets and dependencies from builder stage
COPY --from=builder /app/package.json ./
# For a non-standalone Next.js build, we need node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]