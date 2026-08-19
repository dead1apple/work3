import test from 'node:test'
import assert from 'node:assert/strict'

import { createLatestRequestGuard } from '../src/utils/requestState.js'

test('latest request guard suppresses stale route commits and finalizers', () => {
  const guard = createLatestRequestGuard()
  const events = []

  const first = guard.start('/orders/one')
  const second = guard.start('/orders/two')

  assert.equal(first.commit('/orders/one', () => events.push('stale-commit')), false)
  assert.equal(first.finish('/orders/one', () => events.push('stale-finish')), false)
  assert.equal(second.commit('/orders/two', () => events.push('latest-commit')), true)
  assert.equal(second.finish('/orders/two', () => events.push('latest-finish')), true)

  assert.deepEqual(events, ['latest-commit', 'latest-finish'])
  assert.equal(guard.current, 2)
})
