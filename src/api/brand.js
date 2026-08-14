import request from '../utils/request'

export const getBrands = () => request.get('/brands')
export const getBrandDetail = (id) => request.get(`/brands/${id}`)
