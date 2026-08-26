import { ref } from 'vue'
import { getMerchantOrders } from '../../api/order'

const DOCUMENTED_STATUSES = new Set([0, 1, 2, 3, 4, 5])

export function useOrderList() {
  const status = ref('')
  const page = ref(1)
  const size = ref(10)
  const items = ref([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)

  function buildParams() {
    const params = { page: page.value, size: size.value }
    if (DOCUMENTED_STATUSES.has(status.value)) params.status = status.value
    return params
  }

  async function load() {
    loading.value = true
    error.value = null
    try {
      const result = await getMerchantOrders(buildParams())
      items.value = result.list
      total.value = result.total
      page.value = result.page
      size.value = result.size
      return result
    } catch (loadError) {
      items.value = []
      total.value = 0
      error.value = loadError
      throw loadError
    } finally {
      loading.value = false
    }
  }

  function search() {
    page.value = 1
    return load()
  }

  function changePage(nextPage) {
    page.value = nextPage
    return load()
  }

  function changeSize(nextSize) {
    size.value = nextSize
    page.value = 1
    return load()
  }

  return { status, page, size, items, total, loading, error, load, search, changePage, changeSize }
}
