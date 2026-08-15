# 商城分类导航与中文排版修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让首页和分类页仅展示可由真实分类 ID 访问的分类，修复分类跳转、中文挤字和首页商品卡片误导性加号。

**Architecture:** 在 `src/utils/category.js` 中集中实现分类树展开、首页分类选择和商品查询目标计算，页面只负责请求、状态和渲染。首页与分类页统一使用命名路由 `products` 和 `categoryId`，不再把分类名称当商品关键词，也不再把细分品类送回首页。

**Tech Stack:** Vue 3 Composition API、Vue Router 4、Element Plus、Node.js 内置测试运行器、Vite 6。

## Global Constraints

- 不新增或修改后端接口，不虚构分类或商品数据。
- 不实现首页快捷加入购物车，直接删除加号控件。
- 保留工作区已有未提交改动，不覆盖或回退无关文件内容。
- 中文标题不得使用负字距；英文眉题继续保留独立的正字距。
- 所有展示出的分类入口都必须使用接口提供的真实 ID。
- 不新增 UI 依赖，继续沿用现有响应式断点和 Element Plus 组件。

## 执行复核调整

实施前按测试规范复核后，取消原计划中仅通过正则搜索 Vue/CSS 源码的 `storefront-navigation.test.js`：这种测试只能检测文本变化，不能证明用户行为。分类跳转改由纯函数 `buildCategoryProductsRoute(categoryId)` 的真实返回值测试保护；模板删除加号和中文字距调整由生产构建、实际接口数据与页面检查验证。当前 Windows 沙箱阻止浏览器运行时连接，因此页面检查以编译结果、路由函数测试和实际后端分类/商品响应为依据，不安装额外浏览器依赖。

---

### Task 1: 建立可测试的分类选择与展开规则

**Files:**
- Modify: `src/utils/category.js`
- Test: `tests/category.test.js`

**Interfaces:**
- Consumes: `normalizeCategoryTree(payload)` 产生的 `{ id, name, children }[]`。
- Produces: `flattenCategoryTree(categories, depth = 0, parentId = null)`、`selectFeaturedCategories(categories, limit = 10)`、`getProductCategoryTargets(category)`。

- [ ] **Step 1: 编写失败测试，覆盖展开顺序、层级和父节点 ID**

```js
test('flattens all category levels with navigation metadata', () => {
  const tree = [{ id: 1, name: '数码', children: [{ id: 11, name: '手机', children: [] }] }]
  assert.deepEqual(flattenCategoryTree(tree), [
    { id: 1, name: '数码', children: tree[0].children, depth: 0, parentId: null },
    { id: 11, name: '手机', children: [], depth: 1, parentId: 1 },
  ])
})
```

- [ ] **Step 2: 运行测试并确认因导出不存在而失败**

Run: `node --test tests/category.test.js`

Expected: FAIL，错误指向 `flattenCategoryTree` 未导出，而不是语法或夹具错误。

- [ ] **Step 3: 实现最小的深度优先展开函数**

```js
export const flattenCategoryTree = (categories = [], depth = 0, parentId = null) => categories.flatMap((category) => {
  const current = { ...category, depth, parentId }
  return [current, ...flattenCategoryTree(category.children || [], depth + 1, category.id)]
})
```

- [ ] **Step 4: 运行分类测试并确认展开测试通过**

Run: `node --test tests/category.test.js`

Expected: PASS。

- [ ] **Step 5: 编写失败测试，覆盖首页优先叶子、数量限制和 ID 去重**

```js
test('selects real leaf categories first for the home shortcuts', () => {
  const tree = [
    { id: 1, name: '数码', children: [{ id: 11, name: '手机', children: [] }, { id: 12, name: '电脑', children: [] }] },
    { id: 2, name: '图书', children: [] },
    { id: 2, name: '重复图书', children: [] },
  ]
  assert.deepEqual(selectFeaturedCategories(tree, 2).map(({ id }) => id), [11, 12])
  assert.deepEqual(selectFeaturedCategories(tree, 10).map(({ id }) => id), [11, 12, 2, 1])
})
```

