# 商家端独立前端基础工程设计

## 目标与范围

在空目录中建立一个独立于用户商城和管理员端的 Vue 3 SPA。生产访问前缀为 `/merchant/`，第一阶段只交付登录、可信身份恢复、商家角色鉴权、后台首页和基础布局，不接入商品、订单、优惠券或店铺业务接口。

本工程不会读取、复制或修改用户商城的页面代码。当前目录没有现有文件，也不是 Git 仓库。

## 已确认的后端契约

- 服务地址：`http://49.235.130.42:8080`
- 登录：`POST /api/auth/login`
- 当前用户：`GET /api/user/info`
- 退出登录：`POST /api/user/logout`
- 统一响应：`{ code, msg, data }`
- `code === 1` 表示成功；其他 code 均为业务失败
- 登录请求体：`{ username, password }`
- 登录 token：`data.token`
- 鉴权请求头：`Authorization: <token>`，不添加未经后端声明的 Bearer 前缀
- `/api/user/info` 的 `data.role`：`0` 普通用户、`1` 商家、`2` 管理员

登录响应中即使包含 user，也不作为权限依据。商家身份只由登录后或刷新恢复时重新调用 `/api/user/info` 得出的 role 判定。

## 工程架构

使用 Vue 3、Vite、Vue Router、Pinia、Axios、Element Plus 和 JavaScript。测试使用 Vitest、Vue Test Utils 与 jsdom。

主要边界：

- `src/config/auth.js`：唯一保存 token key 的位置
- `src/utils/token.js`：token 的读取、写入和删除
- `src/utils/request.js`：Axios 实例、严格响应解析、401 通知机制
- `src/api/auth.js`：登录、当前用户和退出接口
- `src/store/session.js`：当前商家 session 的唯一状态源
- `src/router/index.js`：history router 和权限守卫
- `src/layouts/MerchantLayout.vue`：商家工作台外壳
- `src/views`：登录、首页、403、404 页面

模块保持单一职责。Axios 层不直接依赖 Pinia 或 Router，避免循环依赖；它通过可注册的 unauthorized handler 通知应用层处理 401。

## 部署与路由

Vite 配置 `base: '/merchant/'`。Vue Router 使用：

```js
createWebHistory(import.meta.env.BASE_URL)
```

因此源码路由仍写作 `/login`、`/`、`/403`，生产 URL 分别为 `/merchant/login`、`/merchant/`、`/merchant/403`。

开发服务器把 `/api` 代理到 `http://49.235.130.42:8080`。Axios `baseURL` 固定为 `/api`，生产环境由同源 Nginx 转发 `/api` 至后端。

项目文档提供 Nginx 示例：`/merchant/` 静态资源使用 `try_files $uri $uri/ /merchant/index.html`，从而支持直接访问或刷新 history 子路由。该工程只提供配置示例，不修改服务器。

## 请求与错误模型

请求拦截器在存在 token 时设置 `Authorization`。没有 token 时不发送该请求头。

响应拦截器只接受明确的统一结构：响应体必须是对象，并且拥有 `code`、`msg`、`data` 三个字段。处理规则：

- `code === 1`：向调用者返回 `data`
- `code !== 1`：抛出 `ApiBusinessError`，保留后端 code 和 msg
- 结构不合法：抛出 `ApiProtocolError`，不猜测其他成功结构
- HTTP 401：删除 token，调用 unauthorized handler 清空 Pinia session 并跳转登录
- 其他网络或 HTTP 错误：原样标准化为可展示错误，不伪装成业务成功

UI 层负责将错误消息显示给用户；请求层不直接弹 Element Plus 消息，以保持可测试性和职责清晰。

## Session 与角色校验

Session store 状态包含 `user`、`status` 和一次性的恢复 Promise。状态区分 idle、restoring、authenticated、anonymous，避免多个守卫并发重复请求 `/user/info`。

登录流程：

1. 提交用户名和密码到 `/auth/login`。
2. 从严格解析后的 `data.token` 取 token；若 token 缺失则视为协议错误。
3. 暂存 token。
4. 请求 `/user/info`。
5. 仅当可信 user 的 `role === 1` 时保存 user 并进入首页。
6. role 为 0 或 2 时清除本地 token 和 session，导航到 403，并明确提示没有商家权限。
7. `/user/info` 失败时清除不完整 session，避免残留 token 被视为已登录。

