import request from '../utils/request'

export function login(credentials) {
  return request.post('/auth/login', credentials)
}

export function getCurrentUser() {
  return request.get('/user/info')
}

export function logout() {
  return request.post('/user/logout')
}

