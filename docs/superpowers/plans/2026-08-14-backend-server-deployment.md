# Backend Server Mock Integration and Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a `backend-server` branch whose mock SMS and payment APIs return frontend-ready results, then deploy it with seeded test data to `49.235.130.42`.

**Architecture:** Keep the existing Spring Boot, MyBatis, MySQL, Redis, and Sa-Token design. In mock mode, return the generated SMS code from the send endpoint and complete payment synchronously while preserving order/payment state. Package the application as a JAR, run it in a Java 17 container with host networking, and give it a dedicated MySQL database user.

**Tech Stack:** Java 17, Spring Boot 3.2.5, JUnit 5, Mockito, Maven Wrapper, MySQL 5.7, Redis, Docker Compose.

---

### Task 1: Return the SMS code in mock mode

**Files:**
- Create: `mall-server/mall_server/src/test/java/com/ngsz/mall_server/service/impl/UserServiceImplTest.java`
- Create: `mall-server/mall_server/src/test/java/com/ngsz/mall_server/controller/AuthControllerTest.java`
- Modify: `mall-server/mall_server/src/main/java/com/ngsz/mall_server/service/UserService.java`
- Modify: `mall-server/mall_server/src/main/java/com/ngsz/mall_server/service/impl/UserServiceImpl.java`
- Modify: `mall-server/mall_server/src/main/java/com/ngsz/mall_server/controller/AuthController.java`

- [ ] **Step 1: Write failing service and controller tests**

```java
String code = service.sendVerifyCode("13800138000");
assertThat(code).matches("\\d{6}");

Result<?> result = controller.sendCode(dto);
assertThat((Map<?, ?>) result.getData()).containsEntry("code", "123456");
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `./mvnw.cmd -Dtest=UserServiceImplTest,AuthControllerTest test`

Expected: compilation failure because `sendVerifyCode` still returns `void` and the controller response has no mock payload.

- [ ] **Step 3: Implement the minimal mock response**

Change `sendVerifyCode` to return the generated code only when `mall.sms.mock=true`; return `null` otherwise. Return `{mock: true, code: <six digits>, expiresIn: 300}` from `/api/auth/send-code` when a code is present.

- [ ] **Step 4: Run focused and full tests and verify GREEN**

Run: `./mvnw.cmd -Dtest=UserServiceImplTest,AuthControllerTest test`

Run: `./mvnw.cmd test`

Expected: all tests pass with zero failures and zero errors.

### Task 2: Complete payment immediately in mock mode

**Files:**
- Create: `mall-server/mall_server/src/test/java/com/ngsz/mall_server/service/impl/PayServiceImplTest.java`
- Modify: `mall-server/mall_server/src/main/java/com/ngsz/mall_server/service/impl/PayServiceImpl.java`

- [ ] **Step 1: Write a failing payment service test**

```java
Map<String, Object> result = service.createPayment("JD1001", 1, 3L);
Payment payment = (Payment) result.get("payment");
assertThat(payment.getStatus()).isEqualTo(1);
assertThat(result).containsEntry("paid", true).containsEntry("mock", true);
verify(skuMapper).deductStock(10L, 2);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `./mvnw.cmd -Dtest=PayServiceImplTest test`

Expected: assertion failure because a newly created payment remains pending (`status=0`).

- [ ] **Step 3: Implement synchronous mock completion**

Mark `createPayment` transactional. Reuse pending payment records, make already-paid requests idempotent, and in mock mode update the payment and order before returning `{payment, paid: true, mock: true, mockTip}`. Keep non-mock mode pending behavior unchanged.

- [ ] **Step 4: Run focused and full tests and verify GREEN**

Run: `./mvnw.cmd -Dtest=PayServiceImplTest test`

Run: `./mvnw.cmd test`

Expected: all tests pass with zero failures and zero errors.

### Task 3: Add repeatable deployment packaging

**Files:**
- Create: `deploy/backend-server/Dockerfile`
- Create: `deploy/backend-server/.dockerignore`
- Create: `deploy/backend-server/.gitignore`
- Create: `deploy/backend-server/docker-compose.yml`
- Create: `deploy/backend-server/.env.example`
- Modify: `mall-server/mall_server/src/main/resources/application.yml`

- [ ] **Step 1: Parameterize deployment settings**

Use Spring environment placeholders for datasource, Redis, SMS mock, and payment mock settings. Require `DB_PASSWORD` at runtime and do not put database passwords in Git.

- [ ] **Step 2: Add a Java 17 runtime image and Compose service**

The image copies `target/mall_server-0.0.1-SNAPSHOT.jar`, runs as an unprivileged user, uses host networking, restarts automatically, and exposes a health check against `/v3/api-docs`.

- [ ] **Step 3: Build the production artifact**

Run: `./mvnw.cmd clean package`

Expected: `BUILD SUCCESS` and `target/mall_server-0.0.1-SNAPSHOT.jar` exists.

### Task 4: Initialize and deploy the server

**Server paths:**
- Application: `/opt/jd-mall-backend`
- Compose file: `/opt/jd-mall-backend/docker-compose.yml`
- Environment file: `/opt/jd-mall-backend/.env` with mode `600`
- Database schema and seed scripts: `/opt/jd-mall-backend/sql/`

- [ ] **Step 1: Create the dedicated database and account**

Create database `jd_mall`, user `jd_mall_app@localhost`, and grant only `jd_mall.*`. Generate a random password on the server and write it only to the restricted deployment environment file.

- [ ] **Step 2: Upload and import schema plus seed data**

Upload `docx/database.sql` and `docx/seed-data.sql`, execute both, and verify expected row counts (8 users, 12 products, 30 SKUs, and 8 orders).

- [ ] **Step 3: Upload JAR and Compose configuration**

Copy the packaged JAR and deployment files to `/opt/jd-mall-backend`, then run `docker compose up -d --build`.

- [ ] **Step 4: Verify container health and logs**

Run: `docker compose ps`

Run: `docker compose logs --tail=100 backend-server`

Expected: service is running, Spring Boot started, and there are no datasource or Redis errors.

### Task 5: Run online smoke tests and publish the branch

**Files:**
- Verify all modified and created files from Tasks 1-3.

- [ ] **Step 1: Verify public and authentication APIs**

Call `/v3/api-docs`, `/api/products`, and `/api/auth/login` using `testuser / 123456`. Verify HTTP 200 and response `code=1`.

- [ ] **Step 2: Verify direct mock SMS response**

Call `/api/auth/send-code` for an unused test phone. Verify the response contains `mock=true` and a six-digit `code`.

- [ ] **Step 3: Verify direct mock payment response**

Log in as `testuser`, create or select a pending seeded order, call `/api/pay/create`, and verify the response contains `paid=true`, payment status `1`, and a `MOCK_` third-party number.

- [ ] **Step 4: Verify Git diff and full test suite**

Run: `git diff --check`

Run: `./mvnw.cmd test`

Expected: no whitespace errors and all tests pass.

- [ ] **Step 5: Commit and push**

Commit only source, tests, deployment manifests, and this plan. Leave `mall-server/mall_server.rar` untracked. Push `backend-server` to `origin/backend-server`, using the known one-command GitHub DNS/proxy override if required.

---

## Plan Self-Review

- Spec coverage: branch creation, mock SMS, mock payment, seed data, deployment, online verification, and push are all mapped to tasks.
- Placeholder scan: no deferred implementation placeholders remain.
- Type consistency: `UserService.sendVerifyCode` returns nullable `String`; controller and tests use the same contract. `PayService.createPayment` remains `Map<String, Object>` and adds stable `paid`/`mock` keys.
