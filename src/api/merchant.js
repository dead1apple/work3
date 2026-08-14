import request from '../utils/request'

export const getMyShop = () => request.get('/merchant/shop')
export const updateMyShop = (data) => request.put('/merchant/shop', data)
export const applyForShop = (data) => request.post('/merchant/shop/apply', data)
export const deliverOrder = (data) => request.post('/merchant/orders/deliver', data)
export const getMerchantOrders = (params) => request.get('/merchant/orders', { params })
export const getMerchantProducts = (params) => request.get('/merchant/products', { params })
export const createMerchantProduct = (data) => request.post('/merchant/products', data)
export const updateMerchantProduct = (data) => request.put('/merchant/products', data)
export const updateMerchantProductStatus = (id, status) => request.put(`/merchant/products/${id}/status`, null, { params: { status } })
