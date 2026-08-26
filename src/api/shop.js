import request from '../utils/request'

export function getCurrentShop() {
  return request.get('/merchant/shop')
}

export function updateCurrentShop(payload) {
  return request.put('/merchant/shop', payload)
}

export function applyForCurrentShop(payload) {
  return request.post('/merchant/shop/apply', payload)
}
