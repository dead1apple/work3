import test from 'node:test'
import assert from 'node:assert/strict'

import * as adminApi from '../src/api/admin.js'
import request from '../src/utils/request.js'

const captureRequest = async (invoke) => {
  const previousAdapter = request.defaults.adapter
  const hadLocalStorage = Object.hasOwn(globalThis, 'localStorage')
  const previousLocalStorage = globalThis.localStorage
  let captured
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }
  request.defaults.adapter = async (config) => {
    captured = config
    return {
      config,
      data: { code: 1, msg: 'success', data: null },
      headers: {},
      status: 200,
      statusText: 'OK',
    }
  }

  try {
    await invoke()
  } finally {
    request.defaults.adapter = previousAdapter
    if (hadLocalStorage) globalThis.localStorage = previousLocalStorage
    else delete globalThis.localStorage
  }

  const data = typeof captured?.data === 'string' ? JSON.parse(captured.data) : captured?.data
  return {
    method: captured?.method,
    url: captured?.url,
    params: captured?.params,
    data,
  }
}

const coupon = {
  shopId: 9,
  name: '满减券',
  type: 1,
  amount: 20,
  minAmount: 100,
  totalCount: 500,
  startTime: '2026-08-24 00:00:00',
  endTime: '2026-09-24 23:59:59',
  status: 1,
}

const category = {
  parentId: 0,
  name: '数码',
  level: 1,
  icon: 'https://example.com/category.png',
  sortOrder: 10,
  status: 1,
}

const brand = {
  name: '测试品牌',
  logo: 'https://example.com/brand.png',
  description: '品牌简介',
  sortOrder: 5,
  status: 1,
}

const role = {
  name: '运营管理员',
  code: 'OPERATOR',
  permissions: ['product:audit'],
  status: 1,
}

const config = {
  smsMockEnabled: true,
  payMockEnabled: false,
  recommendedProductIds: [11, 12],
}

const batchAudit = {
  type: 'product',
  ids: [11, 12],
  action: 'approve',
  reason: '批量审核',
}

