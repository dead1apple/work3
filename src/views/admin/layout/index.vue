<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { logout } from '../../../api/user.js'
import { useUserStore } from '../../../store/user.js'

const router = useRouter()
const userStore = useUserStore()
const displayName = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.username || '管理员')

const signOut = async () => {
  try {
    await logout()
  } catch {
    // Local session must still end when the remote logout request is unavailable.
  } finally {
    userStore.clearSession()
    await router.replace('/login')
  }
}
</script>

<template>
  <div class="console-shell">
    <aside class="console-sidebar" aria-label="管理后台导航">
      <RouterLink class="console-brand" to="/admin" aria-label="管理后台首页">
        <span class="brand-mark">JD</span>
        <span><strong>管理后台</strong><small>ADMINISTRATION</small></span>
      </RouterLink>
      <nav class="console-nav" aria-label="主导航">
        <RouterLink to="/admin" exact-active-class="is-active">后台首页</RouterLink>
      </nav>
      <div class="coming-soon"><span>后续开放</span><p>审核与管理功能将在后续任务中逐步接入。</p></div>
      <RouterLink class="storefront-link" to="/home">← 返回商城</RouterLink>
    </aside>

    <section class="console-workspace">
      <header class="console-header">
        <div><p>控制台</p><strong>管理后台</strong></div>
        <div class="account-area"><span>{{ displayName }}</span><button type="button" @click="signOut">退出登录</button></div>
      </header>
      <main class="console-content"><RouterView /></main>
    </section>
  </div>
</template>

<style scoped>
.console-shell { --console-accent: #d71920; --console-ink: #191c22; display: grid; min-height: 100vh; grid-template-columns: 248px minmax(0, 1fr); color: var(--console-ink); background: #f3f4f6; }
.console-sidebar { display: flex; min-height: 100vh; flex-direction: column; padding: 28px 22px; color: #fff; background: #181b20; }
.console-brand { display: flex; align-items: center; gap: 12px; color: inherit; text-decoration: none; }.brand-mark { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 10px; background: var(--console-accent); font-size: 13px; font-weight: 900; }.console-brand strong,.console-brand small { display: block; }.console-brand strong { font-size: 17px; }.console-brand small { margin-top: 3px; color: #858c97; font-size: 8px; letter-spacing: .13em; }
.console-nav { margin-top: 48px; }.console-nav a { display: block; padding: 13px 14px; border-radius: 8px; color: #b3b8c1; text-decoration: none; }.console-nav a:hover,.console-nav a:focus-visible,.console-nav a.is-active { color: #fff; background: rgba(255,255,255,.09); }.console-nav a:focus-visible,.storefront-link:focus-visible,.account-area button:focus-visible { outline: 3px solid rgba(215,25,32,.4); outline-offset: 3px; }
.coming-soon { margin-top: 20px; padding: 16px 14px; border: 1px solid rgba(255,255,255,.08); border-radius: 9px; color: #8d949f; }.coming-soon span { color: #d4d7dd; font-size: 12px; font-weight: 700; }.coming-soon p { margin: 8px 0 0; font-size: 12px; line-height: 1.7; }.storefront-link { margin-top: auto; padding-top: 30px; color: #c3c7ce; font-size: 13px; text-decoration: none; }.storefront-link:hover { color: #fff; }
.console-workspace { min-width: 0; }.console-header { display: flex; min-height: 76px; align-items: center; justify-content: space-between; padding: 0 34px; border-bottom: 1px solid #e5e7eb; background: #fff; }.console-header p { margin: 0 0 4px; color: #9299a4; font-size: 11px; }.console-header strong { font-size: 17px; }.account-area { display: flex; align-items: center; gap: 18px; }.account-area span { max-width: 180px; overflow: hidden; font-size: 14px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }.account-area button { padding: 7px 0; border: 0; color: #747c87; background: transparent; cursor: pointer; }.account-area button:hover { color: var(--console-accent); }.console-content { padding: 36px; }
@media (max-width: 760px) { .console-shell { grid-template-columns: 1fr; }.console-sidebar { min-height: auto; padding: 20px; }.console-nav { margin-top: 24px; }.coming-soon { display: none; }.storefront-link { margin-top: 20px; padding-top: 0; }.console-header { min-height: 68px; padding: 0 20px; }.console-content { padding: 22px 16px; } }
</style>
