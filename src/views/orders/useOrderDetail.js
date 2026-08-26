import { ref } from 'vue'
import { getMerchantOrderDetail } from '../../api/order'

export function useOrderDetail(orderNo) {
  const detail = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const result = await getMerchantOrderDetail(orderNo)
      detail.value = result
      return result
    } catch (loadError) {
      detail.value = null
      error.value = loadError
      throw loadError
    } finally {
      loading.value = false
    }
  }

  return { detail, loading, error, load }
}