const cases = [
  ['getAdminProducts', [{ categoryId: 3, keyword: '手机', status: 2, page: 2, size: 20 }], 'get', '/admin/products', { categoryId: 3, keyword: '手机', status: 2, page: 2, size: 20 }],
  ['getAdminProductDetail', [11], 'get', '/admin/products/11/detail'],
  ['auditProduct', [11, 0], 'put', '/admin/products/11/audit', { status: 0 }, null],

  ['getAdminShops', [{ keyword: '旗舰店', status: 0, page: 3, size: 15 }], 'get', '/admin/shops', { keyword: '旗舰店', status: 0, page: 3, size: 15 }],
  ['getAdminShopDetail', [12], 'get', '/admin/shops/12/detail'],
  ['getAdminShopMap', [], 'get', '/admin/shops/map'],
  ['auditShop', [12, 3], 'put', '/admin/shops/12/audit', { status: 3 }, null],

  ['getAdminUsers', [{ keyword: 'test', role: 1, status: 1, page: 2, size: 20 }], 'get', '/admin/users', { keyword: 'test', role: 1, status: 1, page: 2, size: 20 }],
  ['getAdminUserDetail', [13], 'get', '/admin/users/13/detail'],
  ['updateUserStatus', [13, 0], 'put', '/admin/users/13/status', { status: 0 }, null],

  ['getAdminOrders', [{ keyword: '张三', status: 1, page: 4, size: 25 }], 'get', '/admin/orders', { keyword: '张三', status: 1, page: 4, size: 25 }],
  ['getAdminOrderDetail', ['JD202608240001'], 'get', '/admin/orders/JD202608240001/detail'],
  ['closeAdminOrder', ['JD202608240001', { reason: '订单异常' }], 'put', '/admin/orders/JD202608240001/close', undefined, { reason: '订单异常' }],
  ['deliverAdminOrder', ['JD202608240001', { logisticsCompany: '顺丰快递', logisticsNo: 'SF123' }], 'put', '/admin/orders/JD202608240001/deliver', undefined, { logisticsCompany: '顺丰快递', logisticsNo: 'SF123' }],
  ['refundAdminOrder', ['JD202608240001', { amount: 199.5, reason: '协商退款' }], 'put', '/admin/orders/JD202608240001/refund', undefined, { amount: 199.5, reason: '协商退款' }],

  ['getAdminCoupons', [{ keyword: '满减', status: 1, page: 2, size: 10 }], 'get', '/admin/coupons', { keyword: '满减', status: 1, page: 2, size: 10 }],
  ['getAdminAvailableCoupons', [], 'get', '/admin/coupons/available'],
  ['createAdminCoupon', [coupon], 'post', '/admin/coupons', undefined, coupon],
  ['updateAdminCoupon', [14, coupon], 'put', '/admin/coupons/14', undefined, coupon],
  ['updateAdminCouponStatus', [14, 0], 'put', '/admin/coupons/14/status', { status: 0 }, null],

  ['getAdminCategories', [], 'get', '/admin/catalog/categories'],
  ['createAdminCategory', [category], 'post', '/admin/catalog/categories', undefined, category],
  ['updateAdminCategory', [15, category], 'put', '/admin/catalog/categories/15', undefined, category],
  ['updateAdminCategoryStatus', [15, 0], 'put', '/admin/catalog/categories/15/status', { status: 0 }, null],

  ['getAdminBrands', [], 'get', '/admin/catalog/brands'],
  ['createAdminBrand', [brand], 'post', '/admin/catalog/brands', undefined, brand],
  ['updateAdminBrand', [16, brand], 'put', '/admin/catalog/brands/16', undefined, brand],
  ['updateAdminBrandStatus', [16, 0], 'put', '/admin/catalog/brands/16/status', { status: 0 }, null],

  ['getAdminAudits', [{ type: 'product', keyword: '手机', page: 2, size: 20 }], 'get', '/admin/audits', { type: 'product', keyword: '手机', page: 2, size: 20 }],
  ['getAdminAuditHistory', [{ type: 'shop', page: 3, size: 15 }], 'get', '/admin/audits/history', { type: 'shop', page: 3, size: 15 }],
  ['batchAdminAudits', [batchAudit], 'post', '/admin/audits/batch', undefined, batchAudit],

  ['getAdminRoles', [], 'get', '/admin/security/roles'],
  ['createAdminRole', [role], 'post', '/admin/security/roles', undefined, role],
  ['updateAdminRole', [17, role], 'put', '/admin/security/roles/17', undefined, role],
  ['getAdminSecurityAdmins', [], 'get', '/admin/security/admins'],
  ['assignAdminRole', [18, 17], 'put', '/admin/security/admins/18/role', { roleId: 17 }, null],

  ['getAdminRisks', [], 'get', '/admin/security/risks'],
  ['getAdminOperationLogs', [{ page: 2, size: 20, keyword: '审核' }], 'get', '/admin/security/operation-logs', { page: 2, size: 20, keyword: '审核' }],
  ['getAdminLoginLogs', [{ page: 3, size: 15, keyword: 'admin', success: false }], 'get', '/admin/security/login-logs', { page: 3, size: 15, keyword: 'admin', success: false }],

  ['getAdminConfig', [], 'get', '/admin/config'],
  ['updateAdminConfig', [config], 'put', '/admin/config', undefined, config],
  ['getAdminDashboard', [{ days: 30 }], 'get', '/admin/dashboard', { days: 30 }],
]

for (const [name, args, method, url, params, data] of cases) {
  test(`${name} sends the documented admin request`, async () => {
    assert.equal(typeof adminApi[name], 'function', `${name} must be exported`)
    assert.deepEqual(await captureRequest(() => adminApi[name](...args)), {
      method,
      url,
      params,
      data,
    })
  })
}
