# Frontend Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close frontend-owned production blockers, establish deterministic commerce E2E regression, reduce initial bundle cost, and deliver evidence-backed readiness documentation.

**Architecture:** Keep the existing Vue 3 application structure and introduce only targeted boundaries: shared response primitives, a tested product/SKU adapter, conservative session invalidation, and request-generation guards in route-reused views. Use Playwright API interception for deterministic frontend regression and preserve remote-backend failures as external evidence.

**Tech Stack:** Vue 3.5, Vite 6.4, Pinia 2.3, Vue Router 4.6, Axios 1.19, Element Plus 2.14, Node.js 20, Node test runner, Playwright

**Spec:** `docs/superpowers/specs/2026-08-19-frontend-production-readiness-design.md`

## Global Constraints

- Do not add unrelated business pages, a real payment provider, or a new backend protocol.
- Do not hardcode success, delete failing tests, lower assertions, or hide backend failures.
- Treat server order amount, stock, coupon validity, authorization, and payment state as authoritative.
- Preserve simulated payment semantics.
- Write a failing regression test before each frontend behavior fix.
- Run the targeted test after each edit and the full relevant suite at every milestone.
- Do not deploy or mutate the public server during this local readiness pass.
- Record executed evidence separately from static inference.

---

### Task 1: Unify session storage and make 401 handling race-safe

**Files:**
- Modify: `src/utils/auth.js`
- Modify: `src/utils/request.js`
- Modify: `src/store/user.js`
- Modify: `src/views/auth/Login.vue`
- Modify: `src/router/index.js`
- Delete: `src/store/auth.js`
- Modify: `tests/auth.test.js`

**Interfaces:**
- Produces: `AUTH_TOKEN_KEYS`, `CART_STORAGE_KEY`, `readAuthToken(storage)`, `clearAuthStorage(storage, { clearCart })`, and `isCurrentRequestToken(requestToken, storage)`.
- Consumes: the existing Axios envelope contract `{ code: 1, msg, data }` and same-origin login redirect behavior.

- [ ] **Step 1: Add failing token-alias, cart-cleanup, and stale-token tests**

```js
test('reads both supported token keys through one boundary', () => {
  assert.equal(readAuthToken(fakeStorage({ access_token: 'legacy' })), 'legacy')
})

test('session invalidation removes tokens and persisted cart', () => {
  const storage = fakeStorage({ token: 'A', access_token: 'B', cart: '{"cartList":[]}' })
  clearAuthStorage(storage, { clearCart: true })
  assert.deepEqual(storage.entries(), {})
})

test('an old request token cannot invalidate a newer login', () => {
  const storage = fakeStorage({ token: 'new-token' })
  assert.equal(isCurrentRequestToken('old-token', storage), false)
})
```

- [ ] **Step 2: Run the auth test and verify RED**

Run: `node --test tests/auth.test.js`

Expected: FAIL because the new exports do not exist.

- [ ] **Step 3: Implement the pure session boundary**

```js
export const AUTH_TOKEN_KEYS = ['token', 'access_token']
export const CART_STORAGE_KEY = 'cart'
export const readAuthToken = (storage = localStorage) =>
  AUTH_TOKEN_KEYS.map((key) => storage.getItem(key)).find(Boolean) || ''
export const clearAuthStorage = (storage = localStorage, { clearCart = false } = {}) => {
  AUTH_TOKEN_KEYS.forEach((key) => storage.removeItem(key))
  if (clearCart) storage.removeItem(CART_STORAGE_KEY)
}
export const isCurrentRequestToken = (requestToken, storage = localStorage) =>
  Boolean(requestToken) && requestToken === readAuthToken(storage)
```

Update `user` store initialization to call `readAuthToken()`. Delete the unused `auth` store after confirming `rg -n "useAuthStore|store/auth" src tests` has no consumers.

- [ ] **Step 4: Make Axios 401 handling token-aware and idempotent**

Record the outbound token on `config.__authToken`. Normalize envelope codes using `Number(result.code)`. Redirect only when the 401 request token still equals the current token, clear cart persistence, and prevent repeated redirects with a module-scoped boolean.

```js
config.__authToken = token
const code = Number(result.code)
if (code === 401) redirectToLogin(response.config?.__authToken)
```

Do not clear a newer token when an older request finishes late. HTTP 403 rejects with `error.code = 403` but keeps the session.

