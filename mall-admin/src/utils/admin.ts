import type { Coupon, Order } from '../api/types'
import { orderStatusNames } from './format'

export type AdminStatusTone = 'success' | 'danger' | 'muted'

const auditActions: Record<string, { label: string, tone: AdminStatusTone }> = {
  approve: { label: '已通过', tone: 'success' },
  reject: { label: '已拒绝', tone: 'danger' },
  enable: { label: '已启用', tone: 'success' },
  disable: { label: '已停用', tone: 'muted' },
}

export function auditActionPresentation(action: string) {
  return auditActions[action] ?? { label: action, tone: 'muted' as const }
}

const refundStatuses: Record<number, { label: string, tone: AdminStatusTone | 'warning' }> = {
  0: { label: '处理中', tone: 'warning' },
  1: { label: '已退款', tone: 'success' },
  2: { label: '退款失败', tone: 'danger' },
}

export function refundStatusPresentation(status: number) {
  return refundStatuses[status] ?? { label: `状态 ${status}`, tone: 'muted' as const }
}

export function summarizeCoupons(coupons: Coupon[]) {
  const issued = coupons.reduce((sum, coupon) => sum + Number(coupon.issuedCount || 0), 0)
  const used = coupons.reduce((sum, coupon) => sum + Number(coupon.usedCount || 0), 0)
  const remaining = coupons.reduce((sum, coupon) => sum + Math.max(0, Number(coupon.totalCount || 0) - Number(coupon.issuedCount || 0)), 0)
  return {
    templates: coupons.length,
    active: coupons.filter((coupon) => coupon.status === 1).length,
    issued,
    used,
    remaining,
    usageRate: issued ? Number((used / issued * 100).toFixed(1)) : 0,
  }
}

export function toApiDateTime(value: string) {
  if (!value) return ''
  const normalized = value.replace('T', ' ')
  return normalized.length === 16 ? `${normalized}:00` : normalized
}

export function toDateTimeInput(value?: string) {
  return value ? value.slice(0, 16).replace(' ', 'T') : ''
}

export function orderExportRows(orders: Order[]) {
  return orders.map((order) => [
    order.orderNo,
    order.receiverName,
    order.receiverPhone || '',
    Number(order.payAmount || 0),
    orderStatusNames[order.status] || `状态 ${order.status}`,
    order.logisticsCompany || '',
    order.logisticsNo || '',
    order.receiverAddress || '',
    order.createTime,
  ])
}
