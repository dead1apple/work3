import { apiRequest, buildQuery } from './client'
import type {
  AdminSnapshot,
  AdminAccount,
  AdminRole,
  AdminUser,
  AuditQueueItem,
  AuditRecord,
  AuditType,
  Brand,
  Category,
  Coupon,
  CouponForm,
  DashboardOverview,
  ListParams,
  LoginData,
  LoginLog,
  OperationLog,
  Order,
  OrderDetail,
  PageResult,
  ProductDetail,
  ProductSummary,
  RiskAlert,
  Shop,
  ShopDetail,
  SystemConfig,
  UserDetail,
} from './types'

export const adminApi = {
  login: (username: string, password: string) => apiRequest<LoginData>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),

  users: (params: ListParams = {}) => apiRequest<PageResult<AdminUser>>(`/api/admin/users${buildQuery(params)}`),
  setUserStatus: (id: number, status: number) => apiRequest<string>(`/api/admin/users/${id}/status${buildQuery({ status })}`, { method: 'PUT' }),

  products: (params: ListParams = {}) => apiRequest<PageResult<ProductSummary>>(`/api/admin/products${buildQuery(params)}`),
  auditProduct: (id: number, status: number) => apiRequest<string>(`/api/admin/products/${id}/audit${buildQuery({ status })}`, { method: 'PUT' }),

  orders: (params: ListParams = {}) => apiRequest<PageResult<Order>>(`/api/admin/orders${buildQuery(params)}`),

  shops: (params: ListParams = {}) => apiRequest<PageResult<Shop>>(`/api/admin/shops${buildQuery(params)}`),
  auditShop: (id: number, status: number) => apiRequest<string>(`/api/admin/shops/${id}/audit${buildQuery({ status })}`, { method: 'PUT' }),

  coupons: () => apiRequest<Coupon[]>('/api/admin/coupons/available'),

  dashboard: (days = 30) => apiRequest<DashboardOverview>(`/api/admin/dashboard${buildQuery({ days })}`),
  audits: (params: ListParams & { type?: AuditType | '', page?: number, size?: number } = {}) => apiRequest<PageResult<AuditQueueItem>>(`/api/admin/audits${buildQuery(params)}`),
  auditHistory: (params: { type?: AuditType | '', page?: number, size?: number } = {}) => apiRequest<PageResult<AuditRecord>>(`/api/admin/audits/history${buildQuery(params)}`),
  batchAudit: (type: AuditType, ids: number[], action: 'approve' | 'reject', reason?: string) => apiRequest<string>('/api/admin/audits/batch', { method: 'POST', body: JSON.stringify({ type, ids, action, reason }) }),

  userDetail: (id: number) => apiRequest<UserDetail>(`/api/admin/users/${id}/detail`),
  productDetail: (id: number) => apiRequest<ProductDetail>(`/api/admin/products/${id}/detail`),
  shopDetail: (id: number) => apiRequest<ShopDetail>(`/api/admin/shops/${id}/detail`),
  orderDetail: (orderNo: string) => apiRequest<OrderDetail>(`/api/admin/orders/${orderNo}/detail`),
  deliverOrder: (orderNo: string, logisticsCompany: string, logisticsNo: string) => apiRequest<string>(`/api/admin/orders/${orderNo}/deliver`, { method: 'PUT', body: JSON.stringify({ logisticsCompany, logisticsNo }) }),
  closeOrder: (orderNo: string, reason: string) => apiRequest<string>(`/api/admin/orders/${orderNo}/close`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  refundOrder: (orderNo: string, amount: number, reason: string) => apiRequest<string>(`/api/admin/orders/${orderNo}/refund`, { method: 'PUT', body: JSON.stringify({ amount, reason }) }),

  couponList: (params: ListParams = {}) => apiRequest<PageResult<Coupon>>(`/api/admin/coupons${buildQuery(params)}`),
  createCoupon: (form: CouponForm) => apiRequest<Coupon>('/api/admin/coupons', { method: 'POST', body: JSON.stringify(form) }),
  updateCoupon: (id: number, form: CouponForm) => apiRequest<string>(`/api/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(form) }),
  setCouponStatus: (id: number, status: number) => apiRequest<string>(`/api/admin/coupons/${id}/status${buildQuery({ status })}`, { method: 'PUT' }),

  categories: () => apiRequest<Category[]>('/api/admin/catalog/categories'),
  createCategory: (form: Omit<Category, 'id'>) => apiRequest<Category>('/api/admin/catalog/categories', { method: 'POST', body: JSON.stringify(form) }),
  updateCategory: (id: number, form: Partial<Category>) => apiRequest<string>(`/api/admin/catalog/categories/${id}`, { method: 'PUT', body: JSON.stringify(form) }),
  setCategoryStatus: (id: number, status: number) => apiRequest<string>(`/api/admin/catalog/categories/${id}/status${buildQuery({ status })}`, { method: 'PUT' }),
  brands: () => apiRequest<Brand[]>('/api/admin/catalog/brands'),
  createBrand: (form: Omit<Brand, 'id'>) => apiRequest<Brand>('/api/admin/catalog/brands', { method: 'POST', body: JSON.stringify(form) }),
  updateBrand: (id: number, form: Partial<Brand>) => apiRequest<string>(`/api/admin/catalog/brands/${id}`, { method: 'PUT', body: JSON.stringify(form) }),
  setBrandStatus: (id: number, status: number) => apiRequest<string>(`/api/admin/catalog/brands/${id}/status${buildQuery({ status })}`, { method: 'PUT' }),
  getConfig: () => apiRequest<SystemConfig>('/api/admin/config'),
  updateConfig: (config: SystemConfig) => apiRequest<string>('/api/admin/config', { method: 'PUT', body: JSON.stringify(config) }),

  roles: () => apiRequest<AdminRole[]>('/api/admin/security/roles'),
  createRole: (role: Omit<AdminRole, 'id'>) => apiRequest<AdminRole>('/api/admin/security/roles', { method: 'POST', body: JSON.stringify(role) }),
  updateRole: (id: number, role: Partial<AdminRole>) => apiRequest<AdminRole>(`/api/admin/security/roles/${id}`, { method: 'PUT', body: JSON.stringify(role) }),
  adminAccounts: () => apiRequest<AdminAccount[]>('/api/admin/security/admins'),
  assignAdminRole: (userId: number, roleId: number) => apiRequest<string>(`/api/admin/security/admins/${userId}/role${buildQuery({ roleId })}`, { method: 'PUT' }),
  operationLogs: (params: ListParams = {}) => apiRequest<PageResult<OperationLog>>(`/api/admin/security/operation-logs${buildQuery(params)}`),
  loginLogs: (params: ListParams & { success?: boolean | '' } = {}) => apiRequest<PageResult<LoginLog>>(`/api/admin/security/login-logs${buildQuery(params)}`),
  risks: () => apiRequest<RiskAlert[]>('/api/admin/security/risks'),

  snapshot: async (): Promise<AdminSnapshot> => {
    const [users, products, orders, shops, coupons] = await Promise.all([
      adminApi.users({ page: 1, size: 1000 }),
      adminApi.products({ page: 1, size: 1000 }),
      adminApi.orders({ page: 1, size: 1000 }),
      adminApi.shops({ page: 1, size: 1000 }),
      adminApi.coupons(),
    ])
    return {
      users: users.list,
      products: products.list,
      orders: orders.list,
      shops: shops.list,
      coupons,
    }
  },
}
