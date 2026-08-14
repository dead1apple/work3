export const getAuthToken = (payload) => {
  const data = payload?.data || payload
  return data?.token || data?.accessToken || ''
}

export const resolveRedirect = (redirect) => {
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) return redirect
  return '/home'
}
