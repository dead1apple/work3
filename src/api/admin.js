import request from '../utils/request.js'

export const getAdminProducts = (params) => request.get('/admin/products', { params })
export const getAdminProductDetail = (id) => request.get(`/admin/products/${id}/detail`)
export const auditProduct = (id, status) => request.put(`/admin/products/${id}/audit`, null, { params: { status } })

export const getAdminShops = (params) => request.get('/admin/shops', { params })
export const getAdminShopDetail = (id) => request.get(`/admin/shops/${id}/detail`)
export const getAdminShopMap = () => request.get('/admin/shops/map')
export const auditShop = (id, status) => request.put(`/admin/shops/${id}/audit`, null, { params: { status } })

export const getAdminUsers = (params) => request.get('/admin/users', { params })
export const getAdminUserDetail = (id) => request.get(`/admin/users/${id}/detail`)
export const updateUserStatus = (id, status) => request.put(`/admin/users/${id}/status`, null, { params: { status } })

export const getAdminOrders = (params) => request.get('/admin/orders', { params })
export const getAdminOrderDetail = (orderNo) => request.get(`/admin/orders/${orderNo}/detail`)
export const closeAdminOrder = (orderNo, data) => request.put(`/admin/orders/${orderNo}/close`, data)
export const deliverAdminOrder = (orderNo, data) => request.put(`/admin/orders/${orderNo}/deliver`, data)
export const refundAdminOrder = (orderNo, data) => request.put(`/admin/orders/${orderNo}/refund`, data)

export const getAdminCoupons = (params) => request.get('/admin/coupons', { params })
export const getAdminAvailableCoupons = () => request.get('/admin/coupons/available')
export const createAdminCoupon = (data) => request.post('/admin/coupons', data)
export const updateAdminCoupon = (id, data) => request.put(`/admin/coupons/${id}`, data)
export const updateAdminCouponStatus = (id, status) => request.put(`/admin/coupons/${id}/status`, null, { params: { status } })

export const getAdminCategories = () => request.get('/admin/catalog/categories')
export const createAdminCategory = (data) => request.post('/admin/catalog/categories', data)
export const updateAdminCategory = (id, data) => request.put(`/admin/catalog/categories/${id}`, data)
export const updateAdminCategoryStatus = (id, status) => request.put(`/admin/catalog/categories/${id}/status`, null, { params: { status } })

export const getAdminBrands = () => request.get('/admin/catalog/brands')
export const createAdminBrand = (data) => request.post('/admin/catalog/brands', data)
export const updateAdminBrand = (id, data) => request.put(`/admin/catalog/brands/${id}`, data)
export const updateAdminBrandStatus = (id, status) => request.put(`/admin/catalog/brands/${id}/status`, null, { params: { status } })

export const getAdminAudits = (params) => request.get('/admin/audits', { params })
export const getAdminAuditHistory = (params) => request.get('/admin/audits/history', { params })
export const batchAdminAudits = (data) => request.post('/admin/audits/batch', data)

export const getAdminRoles = () => request.get('/admin/security/roles')
export const createAdminRole = (data) => request.post('/admin/security/roles', data)
export const updateAdminRole = (id, data) => request.put(`/admin/security/roles/${id}`, data)
export const getAdminSecurityAdmins = () => request.get('/admin/security/admins')
export const assignAdminRole = (userId, roleId) => request.put(`/admin/security/admins/${userId}/role`, null, { params: { roleId } })

export const getAdminRisks = () => request.get('/admin/security/risks')
export const getAdminOperationLogs = (params) => request.get('/admin/security/operation-logs', { params })
export const getAdminLoginLogs = (params) => request.get('/admin/security/login-logs', { params })

export const getAdminConfig = () => request.get('/admin/config')
export const updateAdminConfig = (data) => request.put('/admin/config', data)

export const getAdminDashboard = (params) => request.get('/admin/dashboard', { params })
