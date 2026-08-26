import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as catalogApi from '../../../api/catalog'
import * as productApi from '../../../api/product'
import { useProductCreate } from '../useProductCreate'

vi.mock('../../../api/catalog', () => ({
  getCategoryTree: vi.fn(),
  getBrands: vi.fn(),
}))

vi.mock('../../../api/product', () => ({
  createMerchantProduct: vi.fn(),
}))

const categoryTree = [
  {
    category: { id: 1, name: '手机数码' },
    children: [{ category: { id: 11, name: '手机' }, children: [] }],
  },
]
const brands = [{ id: 1, name: '华为', status: 1 }]

function fillValidForm(state) {
  Object.assign(state.form, {
    name: 'Codex 商品',
    categoryPath: [1, 11],
    brandId: 1,
  })
  Object.assign(state.form.skuList[0], {
    skuName: '默认款',
    specValues: '{"颜色":"黑色"}',
    price: 99,
    stock: 8,
  })
}

describe('useProductCreate', () => {
  beforeEach(() => {
    vi.mocked(catalogApi.getCategoryTree).mockReset()
    vi.mocked(catalogApi.getBrands).mockReset()
    vi.mocked(productApi.createMerchantProduct).mockReset()
  })

  it('loads categories and brands together into local catalog state', async () => {
    vi.mocked(catalogApi.getCategoryTree).mockResolvedValue(categoryTree)
    vi.mocked(catalogApi.getBrands).mockResolvedValue(brands)
    const state = useProductCreate()

    await state.loadCatalogs()

    expect(catalogApi.getCategoryTree).toHaveBeenCalledOnce()
    expect(catalogApi.getBrands).toHaveBeenCalledOnce()
    expect(state.categoryOptions.value[0].children[0]).toEqual({ value: 11, label: '手机' })
    expect(state.brands.value).toEqual(brands)
    expect(state.catalogLoading.value).toBe(false)
    expect(state.catalogError.value).toBeNull()
  })

  it('clears stale catalogs on failure and supports retry', async () => {
    const failure = new Error('catalog unavailable')
    vi.mocked(catalogApi.getCategoryTree)
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(categoryTree)
    vi.mocked(catalogApi.getBrands).mockResolvedValue(brands)
    const state = useProductCreate()

    await expect(state.loadCatalogs()).rejects.toBe(failure)
    expect(state.categoryOptions.value).toEqual([])
    expect(state.brands.value).toEqual([])
    expect(state.catalogError.value).toBe(failure)

    await state.loadCatalogs()
    expect(state.catalogError.value).toBeNull()
    expect(state.categoryOptions.value).toHaveLength(1)
  })

  it('adds and removes independent manual SKU rows', () => {
    const state = useProductCreate()
    const firstKey = state.form.skuList[0].key

    state.addSku()
    expect(state.form.skuList).toHaveLength(2)
    expect(state.form.skuList[1].key).not.toBe(firstKey)

    state.removeSku(firstKey)
    expect(state.form.skuList).toHaveLength(1)
    expect(state.form.skuList[0].key).not.toBe(firstKey)
  })

  it('validates before POST and exposes field errors', async () => {
    const state = useProductCreate()

    await expect(state.submit()).rejects.toMatchObject({ name: 'ProductFormValidationError' })

    expect(productApi.createMerchantProduct).not.toHaveBeenCalled()
    expect(state.validationErrors.value).toMatchObject({
      name: '请输入商品名称',
      categoryPath: '请选择叶子分类',
    })
  })

  it('submits the explicit payload and returns the backend data', async () => {
    vi.mocked(productApi.createMerchantProduct).mockResolvedValue(108)
    const state = useProductCreate()
    fillValidForm(state)

    await expect(state.submit()).resolves.toBe(108)

    expect(productApi.createMerchantProduct).toHaveBeenCalledWith(expect.objectContaining({
      categoryId: 11,
      brandId: 1,
      name: 'Codex 商品',
      skuList: [expect.objectContaining({ specValues: '{"颜色":"黑色"}' })],
    }))
    expect(state.submitting.value).toBe(false)
    expect(state.submitError.value).toBeNull()
  })

  it('preserves the draft and exposes the original backend error', async () => {
    const failure = new Error('分类无效')
    vi.mocked(productApi.createMerchantProduct).mockRejectedValue(failure)
    const state = useProductCreate()
    fillValidForm(state)

    await expect(state.submit()).rejects.toBe(failure)

    expect(state.form.name).toBe('Codex 商品')
    expect(state.form.skuList[0].skuName).toBe('默认款')
    expect(state.submitError.value).toBe(failure)
    expect(state.submitting.value).toBe(false)
  })

  it('returns one in-flight promise and sends only one POST for duplicate submits', async () => {
    let resolveRequest
    vi.mocked(productApi.createMerchantProduct).mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve
    }))
    const state = useProductCreate()
    fillValidForm(state)

    const first = state.submit()
    const second = state.submit()

    expect(second).toBe(first)
    expect(productApi.createMerchantProduct).toHaveBeenCalledOnce()
    expect(state.submitting.value).toBe(true)

    resolveRequest(108)
    await first
    expect(state.submitting.value).toBe(false)
  })
})
