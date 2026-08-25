export class ApiBusinessError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'ApiBusinessError'
    this.code = code
  }
}

export class ApiProtocolError extends Error {
  constructor(message = '服务响应格式不符合约定') {
    super(message)
    this.name = 'ApiProtocolError'
  }
}

