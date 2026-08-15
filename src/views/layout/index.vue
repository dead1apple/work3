<script setup>
import { computed, ref } from 'vue'
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

const currentLabel = computed(() => route.meta.title || '商城')
const currentUser = computed(() => userStore.userInfo || {})
const displayName = computed(() => currentUser.value.nickname || currentUser.value.nickName || currentUser.value.username || currentUser.value.userName || '用户')

const handleSearch = () => {
  const value = keyword.value.trim()
  router.push({ path: '/products', query: value ? { keyword: value } : {} })
}
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

        <RouterLink v-if="!userStore.isLoggedIn" class="login-link" to="/login">登录</RouterLink>
        <RouterLink v-else class="user-entry" to="/profile" :aria-label="`进入${displayName}的个人中心`">
          <span class="user-name">{{ displayName }}</span>
        </RouterLink>
      </div>
    </header>

    <main class="content-area" :aria-label="currentLabel">
      <RouterView />
    </main>

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
  grid-template-columns: auto minmax(180px, 1fr) auto;
  align-items: center;
  gap: clamp(16px, 4vw, 56px);
  width: min(1180px, calc(100% - 40px));
  min-height: 72px;
  margin: 0 auto;
}

.brand { display: inline-flex; align-items: center; gap: 9px; font-weight: 800; white-space: nowrap; }
.brand-mark { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; color: #fff; background: var(--jd-red); font-size: 12px; letter-spacing: -1px; }
.brand-name { font-size: 18px; letter-spacing: -0.04em; }

.search-form { display: flex; height: 40px; overflow: hidden; border: 2px solid var(--jd-red); border-radius: 12px; background: #fff; }
.search-form input { min-width: 0; flex: 1; padding: 0 14px; border: 0; outline: 0; color: var(--ink); font: inherit; background: transparent; }
.search-form input::placeholder { color: #a7afb9; }
.search-form button { width: 48px; border: 0; color: #fff; background: var(--jd-red); font-size: 24px; line-height: 1; cursor: pointer; }
.search-form button:hover { background: #c91c14; }
.login-link { color: var(--jd-red); font-size: 14px; font-weight: 700; }
.user-entry { display: inline-flex; align-items: center; min-width: 0; color: var(--ink); font-size: 14px; font-weight: 700; }
.user-entry:hover, .user-entry:focus-visible { color: var(--jd-red); }
.user-name { max-width: 92px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.content-area { width: min(1180px, calc(100% - 40px)); min-height: calc(100vh - 136px); margin: 0 auto; padding: 28px 0 88px; }

.bottom-nav { position: fixed; right: 0; bottom: 0; left: 0; z-index: 10; display: flex; justify-content: center; gap: clamp(16px, 8vw, 120px); min-height: 64px; padding: 7px 20px max(7px, env(safe-area-inset-bottom)); border-top: 1px solid var(--line); background: rgba(255, 255, 255, 0.97); box-shadow: 0 -8px 24px rgba(31, 41, 55, 0.05); backdrop-filter: blur(14px); }
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
  .login-link { justify-self: end; }
  .user-entry { justify-self: end; }
  .brand-name { font-size: 16px; }
  .bottom-nav { justify-content: space-around; gap: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .nav-item, .nav-icon { transition: none; }
}
</style>
