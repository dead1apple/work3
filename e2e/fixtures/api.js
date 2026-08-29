import { test as base, expect } from '@playwright/test'
import { installObservability, expectNoObservedErrors } from './observability.js'

const ok = (data = null, msg = 'success') => ({ code: 1, msg, data })
const fail = (code, msg, data = null) => ({ code, msg, data })
const image = (label) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"><rect width="100%" height="100%" fill="#f5f5f5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#e1251b" font-family="Arial" font-size="44">${label}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const wrapCategory = (id, name, children = []) => ({ category: { id, name }, children })
const categories = [
  wrapCategory(10, '手机数码', [wrapCategory(11, '手机'), wrapCategory(12, '电脑')]),
  wrapCategory(20, '家用电器', [wrapCategory(21, '冰箱'), wrapCategory(22, '洗衣机')]),
  wrapCategory(30, '运动户外', [wrapCategory(31, '跑步装备')]),
]
const brands = [{ id: 1, name: 'JD Select' }, { id: 2, name: 'Acme' }]
const products = [
  {
    id: 1001,
    name: '非笛卡尔 SKU 测试手机',
    title: '非笛卡尔 SKU 测试手机',
    subtitle: '用于验证不可购买规格被禁用',
    categoryId: 11,
    brandId: 1,
    price: 3999,
    minPrice: 3999,
    sales: 88,
    status: 1,
    mainImage: image('SKU Phone'),
    images: [image('SKU Phone 1'), image('SKU Phone 2')],
    detail: '三种颜色与容量并非完全组合，测试应发现不存在的组合。',
    skuList: [
      { id: 9001, skuId: 9001, skuName: '黑色 128G', price: 3999, marketPrice: 4299, stock: 5, image: image('Black 128'), specValues: { 颜色: '黑色', 容量: '128G' } },
      { id: 9002, skuId: 9002, skuName: '黑色 256G', price: 4299, marketPrice: 4599, stock: 8, image: image('Black 256'), specValues: { 颜色: '黑色', 容量: '256G' } },
      { id: 9003, skuId: 9003, skuName: '白色 128G', price: 4099, marketPrice: 4399, stock: 0, image: image('White 128'), specValues: { 颜色: '白色', 容量: '128G' } },
      { id: 9004, skuId: 9004, skuName: '蓝色 512G', price: 4999, marketPrice: 5299, stock: 3, image: image('Blue 512'), specValues: { 颜色: '蓝色', 容量: '512G' } },
    ],
  },
  {
    id: 1002,
    name: '组件复用导航耳机',
    title: '组件复用导航耳机',
    subtitle: '验证同一详情组件切换商品',
    categoryId: 12,
    brandId: 2,
    price: 699,
    minPrice: 699,
    sales: 63,
    status: 1,
    mainImage: image('Headset'),
    images: [image('Headset 1')],
    detail: '第二个商品详情。',
    skuList: [{ id: 9101, skuId: 9101, skuName: '标准版', price: 699, marketPrice: 799, stock: 11, image: image('Headset SKU'), specValues: { 版本: '标准版' } }],
  },
]
const productReviews = [{ user: { nickname: '测试买家', avatar: image('Buyer') }, content: '包装完整，体验稳定。', createTime: '2026-08-19' }]

