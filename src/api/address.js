import request from '../utils/request'

export const addAddress = (data) => request.post('/address', data)
export const updateAddress = (data) => request.put('/address', data)
export const setDefaultAddress = (id) => request.put(`/address/default/${id}`)
export const getAddress = (id) => request.get(`/address/${id}`)
export const deleteAddress = (id) => request.delete(`/address/${id}`)
export const getAddressList = () => request.get('/address/list')
