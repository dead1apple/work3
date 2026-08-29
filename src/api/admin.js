import request from '../utils/request.js'

export const getShopMapPoints = () => request.get('/admin/shops/map')
