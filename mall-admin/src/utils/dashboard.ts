import type { AdminSnapshot, Order } from '../api/types'

export interface TrendPoint {
  date: string
  revenue: number
  orders: number
}

const round = (value: number, digits = 1) => Number(value.toFixed(digits))
const isPaidOrder = (order: Order) => order.status >= 1 && order.status <= 3

function buildTrend(orders: Order[]): TrendPoint[] {
  const grouped = new Map<string, TrendPoint>()
  orders.forEach((order) => {
    const key = (order.payTime || order.createTime).slice(0, 10)
    const point = grouped.get(key) ?? { date: key.slice(5).replace('-', '/'), revenue: 0, orders: 0 }
    point.orders += 1
    point.revenue += Number(order.payAmount || 0)
    grouped.set(key, point)
  })
  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, point]) => ({ ...point, revenue: round(point.revenue, 2) }))
}

export function summarizeDashboard(snapshot: AdminSnapshot) {
  const completedOrders = snapshot.orders.filter((order) => order.status === 3).length
  const paidOrders = snapshot.orders.filter(isPaidOrder)
  const issuedCoupons = snapshot.coupons.reduce((sum, coupon) => sum + coupon.issuedCount, 0)
  const usedCoupons = snapshot.coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0)

  return {
    userCount: snapshot.users.length,
    productCount: snapshot.products.length,
    orderCount: snapshot.orders.length,
    shopCount: snapshot.shops.length,
    gmv: round(paidOrders.reduce((sum, order) => sum + Number(order.payAmount || 0), 0), 2),
    completionRate: snapshot.orders.length ? round(completedOrders / snapshot.orders.length * 100) : 0,
    pendingReviews: snapshot.products.filter(({ product }) => product.status === 2).length
      + snapshot.shops.filter((shop) => shop.status === 0).length,
    couponUsageRate: issuedCoupons ? round(usedCoupons / issuedCoupons * 100) : 0,
    activeUsers: snapshot.users.filter((user) => user.status === 1).length,
    activeProducts: snapshot.products.filter(({ product }) => product.status === 1).length,
    activeShops: snapshot.shops.filter((shop) => shop.status === 1).length,
    trend: buildTrend(paidOrders),
    orderStates: [0, 1, 2, 3, 4, 5].map((status) => ({
      status,
      count: snapshot.orders.filter((order) => order.status === status).length,
    })),
  }
}