- [ ] **Step 5: Clear cart state before accepting a new login and add a catch-all route**

In `Login.vue`, call `useCartStore().clearCart()` immediately before `userStore.setSession(...)`. Add a final router record that redirects unmatched paths to `/home`; do not create a new business page.

- [ ] **Step 6: Verify the session milestone**

Run: `node --test tests/auth.test.js`

Expected: all auth tests pass.

Run: `npm test`

Expected: the original 52 tests plus new session tests pass.

- [ ] **Step 7: Commit the session milestone**

```bash
git add src/utils/auth.js src/utils/request.js src/store/user.js src/views/auth/Login.vue src/router/index.js src/store/auth.js tests/auth.test.js
git commit -m "fix: harden session invalidation and auth state"
```

### Task 2: Establish shared response and numeric invariants

**Files:**
- Create: `src/utils/response.js`
- Modify: `src/utils/cart.js`
- Modify: `src/utils/checkout.js`
- Modify: `src/utils/commerce.js`
- Modify: `src/utils/coupon.js`
- Modify: `src/utils/favorite.js`
- Modify: `src/utils/order.js`
- Modify: `src/utils/payment.js`
- Create: `tests/response.test.js`
- Modify: `tests/cart.test.js`
- Modify: `tests/commerce.test.js`

**Interfaces:**
- Produces: `unwrapData(payload)`, `readPayloadList(payload, keys)`, `toFiniteNumber(value, fallback)`, `toNonNegativeMoney(value, fallback)`, and `toBoundedPositiveInteger(value, { fallback, max })`.
- Consumes: raw backend values that may be strings, missing, non-finite, or nested in supported paging containers.

- [ ] **Step 1: Add failing primitive and malformed-commerce tests**

```js
test('numeric primitives reject NaN, Infinity and negative money', () => {
  assert.equal(toFiniteNumber('bad', 7), 7)
  assert.equal(toFiniteNumber(Infinity, 7), 7)
  assert.equal(toNonNegativeMoney(-1, 0), 0)
  assert.equal(toBoundedPositiveInteger('500', { fallback: 1, max: 99 }), 99)
})

test('malformed cart values never produce NaN totals', () => {
  const [item] = normalizeCartList([{ id: 1, skuId: 2, price: 'bad', quantity: 'bad' }])
  assert.equal(Number.isFinite(item.price), true)
  assert.equal(Number.isInteger(item.quantity), true)
  assert.deepEqual(calculateCartTotals([item]), { totalCount: 1, totalPrice: 0 })
})
```

- [ ] **Step 2: Run targeted tests and verify RED**

Run: `node --test tests/response.test.js tests/cart.test.js tests/commerce.test.js`

Expected: FAIL for missing helpers or NaN behavior.

- [ ] **Step 3: Implement `response.js` and migrate duplicate primitives**

```js
export const unwrapData = (payload) => payload?.data ?? payload
export function readPayloadList(payload, keys = ['list', 'records', 'items', 'rows']) {
  const source = unwrapData(payload)
  if (Array.isArray(source)) return source
  return keys.map((key) => source?.[key]).find(Array.isArray) || []
}
export function toFiniteNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}
```

Use these helpers in cart, commerce, coupon, favorite, order, payment, and checkout adapters. Keep resource-specific alias selection in its resource module; do not create a generic mega-adapter.

- [ ] **Step 4: Mark transaction records invalid without throwing a white screen**

`normalizeCartItem` returns `isValid: true` only when it has canonical `id`, `skuId`, finite non-negative price, and a valid positive quantity. `calculateCheckoutTotals` treats non-finite values as safe zeros, while checkout blocks `isValid === false` items and shows a protocol-data message.

- [ ] **Step 5: Verify shared-adapter migration**

Run: `node --test tests/response.test.js tests/cart.test.js tests/commerce.test.js tests/coupon.test.js tests/favorite.test.js tests/order.test.js tests/payment.test.js tests/checkout.test.js`

Expected: all targeted tests pass and no `NaN`/`Infinity` assertion fails.

Run: `npm test`

Expected: full unit suite passes.

- [ ] **Step 6: Commit the response boundary**

```bash
git add src/utils tests
git commit -m "refactor: centralize response and numeric normalization"
```

### Task 3: Make SKU selection and product-route reuse correct

