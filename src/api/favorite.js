import request from '../utils/request'

export const addFavorite = (productId) => request.post(`/favorites/${productId}`)
export const removeFavorite = (productId) => request.delete(`/favorites/${productId}`)
export const getFavorites = () => request.get('/favorites')
export const checkFavorite = (productId) => request.get(`/favorites/check/${productId}`)
