import { ref } from 'vue'
import { getMerchantProducts, updateMerchantProductStatus } from '../../api/product'

const DOCUMENTED_STATUSES = new Set([0, 1, 2])

export function useProductList() {
  const keyword = ref('')
  const status = ref('')
  const page = ref(1)
  const size = ref(10)
  const items = ref([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const updatingProductIds = ref(new Set())

  function buildParams() {
    const params = {
      page: page.value,
      size: size.value,
    }
    const normalizedKeyword = keyword.value.trim()

    if (normalizedKeyword) {
      params.keyword = normalizedKeyword
    }

    if (DOCUMENTED_STATUSES.has(status.value)) {
      params.status = status.value
    }

    return params
  }

  async function load() {
    loading.value = true
    error.value = null

    try {
      const result = await getMerchantProducts(buildParams())
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

  function changeStatus(nextStatus) {
    status.value = nextStatus
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

  async function updateStatus(productId, nextStatus) {
    if (updatingProductIds.value.has(productId)) {
      return
    }

    updatingProductIds.value = new Set(updatingProductIds.value).add(productId)

    try {
      await updateMerchantProductStatus(productId, nextStatus)
      await load()
    } finally {
      const remainingProductIds = new Set(updatingProductIds.value)
      remainingProductIds.delete(productId)
      updatingProductIds.value = remainingProductIds
    }
  }

  return {
    keyword,
    status,
    page,
    size,
    items,
    total,
    loading,
    error,
    updatingProductIds,
    load,
    search,
    changeStatus,
    changePage,
    changeSize,
    updateStatus,
  }
}
