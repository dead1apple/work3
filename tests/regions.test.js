import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRegionOptions, getCities, getDistricts, resolveRegionPath } from '../src/utils/regions.js'

test('builds a province-city-district cascader tree', () => {
  const options = buildRegionOptions()
  assert.equal(options[0].label, '北京市')
  assert.equal(options[0].children[0].children[0].label, '东城区')
  assert.ok(options.length >= 31)
  assert.ok(options.find((item) => item.label === '四川省').children.length >= 20)
})

test('resolves an existing region path into form fields', () => {
  assert.deepEqual(resolveRegionPath(['上海市', '上海市', '徐汇区']), {
    province: '上海市', city: '上海市', district: '徐汇区',
  })
})

test('provides cities and districts only after their parent is selected', () => {
  assert.ok(getCities('四川省').some((item) => item.label === '成都市'))
  assert.ok(getDistricts('四川省', '成都市').some((item) => item.label === '锦江区'))
  assert.deepEqual(getDistricts('四川省', ''), [])
})
