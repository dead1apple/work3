import { describe, expect, it } from 'vitest'
import {
  PRODUCT_STATUS_OPTIONS,
  formatPriceRange,
  getProductStatus,
} from '../product-list'

describe('product list display domain', () => {
  it('maps only the documented merchant product statuses', () => {
    expect(PRODUCT_STATUS_OPTIONS).toEqual([
      { label: '全部状态', value: '' },
      { label: '已下架', value: 0 },
      { label: '已上架', value: 1 },
      { label: '待审核', value: 2 },
    ])
    expect(getProductStatus(0)).toMatchObject({ label: '已下架' })
    expect(getProductStatus(1)).toMatchObject({ label: '已上架' })
    expect(getProductStatus(2)).toMatchObject({ label: '待审核' })
    expect(getProductStatus(9)).toEqual({ label: '未知状态', type: 'info' })
  })

  it('formats the real aggregate price as one value or a range', () => {
    expect(formatPriceRange(1499, 1499)).toBe('¥1,499.00')
    expect(formatPriceRange(6999, 7999)).toBe('¥6,999.00 – ¥7,999.00')
  })
})