**Files:**
- Create: `src/utils/productDetail.js`
- Modify: `src/views/product/Detail.vue`
- Create: `tests/product-detail.test.js`

**Interfaces:**
- Produces: `normalizeProductDetail(payload)`, `findSkuBySelection(skuList, selection)`, `isSkuOptionAvailable(skuList, selection, label, value)`, and `getInitialSkuSelection(skuList)`.
- Consumes: backend product plus `skuList` response and parsed `specValues` JSON.

- [ ] **Step 1: Add failing non-Cartesian SKU tests**

```js
const skus = [
  { id: 11, specValues: '{"颜色":"黑","容量":"128G"}', stock: 3, price: 100 },
  { id: 12, specValues: '{"颜色":"白","容量":"256G"}', stock: 2, price: 200 },
]

test('does not fall back to the first SKU for an impossible combination', () => {
  const product = normalizeProductDetail({ product: { id: 1, name: '手机' }, skuList: skus })
  assert.equal(findSkuBySelection(product.skuList, { 颜色: '黑', 容量: '256G' }), null)
  assert.equal(isSkuOptionAvailable(product.skuList, { 颜色: '黑', 容量: '128G' }, '容量', '256G'), false)
})

test('chooses a real in-stock SKU for initial selection', () => {
  assert.deepEqual(getInitialSkuSelection(skus), { 颜色: '黑', 容量: '128G' })
})
```

- [ ] **Step 2: Run the product-detail test and verify RED**

Run: `node --test tests/product-detail.test.js`

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the product/SKU adapter**

Parse each SKU once into `{ ...rawSku, specs, stock, price, marketPrice }`. Reject malformed `specValues` as an unavailable SKU rather than redirecting the entire product as not found. Build options from normalized specs and return `null` unless every selected key exactly matches a real SKU.

- [ ] **Step 4: Update the detail view to use exact SKU state**

Replace the component-local normalizer and first-SKU fallback. Bind each radio option's `disabled` state to `isSkuOptionAvailable`. Display selected SKU price/stock/image, clamp quantity to `Math.min(99, selectedSku.stock)`, and guard both trade actions:

```js
if (!selectedSku.value) return ElMessage.warning('当前规格组合不可购买，请重新选择')
if (selectedSku.value.stock <= 0) return ElMessage.warning('当前规格暂时无货')
```

- [ ] **Step 5: Replace `onMounted` with a request-sequenced route watcher**

Watch `route.params.id` with `{ immediate: true }`. Increment `loadSequence`, reset selection/product state, and check the captured sequence after product, favorite, and review requests before mutating refs. A late product-A response must never overwrite product B.

- [ ] **Step 6: Verify SKU and product routing**

Run: `node --test tests/product-detail.test.js tests/checkout.test.js`

Expected: all tests pass.

Run: `npm test`

Expected: full unit suite passes.

- [ ] **Step 7: Commit the SKU milestone**

```bash
git add src/utils/productDetail.js src/views/product/Detail.vue tests/product-detail.test.js
git commit -m "fix: enforce valid SKU selection and route refresh"
```

### Task 4: Make cart state canonical, isolated, and single-flight

**Files:**
- Modify: `src/store/cart.js`
- Modify: `src/views/CartView.vue`
- Modify: `src/views/layout/index.vue`
- Modify: `tests/cart.test.js`

**Interfaces:**
- Consumes: canonical server cart-item IDs and the intended checked value from the UI.
- Produces: `toggleCheck(id, checked)`, canonical `addToCart(product)`, and non-persisted account-safe cart state.

- [ ] **Step 1: Add a failing canonical-ID regression test**

Extract or expose a pure `getCanonicalCartItem(result, skuId)` helper and assert that an empty create response returns `null`; it must never synthesize `${skuId}-${Date.now()}`.

```js
assert.equal(getCanonicalCartItem({}, 9), null)
assert.equal(getCanonicalCartItem({ cartItem: { id: 7, skuId: 9 } }, 9).id, 7)
```

- [ ] **Step 2: Run cart tests and verify RED**

Run: `node --test tests/cart.test.js`

Expected: FAIL because the canonical helper and behavior are absent.

- [ ] **Step 3: Remove server-cart persistence and fake IDs**

