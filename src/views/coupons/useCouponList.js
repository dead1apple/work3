import { ref } from 'vue'
import { getMerchantCoupons, updateMerchantCouponStatus } from '../../api/coupon'

const DOCUMENTED_STATUSES = new Set([0, 1])

export function useCouponList() {
  const keyword = ref('')
  const status = ref('')
  const page = ref(1)
  const size = ref(10)
  const items = ref([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const updatingCouponIds = ref(new Set())

  function buildParams() {
    const params = { page: page.value, size: size.value }
    const normalizedKeyword = keyword.value.trim()
    if (normalizedKeyword) params.keyword = normalizedKeyword
    if (DOCUMENTED_STATUSES.has(status.value)) params.status = status.value
    return params
  }

  async function load() {
    loading.value = true
    error.value = null
    try {
      const result = await getMerchantCoupons(buildParams())
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

  function search() { page.value = 1; return load() }
  function changeStatus(nextStatus) { status.value = nextStatus; page.value = 1; return load() }
  function changePage(nextPage) { page.value = nextPage; return load() }
  function changeSize(nextSize) { size.value = nextSize; page.value = 1; return load() }

  async function updateStatus(id, nextStatus) {
    if (updatingCouponIds.value.has(id)) return
    updatingCouponIds.value = new Set(updatingCouponIds.value).add(id)
    try {
      await updateMerchantCouponStatus(id, nextStatus)
      await load()
    } finally {
      const remaining = new Set(updatingCouponIds.value)
      remaining.delete(id)
      updatingCouponIds.value = remaining
    }
  }

  return { keyword, status, page, size, items, total, loading, error, updatingCouponIds, load, search, changeStatus, changePage, changeSize, updateStatus }
}
