import test from 'node:test'
import assert from 'node:assert/strict'
import {
  addToCanonicalCart,
  calculateCartTotals,
  createCartLoadState,
  createQuantityChangeHandler,
  createToggleItemHandler,
  getCanonicalCartItem,
  loadCartWithRetryState,
  mergeCartItem,
  normalizeCartList,
} from '../src/utils/cart.js'

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

test('addToCanonicalCart refetches after an empty create response and does not insert a local record when the server has no row', async () => {
  const calls = []
  const cartList = []

  await assert.rejects(
    addToCanonicalCart({
      product: { skuId: 9, quantity: 2, name: '耳机' },
      cartList,
      addCart: async (payload) => {
        calls.push(['addCart', payload])
        return {}
      },
      fetchCartList: async () => {
        calls.push(['fetchCartList'])
        return []
      },
      updateQuantity: async () => calls.push(['updateQuantity']),
      selectCartItem: async () => calls.push(['selectCartItem']),
      commitCreatedCartItem: () => calls.push(['commitCreatedCartItem']),
    }),
    /购物车已更新，但服务端未返回可操作的购物车记录，请刷新后重试/,
  )

  assert.deepEqual(calls, [
    ['addCart', { skuId: 9, quantity: 2 }],
    ['fetchCartList'],
  ])
  assert.deepEqual(cartList, [])
})

test('addToCanonicalCart returns the refetched canonical server row without local insertion', async () => {
  const calls = []
  const serverRow = { id: 17, skuId: 9, quantity: 2, checked: true, name: '耳机', skuName: '', image: '/sku.png', price: 99, isValid: true }

  const created = await addToCanonicalCart({
    product: { skuId: 9, quantity: 2, name: '耳机' },
    cartList: [],
    addCart: async (payload) => {
      calls.push(['addCart', payload])
      return {}
    },
    fetchCartList: async () => {
      calls.push(['fetchCartList'])
      return [serverRow]
    },
    updateQuantity: async () => calls.push(['updateQuantity']),
    selectCartItem: async () => calls.push(['selectCartItem']),
    commitCreatedCartItem: () => calls.push(['commitCreatedCartItem']),
  })

  assert.deepEqual(created, serverRow)
  assert.deepEqual(calls, [
    ['addCart', { skuId: 9, quantity: 2 }],
    ['fetchCartList'],
  ])
})

test('addToCanonicalCart selects an existing unchecked item on the server before committing local checked state', async () => {
  const calls = []
  const existing = { id: 7, skuId: 9, quantity: 2, checked: false }

  const updated = await addToCanonicalCart({
    product: { skuId: 9, quantity: 3 },
    cartList: [existing],
    addCart: async () => calls.push(['addCart']),
    fetchCartList: async () => calls.push(['fetchCartList']),
    updateQuantity: async (id, quantity) => {
      calls.push(['updateQuantity', id, quantity, existing.checked])
      return existing
    },
    selectCartItem: async (id) => {
      calls.push(['selectCartItem', id, existing.checked])
    },
    commitCreatedCartItem: () => calls.push(['commitCreatedCartItem']),
  })

  assert.equal(updated, existing)
  assert.equal(existing.checked, true)
  assert.deepEqual(calls, [
    ['updateQuantity', 7, 5, false],
    ['selectCartItem', 7, false],
  ])
})

test('toggle item handler sends the emitted checked intent without inverting local state', async () => {
  const calls = []
  const toggleItem = createToggleItemHandler({
    toggleCheck: async (id, checked) => calls.push([id, checked]),
    onError: () => calls.push(['error']),
  })

  await toggleItem({ id: 7, checked: true }, false)

  assert.deepEqual(calls, [[7, false]])
})

test('quantity change handler ignores duplicate updates for the same row while in flight', async () => {
  const calls = []
  const changeQuantity = createQuantityChangeHandler({
    isQuantityUpdating: () => true,
    setQuantityUpdating: (id, updating) => calls.push(['setQuantityUpdating', id, updating]),
    updateQuantity: async () => calls.push(['updateQuantity']),
    refetchCart: async () => calls.push(['refetchCart']),
    onSuccess: () => calls.push(['success']),
    onError: () => calls.push(['error']),
  })

  await changeQuantity({ id: 7, quantity: 3 }, 4, 3)

  assert.deepEqual(calls, [])
})

test('quantity change handler rolls back the row and refetches when the server update fails', async () => {
  const calls = []
  const item = { id: 7, quantity: 4 }
  const changeQuantity = createQuantityChangeHandler({
    isQuantityUpdating: () => false,
    setQuantityUpdating: (id, updating) => calls.push(['setQuantityUpdating', id, updating]),
    updateQuantity: async (id, quantity) => {
      calls.push(['updateQuantity', id, quantity])
      throw new Error('nope')
    },
    refetchCart: async () => calls.push(['refetchCart', item.quantity]),
    onSuccess: () => calls.push(['success']),
    onError: (error) => calls.push(['error', error.message, item.quantity]),
  })

  await changeQuantity(item, 4, 3)

  assert.equal(item.quantity, 3)
  assert.deepEqual(calls, [
    ['setQuantityUpdating', 7, true],
    ['updateQuantity', 7, 4],
    ['error', 'nope', 3],
    ['refetchCart', 3],
    ['setQuantityUpdating', 7, false],
  ])
})

test('cart load retry state clears stale errors and records the next failure for retry UI', async () => {
  const state = createCartLoadState()
  const calls = []
  let attempt = 0
  const fetchCartList = async () => {
    calls.push(['fetchCartList', state.initialLoading, state.loadError])
    attempt += 1
    if (attempt === 1) throw new Error('网络异常')
    return [{ id: 7 }]
  }

  await loadCartWithRetryState({ state, fetchCartList })
  assert.equal(state.initialLoading, false)
  assert.equal(state.loadError, '网络异常')

  await loadCartWithRetryState({ state, fetchCartList })
  assert.equal(state.initialLoading, false)
  assert.equal(state.loadError, '')
  assert.deepEqual(calls, [
    ['fetchCartList', true, ''],
    ['fetchCartList', true, ''],
  ])
})