Remove `persist: true`. After a create response without a canonical ID, call `fetchCartList()` and find the SKU there. If still absent, throw `购物车已更新，但服务端未返回可操作的购物车记录，请刷新后重试` without inserting a local record.

When adding an existing unchecked item, update quantity and call `setCartItemSelected(id, 1)` before setting local `checked = true`.

- [ ] **Step 4: Fix checkbox intent and quantity mutation guards**

Use `:model-value="row.checked"` and pass the emitted value:

```vue
<el-checkbox :model-value="row.checked" @change="(checked) => toggleItem(row, checked)" />
```

Change the store action to `toggleCheck(id, checked)` and send that exact value. In `CartView`, keep a `Set` of quantity-updating IDs, disable the row input while in flight, and receive both current and previous values from Element Plus. On failure, restore the previous value and refetch; show a dedicated retry state if the initial cart load fails.

- [ ] **Step 5: Fetch the current account cart once from the layout**

On layout mount, if authenticated, call `cartStore.fetchCartList()` silently. Do not show stale cross-account data when it fails; the cart route owns the visible retry state.

- [ ] **Step 6: Verify cart behavior**

Run: `node --test tests/cart.test.js tests/auth.test.js`

Expected: tests pass.

Run: `npm test`

Expected: full unit suite passes.

- [ ] **Step 7: Commit the cart milestone**

```bash
git add src/store/cart.js src/views/CartView.vue src/views/layout/index.vue tests/cart.test.js
git commit -m "fix: keep cart state canonical and account-safe"
```

### Task 5: Guard checkout, lists, and route-reused detail views from stale responses

**Files:**
- Modify: `src/views/CheckoutView.vue`
- Modify: `src/views/CategoryView.vue`
- Modify: `src/views/ProductsView.vue`
- Modify: `src/views/CouponsView.vue`
- Modify: `src/views/OrdersView.vue`
- Modify: `src/views/OrderDetailView.vue`
- Modify: `src/views/ReviewView.vue`
- Modify: `src/views/AddressesView.vue`
- Create: `src/utils/address.js`
- Create: `tests/address.test.js`
- Modify: `tests/checkout.test.js`

**Interfaces:**
- Produces: request-generation guards per view and `buildAddressPayload(form)`.
- Consumes: latest route `fullPath`, params, or query snapshot; only matching generations may commit state.

- [ ] **Step 1: Add failing address DTO and terminal-submit tests**

```js
test('address payload omits display and backend response fields', () => {
  assert.deepEqual(buildAddressPayload({ id: 2, fullAddress: 'x', receiverName: '张三', receiverPhone: '13800000000', province: 'A', city: 'B', district: 'C', detailAddress: 'D', isDefault: true }), {
    receiverName: '张三', receiverPhone: '13800000000', province: 'A', city: 'B', district: 'C', detailAddress: 'D', isDefault: 1,
  })
})
```

Add a pure checkout state helper test asserting that API success makes submission terminal even if `extractOrderNo` returns an empty string.

- [ ] **Step 2: Run address/checkout tests and verify RED**

Run: `node --test tests/address.test.js tests/checkout.test.js`

Expected: FAIL for new functions.

- [ ] **Step 3: Make checkout loading generation-safe**

Refactor buy-now and cart loaders to return data objects rather than mutating shared refs during the request. `loadCheckout` captures `const sequence = ++loadSequence`, awaits the selected loader, and commits only when `sequence === loadSequence` and the captured `route.fullPath` still matches.

Include `loadSequence` in `canSubmit` validity and reject invalid normalized cart items.

- [ ] **Step 4: Separate successful order creation from navigation**

Set `orderSubmitted.value = true` immediately after the order API resolves. If no order number is returned, show a warning and route to `/orders`; if navigation fails, keep submission disabled and tell the user the order was created. API rejection before success is the only branch that re-enables submission.

- [ ] **Step 5: Add request sequence guards to category, products, coupons, and orders**

Use one monotonically increasing integer in each view. `ProductsView` keeps its existing sequence. Add the same pattern to category recommendations and order list. Coupons watch `[route.query.tab, route.query.status]`, normalize local state, and load only the relevant current data without creating a replace/watch loop.

- [ ] **Step 6: Watch reused order/review route params**

Replace `onMounted(loadOrder)` in order detail and review with route-param watchers using `{ immediate: true }` and sequence checks. Reset prior order/items before each load so direct navigation between order numbers cannot show stale data.