const clone = (value) => JSON.parse(JSON.stringify(value))
const parseBody = async (request) => {
  const text = request.postData()
  if (!text) return null
  try { return JSON.parse(text) } catch { return text }
}
const normalizeAuth = (request) => (request.headers().authorization || '').replace(/^Bearer\s+/i, '')
const requireAuth = (state, request) => Boolean(normalizeAuth(request) && state.sessions.has(normalizeAuth(request)))
const currentAccount = (state, request) => {
  const token = normalizeAuth(request)
  if (!state.accountData.has(token)) state.accountData.set(token, { cart: [], favoriteProductIds: new Set(), nextCartId: 7001 })
  return state.accountData.get(token)
}
const createAddress = (overrides = {}) => ({
  id: overrides.id || 501,
  receiverName: overrides.receiverName || '张三',
  receiverPhone: overrides.receiverPhone || '13800138000',
  province: overrides.province || '北京市',
  city: overrides.city || '北京市',
  district: overrides.district || '东城区',
  detailAddress: overrides.detailAddress || '长安街 1 号',
  isDefault: overrides.isDefault ?? 1,
})
const findProduct = (id) => products.find((product) => product.id === Number(id))
const findSku = (skuId) => products.flatMap((product) => product.skuList.map((sku) => ({ product, sku }))).find((entry) => entry.sku.id === Number(skuId))
const makeOrderItem = (skuId, quantity, orderItemId) => {
  const found = findSku(skuId) || { product: products[0], sku: products[0].skuList[0] }
  return {
    id: orderItemId,
    orderItemId,
    productId: found.product.id,
    productName: found.product.name,
    name: found.product.name,
    skuName: found.sku.skuName,
    specName: found.sku.skuName,
    productImage: found.sku.image,
    price: found.sku.price,
    quantity,
    subtotal: found.sku.price * quantity,
  }
}
const makeOrder = ({ orderNo, status = 0, cartIds, addressId, couponId, remark, items }) => {
  const orderItems = items || cartIds.map((cartId, index) => makeOrderItem(9001, 1, 8000 + index))
  const goodsAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
  const discountAmount = couponId ? 200 : 0
  return {
    orderNo,
    status,
    statusName: status === 3 ? '已完成' : status === 1 ? '待发货' : '待付款',
    createTime: '2026-08-19 10:00:00',
    payAmount: Math.max(0, goodsAmount - discountAmount),
    totalAmount: Math.max(0, goodsAmount - discountAmount),
    goodsAmount,
    freightAmount: 0,
    discountAmount,
    cartIds,
    addressId,
    couponId,
    remark,
    items: orderItems,
    orderItems,
    address: createAddress({ id: addressId }),
  }
}
const createState = () => {
  const state = {
    sessions: new Map(),
    accountData: new Map(),
    sendCodeCalls: [],
    loginCalls: [],
    addCartCalls: [],
    selectCalls: [],
    quantityCalls: [],
    favoriteCalls: [],
    deleteCartCalls: [],
    addressCalls: [],
    orderCreateCalls: [],
    paymentCreateCalls: [],
    paymentConfirmCalls: [],
    reviewCalls: [],
    forceCart401: false,
    addresses: [createAddress()],
    nextAddressId: 502,
    coupons: [
      { id: 301, name: '满 3000 减 200', type: 1, amount: 200, minPoint: 3000, status: 0 },
      { id: 302, name: '满 100 减 10', type: 1, amount: 10, minPoint: 100, status: 0 },
    ],
    orders: new Map(),
    paymentPollingRound: new Map(),
    paymentCreatedOrderNos: new Set(),
  }
  const completedOrder = makeOrder({
    orderNo: 'ORD-COMPLETE-1',
    status: 3,
    cartIds: [7001],
    addressId: 501,
    couponId: null,
    remark: '已完成订单',
    items: [makeOrderItem(9001, 1, 8001)],
  })
  state.orders.set(completedOrder.orderNo, completedOrder)
  const payableOrder = makeOrder({
    orderNo: 'ORD-PAY-1',
    status: 0,
    cartIds: [7002],
    addressId: 501,
    couponId: null,
    remark: '待支付订单',
    items: [makeOrderItem(9001, 1, 8002)],
  })
  state.orders.set(payableOrder.orderNo, payableOrder)
  return state
}
const listProducts = (query) => {
  let list = products
  const keyword = query.get('keyword')
  const categoryId = Number(query.get('categoryId') || 0)
  const brandId = Number(query.get('brandId') || 0)
  if (keyword) list = list.filter((product) => product.name.includes(keyword) || product.subtitle.includes(keyword))
  if (categoryId) list = list.filter((product) => product.categoryId === categoryId)
  if (brandId) list = list.filter((product) => product.brandId === brandId)
  return { list: clone(list.map((product) => ({ product, minPrice: product.minPrice ?? product.price }))), total: list.length }
}

const knownProtectedRoute = (path, method) => (
  (path === '/user/info' && method === 'GET') ||
  (path.match(/^\/favorites\/check\/\d+$/) && method === 'GET') ||
  (path.match(/^\/favorites\/\d+$/) && (method === 'POST' || method === 'DELETE')) ||
  (path === '/cart' && (method === 'GET' || method === 'POST')) ||
  (path.match(/^\/cart\/\d+\/selected$/) && method === 'PUT') ||
  (path === '/cart/select-all' && method === 'PUT') ||
  (path.match(/^\/cart\/\d+\/quantity$/) && method === 'PUT') ||
  (path.match(/^\/cart\/\d+$/) && method === 'DELETE') ||
  (path === '/address/list' && method === 'GET') ||
  (path === '/address' && (method === 'POST' || method === 'PUT')) ||
  (path === '/coupons/mine' && method === 'GET') ||
  (path === '/coupons/available' && method === 'GET') ||
  (path === '/orders' && (method === 'POST' || method === 'GET')) ||
  (path.match(/^\/orders\/[^/]+$/) && method === 'GET') ||
  (path === '/orders/review' && method === 'POST') ||
  (path === '/pay/status' && method === 'GET') ||
  (path === '/pay/create' && method === 'POST') ||
  (path === '/pay/confirm' && method === 'POST')
)

