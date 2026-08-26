# 当前商家店铺上下文设计

## 已确认的后端事实

- `GET /api/user/info` 只返回用户身份；`nickname` 不是店铺名称，`role` 是商家权限可信字段。
- `GET /api/merchant/shop` 返回当前登录用户作为店主的单个店铺；未申请时成功返回 `data: null`。
- 测试商家 user `id=2`，真实店铺 `id=1、userId=2、shopName=华为官方旗舰店`，证明用户昵称和店铺实体相互独立。
- Shop 模型通过单一 `userId` 表达店主，当前接口没有多店铺集合或店铺切换概念，因此前端按“一名当前用户对应零或一个当前店铺”建模。
- 商家商品和订单接口均按 token 自动定位当前商家名下店铺，不要求前端传 shopId。

## 架构选择

采用独立 Shop Store，而不是把店铺塞入 Session Store，也不只在组件内临时请求。

- Session Store 继续只负责 token、用户、role、登录、恢复和退出。
- `src/api/shop.js` 只暴露本阶段需要的 `getCurrentShop()`。
- `src/store/shop.js` 负责当前店铺上下文，状态为 `idle`、`loading`、`ready`、`empty`、`error`。
- Shop Store 不导入 Session Store；调用方必须在可信 session 已确认 role=1 后调用 `restore()`。
- shopId 不写入 localStorage，也不作为权限依据。

不采用把 shop 合并进 session 的方案，因为这会混合身份与业务上下文；不采用组件级请求，因为无法统一处理刷新、并发恢复、退出和失效 token 清理。

## 数据流

受保护路由导航时：

1. Router guard 调用 `session.restore()`。
2. `/api/user/info` 确认 `role === 1`。
3. Router guard 调用 `shop.restore()`。
4. `/api/merchant/shop` 返回对象时状态为 `ready`，返回 null 时状态为 `empty`。
5. 店铺请求失败时状态为 `error`，但不撤销已确认的商家身份。

Shop Store 对并发恢复请求去重。已经 ready 或 empty 时不重复请求；reset 后可重新恢复。

## 清理边界

- 商家点击退出时，Session Store 清理用户和 token，Merchant Layout 同时 reset Shop Store。
- Axios 收到真实 HTTP 401 时，应用层 unauthorized handler 同时 invalidate session 和 reset shop。
- 失效 token 在刷新 `/api/user/info` 时失败，Router guard 在返回登录前 reset shop，防止旧店铺残留。
- role 非 1 时不调用店铺接口，并 reset 任何旧 Shop Context。

## UI

Merchant Layout 明确区分当前用户和当前店铺：用户区域来自 `/api/user/info`，店铺区域来自 `/api/merchant/shop`。ready 显示真实 `shopName`；loading、empty、error 分别显示明确状态。店铺区域不是编辑入口。

首页只显示真实账号、商家身份和当前店铺基础状态，不添加销售额、订单量、商品量等经营假数据，也不提供店铺创建或编辑操作。

## 测试

- 非商家 session 不初始化店铺。
- 商家 session 成功恢复真实店铺。
- `data: null` 形成 empty，而不是错误或伪造对象。
- 请求失败形成 error，shop 保持 null。
- 并发恢复只发一个请求。
- 路由按 session → shop 顺序恢复。
- logout、HTTP 401、失效 token 和非商家导航均清理 Shop Context。
- Layout/Home 分开显示用户与店铺数据。

## 非目标

不实现店铺申请、修改、商品、订单、发货、优惠券或经营统计；不新增相应 API 文件或页面。
