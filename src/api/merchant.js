import request from '../utils/request.js'

export const getMyShop = () => request.get('/merchant/shop')
export const applyForShop = (data) => request.post('/merchant/shop/apply', data)
