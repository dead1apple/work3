import { onMounted, ref } from 'vue'
import { getMerchantProducts } from '../api/product'
import { getMerchantOrders } from '../api/order'

const dashboardMetrics = [
  ['products', () => getMerchantProducts({ page: 1, size: 1 })],
  ['onSale', () => getMerchantProducts({ status: 1, page: 1, size: 1 })],
  ['offSale', () => getMerchantProducts({ status: 0, page: 1, size: 1 })],
  ['pendingReview', () => getMerchantProducts({ status: 2, page: 1, size: 1 })],
  ['orders', () => getMerchantOrders({ page: 1, size: 1 })],
  ['pendingDelivery', () => getMerchantOrders({ status: 1, page: 1, size: 1 })],
]

export function useMerchantDashboard() {
  const metrics = ref({
    products: null,
    onSale: null,
    offSale: null,
    pendingReview: null,
    orders: null,
    pendingDelivery: null,
  })
  const errors = ref({})
  const loading = ref(true)

  async function load() {
    loading.value = true
    const results = await Promise.allSettled(dashboardMetrics.map(([, request]) => request()))
    const nextMetrics = {}
    const nextErrors = {}

    results.forEach((result, index) => {
      const key = dashboardMetrics[index][0]
      if (result.status === 'fulfilled') nextMetrics[key] = result.value.total
      else nextErrors[key] = result.reason
    })

    metrics.value = { ...metrics.value, ...nextMetrics }
    errors.value = nextErrors
    loading.value = false
  }

  onMounted(load)

  return { metrics, errors, loading, load }
}