- [ ] **Step 6: 运行测试并确认因选择函数未导出而失败**

Run: `node --test tests/category.test.js`

Expected: FAIL，错误指向 `selectFeaturedCategories` 未导出。

- [ ] **Step 7: 实现叶子优先、稳定排序和去重**

```js
export const selectFeaturedCategories = (categories = [], limit = 10) => {
  const all = flattenCategoryTree(categories)
  const ordered = [...all.filter((category) => !category.children.length), ...all.filter((category) => category.children.length)]
  const unique = new Map()
  ordered.forEach((category) => {
    if (category.id && !unique.has(category.id)) unique.set(category.id, category)
  })
  return Array.from(unique.values()).slice(0, Math.max(0, limit))
}
```

- [ ] **Step 8: 编写失败测试，覆盖一级分类聚合与叶子分类直查**

```js
test('chooses child IDs for a parent and its own ID for a leaf', () => {
  const leaf = { id: 11, name: '手机', children: [] }
  const parent = { id: 1, name: '数码', children: [leaf, { id: 12, name: '电脑', children: [] }] }
  assert.deepEqual(getProductCategoryTargets(parent).map(({ id }) => id), [11, 12])
  assert.deepEqual(getProductCategoryTargets(leaf).map(({ id }) => id), [11])
})
```

- [ ] **Step 9: 实现商品查询目标规则并运行测试**

```js
export const getProductCategoryTargets = (category) => {
  if (!category) return []
  return category.children?.length ? category.children : [category]
}
```

Run: `node --test tests/category.test.js`

Expected: 所有分类工具测试 PASS。

---

### Task 2: 让首页十个分类入口使用真实分类 ID

**Files:**
- Modify: `src/views/home/index.vue`
- Create: `tests/storefront-navigation.test.js`
- Test: `tests/category.test.js`

**Interfaces:**
- Consumes: `getCategoryTree()`、`normalizeCategoryTree(payload)`、`selectFeaturedCategories(categories, 10)`。
- Produces: 最多十个真实分类入口；点击时调用 `router.push({ name: 'products', query: { categoryId: category.id } })`。

- [ ] **Step 1: 编写首页源码回归测试**

```js
test('home shortcuts use category IDs and do not render a fake plus action', () => {
  const source = readFileSync(new URL('../src/views/home/index.vue', import.meta.url), 'utf8')
  assert.match(source, /getCategoryTree/)
  assert.match(source, /name:\s*['"]products['"]/)
  assert.match(source, /categoryId:\s*category\.id/)
  assert.doesNotMatch(source, /class="add-button"/)
  assert.doesNotMatch(source, /query:\s*\{\s*keyword:\s*category\.name/)
})
```

- [ ] **Step 2: 运行回归测试并确认旧首页失败**

Run: `node --test tests/storefront-navigation.test.js`

Expected: FAIL，至少命中缺少 `getCategoryTree`、仍用 `keyword` 或仍存在 `add-button` 中的一项。

- [ ] **Step 3: 将硬编码分类替换为接口分类状态**

```js
import { getCategoryTree, getProductList } from '../../api/index.js'
import { normalizeCategoryTree, selectFeaturedCategories } from '../../utils/category.js'

const categoryLoading = ref(true)
const categoryList = ref([])

const loadCategories = async () => {
  categoryLoading.value = true
  try {
    categoryList.value = selectFeaturedCategories(normalizeCategoryTree(await getCategoryTree()), 10)
  } catch (error) {
    categoryList.value = []
    ElMessage.warning(error.message || '分类加载失败，请稍后重试')
  } finally {
    categoryLoading.value = false
  }
}

onMounted(() => Promise.allSettled([loadProducts(), loadCategories()]))
```

保留现有十个图标组件并把它们与色调组合为 `categoryVisuals` 数组，模板按分类索引循环取视觉配置；只移除硬编码的分类名称和分类数据，不把图标配置写回接口数据模型。

