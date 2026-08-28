import { apiRequest, buildQuery } from './client'

describe('API client', () => {
  it('omits empty query values and serializes useful values', () => {
    expect(buildQuery({ page: 2, size: 10, keyword: '手机', status: 0, role: undefined, empty: '' }))
      .toBe('?page=2&size=10&keyword=%E6%89%8B%E6%9C%BA&status=0')
  })

  it('adds the persisted token and unwraps successful data', async () => {
    localStorage.setItem('mall-admin-token', 'test-token')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ code: 1, msg: 'success', data: { total: 8 } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ))

    await expect(apiRequest('/api/admin/users')).resolves.toEqual({ total: 8 })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/users',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'test-token' }) }),
    )
  })

  it('throws the backend message for failed envelopes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ code: -1, msg: '无权访问', data: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ))

    await expect(apiRequest('/api/admin/users')).rejects.toThrow('无权访问')
  })

  it('clears an expired token when backend asks the admin to log in again', async () => {
    localStorage.setItem('mall-admin-token', 'expired-token')
    const unauthorized = vi.fn()
    window.addEventListener('mall-admin:unauthorized', unauthorized)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ code: -1, msg: '请先登录管理员账号', data: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ))

    await expect(apiRequest('/api/admin/dashboard')).rejects.toThrow('请先登录管理员账号')

    expect(localStorage.getItem('mall-admin-token')).toBeNull()
    expect(unauthorized).toHaveBeenCalledOnce()
    window.removeEventListener('mall-admin:unauthorized', unauthorized)
  })
})
