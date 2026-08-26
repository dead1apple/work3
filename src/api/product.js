import request from '../utils/request'

export function getMerchantProducts(params) {
  return request.get('/merchant/products', { params })
}
