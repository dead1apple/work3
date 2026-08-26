import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as catalogApi from '../../../api/catalog'
import * as productApi from '../../../api/product'
import { useProductEdit } from '../useProductEdit'

vi.mock('../../../api/catalog', () => ({ getCategoryTree: vi.fn(), getBrands: vi.fn() }))
vi.mock('../../../api/product', () => ({ createMerchantProduct: vi.fn(), getMerchantProduct: vi.fn(), updateMerchantProduct: vi.fn() }))

const categories = [{ category: { id: 1, name: '手机数码' }, children: [{ category: { id: 11, name: '手机' }, children: [] }] }]
const detail = {
  product: { id: 73, categoryId: 11, brandId: 1, name: 'Codex 部署回归商品', images: [], status: 2 },
  skuList: [{ id: 271, skuName: '默认款', specValues: '{"颜色":"测试"}', price: 99, stock: 1, status: 1 }],
}

describe('useProductEdit', () => {
  beforeEach(() => {
    vi.mocked(catalogApi.getCategoryTree).mockReset().mockResolvedValue(categories)
    vi.mocked(catalogApi.getBrands).mockReset().mockResolvedValue([{ id: 1, name: '华为' }])
    vi.mocked(productApi.getMerchantProduct).mockReset().mockResolvedValue(detail)
    vi.mocked(productApi.updateMerchantProduct).mockReset()
  })

  it('loads the complete detail into the shared form and PUTs IDs without shopId', async () => {
    const state = useProductEdit(73)
    await state.loadCatalogs()
    await state.loadProduct()
    state.form.name = 'Codex 部署回归商品（编辑验证）'
    vi.mocked(productApi.updateMerchantProduct).mockResolvedValue(detail)

    await state.submit()

    expect(productApi.getMerchantProduct).toHaveBeenCalledWith(73)
    expect(state.form.categoryPath).toEqual([1, 11])
    expect(productApi.updateMerchantProduct).toHaveBeenCalledWith(expect.objectContaining({
      id: 73,
      skuList: [expect.objectContaining({ id: 271, status: 1 })],
    }))
    expect(productApi.updateMerchantProduct.mock.calls[0][0]).not.toHaveProperty('shopId')
  })

  it('keeps the edited form and backend error after a failed PUT', async () => {
    const state = useProductEdit(73)
    await state.loadCatalogs()
    await state.loadProduct()
    state.form.name = '保留输入'
    const failure = new Error('待审核商品不允许编辑')
    vi.mocked(productApi.updateMerchantProduct).mockRejectedValue(failure)

    await expect(state.submit()).rejects.toBe(failure)

    expect(state.form.name).toBe('保留输入')
    expect(state.submitError.value).toBe(failure)
  })
})
