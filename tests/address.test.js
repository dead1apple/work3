import test from 'node:test'
import assert from 'node:assert/strict'

import { buildAddressPayload, runAddressSaveWorkflow } from '../src/utils/address.js'

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

test('address save locks before pending validation can double submit', async () => {
  let saving = false
  const pendingValidations = []
  const calls = []
  const form = {
    receiverName: '张三',
    receiverPhone: '13800000000',
    province: 'A',
    city: 'B',
    district: 'C',
    detailAddress: 'D',
    isDefault: 0,
  }

  const save = () => runAddressSaveWorkflow({
    isSaving: () => saving,
    setSaving: (value) => {
      saving = value
      calls.push(['saving', value])
    },
    validate: () => new Promise((resolve) => pendingValidations.push(resolve)),
    getForm: () => form,
    getEditingId: () => null,
    addAddress: async (payload) => calls.push(['add', payload]),
    updateAddress: async () => calls.push(['update']),
    onSuccess: (mode) => calls.push(['success', mode]),
    closeDialog: () => calls.push(['close']),
    reload: async () => calls.push(['reload']),
    onError: (error) => calls.push(['error', error.message]),
  })

  const first = save()
  const second = save()

  assert.equal(pendingValidations.length, 1)
  pendingValidations.forEach((resolve) => resolve(true))
  const results = await Promise.all([first, second])

  assert.deepEqual(results.map((result) => result.skipped), [false, true])
  assert.equal(calls.filter(([name]) => name === 'add').length, 1)
  assert.equal(calls.at(-1)[0], 'saving')
  assert.equal(calls.at(-1)[1], false)
})
