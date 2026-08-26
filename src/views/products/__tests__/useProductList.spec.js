import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as productApi from '../../../api/product'
import { useProductList } from '../useProductList'

vi.mock('../../../api/product', () => ({
  getMerchantProducts: vi.fn(),
}))

const productItem = {
  product: {
    id: 7,
    categoryId: 21,
    brandId: 1,
    shopId: 1,
    name: 'HUAWEI MateBook X Pro',
    subtitle: '14.2 寸全面屏 | 酷睿 Ultra 7',
    mainImage: 'https://picsum.photos/seed/p7/400/400',
    images: null,
    detail: null,
    status: 1,
    salesCount: 12,
    sortOrder: 4,
    createTime: '2026-08-14 13:47:29',
    updateTime: '2026-08-15 13:18:20',
    deleted: 0,
  },
  minPrice: 13999,
  totalStock: 100,
  maxPrice: 17999,
}

const firstPage = {
  total: 1,
  list: [productItem],
  page: 1,
  size: 10,
}

describe('useProductList', () => {
  beforeEach(() => {
    vi.mocked(productApi.getMerchantProducts).mockReset()
  })

  it('loads the first server page into local page state', async () => {
    vi.mocked(productApi.getMerchantProducts).mockResolvedValue(firstPage)
    const state = useProductList()

    await state.load()

    expect(productApi.getMerchantProducts).toHaveBeenCalledWith({ page: 1, size: 10 })
    expect(state.items.value).toEqual([productItem])
    expect(state.total.value).toBe(1)
    expect(state.loading.value).toBe(false)
    expect(state.error.value).toBeNull()
  })

  it('keeps a valid empty response distinct from loading and error', async () => {
    vi.mocked(productApi.getMerchantProducts).mockResolvedValue({
      total: 0,
      list: [],
      page: 1,
      size: 10,
    })
    const state = useProductList()

    await state.load()

    expect(state.items.value).toEqual([])
    expect(state.total.value).toBe(0)
    expect(state.loading.value).toBe(false)
    expect(state.error.value).toBeNull()
  })

  it('clears stale rows when a later product request fails', async () => {
    const failure = new Error('products unavailable')
    vi.mocked(productApi.getMerchantProducts)
      .mockResolvedValueOnce(firstPage)
      .mockRejectedValueOnce(failure)
    const state = useProductList()
    await state.load()

    await expect(state.load()).rejects.toBe(failure)

    expect(state.items.value).toEqual([])
    expect(state.total.value).toBe(0)
    expect(state.error.value).toBe(failure)
    expect(state.loading.value).toBe(false)
  })

  it('sends trimmed server filters and resets search to page one', async () => {
    vi.mocked(productApi.getMerchantProducts).mockResolvedValue(firstPage)
    const state = useProductList()
    state.keyword.value = '  Mate  '
    state.status.value = 1
    state.page.value = 3

    await state.search()

    expect(productApi.getMerchantProducts).toHaveBeenCalledWith({
      keyword: 'Mate',
      status: 1,
      page: 1,
      size: 10,
    })
  })

  it('uses the real page and size query names for server pagination', async () => {
    vi.mocked(productApi.getMerchantProducts).mockResolvedValue(firstPage)
    const state = useProductList()

    await state.changePage(2)
    expect(productApi.getMerchantProducts).toHaveBeenLastCalledWith({ page: 2, size: 10 })

    await state.changeSize(20)
    expect(productApi.getMerchantProducts).toHaveBeenLastCalledWith({ page: 1, size: 20 })
  })

  it('does not share product rows between page instances', async () => {
    vi.mocked(productApi.getMerchantProducts).mockResolvedValue(firstPage)
    const first = useProductList()
    await first.load()

    const second = useProductList()

    expect(second.items.value).toEqual([])
    expect(second.total.value).toBe(0)
  })
})
