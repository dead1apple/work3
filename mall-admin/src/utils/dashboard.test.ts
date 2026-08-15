import { summarizeDashboard } from './dashboard'
import type { AdminSnapshot } from '../api/types'

describe('dashboard summary', () => {
  it('derives operational metrics from backend records', () => {
    const snapshot: AdminSnapshot = {
      users: [{ id: 1, username: 'a', nickname: 'A', status: 1, role: 0, createTime: '2026-08-14 10:00:00' }],
      products: [{ product: { id: 1, name: 'Phone', status: 2, salesCount: 4, createTime: '2026-08-14 10:00:00' }, minPrice: 99, maxPrice: 109, totalStock: 8 }],
      orders: [
        { id: 1, orderNo: 'A', status: 3, payAmount: 120, totalAmount: 120, receiverName: 'A', createTime: '2026-08-14 10:00:00' },
        { id: 2, orderNo: 'B', status: 1, payAmount: 80, totalAmount: 80, receiverName: 'B', createTime: '2026-08-13 10:00:00' },
      ],
      shops: [{ id: 1, shopName: 'Store', status: 0, rating: 4.8, createTime: '2026-08-14 10:00:00' }],
      coupons: [{ id: 1, name: '券', type: 1, amount: 10, minAmount: 100, totalCount: 100, issuedCount: 40, usedCount: 15, startTime: '2026-01-01 00:00:00', endTime: '2026-12-31 23:59:59', status: 1, createTime: '2026-08-14 10:00:00' }],
    }

    const summary = summarizeDashboard(snapshot)

    expect(summary.gmv).toBe(200)
    expect(summary.completionRate).toBe(50)
    expect(summary.pendingReviews).toBe(2)
    expect(summary.couponUsageRate).toBe(37.5)
  })
})
