import { defineStore } from 'pinia'
import { addCart, deleteCart, getCartList, selectAllCartItems, setCartItemSelected, updateCart } from '../api/index.js'
import { calculateCartTotals, getCanonicalCartItem, normalizeCartList } from '../utils/cart.js'

const SERVER_CART_ITEM_REQUIRED = '购物车已更新，但服务端未返回可操作的购物车记录，请刷新后重试'

export const useCartStore = defineStore('cart', {
  state: () => ({ cartList: [] }),
  getters: {
    totalCount: (state) => calculateCartTotals(state.cartList).totalCount,
    totalPrice: (state) => calculateCartTotals(state.cartList).totalPrice,
    checkedList: (state) => state.cartList.filter((item) => item.checked),
  },
  actions: {
    async fetchCartList() {
      try {
        const result = await getCartList()
        this.cartList = normalizeCartList(result)
        return this.cartList
      } catch (error) {
        this.cartList = []
        throw error
      }
    },
    async addToCart(product) {
      const skuId = product.skuId ?? product.id
      if (!skuId) throw new Error('缺少商品 SKU')
      const quantity = Math.min(99, Math.max(1, Number(product.quantity || 1)))
      const existing = this.cartList.find((item) => item.skuId === skuId)
      if (existing) {
        const nextQuantity = Math.min(99, existing.quantity + quantity)
        const updated = await this.updateQuantity(existing.id, nextQuantity)
        if (!existing.checked) {
          await setCartItemSelected(existing.id, 1)
          existing.checked = true
        }
        return updated || existing
      }
      const result = await addCart({ skuId, quantity })
      let created = getCanonicalCartItem(result, skuId)
      let fetchedCanonicalCart = false
      if (!created) {
        const serverCartList = await this.fetchCartList()
        created = serverCartList.find((item) => item.skuId === skuId) || null
        fetchedCanonicalCart = true
      }
      if (!created) throw new Error(SERVER_CART_ITEM_REQUIRED)
      created = normalizeCartList([{
        ...created,
        quantity: created.quantity || quantity,
        selected: created.checked ? 1 : 0,
        productName: created.name || product.name,
        image: created.image || product.image,
        price: created.price ?? product.price,
        skuName: created.skuName || product.skuName,
      }])[0]
      if (!fetchedCanonicalCart) {
        this.cartList = [...this.cartList.filter((item) => item.skuId !== skuId), created]
      }
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
    async toggleCheck(id, checked) {
      const item = this.cartList.find((entry) => entry.id === id)
      if (!item) return
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
})
