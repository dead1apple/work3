<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElDrawer, ElIcon, ElMessage } from 'element-plus'
import { Fold, HomeFilled, SwitchButton } from '@element-plus/icons-vue'
import { useSessionStore } from '../store/session'
import { useShopStore } from '../store/shop'

const router = useRouter()
const session = useSessionStore()
const shop = useShopStore()
const mobileNavigationOpen = ref(false)
const signingOut = ref(false)
const shopLabel = computed(() => {
  if (shop.status === 'ready') return shop.shop.shopName
  if (shop.status === 'empty') return '尚未建立店铺'
  if (shop.status === 'error') return '店铺信息加载失败'
  return '店铺信息加载中'
})

async function signOut() {
  if (signingOut.value) return
  signingOut.value = true

  try {
    await session.signOut()
  } catch {
    ElMessage.warning('服务端退出未完成，本地会话已清理')
  } finally {
    shop.reset()
    signingOut.value = false
    await router.replace({ name: 'login' })
  }
}
</script>

<template>
  <div class="merchant-shell">
    <aside class="merchant-sidebar">
      <RouterLink class="sidebar-brand" :to="{ name: 'merchant-home' }">
        <span class="sidebar-brand__mark" aria-hidden="true">M</span>
        <span>
          <strong>商家工作台</strong>
          <small>MERCHANT DESK</small>
        </span>
      </RouterLink>

      <nav class="merchant-navigation" aria-label="商家后台导航">
        <RouterLink class="navigation-item" :to="{ name: 'merchant-home' }">
          <el-icon aria-hidden="true"><HomeFilled /></el-icon>
          <span>首页</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <span class="sidebar-footer__label">当前工作区</span>
        <strong>经营概览</strong>
        <small>更多功能将在后续阶段开放</small>
      </div>
    </aside>

    <div class="merchant-workspace">
      <header class="merchant-topbar">
        <button
          class="mobile-menu-button"
          type="button"
          aria-label="打开导航"
          :aria-expanded="mobileNavigationOpen"
          @click="mobileNavigationOpen = true"
        >
          <el-icon><Fold /></el-icon>
        </button>

        <div class="topbar-context">
          <span>商家中心</span>
          <strong>首页</strong>
        </div>

        <div class="topbar-actions">
          <el-button data-testid="shop-entry" plain disabled>{{ shopLabel }}</el-button>
          <a class="mall-link" href="/" target="_self">返回用户商城</a>
          <div class="merchant-identity" data-testid="merchant-identity">
            <span class="merchant-avatar" aria-hidden="true">
              {{ session.displayName.slice(0, 1) }}
            </span>
            <span class="merchant-identity__copy">
              <small>当前商家</small>
              <strong>{{ session.displayName }}</strong>
            </span>
          </div>
          <el-button
            data-testid="logout-button"
            text
            :loading="signingOut"
            :icon="SwitchButton"
            @click="signOut"
          >
            退出登录
          </el-button>
        </div>
      </header>

      <main class="merchant-content">
        <RouterView />
      </main>
    </div>

    <el-drawer
      v-model="mobileNavigationOpen"
      class="mobile-navigation-drawer"
      direction="ltr"
      size="280px"
      title="商家工作台"
    >
      <nav aria-label="移动端商家后台导航">
        <RouterLink
          class="navigation-item navigation-item--mobile"
          :to="{ name: 'merchant-home' }"
          @click="mobileNavigationOpen = false"
        >
          <el-icon aria-hidden="true"><HomeFilled /></el-icon>
          <span>首页</span>
        </RouterLink>
      </nav>
    </el-drawer>
  </div>
</template>

<style scoped>
.merchant-shell {
  min-height: 100vh;
  background: var(--color-canvas);
}

.merchant-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 20;
  display: flex;
  width: 244px;
  flex-direction: column;
  padding: var(--space-6) var(--space-4);
  color: #edf7f4;
  background: var(--color-sidebar);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-2);
  color: inherit;
  text-decoration: none;
}

