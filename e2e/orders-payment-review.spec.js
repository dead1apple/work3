import { test, expect } from './fixtures/api.js'

const login = async (page) => {
  await page.goto('/login')
  await page.getByPlaceholder('请输入用户名').fill('reviewer')
  await page.getByPlaceholder('请输入密码').fill('secret123')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/home$/)
}

test('unpaid order pay action keeps its inner label readable', async ({ page, api }) => {
  await login(page)
  await page.goto('/orders?status=0')
  const payButton = page.getByRole('button', { name: '立即付款' }).first()
  await expect(payButton).toBeVisible()
  await expect(payButton.locator('span')).toHaveCSS('color', 'rgb(255, 255, 255)')
})

test('ambiguous payment polls to paid and review submits the exact DTO', async ({ page, api }) => {
  await login(page)
  await page.goto('/payment/ORD-PAY-1')
  await expect(page.getByRole('heading', { name: '选择支付方式' })).toBeVisible()
  await page.getByRole('button', { name: '确认支付' }).click()
  await expect(page.getByRole('heading', { name: '支付处理中' })).toBeVisible()
  await page.getByRole('button', { name: '立即查询' }).click()
  await expect(page.getByRole('heading', { name: '支付成功' })).toBeVisible()
  expect(api.state.paymentCreateCalls).toEqual([{ orderNo: 'ORD-PAY-1', payType: 1 }])
  expect(api.state.paymentConfirmCalls).toEqual([{ paymentNo: 'PAY-ORD-PAY-1' }])

  await page.goto('/orders/ORD-COMPLETE-1')
  await expect(page.getByRole('heading', { name: '已完成' })).toBeVisible()
  await page.getByRole('button', { name: '评价', exact: true }).click()
  await expect(page).toHaveURL(/orderItemId=8001/)
  await page.getByPlaceholder(/写下真实体验/).fill('商品质量稳定，物流包装完整。')
  await page.getByText('匿名评价').click()
  await page.getByRole('button', { name: '发布评价' }).click()
  await expect(page).toHaveURL(/\/orders\/ORD-COMPLETE-1$/)
  expect(api.state.reviewCalls).toEqual([{ orderItemId: 8001, rating: 5, content: '商品质量稳定，物流包装完整。', isAnonymous: 1 }])
})
