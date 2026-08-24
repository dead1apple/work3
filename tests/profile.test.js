import test from 'node:test'
import assert from 'node:assert/strict'

import { buildProfilePayload, normalizeUserProfile } from '../src/utils/profile.js'

test('normalizes user profile response aliases and backend gender values', () => {
  assert.deepEqual(
    normalizeUserProfile({
      data: {
        id: 8,
        userName: 'jd_user',
        nickName: '京东用户',
        mobile: '13800138000',
        avatarUrl: '/avatar.png',
        gender: '2',
        birthday: '2000-01-02T00:00:00',
      },
    }),
    {
      id: 8,
      username: 'jd_user',
      nickname: '京东用户',
      phone: '13800138000',
      email: '',
      avatar: '/avatar.png',
      gender: 2,
      birthday: '2000-01-02',
      status: null,
      role: null,
    },
  )
})

test('profile normalization preserves account identity and role fields', () => {
  assert.deepEqual(
    normalizeUserProfile({
      id: 1,
      username: 'test',
      nickname: 'old',
      phone: '13800138000',
      role: 1,
      status: 1,
      password: null,
    }),
    {
      id: 1,
      username: 'test',
      nickname: 'old',
      phone: '13800138000',
      email: '',
      avatar: '',
      gender: 0,
      birthday: '',
      status: 1,
      role: 1,
    },
  )
})

test('builds a trimmed profile update payload without account-only fields', () => {
  assert.deepEqual(
    buildProfilePayload({
      id: 8,
      username: 'cannot-change',
      phone: '13800138000',
      nickname: '  小京  ',
      email: '  jd@example.com ',
      avatar: ' https://example.com/avatar.png ',
      gender: '1',
      birthday: '2001-03-04T10:20:00',
      role: 2,
    }),
    {
      nickname: '小京',
      email: 'jd@example.com',
      avatar: 'https://example.com/avatar.png',
      gender: 1,
      birthday: '2001-03-04',
    },
  )
})

test('uses safe defaults for malformed optional profile fields', () => {
  const profile = normalizeUserProfile({ nickname: '用户', gender: 99, birthday: null })
  assert.equal(profile.gender, 0)
  assert.equal(profile.birthday, '')
  assert.equal(profile.username, '')
})
