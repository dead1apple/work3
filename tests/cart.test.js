import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateCartTotals, getCanonicalCartItem, mergeCartItem, normalizeCartList } from '../src/utils/cart.js'

test('normalizes the backend cart response into display-ready items', () => {
  const items = normalizeCartList([{ id: 7, quantity: 2, selected: 1, sku: { id: 101, skuName: '黑色', price: 99, image: '/sku.png' }, product: { name: '耳机', mainImage: '/product.png' } }])
  assert.deepEqual(items[0], { id: 7, skuId: 101, name: '耳机', skuName: '黑色', image: '/sku.png', price: 99, quantity: 2, checked: true, isValid: true })
})

test('merges an existing SKU by increasing quantity', () => {
  const merged = mergeCartItem([{ id: 7, skuId: 101, quantity: 2 }], { id: 8, skuId: 101, quantity: 1 })
  assert.equal(merged[0].quantity, 3)
  assert.equal(merged.length, 1)
})

test('calculates checked item count and total price', () => {
  const totals = calculateCartTotals([{ price: 10, quantity: 2, checked: true }, { price: 20, quantity: 3, checked: false }])
  assert.deepEqual(totals, { totalCount: 5, totalPrice: 20 })
})

test('marks malformed cart records invalid without exposing NaN totals', () => {
  const [item] = normalizeCartList([{ id: 1, skuId: 2, price: 'bad', quantity: 'bad' }])

  assert.equal(item.isValid, false)
  assert.equal(Number.isFinite(item.price), true)
  assert.equal(Number.isInteger(item.quantity), true)
  assert.deepEqual(calculateCartTotals([item]), { totalCount: 1, totalPrice: 0 })
})

test('rejects cart records with IDs outside the safe integer range', () => {
  const [oversizedId] = normalizeCartList([{ id: 1e20, skuId: 2, price: 1, quantity: 1 }])
  const [oversizedSkuId] = normalizeCartList([{ id: 1, skuId: 1e20, price: 1, quantity: 1 }])

  assert.equal(oversizedId.id, null)
  assert.equal(oversizedId.isValid, false)
  assert.equal(oversizedSkuId.skuId, null)
  assert.equal(oversizedSkuId.isValid, false)
})

test('canonical cart item helper never synthesizes an id from an empty create response', () => {
  assert.equal(getCanonicalCartItem({}, 9), null)
  assert.equal(getCanonicalCartItem({ cartItem: { id: 7, skuId: 9 } }, 9).id, 7)
})
