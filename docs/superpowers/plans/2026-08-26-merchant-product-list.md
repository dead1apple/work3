# Merchant Product List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a stable, real, read-only product list at `/merchant/products` for the current token-scoped merchant shop.

**Architecture:** Add one narrow product API, page-local list state in a composable, and a products view under the existing Merchant Layout. Session and Shop stores remain unchanged; the router restores both before mounting the view, and the product request never consumes or sends shopId.

**Tech Stack:** Vue 3, Vite, Vue Router, Pinia, Axios, Element Plus, JavaScript, Vitest, Vue Test Utils

**Spec:** `docs/superpowers/specs/2026-08-26-merchant-product-list-design.md`

## Global Constraints

- Only implement the read-only list; no product detail or write actions.
- Use the exact response `data: { total, list, page, size }`; never guess alternative fields.
- Use only query parameters `keyword`, `status`, `page`, and `size`.
- Never send `shopId`; Shop Store is display context only.
- Use server-side search, status filtering, and pagination.
- Keep product state local to the route and clear stale rows on errors.
- Preserve Vite base `/merchant/` and the existing session → shop guard chain.

---

### Task 1: Product API and display-domain helpers

**Files:**
- Create: `src/api/product.js`
- Create: `src/api/__tests__/product.spec.js`
- Create: `src/views/products/product-list.js`
- Create: `src/views/products/__tests__/product-list.spec.js`

**Interfaces:**
- Produces: `getMerchantProducts({ keyword, status, page, size }) -> Promise<{ total, list, page, size }>`
- Produces: `PRODUCT_STATUS_OPTIONS`, `getProductStatus(status)`, `formatPriceRange(minPrice, maxPrice)`

- [ ] **Step 1: Write failing API boundary tests**

Use the real Axios instance with a test adapter. Assert that the observed request has URL `/merchant/products`, exact params `{ keyword: 'Mate', status: 1, page: 2, size: 20 }`, an Authorization header, and no `shopId`. Return a literal real-response fixture and assert the function resolves exactly that `data` object.

- [ ] **Step 2: Run the API test and verify RED**

Run: `npm test -- --run src/api/__tests__/product.spec.js`

Expected: FAIL because `src/api/product.js` does not exist.

- [ ] **Step 3: Implement the minimal API**

```js
import request from '../utils/request'

export function getMerchantProducts(params) {
  return request.get('/merchant/products', { params })
}
```

- [ ] **Step 4: Run the API test and verify GREEN**

Run: `npm test -- --run src/api/__tests__/product.spec.js`

Expected: one passing test and no warnings.

- [ ] **Step 5: Write failing helper tests**

Assert the literal mappings `0 -> 已下架`, `1 -> 已上架`, `2 -> 待审核`, an explicit unknown fallback, and price strings `¥1,499.00` and `¥6,999.00 – ¥7,999.00`.

- [ ] **Step 6: Run helper tests and verify RED**

Run: `npm test -- --run src/views/products/__tests__/product-list.spec.js`

Expected: FAIL because the helper module does not exist.

- [ ] **Step 7: Implement helpers**

Define one frozen status map and derive the filter options from the three documented values. Format equal prices as one currency value and differing prices as a range; do not infer prices from unavailable SKU data.

- [ ] **Step 8: Run both Task 1 tests and verify GREEN**

Run: `npm test -- --run src/api/__tests__/product.spec.js src/views/products/__tests__/product-list.spec.js`

- [ ] **Step 9: Commit Task 1**

```bash
git add src/api/product.js src/api/__tests__/product.spec.js src/views/products/product-list.js src/views/products/__tests__/product-list.spec.js
git commit -m "feat: add merchant product list contract"
```

---

### Task 2: Page-local product list state

**Files:**
- Create: `src/views/products/useProductList.js`
- Create: `src/views/products/__tests__/useProductList.spec.js`

**Interfaces:**
- Consumes: `getMerchantProducts(params)`
- Produces: `useProductList()` with `keyword`, `status`, `page`, `size`, `items`, `total`, `loading`, `error`, `load`, `search`, `changePage`, and `changeSize`

- [ ] **Step 1: Write failing state tests with a complete real fixture**

Use the complete list item shape from the spec. Cover:

1. initial `load()` sends `{ page: 1, size: 10 }` and enters success;
2. empty `{ total: 0, list: [], page: 1, size: 10 }` stays a valid success;
3. a rejected reload clears previous `items` and `total`, then exposes `error`;
4. `search()` trims keyword, sends documented `keyword/status`, and resets page to 1;
5. `changePage(2)` and `changeSize(20)` make new server calls using exact names;
6. a fresh `useProductList()` instance contains no rows from an earlier instance.

- [ ] **Step 2: Run state tests and verify RED**

Run: `npm test -- --run src/views/products/__tests__/useProductList.spec.js`

Expected: FAIL because `useProductList.js` does not exist.

- [ ] **Step 3: Implement minimal state**

Store rows and filters in Vue refs. Build params from `page` and `size`, adding trimmed `keyword` only when non-empty and `status` only when it is `0`, `1`, or `2`. At each request start set loading and clear error; on failure clear rows and total before rethrowing; always clear loading in `finally`.

