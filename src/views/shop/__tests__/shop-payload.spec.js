import { describe, expect, it } from 'vitest'
import { buildShopUpdatePayload } from '../shop-payload'

describe('buildShopUpdatePayload', () => {
  it('returns the complete documented Shop DTO while changing only editable form fields', () => {
    const currentShop = {
      id: 1,
      userId: 2,
      shopName: '华为官方旗舰店',
      logo: null,
      description: '官方直营店',
      licenseImage: null,
      status: 1,
      rating: 4.9,
      location: '116.397428,39.90923',
      address: '北京市东城区王府井大街 88 号',
      createTime: '2026-08-14 13:47:29',
      updateTime: '2026-08-15 12:56:22',
    }

    expect(buildShopUpdatePayload(currentShop, {
      shopName: '  华为官方旗舰店  ',
      logo: 'https://cdn.test/logo.png',
      description: '  新的店铺简介  ',
      licenseImage: 'https://cdn.test/license.png',
      location: ' 116.397428,39.90923 ',
      address: ' 北京市东城区王府井大街 88 号 ',
    })).toEqual({
      id: 1,
      userId: 2,
      shopName: '华为官方旗舰店',
      logo: 'https://cdn.test/logo.png',
      description: '新的店铺简介',
      licenseImage: 'https://cdn.test/license.png',
      status: 1,
      rating: 4.9,
      location: '116.397428,39.90923',
      address: '北京市东城区王府井大街 88 号',
      createTime: '2026-08-14 13:47:29',
      updateTime: '2026-08-15 12:56:22',
    })
  })
})
