# Merchant Frontend

独立商家端 SPA，部署在现有商城站点的 `/merchant/` 前缀下。它与用户商城 `/`、管理员端 `/admin/` 及后端 `/api/` 共存；商家归属与权限始终由后端根据当前 token 判定，前端不把 `shopId` 当作权限依据。

## 技术栈

- Vue 3 + Vite
- Vue Router（HTML5 history）
- Pinia
- Axios
- Element Plus
- JavaScript
- Vitest + Vue Test Utils

## 测试账号

仅限已授权的联调环境使用测试商家账号。账号凭据通过安全渠道提供，不提交到仓库；登录后仍会调用可信的 `GET /api/user/info`，只有 `role === 1` 才建立商家 Session。

## 本地运行

```bash
npm install
npm run dev
```

Vite 开发服务器会把 `/api` 代理到 `http://49.235.130.42:8080`，浏览器端始终使用同源 `/api` 路径。

## 测试与构建

```bash
npm test -- --run
npm run build
```

构建产物输出到 `dist/`。Vite 的生产 base 固定为 `/merchant/`，因此产物资源地址形如 `/merchant/assets/...`。

## 路由

源码路由由 `createWebHistory(import.meta.env.BASE_URL)` 创建：

| 源码路由 | 生产 URL | 用途 |
| --- | --- | --- |
| `/login` | `/merchant/login` | 商家登录 |
| `/` | `/merchant/` | 商家后台首页 |
| `/products` | `/merchant/products` | 商品列表、关键字/状态服务器筛选、分页、上架/下架 |
| `/products/create` | `/merchant/products/create` | 新增待审核商品、SKU 与真实图片上传 |
| `/products/:id/edit` | `/merchant/products/:id/edit` | 商品详情回填、SKU 编辑、完整 DTO 保存 |
| `/orders` | `/merchant/orders` | 订单列表、状态服务器筛选、分页与发货入口 |
| `/orders/:orderNo` | `/merchant/orders/:orderNo` | 商家订单详情、商品明细、收货与物流信息 |
| `/coupons` | `/merchant/coupons` | 已完成：本店优惠券列表、服务器筛选/分页、创建、未领取券编辑、启用/停用、统计和领取明细 |
| `/shop` | `/merchant/shop` | 店铺资料查看、修改与图片上传入口 |
| `/403` | `/merchant/403` | 无商家权限 |
| `/:pathMatch(.*)*` | `/merchant/*` | 404 |

生产环境必须为 `/merchant/` 配置 history fallback，否则直接访问或刷新子路由会返回 404。生产机当前使用 Apache：将 `dist/` 内容部署至 `/www/projects/webs/html/merchant/`，并部署 [deploy/merchant.htaccess](deploy/merchant.htaccess) 为该目录的 `.htaccess`。它会保留真实文件（包括 `/merchant/assets/*`），并将其他 `/merchant/*` 回退到 `/merchant/index.html`。现有 Apache vhost 已将同源 `/api/` 反代到 `127.0.0.1:8080/api/`；不要替换 `/` 或 `/admin/` 的配置。使用 Nginx 的其他环境可参考 [deploy/nginx-merchant.conf.example](deploy/nginx-merchant.conf.example)。

## Session 与角色校验

1. 登录页调用 `POST /api/auth/login`，只从成功响应的 `data.token` 读取 token。
2. token 暂存后立即调用 `GET /api/user/info`。
3. 只有该可信接口返回 `role === 1` 时，Pinia 才建立商家 session。
4. role 为 0 或 2 时清除本地会话并进入 403。
5. 页面刷新时，如果本地存在 token，会重新调用 `/api/user/info` 恢复 session。
6. HTTP 401 会先删除 token，再通知应用清空 Pinia session，并将受保护页面导航到登录页。
7. 退出登录会请求 `POST /api/user/logout`；无论服务端请求是否成功，本地 session 都会被清理。

role 和用户资料不会写入 localStorage，因此不能通过修改前端 role 获得商家权限。

## 当前店铺上下文

商家 session 通过后才会调用 `GET /api/merchant/shop`。该接口由后端根据 token 定位当前用户作为店主的店铺：返回对象表示当前店铺，成功返回 `data: null` 表示尚无店铺。

- Session Store 只保存可信用户身份和 role。
- Shop Store 独立维护 `idle / loading / ready / empty / error`。
- `shopId` 不写入 localStorage，也不作为前端权限凭据。
- 路由刷新严格按 session → shop 顺序恢复。
- 退出、HTTP 401、失效 token 或非商家身份都会清空 Shop Context。
- 店铺接口自身失败时保留可信商家 session，并在页面显示独立错误状态。

当前接口表达的是一个用户对应零或一个当前店铺，没有店铺列表或切换器。页面将用户 `nickname` 与店铺 `shopName` 分开展示。

## 商品列表

`/merchant/products` 在 session 与 Shop Context 恢复完成后调用：

```text
GET /api/merchant/products
```

后端根据 Authorization token 限定当前商家的店铺。前端不会从 Shop Store 读取或发送 `shopId`。

接口支持服务器查询参数：

- `keyword`：商品名称关键字
- `status`：0 下架、1 上架、2 待审核
- `page`：页码
- `size`：每页数量

成功响应 `data` 的真实结构为：

