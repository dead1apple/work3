const normalizeGender = (value) => {
  const gender = Number(value)
  return [0, 1, 2].includes(gender) ? gender : 0
}

const normalizeDate = (value) => {
  if (!value) return ''
  const date = String(value).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : ''
}

export function normalizeUserProfile(payload) {
  const source = payload?.user || payload?.data?.user || payload?.data || payload || {}
  return {
    id: source.id ?? source.userId ?? null,
    username: source.username || source.userName || '',
    nickname: source.nickname || source.nickName || source.username || source.userName || '',
    phone: source.phone || source.mobile || '',
    email: source.email || '',
    avatar: source.avatar || source.avatarUrl || '',
    gender: normalizeGender(source.gender),
    birthday: normalizeDate(source.birthday),
    status: source.status ?? null,
    role: source.role ?? null,
  }
}

export function buildProfilePayload(profile) {
  return {
    nickname: String(profile?.nickname || '').trim(),
    email: String(profile?.email || '').trim(),
    avatar: String(profile?.avatar || '').trim(),
    gender: normalizeGender(profile?.gender),
    birthday: normalizeDate(profile?.birthday),
  }
}
