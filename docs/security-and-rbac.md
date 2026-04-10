# Security & Role-Based Access Control (RBAC)

The Danang Dashboard utilizes a highly flexible, database-driven Role-Based Access Control architecture. It is imperative to understand this model before creating new API routes or Server Actions.

## 1. Authentication Layer (Next-Auth)
- All user sessions are managed via `next-auth`. 
- The session token securely tracks the user's `userId`, `email`, and `roleId`.
- **Middleware:** Next.js `middleware.ts` intercepts requests. Unauthenticated users attempting to access `/dashboard/*` are automatically redirected to `/login`.

## 2. Dynamic RBAC System
In v1.0, we migrated away from hardcoded roles (e.g., `role === 'ADMIN'`). 
- **Roles & Permissions Tables:** Allowed access features are configured in the database, tying specific roles to particular URLs, menus, and actions.
- **Menu Visibility:** The Dynamic Menu Management system checks the user's role against assigned menus before rendering them in the sidebar. If a user lacks permission, the element is not rendered in the DOM.

## 3. Server-Side Validation (Crucial)
Hiding a button in the UI is **not** security. Any user can theoretically forge a request to an endpoint. 
- Therefore, **all Next.js Server Actions and API Routes must independently verify the user session and permissions.**
- Example: Before executing a soft-delete row command in the database, `actions.ts` must query if the active `session.user` has explicit deletion rights for that entity. 

## 4. Data Visibility Rules
Certain roles (e.g., Specialists vs AMs) see different aggregates of data.
- Ensure that Drizzle queries dynamically inject `.where()` clauses restricting data fetch based on ownership or assigned department unless the user possesses an overarching 'Admin/Director' flag.
