import request from '../utils/request'

export const claimCoupon = (templateId) => request.post(`/coupons/claim/${templateId}`)
export const getMyCoupons = (params) => request.get('/coupons/mine', { params })
export const getAvailableCoupons = (params) => request.get('/coupons/available', { params })
