import request from '../utils/request'

export function getCategoryTree() {
  return request.get('/categories/tree')
}

export function getBrands() {
  return request.get('/brands')
}
