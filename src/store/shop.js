import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as shopApi from '../api/shop'

export const useShopStore = defineStore('merchant-shop', () => {
  const shop = ref(null)
  const status = ref('idle')
  const error = ref(null)
  let restorePromise = null
  let contextVersion = 0

  const isReady = computed(() => status.value === 'ready')
  const hasNoShop = computed(() => status.value === 'empty')

  function restore() {
    if (status.value === 'ready' || status.value === 'empty') {
      return Promise.resolve(shop.value)
    }

    if (restorePromise) {
      return restorePromise
    }

    const restoringVersion = contextVersion
    status.value = 'loading'
    error.value = null

    const currentRestoration = shopApi
      .getCurrentShop()
      .then((candidate) => {
        if (restoringVersion === contextVersion) {
          shop.value = candidate
          status.value = candidate === null ? 'empty' : 'ready'
        }
        return candidate
      })
      .catch((restoreError) => {
        if (restoringVersion === contextVersion) {
          shop.value = null
          error.value = restoreError
          status.value = 'error'
        }
        throw restoreError
      })
      .finally(() => {
        if (restorePromise === currentRestoration) {
          restorePromise = null
        }
      })

    restorePromise = currentRestoration
    return currentRestoration
  }

  function reset() {
    contextVersion += 1
    restorePromise = null
    shop.value = null
    status.value = 'idle'
    error.value = null
  }

  function refresh() {
    reset()
    return restore()
  }

  return {
    shop,
    status,
    error,
    isReady,
    hasNoShop,
    restore,
    refresh,
    reset,
  }
})
