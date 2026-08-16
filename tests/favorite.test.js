import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeFavoriteList, normalizeFavoriteState } from '../src/utils/favorite.js'

test('normalizeFavoriteState supports common favorite status response shapes', () => {
  assert.equal(normalizeFavoriteState(true), true)
  assert.equal(normalizeFavoriteState({ favorite: true }), true)
  assert.equal(normalizeFavoriteState({ isFavorite: 1 }), true)
  assert.equal(normalizeFavoriteState({ data: { collected: 'true' } }), true)
  assert.equal(normalizeFavoriteState({ isFavorite: 0 }), false)
  assert.equal(normalizeFavoriteState(null), false)
})

test('normalizeFavoriteList keeps the product id when favorites wrap product data', () => {
  const result = normalizeFavoriteList({
    list: [
      {
        id: 55,
        productId: 8,
        createTime: '2026-08-16 10:00:00',
        minPrice: 99,
        product: {
          id: 8,
          name: '无线蓝牙耳机',
          mainImage: '/images/headphones.png',
          sales: 1200,
        },
      },
    ],
  })

  assert.deepEqual(result, {
    list: [
      {
        favoriteId: 55,
        productId: 8,
        title: '无线蓝牙耳机',
        image: '/images/headphones.png',
        price: 99,
        sales: 1200,
        favoriteTime: '2026-08-16 10:00:00',
      },
    ],
    total: 1,
  })
})

test('normalizeFavoriteList also accepts direct product arrays', () => {
  const result = normalizeFavoriteList([
    {
      id: 9,
      title: '智能手机',
      image: '/images/phone.png',
      price: '2999.00',
      saleCount: 88,
    },
  ])

  assert.equal(result.list[0].productId, 9)
  assert.equal(result.list[0].favoriteId, null)
  assert.equal(result.list[0].price, 2999)
  assert.equal(result.list[0].sales, 88)
  assert.equal(result.total, 1)
})
