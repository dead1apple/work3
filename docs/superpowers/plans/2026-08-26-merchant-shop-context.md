# Merchant Shop Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a reliable, non-persisted current-shop context after trusted merchant session restoration.

**Architecture:** A dedicated Shop Store calls the token-scoped current-shop endpoint and models idle/loading/ready/empty/error explicitly. Router and application lifecycle code coordinate session-first restoration and shared cleanup without adding shop state to Session Store.

**Tech Stack:** Vue 3, Pinia, Vue Router, Axios, Element Plus, JavaScript, Vitest, Vue Test Utils

**Spec:** `docs/superpowers/specs/2026-08-26-merchant-shop-context-design.md`

## Global Constraints

- `GET /api/user/info` remains the only role trust source.
- `GET /api/merchant/shop` is the only new backend call implemented.
- shopId and shop data are never persisted to localStorage.
- Shop Store never imports Session Store.
- No product, order, coupon, shop-edit, shop-apply, or statistics implementation.
- Shop request failure must not revoke an already trusted merchant session.

---

### Task 1: Current-shop API and explicit Shop Store

**Files:**
- Create: `src/api/shop.js`
- Create: `src/store/shop.js`
- Create: `src/store/__tests__/shop.spec.js`

**Interfaces:**
- Produces: `getCurrentShop()` calling `GET /merchant/shop` through the existing `/api` Axios instance.
- Produces: `useShopStore()` with `shop`, `status`, `error`, `isReady`, `hasNoShop`, `restore()`, and `reset()`.

- [ ] **Step 1: Write failing store tests**

Mock only the external shop API. Assert real store outcomes for a returned shop, null response, request error, concurrent restore deduplication, cached ready/empty results, and reset.

```js
await store.restore()
expect(store.status).toBe('ready')
expect(store.shop).toEqual({ id: 1, userId: 2, shopName: '华为官方旗舰店' })
```

- [ ] **Step 2: Run the focused test and confirm red**

Run `npm test -- --run src/store/__tests__/shop.spec.js`; expect missing shop module failure.

- [ ] **Step 3: Implement the minimal API and state machine**

`restore()` must set loading, deduplicate in-flight work, transition null to empty, transition objects to ready, preserve null shop on error, and rethrow errors after recording them. `reset()` returns all state to idle.

- [ ] **Step 4: Run focused tests and commit**

Run `npm test -- --run src/store/__tests__/shop.spec.js`; require all tests passing. Commit with `feat: add current merchant shop context`.

### Task 2: Session-first restoration and cleanup coordination

**Files:**
- Modify: `src/router/guard.js`
- Modify: `src/router/index.js`
- Modify: `src/main.js`
- Modify: `src/layouts/MerchantLayout.vue`
- Modify: `src/router/__tests__/guard.spec.js`
- Modify: `src/layouts/__tests__/MerchantLayout.spec.js`

**Interfaces:**
- `createMerchantGuard(session, shop)` restores session first and calls `shop.restore()` only for trusted merchants.
- HTTP 401 handler and logout reset Shop Store.

- [ ] **Step 1: Add failing guard and layout tests**

Assert role denial never calls shop restore and resets stale shop; merchant navigation restores session before shop; shop errors still allow the merchant route; anonymous/failed session resets shop; logout resets shop and session before login navigation.

```js
expect(callOrder).toEqual(['session', 'shop'])
expect(shop.restore).not.toHaveBeenCalled()
```

- [ ] **Step 2: Run focused tests and confirm red**

Run `npm test -- --run src/router/__tests__/guard.spec.js src/layouts/__tests__/MerchantLayout.spec.js`; expect new assertions to fail.

- [ ] **Step 3: Implement lifecycle coordination**

Instantiate Shop Store from the existing Pinia. Guard must reset shop on anonymous, non-merchant, or failed session; it catches shop restore errors and still authorizes the merchant. Main unauthorized handler resets shop. Layout logout resets shop in finally.

- [ ] **Step 4: Run focused tests and commit**

Run both focused files and require all passing. Commit with `feat: coordinate shop context lifecycle`.

### Task 3: Distinguish user and shop in the UI

**Files:**
- Modify: `src/layouts/MerchantLayout.vue`
- Modify: `src/views/HomeView.vue`
- Modify: `src/layouts/__tests__/MerchantLayout.spec.js`
- Create: `src/views/__tests__/HomeView.spec.js`
- Modify: `README.md`

**Interfaces:**
- Layout displays user identity from Session Store and shop state/name from Shop Store.
- Home displays only real account, role, and shop context without operational metrics.

- [ ] **Step 1: Write failing component tests**

Assert ready shop name is distinct from user nickname, empty/error/loading copy is explicit, no edit/create action exists, and Home shows real username plus merchant role and current shop.

- [ ] **Step 2: Run component tests and confirm red**

Run `npm test -- --run src/views/__tests__/HomeView.spec.js src/layouts/__tests__/MerchantLayout.spec.js`; expect missing or incorrect UI assertions.

- [ ] **Step 3: Implement minimal UI and documentation**

Use existing visual tokens. Add no business menu or fake metric. Document the token → user/info → merchant/shop chain and non-persisted shopId policy.

- [ ] **Step 4: Run full verification and commit**

Run `npm test -- --run`, `npm run build`, browser login/refresh/logout smoke tests, and scope scans for prohibited business APIs. Commit with `feat: show trusted merchant shop context`.
