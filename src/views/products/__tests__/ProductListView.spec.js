import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as productApi from '../../../api/product'
import { useShopStore } from '../../../store/shop'
import ProductListView from '../ProductListView.vue'

vi.mock('../../../api/product', () => ({
  getMerchantProducts: vi.fn(),
  updateMerchantProductStatus: vi.fn(),
}))

const realProductPage = {
  total: 3,
  list: [
    {
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
    },
    {
      product: {
        id: 4,
        categoryId: 12,
        brandId: 1,
        shopId: 1,
        name: 'HUAWEI FreeBuds Pro 3',
        subtitle: '智慧动态降噪 3.0',
        mainImage: 'https://picsum.photos/seed/p4/400/400',
        images: null,
        detail: null,
        status: 1,
        salesCount: 12,
        sortOrder: 7,
        createTime: '2026-08-14 13:47:29',
        updateTime: '2026-08-15 13:18:20',
        deleted: 0,
      },
      minPrice: 1499,
      totalStock: 776,
      maxPrice: 1499,
    },
    {
      product: {
        id: 1,
        categoryId: 11,
        brandId: 1,
        shopId: 1,
        name: 'HUAWEI Mate 60 Pro',
        subtitle: '麒麟 9000S | 鸿蒙 4.0 | 卫星通信',
        mainImage: 'https://picsum.photos/seed/p1/400/400',
        images: null,
        detail: null,
        status: 1,
        salesCount: 9,
        sortOrder: 10,
        createTime: '2026-08-14 13:47:29',
        updateTime: '2026-08-15 13:18:20',
        deleted: 0,
      },
      minPrice: 6999,
      totalStock: 1000,
      maxPrice: 7999,
    },
  ],
  page: 1,
  size: 10,
}

function mountProductList() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const shop = useShopStore(pinia)
  shop.shop = { id: 1, userId: 2, shopName: '华为官方旗舰店', status: 1 }
  shop.status = 'ready'

  const router = createRouter({
    history: createMemoryHistory('/merchant/'),
    routes: [
      { path: '/products', name: 'merchant-products', component: { template: '<div />' } },
      { path: '/products/create', name: 'merchant-product-create', component: { template: '<div />' } },
    ],
  })

  return mount(ProductListView, {
    attachTo: document.body,
    global: { plugins: [pinia, router] },
  })
}

