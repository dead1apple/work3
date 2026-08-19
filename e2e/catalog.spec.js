import { test, expect } from './fixtures/api.js'

test('catalog navigation filters products and preserves non-Cartesian SKU behavior', async ({ page, api }) => {
  expect(api.state.loginCalls).toEqual([])
  await page.goto('/home')
  await expect(page.getByRole('heading', { name: '为你推荐' })).toBeVisible()
  await page.getByRole('link', { name: /非笛卡尔 SKU 测试手机/ }).first().click()
  await expect(page).toHaveURL(/\/product\/1001$/)
  await expect(page.getByRole('heading', { name: '非笛卡尔 SKU 测试手机' })).toBeVisible()

  await expect(page.locator('.el-radio-button').filter({ hasText: '512G' })).toHaveClass(/is-disabled/)
  await page.locator('.el-radio-button').filter({ hasText: '白色' }).click()
  await expect(page.locator('.el-radio-button').filter({ hasText: '256G' })).toHaveClass(/is-disabled/)
  await expect(page.getByRole('button', { name: '加入购物车' })).toHaveAttribute('aria-disabled', 'true')

  await page.goto('/product/1002')
  await expect(page.getByRole('heading', { name: '组件复用导航耳机' })).toBeVisible()
  await expect(page.getByText('第二个商品详情。')).toBeVisible()

  await page.goto('/products')
  await page.getByPlaceholder('请输入商品名称或关键字').fill('耳机')
  await page.locator('.result-search').getByRole('button', { name: '搜索' }).click()
  await expect(page).toHaveURL(/keyword=/)
  await expect(page.getByRole('link', { name: /组件复用导航耳机/ })).toBeVisible()
  await page.getByRole('button', { name: '价格 ↑' }).click()
  await expect(page).toHaveURL(/sortBy=price_asc/)
})