- [ ] **Step 4: 修改分类入口路由和分类区状态**

```vue
<button type="button" @click="router.push({ name: 'products', query: { categoryId: category.id } })">
  <span>{{ category.name }}</span>
</button>
<el-skeleton v-if="categoryLoading" :rows="2" animated />
<el-empty v-else-if="!categoryList.length" :image-size="72" description="暂时没有可浏览的分类" />
```

- [ ] **Step 5: 删除加号按钮并让价格区域保持左对齐**

```vue
<div class="product-bottom"><p class="price"><small>￥</small>{{ product.price }}</p></div>
```

删除 `.add-button`、`.add-button:hover`，将 `.product-bottom` 的 `justify-content` 改为 `flex-start`。

- [ ] **Step 6: 运行首页回归测试和分类工具测试**

Run: `node --test tests/storefront-navigation.test.js tests/category.test.js`

Expected: PASS。

---

### Task 3: 展开分类页导航并修复细分品类跳转

**Files:**
- Modify: `src/views/CategoryView.vue`
- Modify: `tests/storefront-navigation.test.js`
- Test: `tests/category.test.js`

**Interfaces:**
- Consumes: `flattenCategoryTree(categories)`、`getProductCategoryTargets(category)`、`getProductList({ categoryId, page: 1, size: 8 })`。
- Produces: 全树导航、叶子分类直接商品查询、父分类子项聚合，以及 `products?categoryId=<id>` 细分品类跳转。

- [ ] **Step 1: 扩展失败测试，锁定分类页目标路由**

```js
test('category children navigate to the filtered product results page', () => {
  const source = readFileSync(new URL('../src/views/CategoryView.vue', import.meta.url), 'utf8')
  assert.match(source, /name:\s*['"]products['"]/)
  assert.match(source, /categoryId:\s*category\.id/)
  assert.doesNotMatch(source, /name:\s*['"]home['"].*categoryId/)
  assert.match(source, /flattenCategoryTree/)
  assert.match(source, /getProductCategoryTargets/)
})
```

- [ ] **Step 2: 运行测试并确认旧分类页失败**

Run: `node --test tests/storefront-navigation.test.js`

Expected: FAIL，因为旧实现仍把细分品类送到 `home`，且未展开全树导航。

- [ ] **Step 3: 使用全树导航查找当前分类**

```js
const navigationCategories = computed(() => flattenCategoryTree(categories.value))
const selectedCategory = computed(() => navigationCategories.value.find((category) => category.id === selectedCategoryId.value) || null)
const visibleCategories = computed(() => {
  const current = selectedCategory.value
  return current?.children?.length ? current.children : current ? [current] : []
})
```

桌面菜单和移动导航均遍历 `navigationCategories`；一级项保持强调，细分项使用 `depth` 添加缩进和辅助样式。

- [ ] **Step 4: 让父分类聚合子分类、叶子分类查询自身**

```js
const targets = getProductCategoryTargets(category)
const results = await Promise.allSettled(targets.map((target) => getProductList({ categoryId: target.id, page: 1, size: 8 })))
const successful = results.filter((result) => result.status === 'fulfilled')
if (!successful.length && results.length) throw results[0].reason
successful.flatMap((result) => normalizeCategoryProducts(result.value)).forEach((product) => uniqueProducts.set(product.id, product))
```

保留按商品 ID 去重和最多八件的限制。局部请求失败时展示其他成功结果；全部失败时进入原有错误处理。

- [ ] **Step 5: 修复细分品类路由并更新展示文案**

```js
const goToCategory = (category) => router.push({ name: 'products', query: { categoryId: category.id } })
```

模板中的品类计数和网格改用 `visibleCategories`。叶子分类选中时显示一个可进入商品结果页的当前品类卡片，不再显示“暂无细分品类”。

- [ ] **Step 6: 运行导航与分类测试**

Run: `node --test tests/storefront-navigation.test.js tests/category.test.js`

Expected: PASS。

---

