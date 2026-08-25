# Merchant Frontend

独立商家端 SPA。当前阶段仅包含登录、商家身份校验、会话恢复、Merchant Layout 和基础状态页，不包含商品、订单、优惠券或店铺业务。

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
├── api/              # 认证接口
├── config/           # 集中的认证配置
├── layouts/          # Merchant Layout
├── router/           # 路由与鉴权守卫
├── store/            # Pinia session
├── styles/           # 全局样式和设计变量
├── utils/            # request、token 与错误类型
└── views/            # 登录、首页、403、404
```

