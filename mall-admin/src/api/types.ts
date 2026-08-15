export interface ApiEnvelope<T> {
  code: number
  msg: string
  data: T
}

export interface PageResult<T> {
  total: number
  list: T[]
  page: number
  size: number
}

export interface AdminUser {
  id: number
  username: string
  nickname: string
  phone?: string
  email?: string
  avatar?: string
  gender?: number
  status: number
  role: number
  lastLoginTime?: string
  lastLoginIp?: string
  createTime: string
}

export interface Product {
  id: number
  categoryId?: number
  brandId?: number
  shopId?: number
  name: string
  subtitle?: string
  mainImage?: string
  status: number
  salesCount: number
  sortOrder?: number
  createTime: string
}

export interface ProductSummary {
  product: Product
  minPrice: number
  maxPrice: number
  totalStock: number
}

export interface Order {
  id: number
  orderNo: string
  userId?: number
  shopId?: number
  totalAmount: number
  payAmount: number
  freightAmount?: number
  discountAmount?: number
  status: number
  receiverName: string
  receiverPhone?: string
  receiverAddress?: string
  payType?: number
  payTime?: string
  logisticsNo?: string
  logisticsCompany?: string
  createTime: string
}

export interface Shop {
  id: number
  userId?: number
  shopName: string
  logo?: string
  description?: string
  licenseImage?: string
  status: number
  rating: number
  createTime: string
}

export interface Coupon {
  id: number
  shopId?: number | null
  name: string
  type: number
  amount: number
  minAmount: number
  totalCount: number
  issuedCount: number
  usedCount: number
  startTime: string
  endTime: string
  status: number
  createTime: string
}

export interface LoginData {
  token: string
  user: AdminUser
}

export interface AdminSnapshot {
  users: AdminUser[]
  products: ProductSummary[]
  orders: Order[]
  shops: Shop[]
  coupons: Coupon[]
}

export interface ListParams {
  keyword?: string
  status?: number | ''
  role?: number | ''
  categoryId?: number | ''
  page?: number
  size?: number
}

export interface DashboardMetricSet {
  userCount: number
  activeUserCount: number
  productCount: number
  activeProductCount: number
  orderCount: number
  paidOrderCount: number
  shopCount: number
  activeShopCount: number
  revenue: number
  completionRate: number
  couponUsageRate: number
  pendingAuditCount: number
}

export interface DashboardTrendPoint { date: string, revenue: number, orders: number }
export interface RankingItem { id: number, name: string, image?: string, value: number, secondary?: number }
export interface DashboardOverview {
  days: number
  metrics: DashboardMetricSet
  trend: DashboardTrendPoint[]
  orderStates: Array<{ status: number, count: number }>
  topProducts: RankingItem[]
  topShops: RankingItem[]
  pending: { products: number, shops: number, refunds: number }
}

export type AuditType = 'product' | 'shop'
export interface AuditQueueItem {
  id: number
  type: AuditType
  name: string
  image?: string
  owner?: string
  description?: string
  createTime: string
  status: number
}
export interface AuditRecord {
  id: number
  bizType: AuditType
  bizId: number
  bizName: string
  action: string
  reason?: string
  operatorName: string
  createTime: string
}

export interface UserDetail {
  user: AdminUser
  orders: Order[]
  coupons: Array<Coupon & { userCouponId?: number, userStatus?: number, receiveTime?: string }>
  addresses: Array<{ id: number, receiverName: string, receiverPhone: string, province: string, city: string, district: string, detailAddress: string, isDefault: number }>
  loginLogs: LoginLog[]
}
export interface ProductDetail { product: Product, skuList: Array<{ id: number, skuName: string, skuCode?: string, price: number, marketPrice?: number, stock: number, lockedStock: number, status: number }> }
export interface ShopDetail { shop: Shop, products: ProductSummary[], orders: Order[] }
export interface OrderDetail { order: Order, items: Array<{ id: number, productName: string, skuName: string, skuImage?: string, price: number, quantity: number, totalAmount: number }>, payment?: { paymentNo: string, payType: number, amount: number, status: number, thirdPartyNo?: string, payTime?: string }, refunds?: RefundRecord[] }
export interface RefundRecord { id: number, orderNo: string, amount: number, reason: string, status: number, operatorName: string, createTime: string }

export interface CouponForm {
  shopId?: number | null
  name: string
  type: number
  amount: number
  minAmount: number
  totalCount: number
  startTime: string
  endTime: string
  status: number
}

export interface Category { id: number, parentId: number, name: string, level: number, icon?: string, sortOrder: number, status: number, createTime?: string }
export interface Brand { id: number, name: string, logo?: string, description?: string, sortOrder: number, status: number, createTime?: string }
export interface SystemConfig { smsMockEnabled: boolean, payMockEnabled: boolean, recommendedProductIds: number[] }

export interface AdminRole { id: number, name: string, code: string, permissions: string[], status: number, createTime?: string }
export interface AdminAccount extends AdminUser { roleId?: number, roleName?: string, permissions?: string[] }
export interface OperationLog { id: number, adminUserId: number, adminName: string, module: string, action: string, targetType?: string, targetId?: string, detail?: string, success: boolean, ip?: string, createTime: string }
export interface LoginLog { id: number, userId?: number, username: string, ip?: string, success: boolean, message?: string, createTime: string }
export interface RiskAlert { id: string, level: 'high' | 'medium' | 'low', type: string, title: string, description: string, username?: string, count?: number, lastSeen?: string }
