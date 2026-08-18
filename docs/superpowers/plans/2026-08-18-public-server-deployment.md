# Public Server Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the current Vue/Vite storefront at `http://49.235.130.42/` with same-origin access to the existing backend API.

**Architecture:** Build a versioned static release locally, upload it over SSH, and merge only its `index.html` and hashed `assets/` into the existing Baota Apache document root. Apache proxies `/api/` to the backend on `127.0.0.1:8080`; `.htaccess` sends only nonexistent paths to the Vue entry point, preserving existing legacy files and directories.

**Tech Stack:** Vue 3, Vite 6, Node.js/npm, OpenSSH, Apache HTTP Server 2.4

**Spec:** `docs/superpowers/specs/2026-08-18-public-server-deployment-design.md`

## Global Constraints

- Connect to `root@49.235.130.42:22` using the provided `codex_tmp_ssh` key.
- Never copy the private key into the repository or server.
- Preserve the existing document-root contents, including `/admin`, downloads, APKs, images, and named legacy pages.
- Proxy `/api/` to `http://127.0.0.1:8080` without stripping the `/api` prefix.
- Serve Vue Router history URLs through `/index.html`.

---

### Task 1: Validate the Release

**Files:**
- Read: `package.json`
- Read: `vite.config.js`
- Read: `src/utils/request.js`
- Produce locally: `dist/`

**Interfaces:**
- Consumes: npm dependencies pinned by `package-lock.json`
- Produces: a tested `dist/` static release whose API requests use `/api`

- [x] **Step 1: Run the unit tests**

Run: `npm test`

Expected: all Node test-runner tests pass with exit code `0`.

- [x] **Step 2: Build from source**

Run: `npm run build`

Expected: Vite exits with code `0` and creates `dist/index.html` plus hashed assets.

- [x] **Step 3: Inspect the compiled API path**

Run: `rg -n "(/api|49\\.235\\.130\\.42:8080)" dist`

Expected: the application contains the relative `/api` base and no browser-side dependency on the development proxy.

### Task 2: Inventory the Server

**Files:**
- Read remotely: `/etc/os-release`
- Read remotely: active web-server configuration and listening sockets

**Interfaces:**
- Consumes: SSH access to `root@49.235.130.42:22`
- Produces: confirmed Linux distribution, web-server layout, backend listener, and safe frontend configuration path

- [x] **Step 1: Verify non-interactive SSH access**

Run an SSH batch command with a workspace-local known-hosts file and the provided key.

Expected: the server returns its hostname and current user is `root`.

- [x] **Step 2: Inspect services without modifying them**

Read OS metadata, `nginx -V`, `nginx -T`, service status, and `ss -lntp`.

Expected: port `8080` identifies the backend and the Baota Apache configuration identifies the existing IP virtual host on port `80`.

### Task 3: Back Up and Install the Static Release

**Files:**
- Create remotely: `/www/backup/jd-mall-frontend/<UTC release timestamp>/`
- Update remotely: `/www/projects/webs/html/index.html`
- Create remotely: `/www/projects/webs/html/assets/`

**Interfaces:**
- Consumes: validated local `dist/`
- Produces: timestamped rollback files plus the new root entry point and hashed static assets

- [x] **Step 1: Archive and upload the build**

Create a gzip-compressed tar archive from the contents of `dist/` and transfer it with `scp` to `/tmp/jd-mall-frontend-<UTC release timestamp>.tar.gz`.

Expected: the remote archive checksum matches the local archive checksum.

- [x] **Step 2: Back up the active entry point and configuration**

Copy the current `index.html`, `.htaccess`, and `/www/server/panel/vhost/apache/html_49.235.130.42.conf` into `/www/backup/jd-mall-frontend/<UTC release timestamp>/` before overwriting any of them.

Expected: the backup contains all three files and is readable only by administrative users.

- [x] **Step 3: Merge the release without removing legacy content**

