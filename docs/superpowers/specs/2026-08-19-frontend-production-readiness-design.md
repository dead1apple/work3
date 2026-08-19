# Frontend Production Readiness Design

## Goal

Raise the existing Vue storefront from feature-complete to production-ready without adding unrelated business scope, hiding backend failures, changing backend API contracts, or replacing the simulated payment flow.

## Evidence Baseline

- Branch: `feature/frontend-init`; initial worktree clean.
- Runtime: Node.js `20.18.0`, npm `10.8.2`.
- Unit baseline: `npm test` passes 52/52 tests.
- Build baseline: `npm run build` succeeds with Vite `6.4.3` and 1,812 transformed modules.
- Entry JavaScript: 1,064.12 kB raw / 352.17 kB gzip.
- Global CSS: 224.86 kB raw / 29.97 kB gzip.
- Address route JavaScript: 201.55 kB raw / 55.15 kB gzip.
- The repository has route-level dynamic imports and an Apache history fallback, but no browser E2E framework.
- The existing public deployment is HTTP-only, and the prior deployment record shows backend category/product requests returning `code: -1`.

## Scope and Non-goals

### In scope

- Fix reproducible frontend P0/P1/P2 correctness, state-isolation, async-race, error-state, build, and deployment-configuration defects.
- Add deterministic Playwright E2E coverage using intercepted API responses.
- Measure and reduce initial JavaScript/CSS cost based on bundle evidence.
- Consolidate only demonstrably duplicated response and domain normalization logic.
- Validate desktop and mobile rendering, navigation, refresh, console output, and failed requests in a real browser.
- Produce `docs/frontend-production-readiness.md` and update operator/developer documentation.

### Out of scope

- No new commerce domain, page family, real payment provider, or backend API protocol.
- No frontend hardcode that turns backend errors into false success.
- No claim that TLS, payment idempotency, stock locking, price authority, coupon authority, or backend availability is solved by frontend code.
- No live-server deployment or destructive remote operation as part of this local readiness pass.
- No broad visual redesign.

## Severity Gate

- P0: core transaction, authorization, or data-isolation defect; blocks readiness.
- P1: high-probability user-visible defect; blocks readiness unless external and explicitly evidenced.
- P2: maintainability, resilience, performance, or operational defect; fix when localized and testable.
- P3: recommendation; document unless the change is nearly risk-free and directly supports another fix.

The implementation closes frontend-owned P0/P1 items first. External blockers remain visible in the final report with evidence and ownership.

## Architecture

### 1. Session and request boundary

`src/utils/auth.js` becomes the single storage boundary for reading and clearing supported tokens. Axios records the token attached to each request and only invalidates the session when a 401 belongs to the still-current token. Session invalidation clears both token aliases and persisted cart data, and redirects at most once. HTTP and business-envelope status codes are normalized to numbers.

The active `user` store remains the sole authentication store; the unused divergent `auth` store is removed. Explicit logout continues to clear Pinia user/cart state. A new login clears any pre-existing cart snapshot before accepting the new session so one account can never inherit another account's persisted cart.

The frontend will not invent refresh-token behavior because no refresh contract exists. HTTP-only transport and localStorage token exposure remain an operational/security blocker pending backend and TLS work.

### 2. Domain adapters and numeric invariants

Reusable response-boundary helpers provide four explicit operations: unwrap a `data` envelope, read an array from supported paging containers, parse a finite number, and parse a bounded positive integer. Resource-specific adapters continue to own field aliases and status mappings.

Product-detail/SKU compatibility moves out of the component into a tested adapter. An SKU is valid only when every selected specification matches an actual SKU. Invalid Cartesian combinations and zero-stock combinations cannot be added to cart or purchased. Selected price, stock, image, and maximum quantity come from the selected SKU.

Cart creation never manufactures a server identifier. If the create response lacks an authoritative cart-item ID, the store refetches the server cart; if no canonical item appears, it reports a protocol error. Checkbox handlers pass the intended checked value rather than toggling already-mutated `v-model` state. Quantity edits are single-flight per row and roll back or refetch on failure.

Address writes use an explicit DTO builder so display-only fields such as `fullAddress` are never sent to the backend.

### 3. Async state discipline

Every view that can be reused while a route/query changes assigns a monotonically increasing request sequence. Only the newest sequence may commit loading, success, or error state. This applies to product detail, category recommendations, search/order filters, checkout, order detail, review, coupon filters, and payment status.

