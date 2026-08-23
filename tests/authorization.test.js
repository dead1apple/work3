import test from 'node:test'
import assert from 'node:assert/strict'

import { toAuthorizationValue } from '../src/utils/auth.js'

test('sends the raw Sa-Token value required by the backend Authorization token-name', () => {
  assert.equal(toAuthorizationValue('session-token'), 'session-token')
})

test('normalizes a legacy Bearer-prefixed stored token to the raw Sa-Token value', () => {
  assert.equal(toAuthorizationValue('  Bearer session-token  '), 'session-token')
})

test('omits empty authorization values', () => {
  assert.equal(toAuthorizationValue('  '), '')
  assert.equal(toAuthorizationValue(null), '')
})
