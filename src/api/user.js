import request from '../utils/request.js'

export const getUserInfo = () => request.get('/user/info')
export const updateUserInfo = (data) => request.put('/user/info', data)
export const logout = () => request.post('/user/logout')