- [ ] **Step 4: Run state tests and verify GREEN**

Run: `npm test -- --run src/views/products/__tests__/useProductList.spec.js`

- [ ] **Step 5: Commit Task 2**

```bash
git add src/views/products/useProductList.js src/views/products/__tests__/useProductList.spec.js
git commit -m "feat: add product list page state"
```

---

### Task 3: Read-only product list view

**Files:**
- Create: `src/views/products/ProductListView.vue`
- Create: `src/views/products/__tests__/ProductListView.spec.js`

**Interfaces:**
- Consumes: `useProductList()`, Shop Store `shopName`, display helpers
- Produces: the complete loading, success, empty, and error UI for `/products`

- [ ] **Step 1: Write failing component tests**

Mount with real Pinia and Element Plus while mocking only the external product API. Use the full real fixture and assert:

- loading does not render the empty message;
- success renders shop name, the three real product names, status, prices, stock, category ID, and brand ID;
- empty renders “当前店铺暂无商品” without an add button;
- error renders “商品列表加载失败”, no stale product name, and retry calls the API again;
- no edit, delete, on-sale, off-sale, detail, or stock controls exist.

- [ ] **Step 2: Run component tests and verify RED**

Run: `npm test -- --run src/views/products/__tests__/ProductListView.spec.js`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the view**

Use a semantic heading, labelled search/status controls, `el-table`, `el-tag`, `el-image`, `el-empty`, `el-alert`, `el-skeleton`, and `el-pagination`. Render `mainImage` directly and use an inline CSS fallback slot. Trigger `load()` in `onMounted`; never read `shop.id`.

- [ ] **Step 4: Run component tests and verify GREEN**

Run: `npm test -- --run src/views/products/__tests__/ProductListView.spec.js`

- [ ] **Step 5: Commit Task 3**

```bash
git add src/views/products/ProductListView.vue src/views/products/__tests__/ProductListView.spec.js
git commit -m "feat: add read-only merchant product view"
```

---

### Task 4: Protected route and Merchant Layout navigation

**Files:**
- Modify: `src/router/index.js`
- Create: `src/router/routes.js`
- Create: `src/router/__tests__/routes.spec.js`
- Modify: `src/layouts/MerchantLayout.vue`
- Modify: `src/layouts/__tests__/MerchantLayout.spec.js`

**Interfaces:**
- Produces: named route `merchant-products` at source path `/products` under the protected Merchant Layout
- Produces: desktop and mobile links labelled `商品列表`

- [ ] **Step 1: Write failing route and navigation tests**

Assert that resolving `/products` returns route name `merchant-products` and matched metadata includes `requiresMerchant: true`. Update the Layout test to expect exactly `首页` and `商品列表`, while continuing to reject unimplemented navigation labels.

- [ ] **Step 2: Run integration tests and verify RED**

Run: `npm test -- --run src/router/__tests__/routes.spec.js src/layouts/__tests__/MerchantLayout.spec.js`

Expected: FAIL because the route and link do not exist.

- [ ] **Step 3: Implement route and links**

Extract the route array to `src/router/routes.js` for direct behavior testing, keep `createWebHistory(import.meta.env.BASE_URL)`, and lazy-load `ProductListView.vue`. Add `Goods` icon links to both desktop and mobile navigation; do not add a future menu framework.

- [ ] **Step 4: Run integration and complete suite**

Run: `npm test -- --run src/router/__tests__/routes.spec.js src/layouts/__tests__/MerchantLayout.spec.js`

Then: `npm test -- --run`

- [ ] **Step 5: Commit Task 4**

```bash
git add src/router/index.js src/router/routes.js src/router/__tests__/routes.spec.js src/layouts/MerchantLayout.vue src/layouts/__tests__/MerchantLayout.spec.js
git commit -m "feat: route merchant product list"
```

---

### Task 5: Documentation, browser verification, and build

**Files:**
- Modify: `README.md`

**Interfaces:**
- Documents: product-list route, exact API contract, server filtering/pagination, and no-shopId boundary

- [ ] **Step 1: Update README**

Document `/merchant/products`, query names, response shape, local page state, read-only scope, and that product ownership is enforced by the token on the backend.

- [ ] **Step 2: Run fresh automated verification**

Run: `npm test -- --run`

Expected: all test files and tests pass with zero failures.

- [ ] **Step 3: Build production output**

Run: `npm run build`

Expected: exit 0 and `dist/index.html` references `/merchant/assets/`.

- [ ] **Step 4: Run browser Case 1–8**

Start the Vite dev server, log in as the supplied merchant, open the product link, verify three real products, inspect the observed `/api/merchant/products` URL for absence of shopId, reload `/merchant/products`, exercise the real second page using `size=2`, log out, revisit the protected URL, and confirm no console warning/error/unhandled rejection.

- [ ] **Step 5: Commit documentation**

```bash
git add README.md
git commit -m "docs: document merchant product list"
```

- [ ] **Step 6: Report branch state**

Confirm current branch is `feature/merchant-product-list`, working tree is clean, and do not merge into `merchant-foundation`.
