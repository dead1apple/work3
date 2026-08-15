# Mall Admin Dashboard Implementation Plan

**Goal:** Build a local-first administrator dashboard that uses the deployed backend APIs and matches the supplied Logip visual reference while retaining only a left navigation rail and a right content workspace.

**Architecture:** Add a standalone React + TypeScript + Vite application under `mall-admin`. A typed fetch client owns authentication, API envelopes, query serialization, and errors. Page components query the five administrator resources directly; the dashboard derives its metrics and chart series from those same results.

**Tech Stack:** React 19, TypeScript, Vite, React Router, TanStack Query, Recharts, Lucide React, Vitest, Testing Library.

---

## Task 1: Establish the frontend and test baseline

**Files:**
- Create: `mall-admin/package.json`
- Create: `mall-admin/vite.config.ts`
- Create: `mall-admin/tsconfig.json`
- Create: `mall-admin/index.html`
- Create: `mall-admin/src/test/setup.ts`
- Create: `mall-admin/src/api/client.test.ts`
- Create: `mall-admin/src/utils/dashboard.test.ts`

1. Add tests for auth headers, query serialization, backend error envelopes, and dashboard aggregation.
2. Run `npm test` and confirm the tests fail because implementation modules do not exist.
3. Add the minimum client, types, and aggregation code.
4. Re-run `npm test` and confirm the baseline passes.

## Task 2: Implement authentication and API contracts

**Files:**
- Create: `mall-admin/src/api/types.ts`
- Create: `mall-admin/src/api/client.ts`
- Create: `mall-admin/src/api/admin.ts`
- Create: `mall-admin/src/auth/AuthContext.tsx`
- Create: `mall-admin/src/pages/LoginPage.tsx`

1. Model `Result`, `PageResult`, user, product summary, order, shop, and coupon responses.
2. Implement `POST /api/auth/login`, token persistence, logout, 401/session handling, and administrator-role validation.
3. Implement the list and audit/status mutations exposed by the backend.
4. Cover the transport behavior with Vitest.

## Task 3: Build the two-region admin shell

**Files:**
- Create: `mall-admin/src/App.tsx`
- Create: `mall-admin/src/main.tsx`
- Create: `mall-admin/src/components/AppShell.tsx`
- Create: `mall-admin/src/components/PageHeader.tsx`
- Create: `mall-admin/src/components/StatusBadge.tsx`
- Create: `mall-admin/src/components/Pagination.tsx`
- Create: `mall-admin/src/components/StatePanel.tsx`
- Create: `mall-admin/src/styles.css`

1. Build a fixed white left sidebar and one right content workspace on a pale gray canvas.
2. Carry over the reference's navy text, hairline dividers, soft blue/orange accents, restrained 6-8px radii, and compact spacing.
3. Add responsive behavior: a drawer sidebar on narrow screens, stable table overflow, and no overlapping controls.

## Task 4: Build the dashboard and management pages

**Files:**
- Create: `mall-admin/src/pages/DashboardPage.tsx`
- Create: `mall-admin/src/pages/UsersPage.tsx`
- Create: `mall-admin/src/pages/ProductsPage.tsx`
- Create: `mall-admin/src/pages/OrdersPage.tsx`
- Create: `mall-admin/src/pages/ShopsPage.tsx`
- Create: `mall-admin/src/pages/CouponsPage.tsx`
- Create: `mall-admin/src/utils/dashboard.ts`
- Create: `mall-admin/src/utils/format.ts`

1. Derive overview counts, GMV, completion rate, order-state distribution, and recent activity from live administrator endpoints.
2. Add searchable/filterable/paginated user, product, order, and shop tables.
3. Wire user enable/disable, product audit/status, and shop audit/status mutations with confirmation and feedback.
4. Present coupon utilization and validity using the available read-only endpoint.
5. Include loading, error, empty, mutation-progress, and retry states.

## Task 5: Verify locally

1. Run `npm test`.
2. Run `npm run build`.
3. Start Vite on an available local port without deploying.
4. Open the app in the in-app browser and sign in using the administrator test account.
5. Verify desktop and mobile layouts, navigation, filters, pagination, representative audit controls, console output, and text overlap.
6. Provide the localhost URL and wait for explicit approval before any deployment.
