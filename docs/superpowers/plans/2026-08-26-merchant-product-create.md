# Merchant Product Create Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a tested, authenticated product-creation flow at `/merchant/products/create` using the verified backend DTO and real catalog data.

**Architecture:** Keep the draft route-local. Put deterministic validation and payload mapping in a pure domain module, asynchronous catalog/submit state in one composable, and presentation/navigation in the Vue view. The existing session and shop stores remain the only identity/context sources; no shop ID is sent.

**Tech Stack:** Vue 3, Vite, Vue Router, Pinia, Axios, Element Plus, JavaScript, Vitest, Vue Test Utils

**Spec:** `docs/superpowers/specs/2026-08-26-merchant-product-create-design.md`

## Global constraints

- Use exact APIs: `POST /merchant/products`, `GET /categories/tree`, `GET /brands` through the existing `/api` Axios base.
- Explicitly omit product/SKU IDs, status, shopId, and UI-only SKU keys.
- Treat only `{ category, children }`, the documented brand array, and ProductDTO/SkuDTO as valid contracts.
- Use URL fields because no upload endpoint exists.
- Never lose form data on server failure and never issue duplicate POSTs.
- Do not implement edit/status/delete/product detail or unrelated business features.

### Task 1: API boundaries and payload domain

**Files:**
- Modify: `src/api/product.js`
- Create: `src/api/catalog.js`
- Modify: `src/api/__tests__/product.spec.js`
- Create: `src/api/__tests__/catalog.spec.js`
- Create: `src/views/products/product-create.js`
- Create: `src/views/products/__tests__/product-create.spec.js`

- [ ] Write failing adapter-backed tests for exact catalog URLs and product POST body.
- [ ] Run targeted tests and confirm RED.
- [ ] Add the minimal API functions.
- [ ] Write failing pure tests for form defaults, leaf cascader options, URL lines, valid/invalid spec JSON, required fields, non-negative numbers, integer stock, at-least-one SKU, and explicit payload omission.
- [ ] Implement the pure helpers and confirm all Task 1 tests are GREEN.

### Task 2: Route-local async state

**Files:**
- Create: `src/views/products/useProductCreate.js`
- Create: `src/views/products/__tests__/useProductCreate.spec.js`

- [ ] Write failing tests for parallel catalog loading, load failure/retry, SKU add/remove, successful submit, backend rejection preserving draft, and two immediate submit calls sharing one POST.
- [ ] Implement minimal refs/actions with an in-flight submit Promise.
- [ ] Run the targeted state tests and confirm GREEN.

### Task 3: Create page, list entry, and protected route

**Files:**
- Create: `src/views/products/ProductCreateView.vue`
- Create: `src/views/products/__tests__/ProductCreateView.spec.js`
- Modify: `src/views/products/ProductListView.vue`
- Modify: `src/views/products/__tests__/ProductListView.spec.js`
- Modify: `src/router/routes.js`
- Modify: `src/router/__tests__/routes.spec.js`

- [ ] Write failing component tests for normal rendering, client validation, error preservation, success feedback/redirect, catalog retry, and no-shop blocking.
- [ ] Write failing route/list-entry tests.
- [ ] Implement the three-section Element Plus form with local component imports, exact category/brand options, URL fields, manual SKU rows, disabled/loading submit, and named-route navigation.
- [ ] Add `/products/create` under the protected layout and the list CTA.
- [ ] Run all Task 3 tests and confirm GREEN.

### Task 4: Documentation and automated verification

**Files:**
- Modify: `README.md`

- [ ] Document the route, exact payload boundary, URL-only image strategy, validation, pending-review behavior, and non-goals.
- [ ] Run `npm test -- --run` and resolve every regression.
- [ ] Run `npm run build` and verify generated asset URLs retain `/merchant/`.

### Task 5: Real browser verification

- [ ] Start the dev server and log in with the supplied merchant account.
- [ ] Verify direct navigation/refresh, list CTA, real category tree, real brands, SKU add/delete, validation, and empty/error presentation without creating a product.
- [ ] Inspect console and network: only catalog reads before submission and no shopId.
- [ ] Immediately before the final submit, obtain action-time confirmation because this creates real server data.
- [ ] Create exactly one timestamped test product, verify one POST, success redirect, and pending status in the list.
- [ ] Record the returned/list product ID, exact name, status, and whether deletion is unavailable.
- [ ] Run final tests/build, confirm a clean `feature/merchant-product-create` branch, and do not merge.
