import request from '../utils/request'

export function getCurrentShop() {
  return request.get('/merchant/shop')
}
