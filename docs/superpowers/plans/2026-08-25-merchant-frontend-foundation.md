# Merchant Frontend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready Vue 3 merchant SPA foundation that runs under `/merchant/`, authenticates against the existing backend, and authorizes only users whose trusted `/api/user/info` role is 1.

**Architecture:** A strict Axios boundary returns only backend `data`, a Pinia session store owns authentication state, and a Vue Router history guard waits for trusted session restoration before protected navigation. The UI is a small Element Plus merchant shell with login, home, 403, and 404 states.

**Tech Stack:** Vue 3, Vite, Vue Router, Pinia, Axios, Element Plus, JavaScript, Vitest, Vue Test Utils, jsdom

**Spec:** `docs/superpowers/specs/2026-08-25-merchant-frontend-foundation-design.md`

## Global Constraints

- Production base is exactly `/merchant/`.
- Axios base URL is exactly `/api`.
- Only `{ code, msg, data }` is accepted and only `code === 1` succeeds.
- Only `/api/user/info` with `role === 1` grants merchant access.
- Token storage key is defined once as `merchant_access_token` and remains explicitly temporary.
- No merchant product, order, coupon, or shop business API is called.
- JavaScript only; do not introduce TypeScript, SSR, or a persistence plugin.
- The current directory is a new standalone project; initialize Git locally so each independently testable task can be committed.

---

### Task 1: Project scaffold, token utility, and strict request boundary

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `vitest.setup.js`
- Create: `src/config/auth.js`
- Create: `src/utils/token.js`
- Create: `src/utils/api-errors.js`
- Create: `src/utils/request.js`
- Create: `src/utils/__tests__/token.spec.js`
- Create: `src/utils/__tests__/request.spec.js`

**Interfaces:**
- Produces: `AUTH_TOKEN_KEY`, `getToken()`, `setToken(token)`, `clearToken()`.
- Produces: `ApiBusinessError`, `ApiProtocolError`.
- Produces: Axios instance `request` and `setUnauthorizedHandler(handler)`.

- [ ] **Step 1: Initialize the package and test runner configuration**

Create scripts `dev`, `build`, `preview`, and `test`; configure Vite with `base: '/merchant/'`, Vue plugin, and `/api` proxy target `http://49.235.130.42:8080`. Configure Vitest for jsdom and `vitest.setup.js`.

- [ ] **Step 2: Write failing token and request tests**

Test exact token storage operations, Authorization injection, successful data extraction, `ApiBusinessError` for non-1 code, `ApiProtocolError` for missing response fields, and HTTP 401 clearing token plus invoking the registered handler. Use a custom Axios adapter so no test reaches the network.

```js
expect(AUTH_TOKEN_KEY).toBe('merchant_access_token')
expect(await request.get('/ok')).toEqual({ id: 2 })
await expect(request.get('/business-error')).rejects.toMatchObject({ code: -1 })
await expect(request.get('/unknown')).rejects.toBeInstanceOf(ApiProtocolError)
```

- [ ] **Step 3: Install dependencies and run tests to verify red**

Run `npm install vue vue-router pinia axios element-plus @element-plus/icons-vue` and `npm install -D vite @vitejs/plugin-vue vitest @vue/test-utils jsdom`. Then run `npm test -- --run src/utils`; expect failures because token and request modules are absent.

- [ ] **Step 4: Implement the minimal strict request boundary**

Use own-property checks for all three response fields. Attach the raw token as `Authorization`. For HTTP 401, clear storage before awaiting or invoking the application handler. Do not add Bearer, cookie fallback, or alternate response parsing.

- [ ] **Step 5: Run focused tests and commit**

Run `npm test -- --run src/utils`; expect all focused tests to pass. Initialize Git if needed and commit the scaffold plus request boundary with message `feat: initialize merchant frontend request foundation`.

### Task 2: Auth API and trusted merchant session

**Files:**
- Create: `src/api/auth.js`
- Create: `src/store/session.js`
- Create: `src/store/__tests__/session.spec.js`

**Interfaces:**
- Consumes: `request`, token utility, `ApiProtocolError`.
- Produces: `login(credentials)`, `getCurrentUser()`, `logout()` API functions.
- Produces: `useSessionStore()` with `signIn(credentials)`, `restore()`, `signOut()`, `invalidate()`, `isMerchant`, and `displayName`.
- Produces: `MerchantAccessError` with code `MERCHANT_ACCESS_DENIED`.

- [ ] **Step 1: Write failing session tests**

Mock `src/api/auth.js` and cover: sign-in saves returned token then calls current-user endpoint; only role 1 authenticates; roles 0 and 2 clear token and throw `MerchantAccessError`; missing login token throws `ApiProtocolError`; restore without a token stays anonymous; concurrent restore calls share one request; sign-out clears local state even when remote logout rejects.

```js
await store.signIn({ username: 'merchant', password: '123456' })
expect(authApi.getCurrentUser).toHaveBeenCalledOnce()
expect(store.user.role).toBe(1)
expect(getToken()).toBe('server-token')
```

- [ ] **Step 2: Run the session test to verify red**

Run `npm test -- --run src/store/__tests__/session.spec.js`; expect module resolution failure for the missing session store.

