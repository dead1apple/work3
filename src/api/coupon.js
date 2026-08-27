import request from '../utils/request'

export function getMerchantCoupons(params) {
  return request.get('/merchant/coupons', { params })
}

export function createMerchantCoupon(payload) {
  return request.post('/merchant/coupons', payload)
}

export function getMerchantCoupon(id) {
  return request.get(`/merchant/coupons/${id}`)
}

export function updateMerchantCoupon(id, payload) {
  return request.put(`/merchant/coupons/${id}`, payload)
}

export function updateMerchantCouponStatus(id, status) {
  return request.put(`/merchant/coupons/${id}/status`, null, { params: { status } })
}

export function getMerchantCouponUsers(id) {
  return request.get(`/merchant/coupons/${id}/users`)
}

export function getMerchantCouponStatistics(id) {
  return request.get(`/merchant/coupons/${id}/statistics`)
}
