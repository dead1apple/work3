import request from '../utils/request'

export const getProducts = (params) => request.get('/products', { params })
export const getProductList = getProducts
export const getProductDetail = (id) => request.get(`/products/${id}`)
export const getProductReviews = (id, params) => request.get(`/products/${id}/reviews`, { params })
