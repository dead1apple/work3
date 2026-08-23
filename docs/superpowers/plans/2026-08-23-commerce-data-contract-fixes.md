# Commerce Data Contract Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复购物车单选/结算、优惠券金额、商品图片、收藏商品信息和订单商品信息，并明确公网部署差异。

**Architecture:** 在现有 `utils` 归一化边界修复后端响应契约差异，页面仅负责组合请求。购物车直接解包嵌套记录；优惠券用公开模板补全用户券；收藏与订单列表通过详情接口补全展示字段；商品图片统一解析、去重并限制为 8 张。

**Tech Stack:** Vue 3、Pinia、Axios、Node.js `node:test`、Vite。

**Spec:** 用户在 2026-08-23 提出的 7 项商城问题。

## Global Constraints

- 商品详情轮播图总数不超过 8 张。
- 不伪造购物车 ID、商品信息、优惠券金额或订单商品数据。
- 详情补全失败时保留主列表并显示已有数据，不让单条失败拖垮整页。
- 所有行为改动先写失败测试，再写最小实现。

---

### Task 1: 修复购物车嵌套响应

**Files:**
- Modify: `src/utils/cart.js`
- Test: `tests/cart.test.js`

**Interfaces:**
- Consumes: 后端 `{ cart, sku, product }` 条目。
- Produces: `normalizeCartItem(item)` 返回有效 `id`、`skuId`、`quantity`、`checked` 和价格。

- [ ] 添加一个使用真实后端响应形状的失败测试，断言 `cart.id/quantity/selected` 被读取。
- [ ] 运行 `node --test tests/cart.test.js` 并确认测试因 ID 为 `null` 失败。
- [ ] 在 `normalizeCartItem` 中把 `item.cart` 作为购物车记录来源。
- [ ] 重跑购物车测试并确认通过。

### Task 2: 补全用户优惠券模板信息

**Files:**
- Modify: `src/utils/coupon.js`
- Modify: `src/views/CouponsView.vue`
- Modify: `src/views/CheckoutView.vue`
- Test: `tests/coupon.test.js`

**Interfaces:**
- Produces: `mergeCouponTemplates(userCoupons, templates)`，按 `templateId` 合并模板金额、门槛、名称、类型和有效期。
- Produces: 缺少模板元数据的用户券不显示为“0 元可用券”，也不进入结算可用列表。

- [ ] 添加失败测试，覆盖用户券与模板合并、未知模板不作为 0 元券使用。
- [ ] 运行优惠券测试确认失败。
- [ ] 实现纯函数并让我的优惠券页、购物车结算并行加载模板列表后合并。
- [ ] 重跑优惠券与结算测试。

### Task 3: 解析并限制商品图片

**Files:**
- Modify: `src/utils/productDetail.js`
- Modify: `src/views/product/Detail.vue`
- Test: `tests/productDetail.test.js`

**Interfaces:**
- Produces: `normalizeProductImages(...sources)`，支持数组和逗号字符串，去空、去重并最多保留 8 张。

- [ ] 添加失败测试，覆盖逗号字符串没有按字符展开、重复图片去重和 8 张上限。
- [ ] 运行商品详情测试确认失败。
- [ ] 实现图片归一化并用于商品数据和当前 SKU 图片组合。
- [ ] 重跑商品详情测试。

### Task 4: 补全收藏商品信息

**Files:**
- Modify: `src/utils/favorite.js`
- Modify: `src/views/FavoritesView.vue`
- Test: `tests/favorite.test.js`

**Interfaces:**
- Produces: `hydrateFavoriteProducts(favorites, loadProduct)`，按 `productId` 拉取详情并合并标题、主图、价格和销量。

- [ ] 添加失败测试，覆盖仅含收藏 ID/商品 ID 的后端响应与单条详情失败降级。
- [ ] 运行收藏测试确认失败。
- [ ] 页面加载收藏记录后并行补拉商品详情。
- [ ] 重跑收藏测试。

### Task 5: 补全订单列表商品信息

**Files:**
- Modify: `src/utils/order.js`
- Modify: `src/views/OrdersView.vue`
- Test: `tests/order.test.js`

**Interfaces:**
- Produces: `hydrateOrderListItems(orders, loadDetail)`，按订单号补拉详情并写回 `items`。

- [ ] 添加失败测试，覆盖订单主表列表补全详情以及单条失败降级。
- [ ] 运行订单测试确认失败。
- [ ] 页面获取分页订单后并行补拉当前页详情。
- [ ] 重跑订单测试。

### Task 6: 完整验证与部署结论

**Files:**
- Verify only.

- [ ] 运行 `npm test`。
- [ ] 使用独立输出目录运行生产构建，避免开发服务器占用 `dist`。
- [ ] 在本地浏览器复测商品图片、收藏和订单展示，并确认购物车 ID 正常。
- [ ] 对比公网 HTML/请求分块的更新时间与鉴权实现，记录重新部署要求。