Extract the uploaded archive into a staging directory, install its `assets/` under `/www/projects/webs/html/assets/`, then atomically rename a staged `index.html` over `/www/projects/webs/html/index.html`.

Expected: the new root document loads while `/admin`, downloads, APKs, images, and named legacy pages remain untouched.

### Task 4: Configure Apache

**Files:**
- Update remotely: `/www/server/panel/vhost/apache/html_49.235.130.42.conf`
- Update remotely: `/www/projects/webs/html/.htaccess`

**Interfaces:**
- Consumes: `/www/projects/webs/html`, Apache proxy/rewrite modules, and backend `127.0.0.1:8080`
- Produces: public HTTP frontend plus same-origin API proxy

- [x] **Step 1: Write the site configuration**

Keep the existing port `80` virtual host and document root. Add `ProxyPreserveHost On`, proxy `/api/` unchanged to `http://127.0.0.1:8080/api/`, and set standard forwarding headers. Install an `.htaccess` rewrite that excludes `/api/` and existing files/directories, then falls back to `/index.html`.

Expected: the existing IP virtual host remains the only changed virtual host and all legacy paths keep resolving to their existing files.

- [x] **Step 2: Validate before reload**

Run: `/www/server/apache/bin/httpd -t`

Expected: syntax and configuration tests are successful.

- [x] **Step 3: Reload and check status**

Run `/www/server/apache/bin/httpd -k graceful`, then inspect the master process and logs.

Expected: Apache remains active and serves the existing document root with the new entry point.

### Task 5: Verify and Record the Result

**Files:**
- Update: `docs/superpowers/plans/2026-08-18-public-server-deployment.md`

**Interfaces:**
- Consumes: deployed frontend and proxy configuration
- Produces: verified public URL and documented operational result

- [x] **Step 1: Verify from the server**

Request `/`, `/home`, a known legacy path, and `/api/` through `127.0.0.1` with the expected Host header.

Expected: `/` and `/home` return the SPA document; the legacy path still returns its original file; `/api/` reaches the backend even if that backend route itself returns an application error.

- [x] **Step 2: Verify from the public network**

Request `http://49.235.130.42/` and `http://49.235.130.42/home` from the local machine.

Expected: both return HTTP `200` with the application HTML.

- [x] **Step 3: Perform a browser-level smoke check**

Load the public page, confirm visible application content, and inspect whether initial API calls complete without a cross-origin error.

Expected: the storefront renders and browser requests use `http://49.235.130.42/api/...`.

## Deployment Result

- Deployed release: `20260818-100305Z`
- Public URL: `http://49.235.130.42/`
- Rollback backup: `/www/backup/jd-mall-frontend/20260818-100305Z`
- Local verification: `npm test` passed 42 of 42 tests; `npm run build` completed successfully.
- Apache verification: `/www/server/apache/bin/httpd -t` returned `Syntax OK`.
- HTTP verification: `/`, `/home`, the main JavaScript asset, `/api/category/tree`, `/download.html`, and `/admin/` returned HTTP `200` from both the server and the public network.
- Preservation verification: `/download.html` and `/admin/index.html` retained their pre-deployment SHA-256 hashes.
- Browser smoke check: the public page loaded with title `京东商城`.
- Backend caveat: the proxy works, but the Java backend currently returns `{ "code": -1, "msg": "系统内部错误，请稍后重试", "data": null }` for category and product data requests. This is an application/backend issue rather than a frontend or Apache reachability issue.

## Self-Review

- Spec coverage: every deployment, preservation, routing, API proxy, and verification constraint maps to Tasks 1-5.
- Placeholder scan: no deferred implementation steps remain; the release ID is intentionally generated from the UTC deployment timestamp.
- Interface consistency: the local `dist/` output feeds the preserved document root, Apache exposes frontend and API paths, and the timestamped backup contains every overwritten file.
