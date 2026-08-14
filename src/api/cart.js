import request from '../utils/request'

export const setCartItemSelected = (id, selected) => request.put(`/cart/${id}/selected`, null, { params: { selected } })
export const updateCartItemQuantity = (id, quantity) => request.put(`/cart/${id}/quantity`, null, { params: { quantity } })
export const selectAllCartItems = (selected) => request.put('/cart/select-all', null, { params: { selected } })
export const getCart = () => request.get('/cart')
export const addToCart = (data) => request.post('/cart', data)
export const deleteCartItem = (id) => request.delete(`/cart/${id}`)

export const getCartList = getCart
export const addCart = addToCart
export const updateCart = ({ id, quantity }) => updateCartItemQuantity(id, quantity)
export const deleteCart = deleteCartItem
