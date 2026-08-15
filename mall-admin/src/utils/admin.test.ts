import type { Coupon, Order } from '../api/types'
import { auditActionPresentation, orderExportRows, refundStatusPresentation, summarizeCoupons, toApiDateTime, toDateTimeInput } from './admin'

describe('admin workflow utilities', () => {
  it('presents every audit history action with the correct label and tone', () => {
    expect(auditActionPresentation('approve')).toEqual({ label: '已通过', tone: 'success' })
    expect(auditActionPresentation('reject')).toEqual({ label: '已拒绝', tone: 'danger' })
    expect(auditActionPresentation('enable')).toEqual({ label: '已启用', tone: 'success' })
    expect(auditActionPresentation('disable')).toEqual({ label: '已停用', tone: 'muted' })
  })

  it('summarizes coupon inventory and usage across all templates', () => {
    const coupons: Coupon[] = [
      { id: 1, name: '新人券', type: 1, amount: 10, minAmount: 50, totalCount: 100, issuedCount: 60, usedCount: 30, startTime: '2026-08-01 00:00:00', endTime: '2026-09-01 00:00:00', status: 1, createTime: '2026-08-01 00:00:00' },
      { id: 2, name: '店铺券', type: 3, amount: 5, minAmount: 0, totalCount: 50, issuedCount: 20, usedCount: 5, startTime: '2026-08-01 00:00:00', endTime: '2026-09-01 00:00:00', status: 0, createTime: '2026-08-01 00:00:00' },
    ]

    expect(summarizeCoupons(coupons)).toEqual({ templates: 2, active: 1, issued: 80, used: 35, remaining: 70, usageRate: 43.8 })
  })

  it('normalizes datetime-local values for the backend and form controls', () => {
    expect(toApiDateTime('2026-08-14T18:30')).toBe('2026-08-14 18:30:00')
    expect(toDateTimeInput('2026-08-14 18:30:00')).toBe('2026-08-14T18:30')
  })

  it('maps order records to human-readable CSV rows', () => {
    const orders: Order[] = [{
      id: 1,
      orderNo: 'ZY-1001',
      userId: 9,
      shopId: 3,
      totalAmount: 108,
      payAmount: 98,
      status: 2,
      receiverName: '张三',
      receiverPhone: '13800000000',
      receiverAddress: '深圳市南山区',
      logisticsCompany: '顺丰速运',
      logisticsNo: 'SF001',
      createTime: '2026-08-14 12:00:00',
    }]

    expect(orderExportRows(orders)).toEqual([['ZY-1001', '张三', '13800000000', 98, '待收货', '顺丰速运', 'SF001', '深圳市南山区', '2026-08-14 12:00:00']])
  })

  it('distinguishes processing, completed, and failed refunds', () => {
    expect(refundStatusPresentation(0)).toEqual({ label: '处理中', tone: 'warning' })
    expect(refundStatusPresentation(1)).toEqual({ label: '已退款', tone: 'success' })
    expect(refundStatusPresentation(2)).toEqual({ label: '退款失败', tone: 'danger' })
  })
})
