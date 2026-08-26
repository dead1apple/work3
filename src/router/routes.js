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
      {
        path: 'products/create',
        name: 'merchant-product-create',
        component: () => import('../views/products/ProductCreateView.vue'),
        meta: { title: '新增商品' },
      },
      {
        path: 'products/:id/edit',
        name: 'merchant-product-edit',
        component: () => import('../views/products/ProductCreateView.vue'),
        meta: { title: '编辑商品' },
      },
      {
        path: 'orders',
        name: 'merchant-orders',
        component: () => import('../views/orders/OrderListView.vue'),
        meta: { title: '订单管理' },
      },
      {
        path: 'orders/:orderNo',
        name: 'merchant-order-detail',
        component: () => import('../views/orders/OrderDetailView.vue'),
        meta: { title: '订单详情' },
      },
      {
        path: 'shop',
        name: 'merchant-shop',
        component: () => import('../views/shop/ShopView.vue'),
        meta: { title: '店铺管理' },
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
