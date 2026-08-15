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
        { path: 'products', name: 'products', meta: { title: '商品搜索', public: true }, component: () => import('../views/ProductsView.vue') },
        { path: 'cart', name: 'cart', meta: { title: '购物车' }, component: () => import('../views/CartView.vue') },
        { path: 'profile', name: 'profile', meta: { title: '我的' }, component: () => import('../views/ProfileView.vue') },
        { path: 'profile/edit', name: 'profile-edit', meta: { title: '编辑资料' }, component: () => import('../views/ProfileEditView.vue') },
        { path: 'favorites', name: 'favorites', meta: { title: '我的收藏' }, component: () => import('../views/FavoritesView.vue') },
        { path: 'address', alias: '/addresses', name: 'addresses', meta: { title: '收货地址' }, component: () => import('../views/AddressesView.vue') },
        { path: 'coupons', name: 'coupons', meta: { title: '优惠券' }, component: () => import('../views/CouponsView.vue') },
        { path: 'checkout/:mode', name: 'checkout', meta: { title: '确认订单' }, component: () => import('../views/CheckoutView.vue') },
        { path: 'payment/:orderNo', name: 'payment', meta: { title: '收银台' }, component: () => import('../views/PaymentView.vue') },
        { path: 'orders', name: 'orders', meta: { title: '我的订单' }, component: () => import('../views/OrdersView.vue') },
        { path: 'orders/:orderNo', name: 'order-detail', meta: { title: '订单详情' }, component: () => import('../views/OrderDetailView.vue') },
        { path: 'orders/:orderNo/review', name: 'order-review', meta: { title: '发表评价' }, component: () => import('../views/ReviewView.vue') },
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
