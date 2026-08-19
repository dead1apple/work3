import test from 'node:test'
import assert from 'node:assert/strict'

import {
  readPayloadList,
  toBoundedPositiveInteger,
  toFiniteNumber,
  toNonNegativeMoney,
  unwrapData,
} from '../src/utils/response.js'

test('unwraps documented data envelopes and reads supported list containers', () => {
  assert.deepEqual(unwrapData({ data: { records: [{ id: 1 }] } }), { records: [{ id: 1 }] })
  assert.deepEqual(readPayloadList({ data: { records: [{ id: 1 }] } }), [{ id: 1 }])
  assert.deepEqual(readPayloadList({ rows: [{ id: 2 }] }), [{ id: 2 }])
  assert.deepEqual(readPayloadList([{ id: 3 }]), [{ id: 3 }])
})

test('numeric primitives reject NaN, Infinity and negative money', () => {
  assert.equal(toFiniteNumber('bad', 7), 7)
  assert.equal(toFiniteNumber(Infinity, 7), 7)
  assert.equal(toNonNegativeMoney(-1, 0), 0)
  assert.equal(toBoundedPositiveInteger('500', { fallback: 1, max: 99 }), 99)
})
