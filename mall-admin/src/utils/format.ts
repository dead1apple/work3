export const roleNames: Record<number, string> = { 0: '普通用户', 1: '商家', 2: '管理员' }
export const orderStatusNames: Record<number, string> = {
  0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', 5: '已退款',
}
export const productStatusNames: Record<number, string> = { 0: '已下架', 1: '销售中', 2: '待审核' }
export const shopStatusNames: Record<number, string> = { 0: '待审核', 1: '营业中', 2: '已禁用', 3: '已拒绝' }

export const currency = (value: number) => new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 2,
}).format(Number(value || 0))

export const compactNumber = (value: number) => new Intl.NumberFormat('zh-CN', {
  notation: value >= 10000 ? 'compact' : 'standard',
  maximumFractionDigits: 1,
}).format(value)

export const shortDate = (value?: string) => value ? value.slice(0, 10) : '-'
export const shortDateTime = (value?: string) => value ? value.slice(0, 16) : '-'

export function initials(name?: string) {
  return (name?.trim().slice(0, 1) || '管').toUpperCase()
}

export function statusTone(status: number, kind: 'user' | 'product' | 'order' | 'shop') {
  if (kind === 'user') return status === 1 ? 'success' : 'muted'
  if (kind === 'product') return status === 1 ? 'success' : status === 2 ? 'warning' : 'muted'
  if (kind === 'shop') return status === 1 ? 'success' : status === 0 ? 'warning' : status === 3 ? 'danger' : 'muted'
  if (status === 3) return 'success'
  if (status === 0 || status === 1) return 'warning'
  if (status === 2) return 'info'
  if (status === 5) return 'danger'
  return 'muted'
}
