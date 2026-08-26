# 商家商品列表只读版设计

## 目标与边界

在现有独立商家端新增 `/products` 内部路由，使生产 URL 自然成为 `/merchant/products`。页面只允许当前可信商家查看后端按 token 限定给当前店铺的商品列表。

本阶段不实现商品详情、新增、编辑、删除、上下架、SKU 修改、库存修改、批量操作、导入、图片上传、分类管理、品牌管理、订单或优惠券功能。

## 已确认的接口契约

### 商品列表

- Method：`GET`
- URL：`/api/merchant/products`
- 鉴权：必须在请求头携带现有商家 token。OpenAPI 未声明 security scheme，但不带 token 的真实响应为 HTTP 200、`{ code: -1, msg: "请先登录", data: null }`。
- Query：
  - `keyword`：可选，商品名称关键字。
  - `status`：可选，`0` 下架、`1` 上架、`2` 待审核。
  - `page`：可选，默认 1。
  - `size`：可选，默认 10。
- 不支持分类筛选。
- 不接受也不需要前端传递 `shopId`。

真实成功响应中的 `data` 唯一结构为：

```js
{
  total: Number,
  list: Array<{
    product: {
      id: Number,
      categoryId: Number,
      brandId: Number,
      shopId: Number,
      name: String,
      subtitle: String | null,
      mainImage: String | null,
      images: Array<String> | null,
      detail: String | null,
      status: Number,
      salesCount: Number,
      sortOrder: Number,
      createTime: String,
      updateTime: String,
      deleted: Number,
    },
    minPrice: Number,
    totalStock: Number,
    maxPrice: Number,
  }>,
  page: Number,
  size: Number,
}
```

OpenAPI 只把响应声明为泛型 `ResultObject`，没有描述上述分页和列表项结构；真实响应是本页面实现依据。列表响应不包含 `skuList`，只提供已经汇总的最低价、最高价和总库存。

真实分页验证：`page=1&size=2` 返回 2 项，`page=2&size=2` 返回 1 项，二者 `total=3`。`keyword=Mate` 返回 2 项，`status=0` 返回合法空列表。

### 写接口调查（只读）

- 创建：`POST /api/merchant/products`，body 为完整 `ProductDTO`，创建后状态为待审核。
- 修改：`PUT /api/merchant/products`，body 为 `ProductDTO`，商品 ID 位于 body 的 `id`；文档描述为修改商品信息，未声明 PATCH 或部分更新语义，因此下一阶段应按完整 DTO 设计。
- 上下架：`PUT /api/merchant/products/{id}/status?status=0|1`。
- `ProductDTO`：`id`、`categoryId`、`brandId`、`name`、`subtitle`、`mainImage`、`images`、`detail`、`status`、`skuList`；不含 `shopId`。
- `SkuDTO`：`id`、`skuName`、JSON 字符串 `specValues`、`price`、`marketPrice`、`stock`、`image`。
- 分类：`GET /api/categories/tree` 或 `GET /api/categories/children?parentId=`。
- 品牌：`GET /api/brands` 和 `GET /api/brands/{id}`。

这些写接口和目录接口本阶段不实现、不调用。

### 商家订单详情调查

商家端只有 `GET /api/merchant/orders` 与 `POST /api/merchant/orders/deliver`。没有发现 `/api/merchant/orders/{id}`、`/api/merchant/orders/{orderNo}` 或其他商家订单详情接口。本阶段不调用商家订单、用户订单详情或管理员订单接口。

## 架构

采用页面本地状态，不建立 Product Store：

- `src/api/product.js` 只导出 `getMerchantProducts(params)`，直接调用 `/merchant/products`。
- `src/views/products/product-list.js` 保存状态映射、价格显示等无副作用领域格式化逻辑。
- `src/views/products/ProductListView.vue` 维护查询条件、分页、loading、结果和 error。
- Session Store 只负责身份；Shop Store 只负责当前店铺。商品 API 不导入任何 Store。
- Router Guard 先恢复 session，再恢复 shop，组件挂载后才请求商品。
- 页面卸载即销毁商品列表状态，退出后不会把旧列表带入下一会话。

## 页面行为

- 页面标题使用 Shop Store 的真实 `shopName`，但请求参数不使用 `shop.id`。
- 搜索框提交 `keyword`，状态选择器提交 `status`，两者都是服务器筛选；变更查询时回到第 1 页。
- 服务器分页固定使用真实参数 `page` 和 `size`；支持改变每页数量。
- loading 时显示明确骨架或 loading 状态，不先显示空态。
- success 时展示主图、ID、名称、副标题、状态、价格范围、总库存、销量、分类 ID、品牌 ID。
- 图片只使用后端返回的完整 `mainImage`；空值或加载失败显示本地 CSS 占位，不拼接 URL。
- empty 显示“当前店铺暂无商品”，不提供新增按钮。
- error 清空旧列表并显示“商品列表加载失败”和“重新加载”。
- 表格不包含编辑、删除、上下架或详情操作。

## 可访问性与响应式

- 搜索框具有可见标签或可访问名称；按 Enter 可提交。
- 状态筛选有明确标签。
- 加载和错误提示使用可理解的中文文案。
- 表格容器在窄屏横向滚动，导航继续复用现有移动抽屉。
- 颜色、间距、圆角继续使用 `src/styles/base.css` 中的 tokens 与 Element Plus 组件。

## 测试策略

- API 测试验证 URL、真实 query 名称以及不携带 shopId。
- 格式化逻辑测试验证状态映射与价格范围。
- 页面测试覆盖 success、empty、error、重新加载、服务器搜索、状态筛选和分页请求。
- 路由与 Layout 测试验证 `/products` 受 Merchant Guard 保护，导航只增加商品列表。
- 真实浏览器验证登录、导航、真实数据、请求 URL、刷新恢复、退出后回登录与控制台。

## 非目标

不对 OpenAPI 未描述的结构做兼容，不读取 Shop Store 的 ID 构造商品请求，不为了显示分类或品牌名称额外调用接口，不保留跨页面商品缓存。
