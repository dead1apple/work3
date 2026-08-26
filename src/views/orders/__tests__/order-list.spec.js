import { describe, expect, it } from 'vitest'
import { ORDER_STATUS_OPTIONS, formatAmount, getOrderStatus } from '../order-list'

describe('merchant order presentation', () => {
  it('maps documented order statuses and formats server money amounts', () => {
    expect(ORDER_STATUS_OPTIONS).toEqual([
      { label: '待付款', value: 0 },
      { label: '待发货', value: 1 },
      { label: '待收货', value: 2 },
      { label: '已完成', value: 3 },
      { label: '已取消', value: 4 },
      { label: '已退款', value: 5 },
    ])
    expect(getOrderStatus(1)).toMatchObject({ label: '待发货' })
    expect(getOrderStatus(4)).toMatchObject({ label: '已取消' })
    expect(getOrderStatus(9)).toEqual({ label: '未知状态', type: 'info' })
    expect(formatAmount(37144.38)).toBe('¥37,144.38')
  })
})
