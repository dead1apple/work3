import request from '../utils/request'

export function getMerchantOrders(params) {
  return request.get('/merchant/orders', { params })
}
