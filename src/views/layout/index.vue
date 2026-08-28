<script setup>
import { computed, onMounted, ref } from 'vue'
import { Service, ShoppingCart, Ticket, Top } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../../store/cart.js'
import { useUserStore } from '../../store/user.js'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()
const keyword = ref('')

const navigationItems = [
  { label: '首页', path: '/home', icon: '⌂' },
  { label: '分类', path: '/category', icon: '▦' },
  { label: '购物车', path: '/cart', icon: '🛒' },
  { label: '我的', path: '/profile', icon: '♙' },
]
const desktopNavigationItems = navigationItems.filter((item) => item.path !== '/profile')
const footerServices = [
  { title: '品质保障', description: '严选商品，放心购买', icon: '✓', tone: 'red' },
  { title: '极速配送', description: '高效履约，及时送达', icon: '↝', tone: 'blue' },
  { title: '安心支付', description: '多重保障，支付无忧', icon: '▣', tone: 'green' },
  { title: '售后无忧', description: '贴心服务，快速响应', icon: '↻', tone: 'orange' },
]
const footerMallLinks = [
  { label: '商城首页', path: '/home' },
  { label: '商品分类', path: '/category' },
  { label: '购物车', path: '/cart' },
  { label: '我的订单', path: '/orders' },
]
const footerUserLinks = [
  { label: '个人中心', path: '/profile' },
  { label: '收货地址', path: '/address' },
  { label: '我的收藏', path: '/favorites' },
  { label: '优惠券中心', path: '/coupons' },
]

const currentLabel = computed(() => route.meta.title || '商城')
const currentUser = computed(() => userStore.userInfo || {})
const displayName = computed(() => currentUser.value.nickname || currentUser.value.nickName || currentUser.value.username || currentUser.value.userName || '用户')

const handleSearch = () => {
  const value = keyword.value.trim()
  router.push({ path: '/products', query: value ? { keyword: value } : {} })
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  if (!userStore.isLoggedIn) return
  cartStore.fetchCartList().catch(() => {})
})
</script>

