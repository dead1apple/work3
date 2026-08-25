import axios from 'axios'
import { ApiBusinessError, ApiProtocolError } from './api-errors'
import { clearToken, getToken } from './token'

const request = axios.create({
  baseURL: '/api',
  timeout: 15_000,
})

let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null
}

function parseResponse(payload) {
  const isObject = payload !== null && typeof payload === 'object' && !Array.isArray(payload)
  const hasField = (field) => Object.prototype.hasOwnProperty.call(payload, field)

  if (!isObject || !hasField('code') || !hasField('msg') || !hasField('data')) {
    throw new ApiProtocolError()
  }

  if (payload.code !== 1) {
    throw new ApiBusinessError(payload.code, payload.msg)
  }

  return payload.data
}

request.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.set('Authorization', token)
  }

  return config
})

request.interceptors.response.use(
  (response) => parseResponse(response.data),
  (error) => {
    if (error.response?.status === 401) {
      clearToken()

      try {
        unauthorizedHandler?.()
      } catch {
        // The original 401 remains the request's observable failure.
      }
    }

    return Promise.reject(error)
  },
)

export default request
