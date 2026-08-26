import { createRouter, createWebHistory } from 'vue-router'
import { pinia } from '../store'
import { useSessionStore } from '../store/session'
import { useShopStore } from '../store/shop'
import { createMerchantGuard } from './guard'
import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(createMerchantGuard(useSessionStore(pinia), useShopStore(pinia)))

export default router
