import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user.js'
import { createRoleAwareGuard } from './access.js'

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
        { path: 'cart', name: 'cart', meta: { title: '购物车', requiresAuth: true }, component: () => import('../views/CartView.vue') },
        { path: 'profile', name: 'profile', meta: { title: '我的', requiresAuth: true }, component: () => import('../views/ProfileView.vue') },
        { path: 'profile/edit', name: 'profile-edit', meta: { title: '编辑资料', requiresAuth: true }, component: () => import('../views/ProfileEditView.vue') },
        { path: 'favorites', name: 'favorites', meta: { title: '我的收藏', requiresAuth: true }, component: () => import('../views/FavoritesView.vue') },
        { path: 'address', alias: '/addresses', name: 'addresses', meta: { title: '收货地址', requiresAuth: true }, component: () => import('../views/AddressesView.vue') },
        { path: 'coupons', name: 'coupons', meta: { title: '优惠券', requiresAuth: true }, component: () => import('../views/CouponsView.vue') },
        { path: 'checkout/:mode', name: 'checkout', meta: { title: '确认订单', requiresAuth: true }, component: () => import('../views/CheckoutView.vue') },
        { path: 'payment/:orderNo', name: 'payment', meta: { title: '收银台', requiresAuth: true }, component: () => import('../views/PaymentView.vue') },
        { path: 'orders', name: 'orders', meta: { title: '我的订单', requiresAuth: true }, component: () => import('../views/OrdersView.vue') },
        { path: 'orders/:orderNo', name: 'order-detail', meta: { title: '订单详情', requiresAuth: true }, component: () => import('../views/OrderDetailView.vue') },
        { path: 'orders/:orderNo/review', name: 'order-review', meta: { title: '发表评价', requiresAuth: true }, component: () => import('../views/ReviewView.vue') },
        { path: 'merchant/apply', name: 'merchant-apply', meta: { title: '商家入驻', requiresAuth: true, roles: [0, 1] }, component: () => import('../views/merchant/ApplyView.vue') },
      ],
    },
    { path: '/login', name: 'login', meta: { public: true }, component: () => import('../views/auth/Login.vue') },
    { path: '/register', name: 'register', meta: { public: true }, component: () => import('../views/auth/Register.vue') },
    { path: '/403', name: 'forbidden', meta: { title: '无权访问', public: true }, component: () => import('../views/errors/ForbiddenView.vue') },
    {
      path: '/merchant',
      component: () => import('../views/merchant/layout/index.vue'),
      meta: { title: '商家中心', requiresAuth: true, roles: [1] },
      children: [
        { path: '', name: 'merchant-home', meta: { title: '商家首页' }, component: () => import('../views/merchant/HomeView.vue') },
      ],
    },
    {
      path: '/admin',
      component: () => import('../views/admin/layout/index.vue'),
      meta: { title: '管理后台', requiresAuth: true, roles: [2] },
      children: [
        { path: '', name: 'admin-home', meta: { title: '后台首页' }, component: () => import('../views/admin/HomeView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/home' },
  ],
})

router.beforeEach(createRoleAwareGuard(() => useUserStore()))

export default router
