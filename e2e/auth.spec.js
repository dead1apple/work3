import { test, expect } from './fixtures/api.js'

const login = async (page, username = 'alice') => {
  await page.goto('/login')
  await page.getByPlaceholder('请输入用户名').fill(username)
  await page.getByPlaceholder('请输入密码').fill('secret123')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/home$/)
}

test('protected routes redirect to login and return only to safe in-app paths', async ({ page, api }) => {
  expect(api.state.loginCalls).toEqual([])
  await page.goto('/cart')
  await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)cart$/)
  await page.getByPlaceholder('请输入用户名').fill('alice')
  await page.getByPlaceholder('请输入密码').fill('secret123')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(page.getByRole('heading', { name: '购物车' })).toBeVisible()

  await page.evaluate(() => localStorage.clear())
  await page.goto('/login?redirect=https://evil.example/phish')
  await page.getByPlaceholder('请输入用户名').fill('alice')
  await page.getByPlaceholder('请输入密码').fill('secret123')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/home$/)
})

test('registration sends one code request and shows the retry countdown', async ({ page, api }) => {
  await page.goto('/register')
  await page.getByPlaceholder('手机号').fill('13800138000')
  await page.getByRole('button', { name: '获取验证码' }).click()
  await expect(page.getByRole('button', { name: /s 后重试/ })).toBeDisabled()
  await page.getByRole('button', { name: /s 后重试/ }).click({ force: true })
  expect(api.state.sendCodeCalls).toEqual([{ phone: '13800138000' }])
})

test('401 responses clear auth state and account cart data stays isolated', async ({ page, api }) => {
  await login(page, 'alice')
  await page.goto('/product/1001')
  await page.locator('.el-radio-button').filter({ hasText: '黑色' }).click()
  await page.locator('.el-radio-button').filter({ hasText: '128G' }).click()
  await page.getByRole('button', { name: '加入购物车' }).click()
  await expect(page.getByText('已加入购物车')).toBeVisible()

  await page.evaluate(() => localStorage.clear())
  await login(page, 'bob')
  await page.goto('/cart')
  await expect(page.getByText('购物车是空的，快去逛逛吧')).toBeVisible()

  api.state.forceCart401 = true
  await page.reload()
  await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)cart$/)
  await expect(page.evaluate(() => localStorage.getItem('token'))).resolves.toBeNull()
})