刷新恢复流程：

1. 无 token：直接成为 anonymous。
2. 有 token：调用 `/user/info`。
3. role 为 1：恢复 authenticated session。
4. role 非 1：清除 token/session，并进入 403。
5. 401：统一清除 session，并将受保护页面请求重定向到登录页。

前端不保存 role 到 localStorage，因此修改 localStorage 中的伪造 role 无法授权。唯一持久化数据是 token；每次新页面生命周期均向后端重新验证 user 与 role。

退出流程优先调用 `/user/logout`，无论接口是否成功都在 finally 中清除本地 session，随后跳转登录。

## Token 临时策略

跨用户商城、管理员端、商家端是否共享 token 尚未确定。本阶段临时采用商家端独立 key：

```js
export const AUTH_TOKEN_KEY = 'merchant_access_token'
```

该值只存在于 `src/config/auth.js`；其余模块只能通过 token utility 使用它。这样既不隐式决定跨端共享，也能在策略确定后单点替换。README 和最终报告会明确标记该策略为临时决定。

## 路由与权限元数据

- `/login`：商家登录，游客可访问；已认证商家访问时跳转 `/`
- `/`：Merchant Layout 下的商家首页，`meta.requiresMerchant = true`
- `/403`：无商家权限页面
- `/:pathMatch(.*)*`：404 页面

全局守卫只依据 session store 的可信恢复结果。访问受保护页面时：

- authenticated 且 role 为 1：放行
- 无 token 或 401：跳转 `/login`，携带站内 redirect 查询参数
- token 有效但 role 非 1：跳转 `/403`

redirect 只接受以 `/` 开头的站内路由，不接受完整 URL，以避免开放重定向。

## Merchant Layout 与界面

界面是低噪声、任务导向的商家工作台：深色侧栏、清晰顶部栏、浅色内容区，使用 Element Plus 组件和少量项目级设计变量。

侧栏第一阶段只出现“首页”。顶部栏提供当前用户名或昵称、店铺入口占位、返回用户商城 `/`、退出登录。桌面端展示固定侧栏，窄屏使用可展开导航。所有交互按钮有明确文本或 accessible label，键盘焦点可见，并尊重 reduced-motion。

首页只说明基础工作台已就绪，不展示虚构经营指标，也不调用业务接口。未实现的商品、订单、优惠券和店铺功能不加入菜单。

## 测试策略

采用测试先行：先写失败测试，再实现最小代码使其通过。

单元测试覆盖：

- token key 集中读写与删除
- Authorization 请求头注入
- 严格 `{ code, msg, data }` 解析
- code 非 1 的统一业务错误
- 未知响应结构的协议错误
- 401 清 token 并触发 session 失效通知
- 登录后必须调用 `/user/info`
- role 1 建立 session；role 0/2 拒绝
- 刷新恢复与并发恢复去重
- 退出无论服务端结果如何均清本地会话
- 路由对游客、商家和非商家角色的导航结果

组件级测试覆盖登录表单的提交/错误态和 Merchant Layout 的第一阶段菜单与用户操作。完成后运行完整测试和 `vite build`，并检查产物路径使用 `/merchant/` 前缀。

## 非目标

- 不实现或调用商品、订单、优惠券、店铺业务接口
- 不建立管理员或用户商城页面
- 不决定三个前端最终共享或隔离 token 的长期架构
- 不修改现有 Nginx 或后端服务
- 不引入 TypeScript、SSR、微前端或额外状态持久化插件

## 验收标准

- `npm install` 后可运行开发服务器
- 使用测试账号可登录，且只有 `/user/info` 返回 role 1 才进入后台
- role 0/2 无法凭本地数据进入受保护路由
- 刷新受保护页面可恢复有效商家 session
- 401 清理商家端本地会话
- `/merchant/` base、Router history base 和 Nginx fallback 示例一致
- 页面与菜单严格限制在第一阶段范围
- 全部自动化测试通过，生产 build 成功
