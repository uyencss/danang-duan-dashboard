# Developer Guide & Onboarding

Welcome to the Danang Project Dashboard! This guide will help you get your local environment set up and explain our core development conventions.

## 1. Local Environment Setup

**Prerequisites:**
- Node.js (v18+)
- Docker (optional, but recommended for testing infrastructure locally)
- Git

**Steps to run locally:**
1. Clone the repository: `git clone <repo-url>`
2. Install dependencies: `npm install`
3. Copy the environment variables: `cp .env.example .env` (Ask the team lead for the exact local secrets).
4. Run the development server: `npm run dev`
5. Visit `http://localhost:3000`

## 2. Environment Variables Requirement
Your `.env` should look something like this to run the app safely:
```env
# Database (Turso)
TURSO_DATABASE_URL="libsql://..."
TURSO_AUTH_TOKEN="..."

# Authentication (Next-Auth)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secure_random_string"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

## 3. Coding Conventions
- **Client vs Server:** We use Next.js App Router. Default to Server Components (`.tsx` without `"use client"`). Only use `"use client"` when you need browser APIs (onClick, hooks like useState/useEffect).
- **Server Actions:** For data mutations, utilize React Server Actions inside `actions.ts` files, ensuring you validate permissions before executing Drizzle ORM queries.
- **Git Flow:** 
  - Create branches as `feature/<task-name>` or `fix/<bug-name>`.
  - Always write clear, descriptive commit messages.

## 4. Database Migrations (Drizzle ORM)
When you modify the schema in `schema.ts`:
1. Generate the migration: `npm run db:generate`
2. Push to your local/dev database: `npm run db:push`
