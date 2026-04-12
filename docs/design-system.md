# Design System & UI Guidelines
**Version:** 1.1.0 | **Updated:** 2026-04-12

Consistency is key to a professional dashboard. When building new features on the `v2.0` roadmap, adhere to the established component patterns defined below.

## 1. Core Principles
- **Aesthetic Excellence:** Ensure spacing, borders, and colors reflect a premium application. 
- **Reusability:** Avoid writing custom utility classes directly on HTML tags if an existing React component handles the job.
- **Responsive Design:** Ensure tables and dashboards flex gracefully onto mobile device screens.

## 2. Global Components
You should find and utilize these components under `components/common/` (or similar UI folders):
- **Alerts & Toasts (`useAlert`):** Always use out-of-the-box global notification systems for success/error feedback instead of building local state messages.
- **Modals (`useModal`):** Use the unified modal context for quick actions (like the Project Quick Update).
- **Buttons & Inputs:** Use the centralized input forms for consistent border-radius, hover states, and focus-rings.

## 3. Sidebar & Navigation
- The navigation menu is **Dynamic & Database-Driven**.
- Do NOT hardcode new links into the Sidebar UI component.
- Instead, use the `MenuManager` interface (created in v1.0) to register a new route, assign its icon, and configure role access.

## 4. Typography & Theming
- **Primary Fonts:** Ensure you are utilizing the globally loaded font (e.g., Inter, Roboto) configured in Next.js `layout.tsx`.
- **Colors:** Use CSS variables/tokens for colors (e.g., `--color-primary`, `--color-background`) if using standard CSS, ensuring dark-mode compatibility operates seamlessly without manual overrides.
