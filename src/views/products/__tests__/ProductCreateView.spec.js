import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { ElMessage } from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import * as catalogApi from '../../../api/catalog'
import * as productApi from '../../../api/product'
import { useShopStore } from '../../../store/shop'
import ProductCreateView from '../ProductCreateView.vue'

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

async function mountCreate({ shopStatus = 'ready' } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const shop = useShopStore(pinia)
  shop.status = shopStatus
  shop.shop = shopStatus === 'ready'
    ? { id: 1, userId: 2, shopName: '华为官方旗舰店', status: 1 }
    : null

  const router = createRouter({
    history: createMemoryHistory('/merchant/'),
    routes: [
      { path: '/products', name: 'merchant-products', component: { template: '<div />' } },
      { path: '/products/create', name: 'merchant-product-create', component: { template: '<div />' } },
    ],
  })
  await router.push('/products/create')

  const wrapper = mount(ProductCreateView, {
    attachTo: document.body,
    global: { plugins: [pinia, router] },
  })
  return { wrapper, router }
}

function fillValidState(wrapper) {
  const state = wrapper.vm.productCreate
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

describe('ProductCreateView', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.mocked(catalogApi.getCategoryTree).mockReset()
    vi.mocked(catalogApi.getBrands).mockReset()
    vi.mocked(productApi.createMerchantProduct).mockReset()
    vi.mocked(catalogApi.getCategoryTree).mockResolvedValue(categoryTree)
    vi.mocked(catalogApi.getBrands).mockResolvedValue(brands)
  })

  it('renders resolved Element Plus controls and real catalog choices', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { wrapper } = await mountCreate()
    await flushPromises()

    expect(wrapper.text()).toContain('新增商品')
    expect(wrapper.text()).toContain('基础信息')
    expect(wrapper.text()).toContain('图片与详情')
    expect(wrapper.text()).toContain('SKU 信息')
    expect(wrapper.text()).toContain('华为官方旗舰店')
    expect(wrapper.vm.productCreate.categoryOptions.value[0].children[0].label).toBe('手机')
    expect(wrapper.vm.productCreate.brands.value[0].name).toBe('华为')
    expect(warning.mock.calls.flat().filter((message) =>
      String(message).includes('Failed to resolve component'))).toEqual([])
  })

  it('blocks creation completely when the merchant has no shop', async () => {
    const { wrapper } = await mountCreate({ shopStatus: 'empty' })
    await flushPromises()

    expect(wrapper.get('[data-testid="create-no-shop"]').text()).toContain('尚未配置店铺')
    expect(wrapper.find('[data-testid="submit-product"]').exists()).toBe(false)
    expect(catalogApi.getCategoryTree).not.toHaveBeenCalled()
    expect(catalogApi.getBrands).not.toHaveBeenCalled()
  })

  it('shows a catalog error and retries without replacing the page', async () => {
    vi.mocked(catalogApi.getCategoryTree)
      .mockRejectedValueOnce(new Error('catalog unavailable'))
      .mockResolvedValueOnce(categoryTree)
    const { wrapper } = await mountCreate()
    await flushPromises()

    expect(wrapper.get('[data-testid="catalog-error"]').text()).toContain('分类和品牌加载失败')

    await wrapper.get('[data-testid="retry-catalogs"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="catalog-error"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="submit-product"]').exists()).toBe(true)
    expect(catalogApi.getCategoryTree).toHaveBeenCalledTimes(2)
  })

  it('renders client validation messages and sends no request', async () => {
    const { wrapper } = await mountCreate()
    await flushPromises()

    await wrapper.get('[data-testid="submit-product"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('请输入商品名称')
    expect(wrapper.text()).toContain('请选择叶子分类')
    expect(wrapper.text()).toContain('请输入 SKU 名称')
    expect(productApi.createMerchantProduct).not.toHaveBeenCalled()
  })

  it('uses an explicit button action instead of relying on native submit defaults', async () => {
    const { wrapper } = await mountCreate()
    await flushPromises()

    expect(wrapper.get('[data-testid="submit-product"]').attributes('type')).toBe('button')
  })

  it('shows success and returns to the product list after one POST', async () => {
    vi.mocked(productApi.createMerchantProduct).mockResolvedValue(108)
    const success = vi.spyOn(ElMessage, 'success').mockImplementation(() => {})
    const { wrapper, router } = await mountCreate()
    await flushPromises()
    fillValidState(wrapper)

    await wrapper.get('[data-testid="submit-product"]').trigger('click')
    await flushPromises()

    expect(productApi.createMerchantProduct).toHaveBeenCalledOnce()
    expect(success).toHaveBeenCalledWith('商品已提交审核')
    expect(router.currentRoute.value.name).toBe('merchant-products')
  })

  it('shows the backend message and preserves the completed draft', async () => {
    vi.mocked(productApi.createMerchantProduct).mockRejectedValue(new Error('品牌不可用'))
    const { wrapper } = await mountCreate()
    await flushPromises()
    fillValidState(wrapper)

    await wrapper.get('[data-testid="submit-product"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="submit-error"]').text()).toContain('品牌不可用')
    expect(wrapper.vm.productCreate.form.name).toBe('Codex 商品')
    expect(wrapper.vm.productCreate.form.skuList[0].skuName).toBe('默认款')
  })
})
