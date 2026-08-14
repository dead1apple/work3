import request from '../utils/request'

export const getCategoryTree = () => request.get('/categories/tree')
export const getCategoryChildren = (parentId) => request.get('/categories/children', { params: { parentId } })
