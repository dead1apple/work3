import request from '../utils/request'

export const getAdminAvailableCoupons = () => request.get('/admin/coupons/available')
export const auditProduct = (id, status) => request.put(`/admin/products/${id}/audit`, null, { params: { status } })
export const getAdminProducts = (params) => request.get('/admin/products', { params })
export const auditShop = (id, status) => request.put(`/admin/shops/${id}/audit`, null, { params: { status } })
export const getAdminShops = (params) => request.get('/admin/shops', { params })
export const updateUserStatus = (id, status) => request.put(`/admin/users/${id}/status`, null, { params: { status } })
export const getAdminUsers = (params) => request.get('/admin/users', { params })
export const getAdminOrders = (params) => request.get('/admin/orders', { params })