describe('ProductListView', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.mocked(productApi.getMerchantProducts).mockReset()
    vi.mocked(productApi.updateMerchantProductStatus).mockReset()
  })

  it('shows loading without flashing the empty state', async () => {
    vi.mocked(productApi.getMerchantProducts).mockReturnValue(new Promise(() => {}))

    const wrapper = mountProductList()
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[data-testid="product-loading"]').text()).toContain('正在加载商品')
    expect(wrapper.text()).not.toContain('当前店铺暂无商品')
  })

  it('resolves every Element Plus control with the production registration pattern', async () => {
    vi.mocked(productApi.getMerchantProducts).mockResolvedValue(realProductPage)
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})

    mountProductList()
    await flushPromises()

    const unresolvedWarnings = warning.mock.calls
      .flat()
      .filter((message) => String(message).includes('Failed to resolve component'))
    expect(unresolvedWarnings).toEqual([])
  })

  it('renders the real read-only merchant product fields', async () => {
    vi.mocked(productApi.getMerchantProducts).mockResolvedValue(realProductPage)

    const wrapper = mountProductList()
    await flushPromises()

    expect(wrapper.text()).toContain('华为官方旗舰店')
    expect(wrapper.text()).toContain('HUAWEI MateBook X Pro')
    expect(wrapper.text()).toContain('HUAWEI FreeBuds Pro 3')
    expect(wrapper.text()).toContain('HUAWEI Mate 60 Pro')
    expect(wrapper.text()).toContain('已上架')
    expect(wrapper.text()).toContain('¥13,999.00 – ¥17,999.00')
    expect(wrapper.text()).toContain('776')
    expect(wrapper.text()).toContain('分类 21')
    expect(wrapper.text()).toContain('品牌 1')
    expect(wrapper.text()).not.toMatch(/编辑|删除|上架操作|下架操作|商品详情|修改库存/)
  })

  it('renders a legitimate empty page with the real create entry', async () => {
    vi.mocked(productApi.getMerchantProducts).mockResolvedValue({
      total: 0,
      list: [],
      page: 1,
      size: 10,
    })

    const wrapper = mountProductList()
    await flushPromises()

    expect(wrapper.get('[data-testid="product-empty"]').text()).toContain('当前店铺暂无商品')
    expect(wrapper.get('[data-testid="create-product-link"]').text()).toContain('新增商品')
    expect(wrapper.get('[data-testid="create-product-link"]').attributes('href'))
      .toBe('/merchant/products/create')
  })

  it('clears stale rows on error and can retry the real request', async () => {
    vi.mocked(productApi.getMerchantProducts)
      .mockResolvedValueOnce(realProductPage)
      .mockRejectedValueOnce(new Error('products unavailable'))
      .mockResolvedValueOnce(realProductPage)
    const wrapper = mountProductList()
    await flushPromises()
    expect(wrapper.text()).toContain('HUAWEI MateBook X Pro')

    await wrapper.get('[data-testid="reload-products"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="product-error"]').text()).toContain('商品列表加载失败')
    expect(wrapper.text()).not.toContain('HUAWEI MateBook X Pro')

    await wrapper.get('[data-testid="retry-products"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('HUAWEI MateBook X Pro')
    expect(productApi.getMerchantProducts).toHaveBeenCalledTimes(3)
  })

  it('offers the documented opposite status action but none for pending review', async () => {
    vi.mocked(productApi.getMerchantProducts).mockResolvedValue({
      ...realProductPage,
      list: [
        realProductPage.list[0],
        { ...realProductPage.list[1], product: { ...realProductPage.list[1].product, status: 0 } },
        { ...realProductPage.list[2], product: { ...realProductPage.list[2].product, status: 2 } },
      ],
    })

    const wrapper = mountProductList()
    await flushPromises()

    expect(wrapper.get('[data-testid="product-status-action-7"]').text()).toBe('下架')
    expect(wrapper.get('[data-testid="product-status-action-4"]').text()).toBe('上架')
    expect(wrapper.find('[data-testid="product-status-action-1"]').exists()).toBe(false)
  })

  it('confirms a status change and refreshes the list on success', async () => {
    vi.mocked(productApi.getMerchantProducts).mockResolvedValue(realProductPage)
    vi.mocked(productApi.updateMerchantProductStatus).mockResolvedValue({})
    vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm')

    const wrapper = mountProductList()
    await flushPromises()
    await wrapper.get('[data-testid="product-status-action-7"]').trigger('click')
    await flushPromises()

    expect(ElMessageBox.confirm).toHaveBeenCalledWith(
      '确认下架“HUAWEI MateBook X Pro”吗？',
      '下架商品',
      expect.objectContaining({ type: 'warning' }),
    )
    expect(productApi.updateMerchantProductStatus).toHaveBeenCalledWith(7, 0)
    expect(productApi.getMerchantProducts).toHaveBeenCalledTimes(2)
  })

  it('shows the backend message and keeps the rendered status when a change fails', async () => {
    vi.mocked(productApi.getMerchantProducts).mockResolvedValue(realProductPage)
    vi.mocked(productApi.updateMerchantProductStatus).mockRejectedValue(new Error('商品当前不能下架'))
    vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm')
    const error = vi.spyOn(ElMessage, 'error').mockImplementation(() => {})

    const wrapper = mountProductList()
    await flushPromises()
    await wrapper.get('[data-testid="product-status-action-7"]').trigger('click')
    await flushPromises()

    expect(error).toHaveBeenCalledWith('商品当前不能下架')
    expect(wrapper.text()).toContain('已上架')
    expect(productApi.getMerchantProducts).toHaveBeenCalledTimes(1)
  })
})
