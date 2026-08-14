import { defineStore } from 'pinia'
import { addCart, deleteCart, getCartList, selectAllCartItems, setCartItemSelected, updateCart } from '../api/index.js'
import { calculateCartTotals, mergeCartItem, normalizeCartList } from '../utils/cart.js'

export const useCartStore = defineStore('cart', {
  state: () => ({ cartList: [] }),
  getters: {
    totalCount: (state) => calculateCartTotals(state.cartList).totalCount,
    totalPrice: (state) => calculateCartTotals(state.cartList).totalPrice,
    checkedList: (state) => state.cartList.filter((item) => item.checked),
  },
  actions: {
    async fetchCartList() {
      const result = await getCartList()
      this.cartList = normalizeCartList(result)
      return this.cartList
    },
    async addToCart(product) {
      const skuId = product.skuId ?? product.id
      if (!skuId) throw new Error('缺少商品 SKU')
      const quantity = Math.min(99, Math.max(1, Number(product.quantity || 1)))
      const existing = this.cartList.find((item) => item.skuId === skuId)
      if (existing) {
        const nextQuantity = Math.min(99, existing.quantity + quantity)
        const updated = await this.updateQuantity(existing.id, nextQuantity)
        existing.checked = true
        return updated || existing
      }
      const result = await addCart({ skuId, quantity })
      const created = normalizeCartList([{
        ...(result?.cartItem || result || {}),
        id: result?.id || result?.cartItemId || `${skuId}-${Date.now()}`,
        skuId,
        quantity,
        selected: 1,
        productName: product.name,
        image: product.image,
        price: product.price,
        skuName: product.skuName,
      }])[0]
      this.cartList = mergeCartItem(this.cartList, created)
      return created
    },
    async updateQuantity(id, quantity) {
      const nextQuantity = Math.min(99, Math.max(1, Number(quantity || 1)))
      await updateCart({ id, quantity: nextQuantity })
      const item = this.cartList.find((entry) => entry.id === id)
      if (item) item.quantity = nextQuantity
      return item
    },
    async removeFromCart(id) {
      await deleteCart(id)
      this.cartList = this.cartList.filter((item) => item.id !== id)
    },
    async toggleCheck(id) {
      const item = this.cartList.find((entry) => entry.id === id)
      if (!item) return
      const checked = !item.checked
      await setCartItemSelected(id, checked ? 1 : 0)
      item.checked = checked
    },
    async toggleAllCheck(checked) {
      await selectAllCartItems(checked ? 1 : 0)
      this.cartList.forEach((item) => { item.checked = checked })
    },
    clearCart() {
      this.cartList = []
    },
  },
  persist: true,
})
