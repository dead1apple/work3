export const permissionGroups = [
  { module: 'dashboard', label: '经营概览' },
  { module: 'audits', label: '审核中心' },
  { module: 'users', label: '用户管理' },
  { module: 'products', label: '商品管理' },
  { module: 'orders', label: '订单运营' },
  { module: 'shops', label: '店铺管理' },
  { module: 'coupons', label: '优惠券' },
  { module: 'catalog', label: '平台配置' },
  { module: 'config', label: '系统设置' },
  { module: 'security', label: '安全中心' },
] as const

export function hasPermission(permissions: string[] | undefined, permission: string) {
  return Boolean(permissions?.includes('*') || permissions?.includes(permission))
}
