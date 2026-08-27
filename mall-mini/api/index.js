import request from '../utils/request.js'

export const getProducts = (query) => request({ url: '/products', query, auth: false })
export const getProductDetail = (id) => request({ url: `/products/${id}`, auth: false })
export const getProductReviews = (id, query) => request({ url: `/products/${id}/reviews`, query, auth: false })
export const getCategoryTree = () => request({ url: '/categories/tree', auth: false })
export const getCategoryChildren = (parentId) => request({ url: '/categories/children', query: { parentId }, auth: false })
export const getBrands = () => request({ url: '/brands', auth: false })

export const login = (data) => request({ url: '/auth/login', method: 'POST', data, auth: false })
export const getUserInfo = () => request({ url: '/user/info' })
export const logout = () => request({ url: '/user/logout', method: 'POST' })

export const getCart = () => request({ url: '/cart' })
export const addToCart = (data) => request({ url: '/cart', method: 'POST', data })
export const setCartSelected = (id, selected) => request({ url: `/cart/${id}/selected`, method: 'PUT', query: { selected } })
export const updateCartQuantity = (id, quantity) => request({ url: `/cart/${id}/quantity`, method: 'PUT', query: { quantity } })
export const selectAllCart = (selected) => request({ url: '/cart/select-all', method: 'PUT', query: { selected } })
export const deleteCartItem = (id) => request({ url: `/cart/${id}`, method: 'DELETE' })

export const getFavorites = () => request({ url: '/favorites' })
export const checkFavorite = (productId) => request({ url: `/favorites/check/${productId}` })
export const addFavorite = (productId) => request({ url: `/favorites/${productId}`, method: 'POST' })
export const removeFavorite = (productId) => request({ url: `/favorites/${productId}`, method: 'DELETE' })

export const getOrders = (query) => request({ url: '/orders', query })
export const getOrderDetail = (orderNo) => request({ url: `/orders/${orderNo}` })
export const createOrder = (data) => request({ url: '/orders', method: 'POST', data })
export const buyNowOrder = (data) => request({ url: '/orders/buy-now', method: 'POST', data })
export const createReview = (data) => request({ url: '/orders/review', method: 'POST', data })
export const cancelOrder = (orderNo) => request({ url: `/orders/${orderNo}/cancel`, method: 'PUT' })
export const receiveOrder = (orderNo) => request({ url: `/orders/${orderNo}/receive`, method: 'PUT' })
export const deleteOrder = (orderNo) => request({ url: `/orders/${orderNo}`, method: 'DELETE' })

export const getAddressList = () => request({ url: '/address/list' })
export const addAddress = (data) => request({ url: '/address', method: 'POST', data })
export const updateAddress = (data) => request({ url: '/address', method: 'PUT', data })
export const deleteAddress = (id) => request({ url: `/address/${id}`, method: 'DELETE' })
export const setDefaultAddress = (id) => request({ url: `/address/default/${id}`, method: 'PUT' })
