import { test, expect } from './fixtures/api.js'
import { expectNoHorizontalOverflow } from './fixtures/observability.js'

const login = async (page) => {
  await page.goto('/login')
  await page.getByPlaceholder('请输入用户名').fill('smoke')
  await page.getByPlaceholder('请输入密码').fill('secret123')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/home$/)
}

test('responsive commerce pages render key actions without overflow and survive refresh/history', async ({ page, api }) => {
  expect(api.state.loginCalls).toEqual([])
  await login(page)
  const paths = ['/home', '/products', '/product/1001', '/cart', '/checkout/cart', '/orders', '/payment/ORD-COMPLETE-1', '/orders/ORD-COMPLETE-1/review', '/address']
  for (const path of paths) {
    await page.goto(path)
    await expectNoHorizontalOverflow(page)
    await page.reload()
    await expectNoHorizontalOverflow(page)
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