<template>
  <div class="layout-shell">
    <header class="topbar">
      <div class="topbar-inner">
        <RouterLink class="brand" to="/home" aria-label="返回首页">
          <span class="brand-mark">JD</span>
          <span class="brand-name">京东商城</span>
        </RouterLink>

        <form class="search-form" role="search" @submit.prevent="handleSearch">
          <label class="sr-only" for="site-search">搜索商品</label>
          <input
            id="site-search"
            v-model="keyword"
            type="search"
            placeholder="搜索商品、品牌或店铺"
            autocomplete="off"
          />
          <button type="submit" aria-label="搜索">⌕</button>
        </form>

        <nav class="desktop-nav" aria-label="桌面主导航">
          <RouterLink
            v-for="item in desktopNavigationItems"
            :key="item.path"
            :to="item.path"
            class="desktop-nav-item"
            active-class="desktop-nav-item-active"
          >
            <el-badge v-if="item.path === '/cart'" :value="cartStore.totalCount" :hidden="cartStore.totalCount === 0" :max="99">
              {{ item.label }}
            </el-badge>
            <span v-else>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <RouterLink v-if="!userStore.isLoggedIn" class="login-link" to="/login">登录</RouterLink>
        <RouterLink v-else class="user-entry" to="/profile" :aria-label="`进入${displayName}的个人中心`">
          <span class="user-name">{{ displayName }}</span>
        </RouterLink>
      </div>
    </header>

    <main class="content-area" :aria-label="currentLabel">
      <RouterView />
    </main>

    <footer class="site-footer">
      <section class="service-bar" aria-label="商城服务承诺">
        <div v-for="service in footerServices" :key="service.title" class="service-item">
          <span class="service-icon" :class="`service-icon-${service.tone}`" aria-hidden="true">{{ service.icon }}</span>
          <span>
            <strong>{{ service.title }}</strong>
            <small>{{ service.description }}</small>
          </span>
        </div>
      </section>

      <section class="footer-main">
        <div class="footer-brand">
          <RouterLink class="footer-brand-title" to="/home">
            <span class="brand-mark">JD</span>
            <span>京东商城</span>
          </RouterLink>
          <p>精选好物，连接品质生活。每天为你发现值得信赖的商品与服务。</p>
          <span class="footer-status"><i></i> 正常营业 · 服务在线</span>
        </div>

        <div class="footer-column">
          <h2>商城导航</h2>
          <RouterLink v-for="item in footerMallLinks" :key="item.path" :to="item.path">{{ item.label }}</RouterLink>
        </div>

        <div class="footer-column">
          <h2>用户服务</h2>
          <RouterLink v-for="item in footerUserLinks" :key="item.path" :to="item.path">{{ item.label }}</RouterLink>
        </div>

        <div id="footer-contact" class="footer-column footer-contact">
          <h2>需要帮助？</h2>
          <strong>400-888-8888</strong>
          <p>周一至周日 9:00-22:00</p>
          <RouterLink to="/home#product-title">浏览精选商品 <span aria-hidden="true">→</span></RouterLink>
        </div>
      </section>

      <div class="footer-bottom">
        <span>京东商城 · 让生活更简单</span>
        <span>© 2026 JD Mall. All rights reserved.</span>
      </div>
    </footer>

    <aside class="quick-tools" aria-label="快捷工具">
      <RouterLink class="quick-tool" to="/cart" title="购物车" aria-label="购物车">
        <el-badge :value="cartStore.totalCount" :hidden="cartStore.totalCount === 0" :max="99">
          <ShoppingCart />
        </el-badge>
      </RouterLink>
      <RouterLink class="quick-tool" to="/coupons" title="优惠券中心" aria-label="优惠券中心">
        <Ticket />
      </RouterLink>
      <a class="quick-tool" href="#footer-contact" title="联系客服" aria-label="联系客服">
        <Service />
      </a>
      <span class="quick-divider" aria-hidden="true"></span>
      <button type="button" class="quick-tool quick-top" title="回到顶部" aria-label="回到顶部" @click="scrollToTop">
        <Top />
      </button>
    </aside>

    <nav class="bottom-nav" aria-label="主导航">
      <RouterLink
        v-for="item in navigationItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        active-class="nav-item-active"
      >
        <el-badge v-if="item.path === '/cart'" :value="cartStore.totalCount" :hidden="cartStore.totalCount === 0" :max="99" class="cart-badge">
          <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span>
        </el-badge>
        <span v-else class="nav-icon" aria-hidden="true">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.layout-shell {
  --jd-red: #e1251b;
  --ink: #1f2937;
  --muted: #8b95a5;
  --line: #edf0f3;
  min-height: 100vh;
  overflow-x: clip;
  background: #f6f7f9;
  color: var(--ink);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(14px);
}

.topbar-inner {
  display: grid;
  grid-template-columns: auto minmax(260px, 1fr) auto auto;
  align-items: center;
  gap: clamp(14px, 2vw, 28px);
  width: min(1180px, calc(100% - 40px));
  min-height: 72px;
  margin: 0 auto;
}

