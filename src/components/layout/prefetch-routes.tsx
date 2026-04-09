"use client";

import Link from "next/link";

/**
 * Hidden component that eagerly prefetches all dashboard routes.
 * Next.js will download the JS bundles for each route in the background,
 * so when the user clicks a sidebar link, navigation is near-instant.
 */

const DASHBOARD_ROUTES = [
  "/",
  "/du-an",
  "/du-an/tao-moi",
  "/du-an/tracking",
  "/kpi",
  "/dia-ban",
  "/quan-ly-am",
  "/quan-ly-cv",
  "/admin/khach-hang",
  "/admin/san-pham",
  "/admin/users",
  "/admin/kpi",
  "/admin/du-an-da-xoa",
  "/admin/roles",
  "/email-service",
];

export function PrefetchRoutes() {
  return (
    <div className="hidden" aria-hidden="true">
      {DASHBOARD_ROUTES.map((href) => (
        <Link key={href} href={href} prefetch={true} tabIndex={-1}>
          {href}
        </Link>
      ))}
    </div>
  );
}
