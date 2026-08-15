# 分类页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the category placeholder with a responsive, API-backed JD-style category page.

**Architecture:** Normalize the category-tree and product-list payloads in a pure utility module. `CategoryView.vue` owns selection, requests, loading, errors, navigation, and responsive presentation.

**Tech Stack:** Vue 3 Composition API, Vue Router, Element Plus, Node.js built-in test runner.

## Global Constraints

- Reuse `getCategoryTree` and `getProductList`; do not add API endpoints.
- Keep `CategoryView.vue` as the existing `/category` route component.
- Use `ElMessage.error` for request errors and support desktop and mobile layouts.

---

### Task 1: Normalize category and recommendation payloads

**Files:**
- Create: `src/utils/category.js`
- Create: `tests/category.test.js`

**Interfaces:**
- Produces `normalizeCategoryTree(payload)`, `getChildCategories(category)`, and `normalizeCategoryProducts(payload)`.

- [ ] **Step 1: Write the failing test**

```js
test('normalizes category tree nodes', () => {
  assert.deepEqual(normalizeCategoryTree([{ category: { id: 1, name: '手机数码' }, children: [] }]), [{ id: 1, name: '手机数码', children: [] }])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/category.test.js`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Write minimal implementation**

```js
export const normalizeCategoryTree = (payload) => (Array.isArray(payload) ? payload : []).map((node) => ({ id: node?.category?.id, name: node?.category?.name || '未命名分类', children: normalizeCategoryTree(node?.children) })).filter((item) => item.id)
export const getChildCategories = (category) => category?.children || []
export const normalizeCategoryProducts = (payload) => (payload?.list || []).map((item) => ({ id: item?.product?.id, title: item?.product?.name || '未命名商品', image: item?.product?.mainImage || '', price: Number(item?.minPrice ?? 0) })).filter((item) => item.id)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/category.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/utils/category.js tests/category.test.js && git commit -m "feat: normalize category page data"`

### Task 2: Build the responsive category view

**Files:**
- Modify: `src/views/CategoryView.vue`
- Test: `tests/category.test.js`

**Interfaces:**
- Consumes `getCategoryTree()`, `getProductList({ categoryId, page, size })`, and Task 1 helpers.
- Produces an interactive `/category` page routing children to `/home?categoryId=<id>` and products to `/product/<id>`.

- [ ] **Step 1: Extend the failing test**

```js
test('returns empty collections for missing category data', () => {
  assert.deepEqual(normalizeCategoryTree(null), [])
  assert.deepEqual(normalizeCategoryProducts(null), [])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/category.test.js`

Expected: FAIL until missing payloads are handled.

- [ ] **Step 3: Implement the view**

Use `selectedCategoryId`, category and product loading refs, and a computed selected category. Load the category tree on mount, select its first item, then fetch eight products for the selected ID. Render an `el-menu` desktop sidebar, mobile horizontal category bar, `el-row`/`el-col` children grid, responsive product-card grid, skeletons, empty state, and `ElMessage.error` request feedback.

- [ ] **Step 4: Run focused tests and build**

Run: `npm test -- tests/category.test.js && npm run build`

Expected: PASS and successful Vite build.

- [ ] **Step 5: Commit**

Run: `git add src/views/CategoryView.vue src/utils/category.js tests/category.test.js && git commit -m "feat: add linked category page"`

### Task 3: Regression verification

**Files:**
- Test: `tests/auth.test.js`, `tests/cart.test.js`, `tests/category.test.js`

- [ ] **Step 1: Run all automated tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: successful production build.

- [ ] **Step 3: Check the final diff**

Run: `git diff --check HEAD && git status --short`

Expected: no whitespace errors and no uncommitted category-page files.
