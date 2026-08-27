import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as shopApi from '../../../api/shop'
import { useShopStore } from '../../../store/shop'
import ShopView from '../ShopView.vue'

vi.mock('../../../api/shop', () => ({ getCurrentShop: vi.fn(), updateCurrentShop: vi.fn() }))

const shopData = { id: 1, userId: 2, shopName: '华为官方旗舰店', logo: null, description: '官方直营店', licenseImage: null, status: 1, rating: 4.8, location: '116.397428,39.90923', address: '北京市东城区', createTime: '2026-08-01 10:00:00', updateTime: '2026-08-20 10:00:00' }

function mountShop() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useShopStore(pinia)
  store.shop = shopData
  store.status = 'ready'
  return mount(ShopView, { attachTo: document.body, global: { plugins: [pinia] } })
}

describe('ShopView', () => {
  beforeEach(() => { vi.mocked(shopApi.getCurrentShop).mockReset().mockResolvedValue(shopData); vi.mocked(shopApi.updateCurrentShop).mockReset() })

  it('renders the current shop fields and documented business status', async () => {
    const wrapper = mountShop()
    await flushPromises()
    expect(wrapper.text()).toContain('华为官方旗舰店')
    expect(wrapper.text()).toContain('营业中')
    expect(wrapper.text()).toContain('4.8')
    expect(wrapper.text()).toContain('北京市东城区')
  })

  it('preserves the draft on failed update and refreshes the shop context after success', async () => {
    const wrapper = mountShop()
    await flushPromises()
    await wrapper.get('[data-testid="edit-shop"]').trigger('click')
    await wrapper.get('[data-testid="shop-description"]').setValue('新的店铺简介')
    vi.mocked(shopApi.updateCurrentShop).mockRejectedValueOnce(new Error('店铺暂不可修改'))
    await wrapper.get('[data-testid="save-shop"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('店铺暂不可修改')
    expect(wrapper.get('[data-testid="shop-description"]').element.value).toBe('新的店铺简介')

    vi.mocked(shopApi.updateCurrentShop).mockResolvedValueOnce({})
    vi.mocked(shopApi.getCurrentShop).mockResolvedValueOnce({ ...shopData, description: '新的店铺简介' })
    await wrapper.get('[data-testid="save-shop"]').trigger('click')
    await flushPromises()
    expect(shopApi.updateCurrentShop).toHaveBeenLastCalledWith(expect.objectContaining({
      id: 1,
      userId: 2,
      status: 1,
      rating: 4.8,
      description: '新的店铺简介',
      createTime: '2026-08-01 10:00:00',
      updateTime: '2026-08-20 10:00:00',
    }))
    expect(shopApi.getCurrentShop).toHaveBeenCalled()
    expect(wrapper.text()).toContain('新的店铺简介')
  })
})