- [ ] **Step 7: Add address error/retry state and explicit write DTO**

Use `buildAddressPayload(form.value)` for add/update. Add `loadError` so an initial request failure renders “地址加载失败” plus a retry button, never “暂未添加”. Guard save/default/delete actions from double submission.

- [ ] **Step 8: Verify the route-state milestone**

Run: `node --test tests/address.test.js tests/checkout.test.js tests/product-search.test.js tests/order.test.js tests/review.test.js`

Expected: all targeted tests pass.

Run: `npm test`

Expected: full unit suite passes.

- [ ] **Step 9: Commit the async-state milestone**

```bash
git add src/views src/utils/address.js tests/address.test.js tests/checkout.test.js
git commit -m "fix: prevent stale commerce state and duplicate orders"
```

### Task 6: Make simulated payment conservative and monotonic

**Files:**
- Modify: `src/utils/payment.js`
- Modify: `src/views/PaymentView.vue`
- Modify: `tests/payment.test.js`

**Interfaces:**
- Produces: `mergePaymentStatus(current, incoming)` with paid as a terminal state.
- Consumes: authoritative status and order-detail amount; URL amount is ignored for authority.

- [ ] **Step 1: Add failing monotonic-payment tests**

```js
test('paid status cannot regress to processing', () => {
  const paid = normalizePaymentStatus({ isPaid: true, payment: { status: 1 } })
  const processing = normalizePaymentStatus({ payment: { status: 0 } })
  assert.equal(mergePaymentStatus(paid, processing).state, 'paid')
})

test('a known payment number plus confirmation uncertainty remains processing', () => {
  const status = normalizePaymentStatus({ payment: { paymentNo: 'P1', status: 0 } })
  assert.equal(status.canPay, false)
})
```

- [ ] **Step 2: Run payment tests and verify RED**

Run: `node --test tests/payment.test.js`

Expected: FAIL because `mergePaymentStatus` is missing.

- [ ] **Step 3: Implement terminal-state merge and request sequencing**

Paid is terminal. A status response commits only when its request sequence is newer than the last applied sequence. Reset all timers and sequences when `route.params.orderNo` changes; replace `onMounted` with an immediate watcher.

- [ ] **Step 4: Separate create, confirm, and status uncertainty**

If create fails before any payment identifier, show a retryable failure. Once create may have succeeded or a payment number exists, confirm failure/timeout sets processing and starts status polling. It must not set local failed state. Only an authoritative status response maps to failed.

- [ ] **Step 5: Load payable amount from order detail**

Call `getOrderDetail(orderNo)` as a best-effort parallel request, normalize with `normalizeOrderDetail`, and display `payAmount`. If unavailable, display “以订单为准”; do not use `route.query.amount` as an amount source.

- [ ] **Step 6: Verify simulated payment**

Run: `node --test tests/payment.test.js tests/order.test.js`

Expected: tests pass.

Run: `npm test`

Expected: full unit suite passes.

- [ ] **Step 7: Commit the payment milestone**

```bash
git add src/utils/payment.js src/views/PaymentView.vue tests/payment.test.js
git commit -m "fix: handle ambiguous simulated payment safely"
```

### Task 7: Complete registration and HTTPS-safe user image validation

**Files:**
- Modify: `src/views/auth/Register.vue`
- Modify: `src/utils/review.js`
- Modify: `tests/review.test.js`

**Interfaces:**
- Consumes: existing `sendCode({ phone })` and `register(form)` endpoints.
- Produces: single-flight code sending with a 60-second countdown; review image URLs restricted to HTTPS.

- [ ] **Step 1: Change the review URL test to require HTTPS**

```js
assert.throws(() => normalizeReviewImages(['http://img.example.com/a.jpg']), /https:\/\//)
assert.deepEqual(normalizeReviewImages(['https://img.example.com/a.jpg']), ['https://img.example.com/a.jpg'])
```

- [ ] **Step 2: Run review tests and verify RED**

Run: `node --test tests/review.test.js`

Expected: FAIL because HTTP is currently accepted.

- [ ] **Step 3: Restrict review image URLs and implement code sending**

