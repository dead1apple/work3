import { createRouter, createWebHistory } from 'vue-router'
import { pinia } from '../store'
import { useSessionStore } from '../store/session'
import { useShopStore } from '../store/shop'
import { createMerchantGuard } from './guard'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/',
      component: () => import('../layouts/MerchantLayout.vue'),
      meta: { requiresMerchant: true },
      children: [
        {
          path: '',
          name: 'merchant-home',
          component: () => import('../views/HomeView.vue'),
        },
      ],
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('../views/ForbiddenView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(createMerchantGuard(useSessionStore(pinia), useShopStore(pinia)))

export default router
