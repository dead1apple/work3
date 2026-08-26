import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { routes } from '../routes'

describe('merchant application routes', () => {
  it('registers the product list under the protected Merchant Layout', () => {
    const router = createRouter({
      history: createMemoryHistory('/merchant/'),
      routes,
    })

    const resolved = router.resolve('/products')

    expect(resolved.name).toBe('merchant-products')
    expect(resolved.href).toBe('/merchant/products')
    expect(resolved.meta.requiresMerchant).toBe(true)
    expect(resolved.matched).toHaveLength(2)
  })
})
