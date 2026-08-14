import request from '../utils/request'

export const receiveOrder = (orderNo) => request.put(`/orders/${orderNo}/receive`)
export const cancelOrder = (orderNo) => request.put(`/orders/${orderNo}/cancel`)
export const getOrders = (params) => request.get('/orders', { params })
export const createOrder = (data) => request.post('/orders', data)
export const createReview = (data) => request.post('/orders/review', data)
export const buyNow = (data) => request.post('/orders/buy-now', data)
export const getOrderDetail = (orderNo) => request.get(`/orders/${orderNo}`)
export const deleteOrder = (orderNo) => request.delete(`/orders/${orderNo}`)