- [ ] **Step 3: Implement auth API and session state machine**

`login` posts to `/auth/login`, `getCurrentUser` gets `/user/info`, and `logout` posts to `/user/logout`. The store uses statuses `idle`, `restoring`, `authenticated`, and `anonymous`; it never persists role or user. Clear partial authentication on every failed trust check.

- [ ] **Step 4: Run focused tests and commit**

Run `npm test -- --run src/store/__tests__/session.spec.js`; expect all session tests to pass. Commit with message `feat: add trusted merchant session`.

### Task 3: Router and authorization guard

**Files:**
- Create: `src/router/guard.js`
- Create: `src/router/index.js`
- Create: `src/router/__tests__/guard.spec.js`

**Interfaces:**
- Consumes: `useSessionStore()` and `getToken()`.
- Produces: `createMerchantGuard(sessionStore)` and application `router`.
- Produces route names: `login`, `merchant-home`, `forbidden`, `not-found`.

- [ ] **Step 1: Write failing guard tests**

Call the guard as a pure async function. Verify anonymous protected navigation returns login with a local redirect; role 1 returns true; valid non-merchant returns forbidden; authenticated merchant visiting login returns home; external-looking redirect values are not propagated.

```js
expect(await guard({ fullPath: '/', meta: { requiresMerchant: true } })).toEqual({
  name: 'login',
  query: { redirect: '/' },
})
```

- [ ] **Step 2: Run the guard test to verify red**

Run `npm test -- --run src/router/__tests__/guard.spec.js`; expect module resolution failure for the missing guard.

- [ ] **Step 3: Implement history routes and guard**

Create Router with `createWebHistory(import.meta.env.BASE_URL)`. Define `/login`, layout parent `/` with home child, `/403`, and `/:pathMatch(.*)*`. Protected navigation must await `session.restore()` and trust the resulting session state only.

- [ ] **Step 4: Run focused tests and commit**

Run `npm test -- --run src/router/__tests__/guard.spec.js`; expect all guard tests to pass. Commit with message `feat: add merchant authorization routes`.

### Task 4: Application shell and route views

**Files:**
- Create: `src/main.js`
- Create: `src/App.vue`
- Create: `src/styles/base.css`
- Create: `src/layouts/MerchantLayout.vue`
- Create: `src/views/LoginView.vue`
- Create: `src/views/HomeView.vue`
- Create: `src/views/ForbiddenView.vue`
- Create: `src/views/NotFoundView.vue`
- Create: `src/views/__tests__/LoginView.spec.js`
- Create: `src/layouts/__tests__/MerchantLayout.spec.js`

**Interfaces:**
- Consumes: Pinia session store and route names.
- Produces: the runnable merchant SPA.

- [ ] **Step 1: Write failing component tests**

Mount LoginView with mocked router/session and assert credentials are submitted, trusted merchant navigation follows a safe local redirect, access denial navigates to forbidden, and other errors render actionable text. Mount MerchantLayout and assert the only navigation item is 首页, user display name is visible, `/` is the user-mall link, shop entry is explicitly disabled, and logout invokes session cleanup plus login navigation.

- [ ] **Step 2: Run component tests to verify red**

Run `npm test -- --run src/views src/layouts`; expect missing component failures.

- [ ] **Step 3: Implement accessible responsive UI**

Build a utility-first merchant console with a dark navy sidebar, warm off-white workspace, teal accent, visible focus rings, reduced-motion support, desktop fixed navigation, and a mobile drawer. Do not render business metrics or inactive business menus.

- [ ] **Step 4: Wire the unauthorized handler at application startup**

Register a handler that calls `session.invalidate()` and replaces the current protected route with login plus a local redirect. Install Pinia, Router, Element Plus, and icons in `main.js`.

- [ ] **Step 5: Run component and full tests, then commit**

Run `npm test -- --run src/views src/layouts`, then `npm test -- --run`; expect all tests to pass. Commit with message `feat: add merchant login and workspace shell`.

### Task 5: Deployment documentation and final verification

**Files:**
- Create: `README.md`
- Create: `deploy/nginx-merchant.conf.example`

**Interfaces:**
- Documents build, dev proxy, `/merchant/` deployment, history fallback, `/api` proxy expectation, route list, session trust flow, and temporary token-key policy.

- [ ] **Step 1: Write the Nginx example and README**

The example must use `location ^~ /merchant/`, `try_files $uri $uri/ /merchant/index.html`, and a separate `/api/` reverse proxy placeholder pointing at `http://49.235.130.42:8080`. Explain that the example is not automatically applied to the server.

- [ ] **Step 2: Run fresh verification**

Run `npm test -- --run` and require zero failed tests. Run `npm run build` and require exit code 0. Inspect `dist/index.html` for `/merchant/assets/` references and use `rg --files` to report the final source structure.

- [ ] **Step 3: Review scope and commit**

Search source for `/api/merchant/products`, `/api/merchant/orders`, coupon endpoints, and shop endpoints; require no matches. Search for hardcoded token-key copies; require only the config definition and tests/documentation references. Commit with message `docs: document merchant deployment and verification`.
