import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getOrderActions,
  getOrderActionPresentation,
  getOrderStatusMeta,
  normalizeOrderDetail,
  normalizeOrderList,
} from '../src/utils/order.js'

test('uses the backend order status contract', () => {
  const expected = ['待付款', '待发货', '待收货', '已完成', '已取消', '已退款']
  expected.forEach((text, status) => assert.equal(getOrderStatusMeta(status).text, text))
})

test('normalizes paged orders and order items from records', () => {
  const result = normalizeOrderList({
    records: [{
      orderNo: 'JD20260001',
      status: 2,
      payAmount: '198.00',
      orderItems: [{ id: 9, productId: 8, productName: '无线耳机', skuName: '曜石黑', productImage: '/earphone.png', price: '99', quantity: 2 }],
    }],
    total: 1,
  })

  assert.equal(result.total, 1)
  assert.equal(result.list[0].statusText, '待收货')
  assert.equal(result.list[0].payAmount, 198)
  assert.deepEqual(result.list[0].items[0], {
    id: 9,
    orderItemId: 9,
    productId: 8,
    name: '无线耳机',
    spec: '曜石黑',
    image: '/earphone.png',
    price: 99,
    quantity: 2,
    subtotal: 198,
  })
})

test('normalizes a wrapped order detail and builds the full address', () => {
  const detail = normalizeOrderDetail({
    order: { orderNo: 'JD2', status: 1, totalAmount: '109', freightAmount: '10', createTime: '2026-08-17 12:00:00' },
    items: [{ orderItemId: 3, productName: '键盘', price: 99, quantity: 1 }],
    address: { receiverName: '张三', receiverPhone: '13800000000', province: '上海市', city: '上海市', district: '浦东新区', detailAddress: '世纪大道 1 号' },
  })

  assert.equal(detail.orderNo, 'JD2')
  assert.equal(detail.statusText, '待发货')
  assert.equal(detail.receiverName, '张三')
  assert.equal(detail.fullAddress, '上海市 上海市 浦东新区 世纪大道 1 号')
  assert.equal(detail.goodsAmount, 99)
  assert.equal(detail.payAmount, 109)
})

test('normalizes order list items from per-order detail payloads', () => {
  const payload = { list: [{ orderNo: 'JD20260002', status: 3, payAmount: 329 }], total: 1 }
  const details = new Map([['JD20260002', {
    order: { orderNo: 'JD20260002', status: 3 },
    items: [{ id: 18, productId: 69, productName: '安踏 综训鞋 运动鞋', skuImage: '/anta.png', price: 329, quantity: 1 }],
  }]])

  const result = normalizeOrderList(payload, details)

  assert.equal(result.list[0].items.length, 1)
  assert.equal(result.list[0].items[0].name, '安踏 综训鞋 运动鞋')
  assert.equal(result.list[0].items[0].image, '/anta.png')
})

test('keeps orders visible when one detail payload is unavailable', () => {
  const result = normalizeOrderList({ list: [{ orderNo: 'JD20260003', status: 1 }], total: 1 }, new Map())

  assert.equal(result.list.length, 1)
  assert.deepEqual(result.list[0].items, [])
})

test('exposes only operations allowed by each order status', () => {
  assert.deepEqual(getOrderActions(0), ['detail', 'cancel', 'pay'])
  assert.deepEqual(getOrderActions(1), ['detail', 'cancel'])
  assert.deepEqual(getOrderActions(2), ['detail', 'receive'])
  assert.deepEqual(getOrderActions(3), ['detail', 'review', 'delete'])
  assert.deepEqual(getOrderActions(4), ['detail', 'delete'])
  assert.deepEqual(getOrderActions(5), ['detail', 'delete'])
})

test('marks the pay action as a high-contrast primary order action', () => {
  assert.deepEqual(getOrderActionPresentation('pay'), {
    type: 'danger',
    plain: false,
    className: 'pay-order-action',
  })
  assert.deepEqual(getOrderActionPresentation('cancel'), {
    type: '',
    plain: true,
    className: '',
  })
})