Checkout separates API submission from post-success navigation. Once the backend returns success, the submit action becomes terminal even if the order number is absent or navigation fails; the UI directs the user to orders rather than permitting a duplicate submission.

Payment treats network ambiguity conservatively. After a payment record may have been created or confirmation may have reached the server, the UI enters `processing` and queries the authoritative status. It never converts a timeout into a definitive failure. Paid status is terminal and cannot regress due to a stale response. Displayed payable amount comes from the order-detail API, not the URL query.

### 4. UI state and routing

Existing layouts and visual language remain. Missing error/retry states are added to addresses and cart. Invalid URLs fall back through a catch-all route without adding a new business page. Registration wires its already-defined `sendCode` endpoint to the existing verification-code field with phone validation, single-flight behavior, countdown cleanup, and no production use of `mock-code`.

All transaction buttons expose disabled/loading states that correspond to actual invariants: valid SKU, stock, canonical cart IDs, address, items, current checkout load generation, and non-terminal submission.

### 5. E2E strategy

Playwright runs against the Vite dev server. A stateful API fixture intercepts `/api/**` and returns the same `{ code, msg, data }` envelope expected by Axios. Tests assert user-observable behavior and final page state, not component internals.

Coverage includes:

- protected-route redirect, safe post-login return, login and registration-code behavior;
- guest home, category, search, filter, product detail, SKU validity, and route reuse;
- favorite, cart selection/quantity/delete, address, coupon, checkout, and duplicate-submit protection;
- order list/detail, simulated payment ambiguity/polling/success, and review submission;
- 401 cleanup and cross-account cart isolation;
- desktop 1440x900 and 1920x1080 plus mobile 390x844 smoke checks;
- console errors, page errors, failed requests, direct URLs, refresh, and history navigation.

Remote-backend smoke checks are separate and never substituted for deterministic regression. A failed backend response is recorded as backend evidence.

### 6. Bundle and build design

The default `ElementPlus` plugin installation is removed. Template components and directives are resolved per SFC with `unplugin-vue-components` and `ElementPlusResolver`, while programmatic APIs and icons remain explicit named imports. This preserves route-level splitting and prevents the full component library and all styles from entering the initial chunk.

Bundle analysis is reproducible through a conditional visualizer build. A reporting script records raw and gzip sizes for the entry, largest chunk, vendor chunks, and total JavaScript. Manual chunks are added only if post-import analysis shows a stable caching benefit; Element Plus is not forced into one monolithic initial vendor chunk.

Node/npm metadata and E2E/build scripts are documented. Lint is not invented in this pass because the repository has no lint configuration; its absence is reported.

### 7. Apache hardening

The checked-in virtual-host configuration is corrected and tightened without pretending TLS exists:

- correct `ServerName`;
- retain the verified `/api/` proxy and `.htaccess` history fallback;
- restrict overrides to `FileInfo` and disable indexes;
- compress only appropriate MIME types;
- cache Vite hashed `/assets/` immutably while keeping `index.html` revalidatable;
- add safe security headers: nosniff, same-origin framing, referrer policy, permissions policy, and a CSP compatible with the current application.

HSTS is not enabled on port 80. The final report marks HTTPS, certificate provisioning, port-80 redirect, secure cookie/session architecture, and correct forwarded protocol as unresolved production requirements.

## Verification Milestones

1. Baseline: preserve exact initial tests/build/bundle evidence.
2. Correctness: targeted tests fail first, fixes pass, then all 52 existing tests remain green.
3. E2E: mocked core flows pass repeatedly on desktop and mobile projects.
4. Performance: analyze before and after; confirm smaller initial entry and no pathological micro-chunk explosion.
5. Browser: inspect real rendered pages, console, network, responsive layouts, refresh, and history.
6. Operations: validate local Apache config text and public smoke evidence without mutating the server.
7. Final: run unit, E2E, bundle budget/report, production build, optional lint only if present, and a full diff review.

## Acceptance Criteria

- No known frontend-owned P0/P1 remains without a written, evidence-backed reason.
- Existing unit tests are not removed or weakened.
- New tests reproduce the defects they protect.
- E2E does not require the unstable remote backend.
- `npm test`, full Playwright E2E, and `npm run build` all exit 0.
- The final report distinguishes executed facts, static findings, browser observations, and external blockers.
- The report includes exact commands, before/after bundle figures, browser viewport results, backend evidence, and remaining production risks.
