<template>
  <main class="profile-page">
    <el-skeleton v-if="loading" :rows="8" animated class="profile-skeleton" />

    <template v-else>
      <section class="profile-header">
        <div class="profile-identity">
          <el-avatar :size="72" class="profile-avatar" :src="user.avatar">
            {{ avatarText }}
          </el-avatar>
          <div class="profile-copy">
            <h1>你好，{{ user.nickname }}</h1>
            <p class="profile-account">{{ maskedAccount }}</p>
          </div>
        </div>
        <el-tag class="member-label" effect="dark">PLUS会员</el-tag>
      </section>

      <el-card class="order-card" shadow="never">
        <div class="section-heading">
          <h2>我的订单</h2>
          <button class="view-all" type="button" @click="router.push('/orders')">
            查看全部 <span aria-hidden="true">›</span>
          </button>
        </div>
        <el-row :gutter="8" class="order-grid">
          <el-col v-for="item in orderItems" :key="item.label" :span="6">
            <button class="order-item" type="button" @click="router.push({ path: '/orders', query: { status: item.status } })">
              <el-badge :value="item.count" :hidden="item.count === 0" class="order-badge">
                <el-icon :size="24" class="order-icon"><component :is="item.icon" /></el-icon>
              </el-badge>
              <span>{{ item.label }}</span>
            </button>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="menu-card" shadow="never">
        <button
          v-for="item in menuItems"
          :key="item.label"
          class="menu-item"
          type="button"
          @click="router.push(item.path)"
        >
          <span class="menu-leading">
            <el-icon :size="19"><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </span>
          <span class="menu-arrow" aria-hidden="true">›</span>
        </button>
      </el-card>

      <el-button class="logout-button" type="danger" size="large" @click="handleLogout">
        退出登录
      </el-button>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElAvatar, ElIcon, ElMessage, ElMessageBox, ElTag } from 'element-plus'
import {
  ChatDotRound,
  CircleCheck,
  Clock,
  Location,
  Setting,
  ShoppingBag,
  Star,
  Ticket,
  Van,
} from '@element-plus/icons-vue'
import { getUserInfo, logout } from '../api/index.js'
import { useCartStore } from '../store/cart.js'
import { useUserStore } from '../store/user.js'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const loading = ref(true)

const fallbackUser = {
  nickname: '用户昵称',
  username: 'testuser',
  phone: '',
  userId: '',
  avatar: '',
}

const user = ref({ ...fallbackUser })

const orderItems = [
  { label: '待付款', count: 0, icon: Clock, status: '1' },
  { label: '待发货', count: 0, icon: Van, status: '2' },
  { label: '待收货', count: 0, icon: CircleCheck, status: '3' },
  { label: '待评价', count: 0, icon: ChatDotRound, status: '4' },
]

const menuItems = [
  { label: '我的订单', path: '/orders', icon: ShoppingBag },
  { label: '我的收藏', path: '/favorites', icon: Star },
  { label: '收货地址', path: '/address', icon: Location },
  { label: '优惠券', path: '/coupons', icon: Ticket },
  { label: '编辑资料', path: '/profile/edit', icon: Setting },
]

const avatarText = computed(() => (user.value.nickname || '用户').trim().slice(0, 1).toUpperCase())

const maskedAccount = computed(() => {
  const phone = String(user.value.phone || '')
  if (/^\d{11}$/.test(phone)) return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  return user.value.userId ? `用户ID：${user.value.userId}` : '欢迎使用京东商城'
})

function normalizeUser(payload) {
  const source = payload?.user || payload?.data?.user || payload?.data || payload || {}
  return {
    ...fallbackUser,
    ...source,
    nickname: source.nickname || source.nickName || source.username || source.userName || fallbackUser.nickname,
    username: source.username || source.userName || fallbackUser.username,
    phone: source.phone || source.mobile || '',
    userId: source.userId || source.id || '',
    avatar: source.avatar || source.avatarUrl || '',
  }
}