const routeApi = async ({ method, path, query, request, state }) => {
  if (path === '/auth/send-code' && method === 'POST') {
    const body = await parseBody(request)
    state.sendCodeCalls.push(body)
    return ok({ mockCode: '246810', countdown: 60 })
  }
  if (path === '/auth/register' && method === 'POST') return ok({ id: 901 })
  if (path === '/auth/login' && method === 'POST') {
    const body = await parseBody(request)
    state.loginCalls.push(body)
    const token = `token-${body?.username || 'user'}`
    state.sessions.set(token, { username: body?.username || 'user' })
    currentAccount(state, { headers: () => ({ authorization: token }) })
    return ok({ token, user: { id: token.endsWith('alice') ? 1 : 2, username: body?.username || 'user' } })
  }
  if (path === '/categories/tree' && method === 'GET') return ok(clone(categories))
  if (path === '/brands' && method === 'GET') return ok(clone(brands))
  if (path === '/admin/shops/map' && method === 'GET') {
    if (!requireAuth(state, request)) return fail(401, '未登录')
    return ok([{ id: 100, shopName: '京东自营旗舰店', address: '北京市朝阳区京东大厦', location: '116.397428,39.90923' }])
  }
  if (path === '/products' && method === 'GET') return ok(listProducts(query))
  if (path.match(/^\/products\/\d+$/) && method === 'GET') return ok(clone(findProduct(path.split('/').pop())))
  if (path.match(/^\/products\/\d+\/reviews$/) && method === 'GET') return ok({ list: clone(productReviews), total: productReviews.length })

  if (path === '/user/info' && method === 'GET' && !requireAuth(state, request)) return null
  if (!knownProtectedRoute(path, method)) return null
  if (!requireAuth(state, request)) return fail(401, '未登录')
  const account = currentAccount(state, request)

  if (path === '/user/info' && method === 'GET') {
    const token = normalizeAuth(request)
    const session = state.sessions.get(token)
    return ok({ id: 2, username: session?.username || 'user', nickname: session?.username || '用户', role: 0 })
  }

  if (path.match(/^\/favorites\/check\/\d+$/) && method === 'GET') return ok(account.favoriteProductIds.has(Number(path.split('/').pop())))
  if (path.match(/^\/favorites\/\d+$/) && method === 'POST') {
    const productId = Number(path.split('/').pop())
    state.favoriteCalls.push({ method, productId })
    account.favoriteProductIds.add(productId)
    return ok(true)
  }
  if (path.match(/^\/favorites\/\d+$/) && method === 'DELETE') {
    const productId = Number(path.split('/').pop())
    state.favoriteCalls.push({ method, productId })
    account.favoriteProductIds.delete(productId)
    return ok(true)
  }
  if (path === '/cart' && method === 'GET') {
    if (state.forceCart401) return fail(401, '登录已过期')
    return ok(clone(account.cart))
  }
  if (path === '/cart' && method === 'POST') {
    const body = await parseBody(request)
    state.addCartCalls.push(body)
    const found = findSku(body.skuId)
    const existing = account.cart.find((item) => item.skuId === Number(body.skuId))
    if (existing) existing.quantity += Number(body.quantity || 1)
    const item = existing || {
      id: account.nextCartId++,
      skuId: found.sku.id,
      productName: found.product.name,
      skuName: found.sku.skuName,
      image: found.sku.image,
      price: found.sku.price,
      quantity: Number(body.quantity || 1),
      selected: 1,
    }
    if (!existing) account.cart.push(item)
    return ok({ cartItem: clone(item) })
  }
  if (path.match(/^\/cart\/\d+\/selected$/) && method === 'PUT') {
    const id = Number(path.split('/')[2])
    const selected = Number(query.get('selected'))
    state.selectCalls.push({ id, selected })
    const item = account.cart.find((entry) => entry.id === id)
    if (item) item.selected = selected
    return ok(true)
  }
  if (path === '/cart/select-all' && method === 'PUT') {
    const selected = Number(query.get('selected'))
    state.selectCalls.push({ id: 'all', selected })
    account.cart.forEach((item) => { item.selected = selected })
    return ok(true)
  }
  if (path.match(/^\/cart\/\d+\/quantity$/) && method === 'PUT') {
    const id = Number(path.split('/')[2])
    const quantity = Number(query.get('quantity'))
    state.quantityCalls.push({ id, quantity })
    if (quantity === 13) return fail(409, '库存不足，剩余 12 件')
    const item = account.cart.find((entry) => entry.id === id)
    if (item) item.quantity = quantity
    return ok(true)
  }
  if (path.match(/^\/cart\/\d+$/) && method === 'DELETE') {
    const id = Number(path.split('/').pop())
    state.deleteCartCalls.push({ id })
    account.cart = account.cart.filter((entry) => entry.id !== id)
    return ok(true)
  }
  if (path === '/address/list' && method === 'GET') return ok(clone(state.addresses))
  if (path === '/address' && method === 'POST') {
    const body = await parseBody(request)
    state.addressCalls.push({ method, receiverName: body.receiverName, receiverPhone: body.receiverPhone, detailAddress: body.detailAddress, isDefault: body.isDefault })
    const address = createAddress({ ...body, id: state.nextAddressId++ })
    if (address.isDefault) state.addresses.forEach((item) => { item.isDefault = 0 })
    state.addresses.push(address)
    return ok(clone(address))
  }
  if (path === '/address' && method === 'PUT') {
    const body = await parseBody(request)
    state.addressCalls.push({ method, id: body.id, receiverName: body.receiverName })
    const index = state.addresses.findIndex((item) => item.id === Number(body.id))
    if (index !== -1) state.addresses[index] = { ...state.addresses[index], ...body }
    return ok(clone(state.addresses[index]))
  }
  if (path === '/coupons/mine' && method === 'GET') return ok({ list: clone(state.coupons), total: state.coupons.length })
  if (path === '/coupons/available' && method === 'GET') return ok({ list: clone(state.coupons), total: state.coupons.length })
  if (path === '/orders' && method === 'POST') {
    const body = await parseBody(request)
    state.orderCreateCalls.push(body)
    const cartItems = account.cart.filter((item) => body.cartIds.includes(item.id))
    const orderNo = `ORD-${String(state.orderCreateCalls.length).padStart(4, '0')}`
    const order = makeOrder({
      orderNo,
      status: 0,
      cartIds: body.cartIds,
      addressId: body.addressId,
      couponId: body.couponId,
      remark: body.remark,
      items: cartItems.map((item, index) => makeOrderItem(item.skuId, item.quantity, 8100 + index)),
    })
    state.orders.set(orderNo, order)
    return ok({ orderNo, payAmount: order.payAmount })
  }
  if (path === '/orders' && method === 'GET') {
    const status = query.get('status')
    let list = Array.from(state.orders.values())
    if (status != null) list = list.filter((order) => order.status === Number(status))
    return ok({ list: clone(list), total: list.length })
  }
  if (path.match(/^\/orders\/[^/]+$/) && method === 'GET') return ok(clone(state.orders.get(decodeURIComponent(path.split('/').pop()))))
  if (path === '/orders/review' && method === 'POST') {
    const body = await parseBody(request)
    state.reviewCalls.push(body)
    return ok({ id: 9901 })
  }
  if (path === '/pay/status' && method === 'GET') {
    const orderNo = query.get('orderNo')
    const round = (state.paymentPollingRound.get(orderNo) || 0) + 1
    state.paymentPollingRound.set(orderNo, round)
    const order = state.orders.get(orderNo)
    const isPaid = state.paymentCreatedOrderNos.has(orderNo) && round >= 2
    if (isPaid && order) order.status = 1
    return ok(isPaid ? { isPaid: true, payment: { paymentNo: `PAY-${orderNo}`, payType: 1, status: 1 } } : { payment: null, status: 0 })
  }
  if (path === '/pay/create' && method === 'POST') {
    const dto = { orderNo: query.get('orderNo'), payType: Number(query.get('payType')) }
    state.paymentCreateCalls.push(dto)
    state.paymentCreatedOrderNos.add(dto.orderNo)
    return ok({ paymentNo: `PAY-${dto.orderNo}` })
  }
  if (path === '/pay/confirm' && method === 'POST') {
    const dto = { paymentNo: query.get('paymentNo') }
    state.paymentConfirmCalls.push(dto)
    return fail(503, '支付确认超时，请稍后查询')
  }
  return null
}

export const test = base.extend({
  api: async ({ page }, use) => {
    const state = createState()
    const observability = await installObservability(page)
    await page.route(/webapi\.amap\.com/, (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.AMap = {};' }))
    await page.route(/^http:\/\/127\.0\.0\.1:4173\/api\/.*/, async (route, request) => {
      const url = new URL(request.url())
      const result = await routeApi({ method: request.method(), path: url.pathname.replace(/^\/api/, ''), query: url.searchParams, request, state })
      if (!result) {
        await route.fulfill({ status: 501, contentType: 'application/json', body: JSON.stringify(fail(501, `Unhandled mock endpoint: ${request.method()} ${url.pathname}${url.search}`)) })
        return
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result) })
    })
    await use({ state, observability })
    await expectNoObservedErrors(page, observability)
  },
})

export { expect }
