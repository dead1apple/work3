import { hasPermission } from './permissions'

describe('administrator permissions', () => {
  it('allows all actions for a wildcard role', () => {
    expect(hasPermission(['*'], 'orders:manage')).toBe(true)
  })

  it('distinguishes view and manage permissions', () => {
    expect(hasPermission(['orders:view'], 'orders:view')).toBe(true)
    expect(hasPermission(['orders:view'], 'orders:manage')).toBe(false)
  })
})