Allow only `https:` in `normalizeReviewImages`. In registration, validate phone with `/^1[3-9]\d{9}$/`, call `sendCode({ phone: form.phone.trim() })`, and start a 60-second countdown only after success. Disable the send button while sending or while countdown is nonzero. Clear the interval in `onUnmounted`.

Do not call or expose `getMockCode` from the production UI.

- [ ] **Step 4: Verify registration-related code and review validation**

Run: `node --test tests/review.test.js tests/auth.test.js`

Expected: tests pass.

Run: `npm test`

Expected: full unit suite passes.

- [ ] **Step 5: Commit registration and image validation**

```bash
git add src/views/auth/Register.vue src/utils/review.js tests/review.test.js
git commit -m "fix: complete registration verification flow"
```

### Task 8: Add deterministic Playwright commerce regression

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `playwright.config.js`
- Create: `e2e/fixtures/api.js`
- Create: `e2e/fixtures/observability.js`
- Create: `e2e/auth.spec.js`
- Create: `e2e/catalog.spec.js`
- Create: `e2e/cart-checkout.spec.js`
- Create: `e2e/orders-payment-review.spec.js`
- Create: `e2e/responsive-smoke.spec.js`

**Interfaces:**
- Produces: `npm run test:e2e`, `npm run test:e2e:headed`, stateful route interception, and console/page/network failure collection.
- Consumes: the browser-facing `/api/**` contract and Vite `npm run dev -- --host 127.0.0.1` server.

- [ ] **Step 1: Install Playwright as a development dependency**

Run: `npm install --save-dev @playwright/test`

Expected: `package.json` and lockfile include `@playwright/test` without changing runtime dependencies.

Run: `npx playwright install chromium`

Expected: Playwright reports Chromium installed; if policy blocks download, configure the installed Chrome channel and record that environment requirement.

- [ ] **Step 2: Configure deterministic projects and web server**

```js
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173/home', reuseExistingServer: false },
  projects: [
    { name: 'desktop-1440', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-390', use: { viewport: { width: 390, height: 844 }, isMobile: true } },
  ],
})
```

- [ ] **Step 3: Build a stateful API fixture**

Intercept `**/api/**`, parse method/path/query/body, and respond with `{ code: 1, msg: 'success', data }`. Maintain in-memory token, favorite, cart, addresses, coupons, orders, payment polling round, and reviews per test. Unknown mocked endpoints return status 501 so missing coverage fails visibly.

- [ ] **Step 4: Add auth and catalog E2E**

Assert protected redirects and safe post-login return. Assert registration sends a code once and shows the countdown. Walk home → category → products → filters → detail. Use a deliberately non-Cartesian SKU fixture and assert impossible options/actions are disabled; navigate from product A to B in the same component and assert B renders.

- [ ] **Step 5: Add favorite, cart, address, coupon, and checkout E2E**

Assert favorite toggling, add-to-cart canonical ID, checkbox state sent exactly, quantity failure rollback, delete, address add/edit, coupon selection, one order create request despite repeated clicks, and navigation to payment.

- [ ] **Step 6: Add order, ambiguous payment, and review E2E**

Make `/pay/confirm` fail after create while subsequent `/pay/status` becomes paid. Assert the UI shows processing then paid and `/pay/create` was called once. Open completed order, select an order item, submit a review, and assert the exact DTO.

- [ ] **Step 7: Add responsive and observability assertions**

At 1440x900 and 390x844, load home, products, detail, cart, checkout, orders, payment, review, and address dialog. Assert `document.documentElement.scrollWidth <= window.innerWidth`, important buttons are visible, direct URLs refresh, back/forward works, and collected `console.error`, `pageerror`, and unexpected failed requests arrays are empty.

- [ ] **Step 8: Run E2E twice for repeatability**

Run: `npm run test:e2e`

Expected: all desktop and mobile tests pass.

Run: `npm run test:e2e`

Expected: the same suite passes again without order-dependent state.

- [ ] **Step 9: Commit E2E regression**

```bash
git add package.json package-lock.json playwright.config.js e2e
git commit -m "test: add deterministic commerce e2e regression"
```

