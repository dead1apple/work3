const STATUS_META = {
  0: { text: '待付款', description: '订单已提交，请尽快完成支付', tone: 'warning', step: 1 },
  1: { text: '待发货', description: '付款成功，商家正在准备商品', tone: 'warning', step: 2 },
  2: { text: '待收货', description: '商品已发出，请注意查收', tone: 'primary', step: 3 },
  3: { text: '已完成', description: '订单已完成，感谢您的购买', tone: 'success', step: 4 },
  4: { text: '已取消', description: '订单已取消', tone: 'info', step: 0 },
  5: { text: '已退款', description: '订单款项已退回', tone: 'info', step: 0 },
}

const UNKNOWN_STATUS = { text: '订单处理中', description: '订单状态正在更新', tone: 'info', step: 0 }

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== '')
const toNumber = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const unwrap = (payload) => payload?.data ?? payload ?? {}

const readList = (payload) => {
  const source = unwrap(payload)
  if (Array.isArray(source)) return source
  return source.list || source.records || source.items || source.rows || []
}

export function getOrderStatusMeta(status) {
  return STATUS_META[Number(status)] || UNKNOWN_STATUS
}

export function normalizeOrderItem(item = {}) {
  const price = toNumber(firstDefined(item.price, item.unitPrice, item.salePrice))
  const quantity = Math.max(1, toNumber(firstDefined(item.quantity, item.count, item.num), 1))
  const id = firstDefined(item.orderItemId, item.id)
  return {
    id,
    orderItemId: id,
    productId: firstDefined(item.productId, item.spuId, item.product?.id),
    name: firstDefined(item.productName, item.name, item.skuName, item.product?.name, '商品'),
    spec: firstDefined(item.specName, item.skuName, item.spec, item.sku?.name, ''),
    image: firstDefined(item.productImage, item.image, item.mainImage, item.product?.mainImage, ''),
    price,
    quantity,
    subtotal: toNumber(firstDefined(item.subtotal, item.totalAmount, item.amount), price * quantity),
  }
}

function normalizeOrder(source = {}, extra = {}) {
  const status = toNumber(source.status, -1)
  const meta = getOrderStatusMeta(status)
  const rawItems = extra.items || source.items || source.orderItems || source.details || []
  const items = Array.isArray(rawItems) ? rawItems.map(normalizeOrderItem) : []
  const goodsAmount = toNumber(firstDefined(source.goodsAmount, source.productAmount), items.reduce((sum, item) => sum + item.subtotal, 0))
  const payAmount = toNumber(firstDefined(source.payAmount, source.totalAmount, source.actualAmount), goodsAmount)
  return {
    ...source,
    orderNo: firstDefined(source.orderNo, source.orderNumber, source.id, ''),
    status,
    statusText: firstDefined(source.statusName, source.statusText, meta.text),
    statusMeta: { ...meta, text: firstDefined(source.statusName, source.statusText, meta.text) },
    items,
    goodsAmount,
    freightAmount: toNumber(firstDefined(source.freightAmount, source.shippingFee)),
    discountAmount: toNumber(firstDefined(source.discountAmount, source.couponAmount)),
    payAmount,
    totalAmount: payAmount,
  }
}

export function normalizeOrderList(payload) {
  const source = unwrap(payload)
  const list = readList(source).map((item) => normalizeOrder(item))
  return {
    list,
    total: toNumber(firstDefined(source.total, source.totalElements, source.count), list.length),
  }
}

export function normalizeOrderDetail(payload) {
  const source = unwrap(payload)
  const orderSource = source.order || source.orderInfo || source
  const rawItems = source.items || source.orderItems || source.details || orderSource.items || orderSource.orderItems || []
  const address = source.address || source.deliveryAddress || orderSource.address || orderSource.deliveryAddress || {}
  const order = normalizeOrder(orderSource, { items: rawItems })
  const receiverName = firstDefined(address.receiverName, address.name, orderSource.receiverName, '')
  const receiverPhone = firstDefined(address.receiverPhone, address.phone, orderSource.receiverPhone, '')
  const region = [address.province, address.city, address.district].filter(Boolean)
  const detailAddress = firstDefined(address.detailAddress, address.address, orderSource.detailAddress, '')
  return {
    ...order,
    receiverName,
    receiverPhone,
    detailAddress,
    fullAddress: [...region, detailAddress].filter(Boolean).join(' '),
    createTime: firstDefined(orderSource.createTime, orderSource.createdAt, ''),
    payTime: firstDefined(orderSource.payTime, ''),
    deliveryTime: firstDefined(orderSource.deliveryTime, orderSource.shipTime, ''),
    receiveTime: firstDefined(orderSource.receiveTime, orderSource.completeTime, ''),
    remark: firstDefined(orderSource.remark, orderSource.orderRemark, ''),
    logisticsCompany: firstDefined(orderSource.logisticsCompany, orderSource.expressCompany, ''),
    logisticsNo: firstDefined(orderSource.logisticsNo, orderSource.trackingNo, orderSource.expressNo, ''),
  }
}

export function getOrderActions(status) {
  const actions = {
    0: ['detail', 'cancel', 'pay'],
    1: ['detail', 'cancel'],
    2: ['detail', 'receive'],
    3: ['detail', 'review', 'delete'],
    4: ['detail', 'delete'],
    5: ['detail', 'delete'],
  }
  return actions[Number(status)] || ['detail']
}
