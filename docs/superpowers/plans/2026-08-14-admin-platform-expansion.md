# Admin Platform Expansion Implementation Plan

**Goal:** Expand the local mall administrator application into a complete operational console covering analytics, unified audits, entity details, order operations, marketing/catalog configuration, and administrator security.

**Architecture:** Keep the existing storefront services intact. Add a focused `AdminPlatformService` backed by `JdbcTemplate` for cross-domain administrator queries and mutations, plus an administrator security interceptor for authentication and permission checks. Use an isolated local MySQL database named `jd_mall_admin_dev` so the complete backend can run on port 8081 without changing the user's existing `jd_mall` data. The Vite development server proxies `/api` to that backend.

**Tech Stack:** Spring Boot 3.2, Sa-Token, MyBatis, JdbcTemplate, MySQL 8, React 19, TypeScript, TanStack Query, Recharts, Vitest.

## Task 1: Contract tests and local data profile

**Files:**
- Create: `mall-server/mall_server/src/test/java/com/ngsz/mall_server/service/AdminPlatformServiceTest.java`
- Create: `mall-server/mall_server/src/test/java/com/ngsz/mall_server/service/AdminSecurityServiceTest.java`
- Create: `mall-server/mall_server/src/main/resources/application-local.yml`
- Create: `docx/admin-platform-migration.sql`
- Update: `docx/seed-data.sql`

1. Define tests for paid-order analytics, batch audit validation, role permissions, and risk detection.
2. Run the tests and confirm they fail because platform services do not exist.
3. Create and seed the isolated `jd_mall_admin_dev` schema with representative data for every administrator workflow.

## Task 2: Security, roles, and activity logs

**Files:**
- Create: `common/security/AdminSecurityService.java`
- Create: `common/security/AdminSecurityInterceptor.java`
- Modify: `common/config/WebMvcConfig.java`
- Create: `service/AdminPlatformService.java`
- Create: `service/impl/AdminPlatformServiceImpl.java`
- Modify: `service/impl/UserServiceImpl.java`
- Create: `controller/admin/AdminSecurityController.java`
- Create: `docx/admin-platform-migration.sql`

1. Require login and administrator role for `/api/admin/**`.
2. Resolve fine-grained permissions from administrator roles; super administrators receive `*`.
3. Record all administrator mutations and login attempts.
4. Expose role CRUD, assignments, operation logs, login logs, and derived risk alerts.

## Task 3: Analytics, audits, details, and orders

**Files:**
- Create: `controller/admin/AdminDashboardController.java`
- Create: `controller/admin/AdminAuditController.java`
- Modify: existing user/product/order/shop administrator controllers.
- Create: administrator request DTOs for batch audit, delivery, close, and refund.

1. Return date-ranged KPIs, revenue/order trends, order distribution, top products, top shops, and pending counts.
2. Return a unified product/shop audit queue and audit history.
3. Support batch approve/reject with required rejection reasons.
4. Return user, product, shop, and order detail aggregates.
5. Support administrator delivery/logistics changes, order close, and mock refund records.

## Task 4: Marketing, catalog, recommendations, and mock settings

**Files:**
- Modify: `controller/admin/AdminCouponController.java`
- Create: `controller/admin/AdminCatalogController.java`
- Create: `controller/admin/AdminConfigController.java`
- Create: coupon/category/brand/config request DTOs.

1. Add paginated coupon template CRUD and enable/disable actions.
2. Add category and brand create/update/status actions.
3. Store recommended product IDs in system configuration.
4. Store SMS/payment mock switches in system configuration and use them at runtime.

## Task 5: Administrator frontend expansion

**Files:**
- Modify: `mall-admin/src/api/types.ts`, `api/admin.ts`, `vite.config.ts`
- Modify: current dashboard, users, products, orders, shops, coupons pages.
- Create: audit center, catalog/config, and security pages.
- Create: reusable drawer, tabs, forms, selection bar, and export helpers.

1. Replace client-side overview aggregation with the backend analytics endpoint and add date selection, status distribution, rankings, and pending actions.
2. Add unified audit batch selection, confirmation, rejection reason, and history.
3. Add entity detail drawers for users/products/orders/shops.
4. Add order delivery, close, refund, logistics update, and CSV export.
5. Add coupon CRUD, catalog management, recommendations, and mock switches.
6. Add role/permission management, administrator assignments, operation/login logs, and risk alerts.

## Task 6: Full-stack local verification

1. Run all backend tests and package the backend.
2. Run all frontend tests and production build.
3. Start the backend with the `local` profile on 8081 and Vite on 5173.
4. Sign in as the seeded administrator and verify every page, representative read/write workflow, console logs, and responsive layouts.
5. Leave the local preview open and wait for explicit approval before deployment.
