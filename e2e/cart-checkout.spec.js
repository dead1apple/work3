import { test, expect } from './fixtures/api.js'

const login = async (page) => {
  await page.goto('/login')
  await page.getByPlaceholder('请输入用户名').fill('buyer')
  await page.getByPlaceholder('请输入密码').fill('secret123')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/home$/)
}

const addPhoneToCart = async (page) => {
  await page.goto('/product/1001')
  await page.locator('.el-radio-button').filter({ hasText: '黑色' }).click()
  await page.locator('.el-radio-button').filter({ hasText: '128G' }).click()
  await page.getByRole('button', { name: '加入购物车' }).click()
  await expect(page.getByText('已加入购物车')).toBeVisible()
}

const chooseHighlightedSelectOption = async (page) => {
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
}

test('favorite, canonical cart, rollback, delete, address edit, coupon and terminal checkout submit', async ({ page, api }) => {
  await login(page)
  await page.goto('/product/1001')
  await page.getByRole('button', { name: /收藏商品/ }).click()
  await expect(page.getByRole('button', { name: /已收藏/ })).toBeVisible()
  await page.getByRole('button', { name: /已收藏/ }).click()
  await expect(page.getByRole('button', { name: /收藏商品/ })).toBeVisible()
  expect(api.state.favoriteCalls).toEqual([
    { method: 'POST', productId: 1001 },
    { method: 'DELETE', productId: 1001 },
  ])

  await addPhoneToCart(page)
  expect(api.state.addCartCalls).toEqual([{ skuId: 9001, quantity: 1 }])
  await page.goto('/cart')
  await expect(page.getByText('非笛卡尔 SKU 测试手机')).toBeVisible()
  await page.locator('.cart-table .el-checkbox').nth(1).click()
  await page.locator('.cart-table .el-checkbox').nth(1).click()
  expect(api.state.selectCalls).toEqual([{ id: 7001, selected: 0 }, { id: 7001, selected: 1 }])
  await page.getByRole('spinbutton').fill('13')
  await page.getByRole('spinbutton').blur()
  await expect(page.getByText('库存不足，剩余 12 件')).toBeVisible()
  await expect(page.getByRole('spinbutton')).toHaveValue('1')
  expect(api.state.quantityCalls).toEqual([{ id: 7001, quantity: 13 }])

  await page.getByRole('button', { name: '去结算' }).click()
  await expect(page).toHaveURL(/\/checkout\/cart$/)
  await page.locator('.discount-row').filter({ hasText: '优惠券' }).first().locator('.el-select').click()
  await page.getByText(/满 3000 减 200/).click()
  await page.getByLabel('订单备注').fill('门口请电话联系')
  await page.getByRole('button', { name: '提交订单' }).dblclick()
  await expect(page).toHaveURL(/\/payment\/ORD-0001/)
  expect(api.state.orderCreateCalls).toEqual([{ cartIds: [7001], addressId: 501, couponId: 301, remark: '门口请电话联系' }])

  await page.goto('/address')
  await page.getByRole('button', { name: '新增收货地址', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '新增收货地址' })
  await page.getByPlaceholder('请输入收货人姓名').fill('王五')
  await page.getByPlaceholder('请输入 11 位手机号码').fill('13900139000')
  await dialog.getByRole('combobox', { name: /所在地区/ }).click()
  await chooseHighlightedSelectOption(page)
  await dialog.getByRole('combobox', { name: /城市/ }).click()
  await chooseHighlightedSelectOption(page)
  await dialog.getByRole('combobox', { name: /区 \/ 县/ }).click()
  await chooseHighlightedSelectOption(page)
  await page.getByPlaceholder('请输入街道、门牌号、楼栋、单元等详细信息').fill('测试路 9 号')
  await page.getByRole('button', { name: '保存地址' }).click()
  await expect(page.getByText('王五')).toBeVisible()
  await page.getByRole('button', { name: '编辑' }).first().click()
  await page.getByPlaceholder('请输入收货人姓名').fill('李四')
  await page.getByRole('button', { name: '保存地址' }).click()
  await expect(page.getByText('李四')).toBeVisible()
  expect(api.state.addressCalls).toEqual([
    { method: 'POST', receiverName: '王五', receiverPhone: '13900139000', detailAddress: '测试路 9 号', isDefault: 0 },
    { method: 'PUT', id: 501, receiverName: '李四' },
  ])

  await addPhoneToCart(page)
  await page.goto('/cart')
  await page.getByRole('button', { name: '删除' }).click()
  await expect(page.getByText('购物车是空的，快去逛逛吧')).toBeVisible()
  expect(api.state.deleteCartCalls).toEqual([{ id: 7001 }])
})
