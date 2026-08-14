import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user.js'
import { resolveRedirect } from '../utils/auth.js'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../views/layout/index.vue'),
      children: [
        { path: '', redirect: '/home' },
        { path: 'home', name: 'home', meta: { title: '首页', public: true }, component: () => import('../views/home/index.vue') },
        { path: 'category', name: 'category', meta: { title: '分类', public: true }, component: () => import('../views/CategoryView.vue') },
        { path: 'product/:id', name: 'product-detail', meta: { title: '商品详情', public: true }, component: () => import('../views/product/Detail.vue') },
        { path: 'cart', name: 'cart', meta: { title: '购物车' }, component: () => import('../views/CartView.vue') },
        { path: 'profile', name: 'profile', meta: { title: '我的' }, component: () => import('../views/ProfileView.vue') },
      ],
    },
    { path: '/login', name: 'login', meta: { public: true }, component: () => import('../views/auth/Login.vue') },
    { path: '/register', name: 'register', meta: { public: true }, component: () => import('../views/auth/Register.vue') },
  ],
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  if ((to.name === 'login' || to.name === 'register') && userStore.isLoggedIn) {
    return resolveRedirect(to.query.redirect)
  }
  if (to.meta.public) return true
  if (!userStore.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
