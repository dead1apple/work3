const ORDER_STATUS = Object.freeze({
  0: Object.freeze({ label: '待付款', type: 'warning' }),
  1: Object.freeze({ label: '待发货', type: 'primary' }),
  2: Object.freeze({ label: '待收货', type: 'success' }),
  3: Object.freeze({ label: '已完成', type: 'success' }),
  4: Object.freeze({ label: '已取消', type: 'info' }),
  5: Object.freeze({ label: '已退款', type: 'danger' }),
})

export const ORDER_STATUS_OPTIONS = Object.freeze([
  Object.freeze({ label: '全部状态', value: '' }),
  Object.freeze({ label: '待付款', value: 0 }),
  Object.freeze({ label: '待发货', value: 1 }),
  Object.freeze({ label: '待收货', value: 2 }),
  Object.freeze({ label: '已完成', value: 3 }),
  Object.freeze({ label: '已取消', value: 4 }),
  Object.freeze({ label: '已退款', value: 5 }),
])

export function getOrderStatus(status) {
  return ORDER_STATUS[status] || { label: '未知状态', type: 'info' }
}

export function formatAmount(amount) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount || 0)
}
