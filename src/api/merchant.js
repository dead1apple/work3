import request from '../utils/request.js'

export const getMyShop = () => request.get('/merchant/shop')
export const applyForShop = (data) => request.post('/merchant/shop/apply', data)

export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/merchant/uploads/images', formData)
}
