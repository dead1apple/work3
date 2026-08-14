import request from '../utils/request'

export const createPayment = (data) => request.post('/pay/create', data)
export const confirmPayment = (data) => request.post('/pay/confirm', data)
export const getPaymentStatus = (orderNo) => request.get('/pay/status', { params: { orderNo } })