### Task 4: 修复中文标题字距并建立样式回归保护

**Files:**
- Modify: `src/views/home/index.vue`
- Modify: `src/style.css`
- Modify: `tests/storefront-navigation.test.js`

**Interfaces:**
- Consumes: 首页现有 `.banner-copy h1`、`h2` 和全局 `.page-title h1` 样式。
- Produces: 中文标题自然字距；英文 `.banner-kicker`、`.section-kicker`、`.page-title p` 保持正字距。

- [ ] **Step 1: 编写失败的字距回归测试**

```js
test('Chinese commerce headings do not use negative letter spacing', () => {
  const home = readFileSync(new URL('../src/views/home/index.vue', import.meta.url), 'utf8')
  const globalStyles = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
  assert.doesNotMatch(home, /\.banner-copy h1\s*\{[^}]*letter-spacing:\s*-/s)
  assert.doesNotMatch(home, /h2\s*\{[^}]*letter-spacing:\s*-/s)
  assert.doesNotMatch(globalStyles, /\.page-title h1\s*\{[^}]*letter-spacing:\s*-/s)
  assert.match(home, /\.banner-kicker,\.section-kicker\s*\{[^}]*letter-spacing:\s*\.18em/s)
})
```

- [ ] **Step 2: 运行测试并确认现有负字距触发失败**

Run: `node --test tests/storefront-navigation.test.js`

Expected: FAIL，指出首页轮播标题、区块标题或全局页面标题仍使用负字距。

- [ ] **Step 3: 为中文和英文分别设置字距**

```css
.banner-copy h1 { letter-spacing: .03em; }
h2 { letter-spacing: normal; }
.page-title h1 { letter-spacing: normal; }
.banner-kicker,
.section-kicker,
.page-title p { letter-spacing: .18em; }
```

保留选择器中的其他现有声明，只替换对应 `letter-spacing` 值，不改动无关页面布局。

- [ ] **Step 4: 运行样式和导航回归测试**

Run: `node --test tests/storefront-navigation.test.js tests/element-styles.test.js`

Expected: PASS。

---

### Task 5: 完整验证与交付检查

**Files:**
- Verify: `src/utils/category.js`
- Verify: `src/views/home/index.vue`
- Verify: `src/views/CategoryView.vue`
- Verify: `src/style.css`
- Verify: `tests/category.test.js`
- Verify: `tests/storefront-navigation.test.js`

**Interfaces:**
- Consumes: Tasks 1–4 的最终实现。
- Produces: 可构建、无测试回归、无空白错误的商城前端改动。

- [ ] **Step 1: 运行完整测试套件**

Run: `npm test`

Expected: 退出码 0，所有测试 PASS，无失败或取消。

- [ ] **Step 2: 运行生产构建**

Run: `npm run build`

Expected: 退出码 0，Vite 完成 production build。

- [ ] **Step 3: 检查本次相关文件的空白错误**

Run: `git diff --check -- src/utils/category.js src/views/home/index.vue src/views/CategoryView.vue src/style.css tests/category.test.js tests/storefront-navigation.test.js`

Expected: 无输出，退出码 0。

- [ ] **Step 4: 对照需求逐项检查源码结果**

Run: `rg -n "keyword: category.name|name: 'home'.*categoryId|letter-spacing: -|add-button|flattenCategoryTree|getProductCategoryTargets|name: 'products'" src/views/home/index.vue src/views/CategoryView.vue src/style.css src/utils/category.js`

Expected: 不再出现 `keyword: category.name`、首页分类跳转 `home`、中文标题负字距或 `add-button`；能找到两个分类工具和 `products` 路由。

- [ ] **Step 5: 审阅最终差异并确认未覆盖无关改动**

Run: `git diff -- src/utils/category.js src/views/home/index.vue src/views/CategoryView.vue src/style.css tests/category.test.js tests/storefront-navigation.test.js`

Expected: 差异只涉及真实分类导航、分类页展开与查询、中文标题字距、加号删除及对应测试。
