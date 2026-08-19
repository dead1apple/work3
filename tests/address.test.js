import test from 'node:test'
import assert from 'node:assert/strict'

import { buildAddressPayload } from '../src/utils/address.js'

test('address payload omits display and backend response fields', () => {
  assert.deepEqual(buildAddressPayload({
    id: 2,
    fullAddress: 'x',
    receiverName: '张三',
    receiverPhone: '13800000000',
    province: 'A',
    city: 'B',
    district: 'C',
    detailAddress: 'D',
    isDefault: true,
  }), {
    receiverName: '张三',
    receiverPhone: '13800000000',
    province: 'A',
    city: 'B',
    district: 'C',
    detailAddress: 'D',
    isDefault: 1,
  })
})