async function loadUserInfo() {
  loading.value = true
  try {
    const response = await getUserInfo()
    user.value = normalizeUser(response)
    userStore.setUserInfo(user.value)
  } catch (error) {
    user.value = normalizeUser(userStore.userInfo || fallbackUser)
    ElMessage.error(error?.message || '用户信息加载失败，已显示占位信息')
  } finally {
    loading.value = false
  }
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出当前账号吗？', '退出登录', {
      type: 'warning',
      confirmButtonText: '确认退出',
      cancelButtonText: '暂不退出',
      center: true,
    })
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error('无法确认退出操作')
    return
  }

  let serverLogoutSucceeded = true
  try {
    await logout()
  } catch {
    serverLogoutSucceeded = false
  }

  try {
    cartStore.clearCart()
    userStore.clearSession()
    if (serverLogoutSucceeded) ElMessage.success('已安全退出登录')
    else ElMessage.warning('本地账号已退出，服务器会话暂未同步注销')
    await router.replace({ name: 'login' })
  } catch {
    ElMessage.error('本地登录状态清理失败，请刷新页面重试')
  }
}

onMounted(loadUserInfo)
</script>

<style scoped>
.profile-page {
  width: 100%;
  min-height: calc(100vh - 136px);
  margin: 0 auto;
  padding: 0 16px 28px;
  color: #1f2937;
  background: #f5f5f5;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: 1px;
}

.profile-skeleton { padding: 28px 8px; }

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 180px;
  padding: 32px 30px;
  overflow: hidden;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(135deg, #e02d2d 0%, #eb4545 56%, #f56c6c 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, .06), 0 14px 28px rgba(224, 45, 45, .14);
}

.profile-identity { display: flex; align-items: center; gap: 18px; }
.profile-avatar { flex: none; border: 3px solid rgba(255, 255, 255, .82); background: rgba(255, 255, 255, .22); font-size: 28px; font-weight: 700; }
.profile-copy p, .profile-copy h1 { margin: 0; }
.profile-copy h1 { margin: 0 0 10px; font-size: 24px; font-weight: 700; letter-spacing: 1px; }
.profile-account { font-size: 13px; opacity: .9; }
.member-label { align-self: flex-start; --el-tag-bg-color: #f7c948; --el-tag-border-color: #f7c948; --el-tag-text-color: #7a4d00; padding: 1px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: 1px; }

.order-card, .menu-card { margin-top: 14px; border: 0; border-radius: 12px; background: #fff; box-shadow: 0 2px 8px rgba(0, 0, 0, .06); }
.section-heading { display: flex; align-items: center; justify-content: space-between; padding-bottom: 9px; border-bottom: 1px solid #f4f5f7; }
.section-heading h2 { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: 1px; }
.view-all, .order-item, .menu-item { border: 0; background: transparent; cursor: pointer; font: inherit; }
.view-all { color: #909399; font-size: 13px; letter-spacing: 1px; }
.view-all span, .menu-arrow { margin-left: 5px; color: #aeb4be; font-size: 23px; vertical-align: -2px; }
.order-grid { padding-top: 12px; }
.order-item { display: flex; flex-direction: column; align-items: center; gap: 9px; width: 100%; padding: 10px 0 8px; color: #333; font-size: 14px; letter-spacing: 1px; }
.order-item:hover, .menu-item:hover { color: #e1251b; }
.order-item:focus-visible, .menu-item:focus-visible, .view-all:focus-visible { outline: 2px solid #e1251b; outline-offset: 3px; border-radius: 6px; }
.order-badge { height: 27px; }
.order-icon { color: #666; }

.menu-card { padding: 0 16px; }
.menu-item { display: flex; align-items: center; justify-content: space-between; width: 100%; height: 56px; padding: 0; border-bottom: 1px solid #f0f0f0; color: #333; text-align: left; transition: background-color 160ms ease, color 160ms ease; }
.menu-item:last-child { border-bottom: 0; }
.menu-leading { display: flex; align-items: center; gap: 12px; }
.menu-leading .el-icon { color: #e1251b; }
.menu-arrow { margin: 0; }
.logout-button { display: block; width: 100%; height: 48px; margin: 20px auto; border-radius: 8px; letter-spacing: 1px; }

@media (max-width: 600px) {
  .profile-page { padding-top: 0; }
  .profile-header { min-height: 180px; padding: 28px 20px; border-radius: 12px; }
  .profile-copy h1 { font-size: 22px; }
  .member-label { align-self: center; }
}
</style>
