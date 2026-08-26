import request from '../utils/request'

export function getMerchantProducts(params) {
  return request.get('/merchant/products', { params })
}

export function createMerchantProduct(payload) {
  return request.post('/merchant/products', payload)
}

export function getMerchantProduct(id) {
  return request.get(`/merchant/products/${id}`)
}

export function updateMerchantProduct(payload) {
  return request.put('/merchant/products', payload)
}

export function uploadMerchantImage(file) {
  const data = new FormData()
  data.append('file', file)
  return request.post('/merchant/uploads/images', data)
}

export function updateMerchantProductStatus(id, status) {
  return request.put(`/merchant/products/${id}/status`, null, { params: { status } })
}