```text
{ total, list: [{ product, minPrice, totalStock, maxPrice }], page, size }
```

页面使用服务器搜索、状态筛选和分页，不对当前页做伪搜索，也不兼容未声明的 `records`、`rows` 等结构。“全部状态”为默认选项，请求完全不传 `status`；选择具体状态才传真实状态码，并回到第 1 页重新请求。商品状态保存在页面级 composable 中，离开路由或退出会话后不会保留旧商家商品。表格提供新增、编辑以及真实允许状态下的上架/下架操作；操作成功后重新 GET 服务端状态。

## 新增商品

`/merchant/products/create` 使用三个真实接口：

```text
GET  /api/categories/tree
GET  /api/brands
POST /api/merchant/products
```

分类树只按后端的 `{ category, children }` 结构转换为级联选项，并要求选择叶子分类；品牌接口返回完整非分页数组。两项目录数据都不使用 mock，也不猜测其他响应结构。

创建页采用手工 SKU 行，可以逐行添加或删除。`specValues` 严格作为 JSON 对象字符串输入，例如：

```json
{"颜色":"黑色","容量":"256GB"}
```

提交前会验证并重新序列化该对象。页面显式构造 `ProductDTO` 和 `SkuDTO`，不会把 reactive form 原样发送，也不会包含商品/SKU `id`、`status`、`shopId` 或 UI 行 key。后端负责按 token 绑定店铺并把新商品设为待审核。

主图、其他图片和 SKU 图片复用 `POST /api/merchant/uploads/images`，使用 multipart `file` 字段和后端返回的绝对 URL。详情使用 textarea，不引入富文本编辑器。

前端要求商品名称、叶子分类、品牌、至少一个 SKU、SKU 名称、JSON 对象规格、非负价格和非负整数库存。提交期间复用同一个请求以防止重复创建；后端失败时保留草稿并展示原始业务消息。成功后提示“商品已提交审核”，通过命名路由返回商品列表并由列表页面重新请求服务端。

role 为 1 但 Shop Context 为 `empty` 时，页面不会加载目录或发送创建请求，并明确提示当前账号尚未关联店铺。当前阶段不实现删除、独立库存修改或商品详情独立页面。

## 订单与店铺

- 订单列表只调用商家专用接口，支持真实状态筛选和分页；订单详情按 `orderNo` 获取。
- 发货仅在后端允许的订单状态显示入口，提交后重新 GET 订单列表；为避免污染不可逆真实订单，生产环境没有实际发货测试。
- 店铺页面读取当前 token 所属店铺。修改时会将 GET 得到的完整 `Shop` DTO 原样带回，仅允许 UI 修改店铺名称、简介、地址、经纬度、Logo 与营业执照 URL，保存成功后刷新 Shop Context。
- 店铺 Logo 与营业执照复用商品页已验证的图片上传组件和接口。

## Dashboard

首页只展示可从现有商家接口准确获得的数量：商品总数、上架/下架/待审核数量、订单总数和待发货数量。各指标独立请求和失败显示，不推算销售额、访客或转化率，也不使用 mock 业务数据。

## Token 临时策略

当前商家端采用独立 token key：

```text
merchant_access_token
```

该 key 只在 `src/config/auth.js` 中定义，业务模块通过 `src/utils/token.js` 读写。这是隔离策略，不是前端缺陷。

## 请求约定

Axios `baseURL` 为 `/api`，请求头直接使用后端声明的格式：

```text
Authorization: <token>
```

响应仅接受明确的 `{ code, msg, data }`：

- `code === 1`：返回 `data`
- 其他 code：抛出统一业务错误
- 缺少任一约定字段：抛出协议错误
- 不尝试兼容未声明的响应结构

## 优惠券

优惠券模块已完成列表、创建、未领取券编辑、启用/停用、统计和领取明细；只调用商家专用接口：`/api/merchant/coupons`、`/api/merchant/coupons/{id}`、`/api/merchant/coupons/{id}/status`、`/api/merchant/coupons/{id}/users` 与 `/api/merchant/coupons/{id}/statistics`。店铺归属由 token 决定，前端不传或持久化 `shopId`。后端 OpenAPI 只声明优惠券类型取值范围为 `1–3`，未提供业务名称，因此页面忠实显示为“类型 1/2/3”，不自行推断其折扣语义。

## 已知限制（非前端 Bug）

- `POST /api/merchant/orders/deliver` 已有自动测试与请求构造验证；为避免污染不可逆真实订单，未对生产订单实际发货。
- 真实图片上传会生成服务端文件。联调应使用可追溯的测试图片并遵守环境数据清理规则。

## 交付检查

```bash
npm test -- --run
npm run build
git status --short --branch
```

预期：测试与构建成功、分支为 `merchant-frontend`、工作区 clean，且与 `origin/merchant-frontend` 同步。

## 目录

```text
src/
├── api/              # 认证、店铺、商品、订单与公共目录接口
├── config/           # 集中的认证配置
├── layouts/          # Merchant Layout
├── router/           # 路由与鉴权守卫
├── store/            # Pinia session 与 Shop Context
├── styles/           # 全局样式和设计变量
├── utils/            # request、token 与错误类型
└── views/            # 登录、Dashboard、商品、订单、店铺、403、404
```