.brand { display: inline-flex; align-items: center; gap: 9px; font-weight: 800; white-space: nowrap; }
.brand-mark { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; color: #fff; background: var(--jd-red); font-size: 12px; letter-spacing: -1px; }
.brand-name { font-size: 18px; letter-spacing: normal; }

.search-form { display: flex; height: 40px; overflow: hidden; border: 2px solid var(--jd-red); border-radius: 12px; background: #fff; }
.search-form input { min-width: 0; flex: 1; padding: 0 14px; border: 0; outline: 0; color: var(--ink); font: inherit; background: transparent; }
.search-form input::placeholder { color: #a7afb9; }
.search-form button { width: 48px; border: 0; color: #fff; background: var(--jd-red); font-size: 24px; line-height: 1; cursor: pointer; }
.search-form button:hover { background: #c91c14; }
.desktop-nav { display: flex; align-items: center; gap: 4px; }
.desktop-nav-item { position: relative; padding: 10px 9px; border-radius: 8px; color: #5f6875; font-size: 13px; font-weight: 700; white-space: nowrap; transition: color 160ms ease, background-color 160ms ease; }
.desktop-nav-item:hover, .desktop-nav-item:focus-visible { color: var(--jd-red); background: #fff1f0; outline: 0; }
.desktop-nav-item-active { color: var(--jd-red); background: #fff1f0; }
.login-link { color: var(--jd-red); font-size: 14px; font-weight: 700; }
.user-entry { display: inline-flex; align-items: center; min-width: 0; color: var(--ink); font-size: 14px; font-weight: 700; }
.user-entry:hover, .user-entry:focus-visible { color: var(--jd-red); }
.user-name { max-width: 92px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.content-area { width: min(1180px, calc(100% - 40px)); min-height: calc(100vh - 72px); margin: 0 auto; padding: 28px 0 40px; }

.site-footer { margin-top: 16px; border-top: 1px solid #e8ebef; background: #fff; }
.service-bar, .footer-main, .footer-bottom { width: min(1180px, calc(100% - 40px)); margin: 0 auto; }
.service-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; padding: 24px 0; border-bottom: 1px solid #edf0f3; }
.service-item { display: flex; align-items: center; justify-content: center; gap: 11px; min-width: 0; }
.service-icon { display: grid; width: 38px; height: 38px; flex: 0 0 38px; place-items: center; border-radius: 50%; font-size: 20px; font-weight: 700; }
.service-icon-red { color: #e1251b; background: #fff0ee; }
.service-icon-blue { color: #347ebc; background: #eaf4fc; }
.service-icon-green { color: #318d53; background: #e8f7ed; }
.service-icon-orange { color: #d47b20; background: #fff2e3; }
.service-item strong, .service-item small { display: block; }
.service-item strong { color: #3b444f; font-size: 14px; }
.service-item small { margin-top: 4px; color: #9aa2ac; font-size: 11px; }
.footer-main { display: grid; grid-template-columns: minmax(260px, 1.5fr) repeat(3, minmax(130px, 1fr)); gap: 30px; padding: 34px 0 30px; }
.footer-brand-title { display: inline-flex; align-items: center; gap: 9px; color: #232832; font-size: 18px; font-weight: 800; }
.footer-brand-title .brand-mark { border-radius: 8px; }
.footer-brand p { max-width: 290px; margin: 15px 0 13px; color: #89929d; font-size: 12px; line-height: 1.8; }
.footer-status { color: #77818c; font-size: 11px; }
.footer-status i { display: inline-block; width: 6px; height: 6px; margin-right: 5px; border-radius: 50%; background: #37a862; vertical-align: 1px; }
.footer-column { display: flex; flex-direction: column; align-items: flex-start; gap: 11px; }
.footer-column h2 { margin: 1px 0 5px; color: #303943; font-size: 14px; }
.footer-column a { color: #8a939e; font-size: 12px; transition: color 160ms ease; }
.footer-column a:hover, .footer-column a:focus-visible { color: var(--jd-red); outline: 0; }
.footer-contact strong { color: var(--jd-red); font-family: Arial, sans-serif; font-size: 20px; }
.footer-contact p { margin: -4px 0 1px; color: #9aa2ac; font-size: 11px; }
.footer-contact a { color: #59636f; }
.footer-contact a span { margin-left: 3px; color: var(--jd-red); font-size: 15px; }
.footer-bottom { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 16px 0 22px; border-top: 1px solid #edf0f3; color: #a0a8b2; font-size: 11px; }

.quick-tools { position: fixed; top: 50%; right: max(12px, calc((100vw - 1180px) / 2 - 66px)); z-index: 9; display: flex; width: 48px; flex-direction: column; align-items: center; transform: translateY(-50%); border: 1px solid #e6e9ed; border-radius: 8px; background: rgba(255, 255, 255, .96); box-shadow: 0 8px 22px rgba(31, 41, 55, .1); backdrop-filter: blur(12px); }
.quick-tool { display: grid; width: 46px; height: 48px; place-items: center; border: 0; color: #7d8792; background: transparent; cursor: pointer; transition: color 160ms ease, background-color 160ms ease; }
.quick-tool:first-child { border-radius: 8px 8px 0 0; }
.quick-tool:last-child { border-radius: 0 0 8px 8px; }
.quick-tool:hover, .quick-tool:focus-visible { color: var(--jd-red); background: #fff3f1; outline: 0; }
.quick-tool svg { width: 19px; height: 19px; }
.quick-tool :deep(.el-badge__content) { top: 3px; right: 1px; transform: translateY(-50%) translateX(50%) scale(.82); }
.quick-divider { width: 30px; height: 1px; background: #edf0f3; }
.quick-top { color: #9aa2ac; }

.bottom-nav { display: none; }
.nav-item { display: flex; min-width: 56px; flex-direction: column; align-items: center; justify-content: center; gap: 3px; color: var(--muted); font-size: 12px; font-weight: 600; transition: color 160ms ease, transform 160ms ease; }
.nav-item:hover, .nav-item:focus-visible { color: var(--jd-red); }
.nav-item-active { color: var(--jd-red); }
.nav-item-active .nav-icon { transform: translateY(-1px); }
.nav-icon { font-size: 21px; line-height: 1; transition: transform 160ms ease; }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

@media (max-width: 640px) {
  .topbar-inner, .content-area { width: min(100% - 28px, 1180px); }
  .topbar-inner { grid-template-columns: auto auto; gap: 12px; min-height: 112px; padding: 12px 0; }
  .search-form { grid-column: 1 / -1; grid-row: 2; }
  .desktop-nav { display: none; }
  .login-link { justify-self: end; }
  .user-entry { justify-self: end; }
  .brand-name { font-size: 16px; }
  .content-area { min-height: calc(100vh - 176px); padding-bottom: 112px; }
  .site-footer { margin-top: 4px; padding-bottom: 76px; }
  .service-bar, .footer-main, .footer-bottom { width: min(100% - 28px, 1180px); }
  .service-bar { grid-template-columns: repeat(2, 1fr); gap: 20px 10px; padding: 22px 0; }
  .service-item { justify-content: flex-start; gap: 8px; }
  .service-icon { width: 34px; height: 34px; flex-basis: 34px; font-size: 18px; }
  .service-item strong { font-size: 13px; }
  .service-item small { font-size: 10px; }
  .footer-main { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 22px; padding: 28px 0 24px; }
  .footer-brand { grid-column: 1 / -1; }
  .footer-brand p { max-width: 100%; margin: 12px 0 10px; }
  .footer-contact strong { font-size: 17px; }
  .footer-bottom { align-items: flex-start; flex-direction: column; gap: 6px; padding: 15px 0 20px; }
  .quick-tools { display: none; }
  .bottom-nav { position: fixed; right: 0; bottom: 0; left: 0; z-index: 10; display: flex; justify-content: space-around; gap: 0; min-height: 64px; padding: 7px 20px max(7px, env(safe-area-inset-bottom)); border-top: 1px solid var(--line); background: rgba(255, 255, 255, 0.97); box-shadow: 0 -8px 24px rgba(31, 41, 55, 0.05); backdrop-filter: blur(14px); }
}

@media (prefers-reduced-motion: reduce) {
  .nav-item, .nav-icon { transition: none; }
}
</style>
