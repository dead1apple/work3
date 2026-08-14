import test from 'node:test'
import assert from 'node:assert/strict'
import { getAuthToken, resolveRedirect } from '../src/utils/auth.js'

test('extracts token from a successful login payload', () => {
  assert.equal(getAuthToken({ accessToken: 'access-token' }), 'access-token')
  assert.equal(getAuthToken({ data: { token: 'nested-token' } }), 'nested-token')
})

test('only accepts safe same-origin redirect paths', () => {
  assert.equal(resolveRedirect('/cart?from=login'), '/cart?from=login')
  assert.equal(resolveRedirect('https://example.com'), '/home')
  assert.equal(resolveRedirect('//example.com'), '/home')
})