### Task 9: Analyze and reduce the initial bundle

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.js`
- Modify: `src/main.js`
- Modify: `tests/element-styles.test.js`
- Create: `scripts/report-bundle.mjs`

**Interfaces:**
- Produces: per-SFC Element Plus imports, `npm run build:analyze`, and `npm run report:bundle` raw/gzip evidence.
- Consumes: the baseline entry 1,064.12 kB raw / 352.17 kB gzip and global CSS 224.86 kB / 29.97 kB gzip.

- [ ] **Step 1: Install analysis and component-resolution development tools**

Run: `npm install --save-dev unplugin-vue-components rollup-plugin-visualizer`

Expected: only development dependencies change.

- [ ] **Step 2: Change the static style test to fail on full Element Plus installation**

Assert `src/main.js` does not contain a default `ElementPlus` import or `app.use(ElementPlus)`, and assert `vite.config.js` contains `Components` plus `ElementPlusResolver` with CSS style resolution.

Run: `node --test tests/element-styles.test.js`

Expected: FAIL against the current full-plugin entry.

- [ ] **Step 3: Configure per-SFC component resolution**

```js
Components({
  resolvers: [ElementPlusResolver({ importStyle: 'css' })],
  dts: false,
})
```

Remove the default Element Plus import, `app.use(ElementPlus)`, duplicate global component registration, and the long global style list from `main.js`. Keep locale/message configuration only where supported without installing the whole library. Confirm `v-loading` resolves; if the resolver does not handle the directive in the installed version, explicitly register only `ElLoading.directive`.

- [ ] **Step 4: Add conditional visualizer and bundle reporting**

Enable `visualizer({ filename: 'dist/bundle-stats.html', gzipSize: true, brotliSize: true })` only when `ANALYZE=true`. `report-bundle.mjs` reads `dist/index.html`, identifies initial JS/CSS, scans all JS files, and prints raw and gzip sizes for entry, largest chunk, total JS, and each chunk above 50 kB.

- [ ] **Step 5: Build, inspect, then choose chunking only from evidence**

Run: `npm run build:analyze`

Expected: build succeeds and writes `dist/bundle-stats.html`.

Run: `npm run report:bundle`

Expected: entry and total metrics are printed. Add a small `manualChunks` rule only for stable Vue/Router/Pinia or Axios vendor groups if the visualizer shows a caching benefit. Do not group all Element Plus modules into one initial vendor chunk and do not raise the warning limit to hide size.

- [ ] **Step 6: Verify UI and bundle after optimization**

Run: `node --test tests/element-styles.test.js`

Expected: style/config regression passes.

Run: `npm test`

Expected: full unit suite passes.

Run: `npm run test:e2e`

Expected: all E2E tests pass with no missing Element Plus component or style.

Run: `npm run build && npm run report:bundle`

Expected: production build succeeds and final metrics are recorded for the report.

- [ ] **Step 7: Commit bundle optimization**

```bash
git add package.json package-lock.json vite.config.js src/main.js tests/element-styles.test.js scripts/report-bundle.mjs
git commit -m "perf: reduce initial Element Plus bundle cost"
```

### Task 10: Harden checked-in Apache configuration and developer docs

**Files:**
- Modify: `deploy/apache-vhost.conf`
- Modify: `deploy/site.htaccess`
- Modify: `README.md`
- Create: `tests/deployment-config.test.js`

**Interfaces:**
- Produces: correct IP `ServerName`, restricted overrides, targeted compression/caching, safe headers, and documented local/release commands.
- Consumes: existing `/api/` proxy, history fallback, legacy document-root preservation, and HTTP-only operational reality.

- [ ] **Step 1: Add failing Apache text-contract tests**

Assert the config contains `ServerName 49.235.130.42`, `AllowOverride FileInfo`, `Options -Indexes +FollowSymLinks`, immutable caching scoped to `/assets/`, `index.html` revalidation, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, framing protection, and CSP. Assert `.htaccess` still excludes `/api` and existing files/directories.

Run: `node --test tests/deployment-config.test.js`

Expected: FAIL against the current broad/minimal config.

- [ ] **Step 2: Tighten Apache without claiming TLS**

Use `AddOutputFilterByType DEFLATE` for text, JavaScript, JSON, SVG, and fonts. Add headers inside `<IfModule mod_headers.c>`. Scope long caching to `^/assets/` so legacy root assets are not accidentally cached for a year. Keep HSTS absent until a verified 443 virtual host exists.

- [ ] **Step 3: Expand README with exact workflows**

Document Node 20, `npm ci`, dev, unit, E2E, analyze, report, build, preview, Apache file placement, `.htaccess`, and the fact that public production still requires TLS and a stable backend. Do not include credentials or private server keys.

- [ ] **Step 4: Verify deployment configuration and docs**

Run: `node --test tests/deployment-config.test.js`

Expected: tests pass.

Run: `npm test`

Expected: full unit suite passes.

- [ ] **Step 5: Commit deployment and docs**

```bash
git add deploy README.md tests/deployment-config.test.js
git commit -m "chore: harden frontend deployment configuration"
```

### Task 11: Real-browser acceptance, final regression, and readiness report

**Files:**
- Create: `docs/frontend-production-readiness.md`
- Modify only if a reproduced frontend defect requires it: affected `src/**`, `tests/**`, or `e2e/**` file

**Interfaces:**
- Produces: browser evidence at 1440x900, 1920x1080, and 390x844; final command/results ledger; P0-P3 disposition; before/after bundle table.
- Consumes: all previous milestones and the public URL only for non-mutating smoke evidence.

- [ ] **Step 1: Start the local application and perform Codex Browser acceptance**

Run: `npm run dev -- --host 127.0.0.1 --port 5173`

Use the in-app browser at 1440x900, 1920x1080, and 390x844. Walk the guest and authenticated mocked flows named in the spec. Inspect console errors/warnings, failed and duplicate requests, loading/empty/error states, direct URLs, refresh, back/forward, dialogs, text clipping, images, form interaction, and horizontal overflow.

- [ ] **Step 2: Reproduce and close every browser-owned defect**

For each new frontend defect, write or strengthen an automated regression first, verify it fails, implement the smallest fix, rerun the targeted test, then repeat the exact browser action. Backend failures are captured with URL, method, status/envelope, timestamp, and visible impact; they are not converted to mock success outside E2E.

- [ ] **Step 3: Perform non-mutating public smoke checks**

Check `http://49.235.130.42/`, `/home`, one SPA deep link, one hashed asset, and one `/api/` request. Record HTTP status, security/cache headers, console/mixed-content/CORS observations, and backend envelope. Do not upload or reload Apache.

- [ ] **Step 4: Run the final automated regression**

Run: `npm test`

Expected: all unit tests pass; record exact count and duration.

Run: `npm run test:e2e`

Expected: all desktop/mobile E2E tests pass; record exact count and duration.

Run: `npm run build`

Expected: production build exits 0.

Run: `npm run report:bundle`

Expected: final raw/gzip metrics print successfully.

Run lint only if a lint script now exists. If none exists, record “not configured” rather than inventing a passing result.

- [ ] **Step 5: Review the complete diff**

Run: `git diff --check`

Expected: no whitespace errors.

Run: `git diff --stat` and `git diff`

Inspect for unrelated redesign, debug logging, dead code, weakened tests, hidden backend workarounds, stale imports, and accidental generated artifacts. Run `rg -n "console\\.|debugger" src tests e2e` and resolve production debug residue.

- [ ] **Step 6: Write the readiness report**

`docs/frontend-production-readiness.md` must include: overview; original state; P0/P1/P2/P3 findings; fixed and unfixed items; backend evidence; new unit/E2E tests; browser results by viewport; before/after entry, vendor, largest, total JS and gzip; bundle composition; adapter/architecture changes; Apache/TLS risks; exact commands and exit results; final verdict and follow-up owners.

- [ ] **Step 7: Final verification after documentation**

Run: `npm test && npm run test:e2e && npm run build`

Expected: all three commands exit 0 after the final documentation/diff cleanup.

- [ ] **Step 8: Commit the final report**

```bash
git add docs/frontend-production-readiness.md
git commit -m "docs: record frontend production readiness results"
```

## Plan Self-Review

- Spec coverage: Tasks 1-7 close confirmed frontend correctness/security-state defects; Task 8 covers deterministic E2E; Task 9 covers measured bundle work; Task 10 covers Apache/docs; Task 11 covers browser, remote evidence, final regression, diff review, and required report.
- Placeholder scan: every step names exact files, functions, commands, or observable results; no deferred implementation marker is present.
- Interface consistency: session helpers originate in Task 1; response primitives in Task 2; product/SKU functions in Task 3; address DTO in Task 5; payment merge in Task 6; Playwright scripts in Task 8; bundle scripts in Task 9; final commands consume those exact interfaces.
