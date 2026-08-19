import { test, expect } from './fixtures/api.js'
import { expectNoHorizontalOverflow } from './fixtures/observability.js'

const login = async (page) => {
  await page.goto('/login')
  await page.getByPlaceholder('请输入用户名').fill('smoke')
  await page.getByPlaceholder('请输入密码').fill('secret123')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/home$/)
}

const seedCart = async (page) => {
  await page.goto('/product/1001')
  await page.locator('.el-radio-button').filter({ hasText: '黑色' }).click()
  await page.locator('.el-radio-button').filter({ hasText: '128G' }).click()
  await page.getByRole('button', { name: '加入购物车' }).click()
  await expect(page.getByText('已加入购物车')).toBeVisible()
}

test('responsive commerce pages render key actions without overflow and survive refresh/history', async ({ page, api }) => {
  expect(api.state.loginCalls).toEqual([])
  await login(page)
  await seedCart(page)
  const routes = [
    { path: '/home', action: () => page.getByRole('button', { name: /查看详情/ }).first() },
    { path: '/products', action: () => page.locator('.result-search').getByRole('button', { name: '搜索' }) },
    { path: '/product/1001', action: () => page.getByRole('button', { name: '加入购物车' }) },
    { path: '/cart', action: () => page.getByRole('button', { name: '去结算' }) },
    { path: '/checkout/cart', action: () => page.getByRole('button', { name: '提交订单' }) },
    { path: '/orders', action: () => page.getByRole('button', { name: '继续购物' }) },
    { path: '/payment/ORD-PAY-1', action: () => page.getByRole('button', { name: '确认支付' }) },
    { path: '/orders/ORD-COMPLETE-1/review', action: () => page.getByRole('button', { name: '发布评价' }) },
    { path: '/address', action: () => page.getByRole('button', { name: '新增收货地址', exact: true }) },
  ]
  for (const { path, action } of routes) {
    await page.goto(path)
    await expectNoHorizontalOverflow(page)
    await expect(action()).toBeVisible()
    await page.reload()
    await expectNoHorizontalOverflow(page)
    await expect(action()).toBeVisible()
  }

  await page.goto('/home')
  await page.goto('/products')
  await page.goBack()
  await expect(page).toHaveURL(/\/home$/)
  await page.goForward()
  await expect(page).toHaveURL(/\/products$/)

  await page.goto('/address')
  await page.getByRole('button', { name: '新增收货地址', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '新增收货地址' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
})
