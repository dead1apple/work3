export const routes = [
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
        meta: { title: '首页' },
      },
      {
        path: 'products',
        name: 'merchant-products',
        component: () => import('../views/products/ProductListView.vue'),
        meta: { title: '商品列表' },
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
]
