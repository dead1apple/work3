import { describe, expect, it } from 'vitest'
import {
  buildProductPayload,
  createProductForm,
  createSkuRow,
  parseImageUrls,
  toCategoryOptions,
  validateProductForm,
} from '../product-create'

function validForm() {
  return {
    name: '  Codex 商家端测试商品  ',
    subtitle: '  独立商家端创建  ',
    categoryPath: [1, 11],
    brandId: 1,
    mainImage: '  https://example.com/main.jpg  ',
    imageUrls: 'https://example.com/a.jpg\n\n https://example.com/b.jpg ',
    detail: '  <p>测试详情</p>  ',
    skuList: [
      {
        key: 42,
        skuName: '  黑色默认款 ',
        specValues: ' { "颜色": "黑色", "容量": "256GB" } ',
        price: 99.5,
        marketPrice: 129,
        stock: 10,
        image: ' https://example.com/sku.jpg ',
      },
    ],
  }
}

describe('product create domain', () => {
  it('creates a fresh form with one independent SKU row', () => {
    const first = createProductForm()
    const second = createProductForm()

    expect(first.categoryPath).toEqual([])
    expect(first.skuList).toHaveLength(1)
    expect(first.skuList[0]).toMatchObject({ skuName: '', specValues: '{}', stock: 0 })
    expect(first.skuList[0].key).not.toBe(second.skuList[0].key)
  })

  it('maps only the exact category tree shape into leaf-selecting cascader options', () => {
    const result = toCategoryOptions([
      {
        category: { id: 1, name: '手机数码' },
        children: [
          { category: { id: 11, name: '手机' }, children: [] },
        ],
      },
    ])

    expect(result).toEqual([
      {
        value: 1,
        label: '手机数码',
        children: [{ value: 11, label: '手机' }],
      },
    ])
  })

  it('turns non-empty URL lines into the documented string array', () => {
    expect(parseImageUrls(' https://a.test/1.jpg\n\nhttps://a.test/2.jpg ')).toEqual([
      'https://a.test/1.jpg',
      'https://a.test/2.jpg',
    ])
  })

  it('builds the explicit ProductDTO and strips every UI/server-owned field', () => {
    const form = validForm()
    form.id = 8
    form.status = 1
    form.shopId = 99
    form.skuList[0].id = 6

    const payload = buildProductPayload(form)

    expect(payload).toEqual({
      categoryId: 11,
      brandId: 1,
      name: 'Codex 商家端测试商品',
      subtitle: '独立商家端创建',
      mainImage: 'https://example.com/main.jpg',
      images: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
      detail: '<p>测试详情</p>',
      skuList: [
        {
          skuName: '黑色默认款',
          specValues: '{"颜色":"黑色","容量":"256GB"}',
          price: 99.5,
          marketPrice: 129,
          stock: 10,
          image: 'https://example.com/sku.jpg',
        },
      ],
    })
    expect(payload).not.toHaveProperty('id')
    expect(payload).not.toHaveProperty('status')
    expect(payload).not.toHaveProperty('shopId')
    expect(payload.skuList[0]).not.toHaveProperty('key')
    expect(payload.skuList[0]).not.toHaveProperty('id')
  })

  it('uses null and empty arrays for optional empty DTO fields', () => {
    const form = validForm()
    form.subtitle = ' '
    form.mainImage = ''
    form.imageUrls = ''
    form.detail = ''
    form.skuList[0].marketPrice = ''
    form.skuList[0].image = ''

    expect(buildProductPayload(form)).toMatchObject({
      subtitle: null,
      mainImage: null,
      images: [],
      detail: null,
      skuList: [{ marketPrice: null, image: null }],
    })
  })

  it('rejects missing product identity fields and an empty SKU list', () => {
    const form = validForm()
    form.name = ' '
    form.categoryPath = []
    form.brandId = null
    form.skuList = []

    expect(validateProductForm(form)).toEqual(expect.objectContaining({
      name: '请输入商品名称',
      categoryPath: '请选择叶子分类',
      brandId: '请选择品牌',
      skuList: '至少添加一个 SKU',
    }))
  })

  it.each([
    ['', '请输入 SKU 名称'],
    ['[]', '规格值必须是 JSON 对象'],
    ['null', '规格值必须是 JSON 对象'],
    ['not-json', '规格值必须是有效 JSON 对象'],
  ])('rejects invalid SKU identity/specification %s', (specValues, message) => {
    const form = validForm()
    form.skuList[0].specValues = specValues
    if (specValues === '') form.skuList[0].skuName = ''

    const errors = validateProductForm(form)

    expect(Object.values(errors).join(' ')).toContain(message)
  })

  it('rejects negative/non-numeric money and negative/fractional stock', () => {
    const form = validForm()
    form.skuList.push(createSkuRow())
    form.skuList[0].price = -1
    form.skuList[0].marketPrice = 'x'
    form.skuList[0].stock = 1.5
    form.skuList[1].skuName = '第二款'
    form.skuList[1].specValues = '{}'
    form.skuList[1].price = 'x'
    form.skuList[1].stock = -1

    expect(validateProductForm(form)).toEqual(expect.objectContaining({
      'skuList.0.price': '销售价必须是非负数字',
      'skuList.0.marketPrice': '市场价必须是非负数字',
      'skuList.0.stock': '库存必须是非负整数',
      'skuList.1.price': '销售价必须是非负数字',
      'skuList.1.stock': '库存必须是非负整数',
    }))
  })
})