.sidebar-brand__mark {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 12px;
  color: #75e1cb;
  font-family: Georgia, serif;
  font-size: 23px;
}

.sidebar-brand strong,
.sidebar-brand small {
  display: block;
}

.sidebar-brand strong {
  font-size: 15px;
}

.sidebar-brand small {
  margin-top: 3px;
  color: var(--color-sidebar-muted);
  font-size: 9px;
  letter-spacing: 0.15em;
}

.merchant-navigation {
  margin-top: 54px;
}

.navigation-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 46px;
  padding: 0 var(--space-4);
  border-radius: 10px;
  color: var(--color-sidebar-muted);
  font-size: 14px;
  font-weight: 650;
  text-decoration: none;
}

.navigation-item.router-link-exact-active {
  color: #effbf8;
  background: rgba(76, 198, 174, 0.15);
  box-shadow: inset 3px 0 #50cdb4;
}

.sidebar-footer {
  display: grid;
  gap: var(--space-2);
  margin-top: auto;
  padding: var(--space-4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-medium);
  background: rgba(255, 255, 255, 0.04);
}

.sidebar-footer__label,
.sidebar-footer small {
  color: var(--color-sidebar-muted);
  font-size: 11px;
}

.sidebar-footer strong {
  font-size: 14px;
}

.merchant-workspace {
  min-height: 100vh;
  margin-left: 244px;
}

.merchant-topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  min-height: 76px;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5);
  padding: 0 clamp(20px, 3vw, 42px);
  border-bottom: 1px solid var(--color-line);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
}

.topbar-context span,
.topbar-context strong {
  display: block;
}

.topbar-context span {
  margin-bottom: 3px;
  color: var(--color-muted);
  font-size: 11px;
  letter-spacing: 0.08em;
}

.topbar-context strong {
  font-size: 17px;
}

.topbar-actions,
.merchant-identity {
  display: flex;
  align-items: center;
}

.topbar-actions {
  gap: var(--space-4);
}

.mall-link {
  color: #3e514d;
  font-size: 13px;
  font-weight: 650;
  text-decoration: none;
}

.mall-link:hover {
  color: var(--color-accent);
}

.merchant-identity {
  gap: var(--space-2);
  padding-left: var(--space-4);
  border-left: 1px solid var(--color-line);
}

.merchant-avatar {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 50%;
  color: #075c4e;
  background: var(--color-accent-soft);
  font-weight: 750;
}

.merchant-identity__copy small,
.merchant-identity__copy strong {
  display: block;
}

.merchant-identity__copy small {
  color: var(--color-muted);
  font-size: 10px;
}

.merchant-identity__copy strong {
  max-width: 128px;
  margin-top: 2px;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.merchant-content {
  padding: clamp(24px, 4vw, 48px);
}

.mobile-menu-button {
  display: none;
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-small);
  color: var(--color-ink);
  background: var(--color-surface);
  cursor: pointer;
}

.navigation-item--mobile {
  color: var(--color-ink);
}

@media (max-width: 1080px) {
  .topbar-actions > .el-button:first-child,
  .mall-link,
  .merchant-identity__copy small {
    display: none;
  }
}

@media (max-width: 760px) {
  .merchant-sidebar {
    display: none;
  }

  .merchant-workspace {
    margin-left: 0;
  }

  .merchant-topbar {
    min-height: 68px;
  }

  .mobile-menu-button {
    display: inline-grid;
    place-items: center;
  }

  .topbar-context {
    margin-right: auto;
  }

  .merchant-identity {
    padding-left: 0;
    border-left: 0;
  }

  .merchant-identity__copy,
  .topbar-actions [data-testid="logout-button"] span {
    display: none;
  }

  .merchant-content {
    padding: var(--space-6) var(--space-4);
  }
}
</style>
