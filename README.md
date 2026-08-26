# Merchant Frontend

独立商家端 SPA。当前包含登录、商家身份校验、会话恢复、当前店铺上下文、商品列表，以及提交待审核商品。商品编辑、上下架、订单、优惠券和店铺写入业务尚未实现。

## 技术栈

- Vue 3 + Vite
- Vue Router（HTML5 history）
- Pinia
- Axios
- Element Plus
- JavaScript
- Vitest + Vue Test Utils

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
| `/products` | `/merchant/products` | 当前店铺商品列表（只读） |
| `/products/create` | `/merchant/products/create` | 新增商品并提交审核 |
| `/403` | `/merchant/403` | 无商家权限 |
| `/:pathMatch(.*)*` | `/merchant/*` | 404 |

生产环境必须为 `/merchant/` 配置 history fallback，否则直接访问或刷新子路由会由 Nginx 返回 404。参考 [deploy/nginx-merchant.conf.example](deploy/nginx-merchant.conf.example)。该文件只是示例，不会自动修改服务器。

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

页面使用服务器搜索、状态筛选和分页，不对当前页做伪搜索，也不兼容未声明的 `records`、`rows` 等结构。商品状态保存在页面级 composable 中，离开路由或退出会话后不会保留旧商家商品。当前表格只增加“新增商品”入口，没有详情、编辑、删除、上下架或库存操作。

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

OpenAPI 没有文件或图片上传端点，因此主图、其他图片和 SKU 图片使用完整 URL 输入；其他图片每行一个 URL，提交为字符串数组。详情使用 textarea，不引入富文本编辑器。

前端要求商品名称、叶子分类、品牌、至少一个 SKU、SKU 名称、JSON 对象规格、非负价格和非负整数库存。提交期间复用同一个请求以防止重复创建；后端失败时保留草稿并展示原始业务消息。成功后提示“商品已提交审核”，通过命名路由返回商品列表并由列表页面重新请求服务端。

role 为 1 但 Shop Context 为 `empty` 时，页面不会加载目录或发送创建请求，并明确提示当前账号尚未关联店铺。当前阶段不实现图片上传、规格矩阵、编辑、删除、上下架或独立库存修改。

### 当前后端联调状态

2026-08-26 的真实浏览器联调中，创建接口对契约内完整 DTO、最小 DTO，以及额外携带 `status: 2` 的最小 DTO 均返回：

```json
{"code":-1,"msg":"系统内部错误，请稍后重试","data":null}
```

失败后按测试商品精确名称查询均为 0，未产生测试商品。由于显式 `status: 2` 也不能解决问题，前端仍按接口说明省略 status，等待后端通过服务端日志定位内部错误或补充未文档化约束；页面会保留草稿并显示该真实业务消息。

## Token 临时策略

三个前端是否共享 token 尚未确定。当前临时采用商家端独立 key：

```text
merchant_access_token
```

该 key 只在 `src/config/auth.js` 中定义，业务模块通过 `src/utils/token.js` 读写。最终策略确定后可以单点修改，不需要搜索替换整个项目。

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

## 第一阶段目录

```text
src/
├── api/              # 认证、店铺、商品与公共目录接口
├── config/           # 集中的认证配置
├── layouts/          # Merchant Layout
├── router/           # 路由与鉴权守卫
├── store/            # Pinia session 与 Shop Context
├── styles/           # 全局样式和设计变量
├── utils/            # request、token 与错误类型
└── views/            # 登录、首页、商品列表与新增、403、404
```
