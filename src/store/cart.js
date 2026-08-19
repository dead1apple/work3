import { defineStore } from 'pinia'
import { addCart, deleteCart, getCartList, selectAllCartItems, setCartItemSelected, updateCart } from '../api/index.js'
import { addToCanonicalCart, calculateCartTotals, normalizeCartList } from '../utils/cart.js'

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
      return addToCanonicalCart({
        product,
        cartList: this.cartList,
        addCart,
        fetchCartList: this.fetchCartList.bind(this),
        updateQuantity: this.updateQuantity.bind(this),
        selectCartItem: (id) => setCartItemSelected(id, 1),
        commitCreatedCartItem: (created, skuId) => {
          this.cartList = [...this.cartList.filter((item) => item.skuId !== skuId), created]
        },
      })
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
