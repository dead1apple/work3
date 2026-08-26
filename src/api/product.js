import request from '../utils/request'

export function getMerchantProducts(params) {
  return request.get('/merchant/products', { params })
}

export function createMerchantProduct(payload) {
  return request.post('/merchant/products', payload)
}
