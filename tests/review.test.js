import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildReviewPayload,
  normalizeReviewImages,
  selectReviewItem,
} from '../src/utils/review.js'

test('selects the requested order item instead of asking for a manual id', () => {
  const items = [{ orderItemId: 11, name: '手机' }, { orderItemId: 12, name: '耳机' }]
  assert.equal(selectReviewItem(items, '12').name, '耳机')
  assert.equal(selectReviewItem(items, null).name, '手机')
  assert.equal(selectReviewItem(items, '99'), null)
})

test('normalizes, deduplicates and limits review image urls', () => {
  assert.deepEqual(normalizeReviewImages([
    ' https://img.example.com/1.jpg ',
    'https://img.example.com/1.jpg',
    'https://img.example.com/2.png',
  ]), ['https://img.example.com/1.jpg', 'https://img.example.com/2.png'])
})

test('rejects invalid review image urls', () => {
  assert.throws(() => normalizeReviewImages(['not-a-url']), /https:\/\//)
  assert.throws(() => normalizeReviewImages(['http://img.example.com/a.jpg']), /https:\/\//)
  assert.deepEqual(normalizeReviewImages(['https://img.example.com/a.jpg']), ['https://img.example.com/a.jpg'])
  assert.throws(() => normalizeReviewImages(Array.from({ length: 6 }, (_, index) => `https://img.example.com/${index}.jpg`)), /最多添加 5 张/)
})

test('builds only fields accepted by ReviewDTO', () => {
  assert.deepEqual(buildReviewPayload({
    orderNo: 'JD-IGNORED',
    orderItemId: '68',
    rating: 5,
    content: '  商品很好，物流很快。  ',
    images: ['https://img.example.com/a.jpg', 'https://img.example.com/b.jpg'],
    isAnonymous: true,
  }), {
    orderItemId: 68,
    rating: 5,
    content: '商品很好，物流很快。',
    images: 'https://img.example.com/a.jpg,https://img.example.com/b.jpg',
    isAnonymous: 1,
  })
})

test('omits images when none are supplied and validates required values', () => {
  assert.deepEqual(buildReviewPayload({ orderItemId: 8, rating: 4, content: '', images: [], isAnonymous: false }), {
    orderItemId: 8,
    rating: 4,
    content: '',
    isAnonymous: 0,
  })
  assert.throws(() => buildReviewPayload({ orderItemId: '', rating: 5 }), /订单商品无效/)
  assert.throws(() => buildReviewPayload({ orderItemId: 8, rating: 0 }), /评分必须为 1 到 5 星/)
})
