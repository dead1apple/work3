# 商家新增商品设计

## 目标与边界

在现有独立商家端新增 `/products/create` 内部路由，使生产 URL 为 `/merchant/products/create`。已通过商家鉴权且拥有店铺上下文的用户，可以填写完整商品与 SKU 信息并调用真实创建接口；创建成功后返回商品列表。

本阶段只实现新增商品，不实现编辑、删除、上下架、分类或品牌管理，也不调用订单、优惠券等业务接口。后端没有图片上传端点，因此页面只接受完整图片 URL，不伪造上传能力。

## 已确认的真实接口契约

### 创建商品

- Method：`POST`
- URL：`/api/merchant/products`
- Body：`ProductDTO`
- 后端说明：创建成功后商品状态为待审核。
- DTO 不包含 `shopId`；店铺归属由 token 在服务端确定。
- 新增时不传商品 `id` 和 SKU `id`。
- 前端不传 `status`，避免覆盖后端“创建后待审核”的规则。

### 真实写入联调记录（2026-08-26）

浏览器对完整 DTO、去除可选复杂字段后的最小 DTO，以及最小 DTO 加 `status: 2` 分别进行了一次真实 POST。三次均由后端返回 HTTP 200、`{ code: -1, msg: "系统内部错误，请稍后重试", data: null }`，随后按精确名称查询商家商品列表均为 `total: 0`，没有落下测试商品。

`status: 2` 未解决错误，因此不能把它认定为真实必填契约。前端继续遵循接口说明：创建端不传 status，由后端设置待审核。完成真实创建需要后端根据服务端日志修复或补充当前 OpenAPI 未表达的约束。

提交体只包含：

```js
{
  categoryId: Number,
  brandId: Number,
  name: String,
  subtitle: String | null,
  mainImage: String | null,
  images: Array<String>,
  detail: String | null,
  skuList: Array<{
    skuName: String,
    specValues: String,
    price: Number,
    marketPrice: Number | null,
    stock: Number,
    image: String | null,
  }>,
}
```

`specValues` 是 JSON 对象的字符串形式，例如 `{"颜色":"曜石黑","内存":"12+256GB"}`。前端验证并重新序列化该对象，拒绝数组、`null` 或其他 JSON 原始值。

OpenAPI 没有声明字段 `required` 或数值最小值。为阻止明显无效数据而不虚构后端规则，前端要求商品名称、叶子分类、品牌、至少一个 SKU、SKU 名称和有效规格对象；价格、市场价不得为负，库存必须为非负整数。主图、副标题、其他图片、详情、市场价和 SKU 图片可为空。

### 分类树

- `GET /api/categories/tree`
- 返回数组节点，节点结构严格为 `{ category, children }`。
- `category` 使用 `id`、`name` 等真实字段。
- 现有商品均使用叶子分类，因此级联选择器只允许选择叶子，并只提交最终叶子的 `id`。

### 品牌

- `GET /api/brands`
- 返回非分页品牌数组，页面使用真实 `id` 和 `name`。

### 图片

OpenAPI 路径中不存在匹配 upload、file 或 image 的端点。主图、其他图片和 SKU 图片均使用 URL 输入；其他图片按每行一个 URL 转换为字符串数组。

## 架构

采用页面本地状态，不建立 Product Store：

- `src/api/product.js` 新增 `createMerchantProduct(payload)`。
- `src/api/catalog.js` 提供分类树和品牌读取函数。
- `src/views/products/product-create.js` 保存表单工厂、分类树转换、校验和显式 payload 构造等纯逻辑。
- `src/views/products/useProductCreate.js` 负责目录加载、SKU 行增删、提交状态和防重复提交。
- `src/views/products/ProductCreateView.vue` 负责 Element Plus 表单、店铺空态、成功/失败反馈和导航。

页面不把商品草稿放进 Pinia，离开路由即销毁，防止不同会话共享未提交数据。Shop Store 只作为准入和展示上下文，不提供 `shopId` 给创建 API。

## 页面与交互

- 商品列表标题区增加“新增商品”按钮。
- 创建页分为“基础信息”“图片与详情”“SKU”三个区块。
- 分类和品牌并行加载；加载失败显示明确错误和重试按钮，保留已填写数据。
- SKU 默认一行，可继续添加或删除；删除到零行后提交会显示“至少添加一个 SKU”。
- 表单错误定位到对应字段或 SKU 行，后端业务错误使用 request 层抛出的原始 `msg` 展示。
- 提交期间按钮 loading/disabled；重复点击复用同一个进行中的 Promise，最多发送一次 POST。
- 创建成功显示“商品已提交审核”，随后跳转命名路由 `merchant-products`。
- 当前 Shop Store 为 `empty` 时不加载目录、不展示可提交表单，明确提示先联系管理员配置店铺。

## 可访问性与响应式

- 所有输入具备可见标签，必填项在文案中明确。
- JSON 规格输入提供真实示例和错误文案。
- 宽屏 SKU 使用网格，窄屏降为纵向卡片；操作按钮保持键盘可达。
- 延续现有 CSS tokens、排版和 Element Plus 局部导入方式。

## 测试策略

- API 测试验证真实 GET/POST URL、请求体和没有 `id/status/shopId`。
- 纯逻辑测试覆盖分类转换、图片数组、规格 JSON、SKU 增删相关边界、数值验证和 payload。
- composable 测试覆盖目录加载、提交成功、后端错误、表单保留以及重复提交只产生一次 POST。
- 组件测试覆盖正常表单、目录错误、无店铺阻断、客户端校验、成功消息和跳转。
- 路由/列表测试覆盖受保护的 `/products/create` 和新增入口。
- 浏览器测试使用真实商家账户完成 Cases 1–11；最终只创建一个名称可识别的测试商品，并记录服务端返回结果或列表中的 ID、名称和状态。

## 非目标

不猜测未知响应结构，不提供本地角色绕过，不发送店铺 ID，不实现文件上传或富文本编辑器，不在创建流程中调用其他商家业务接口。
