import request from '../utils/request'

export function getMerchantOrders(params) {
  return request.get('/merchant/orders', { params })
}

export function deliverMerchantOrder(payload) {
  return request.post('/merchant/orders/deliver', payload)
}
