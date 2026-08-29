<template>
  <main class="profile-page">
    <el-skeleton v-if="loading" class="profile-skeleton" animated>
      <template #template>
        <div class="skeleton-header">
          <el-skeleton-item variant="circle" style="width: 84px; height: 84px" />
          <div class="skeleton-lines">
            <el-skeleton-item variant="h1" style="width: 42%; height: 24px" />
            <el-skeleton-item variant="text" style="width: 58%" />
            <el-skeleton-item variant="text" style="width: 46%" />
          </div>
        </div>
        <el-skeleton-item variant="rect" style="display: block; height: 92px; margin-top: 16px; border-radius: 16px" />
        <el-skeleton-item variant="rect" style="display: block; height: 190px; margin-top: 16px; border-radius: 16px" />
        <el-skeleton-item variant="rect" style="display: block; height: 160px; margin-top: 16px; border-radius: 16px" />
      </template>
    </el-skeleton>

    <template v-else>
      <section class="profile-header">
        <div class="profile-identity">
          <el-avatar :size="84" class="profile-avatar" :src="user.avatar">
            {{ avatarText }}
          </el-avatar>
          <div class="profile-copy">
            <div class="profile-name-row">
              <h1>你好，{{ user.nickname }}</h1>
              <span class="role-badge">{{ roleLabel }}</span>
            </div>
            <p class="profile-account">{{ maskedAccount }}</p>
            <p v-if="profileMetaText" class="profile-meta">{{ profileMetaText }}</p>
          </div>
        </div>
        <p v-if="lastLoginText" class="profile-login-time">最近登录 {{ lastLoginText }}</p>
      </section>

      <el-card class="asset-card" shadow="never">
        <div class="asset-grid">
          <button
            v-for="item in assetItems"
            :key="item.label"
            class="asset-item"
            type="button"
            @click="router.push(item.path)"
          >
            <strong class="asset-value">{{ item.count }}</strong>
            <span class="asset-label">{{ item.label }}</span>
          </button>
        </div>
      </el-card>

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
        <div v-if="recentOrders.length" class="recent-orders">
          <button
            v-for="order in recentOrders"
            :key="order.orderNo"
            class="recent-order"
            type="button"
            @click="router.push(`/orders/${order.orderNo}`)"
          >
            <span class="recent-main">
              <span class="recent-name">{{ recentOrderName(order) }}</span>
              <span class="recent-no">订单号 {{ order.orderNo }}</span>
            </span>
            <span class="recent-side">
              <strong class="recent-amount">￥{{ order.payAmount }}</strong>
              <el-tag size="small" :type="order.statusMeta.tone" effect="light">{{ order.statusMeta.text }}</el-tag>
            </span>
          </button>
        </div>
        <div v-else class="order-empty">
          <p>还没有订单，先去逛逛吧～</p>
          <el-button link type="primary" @click="router.push('/')">去逛逛</el-button>
        </div>
      </el-card>

      <el-card class="menu-card" shadow="never">
        <template v-for="item in menuItems" :key="item.label">
          <a v-if="item.href" class="menu-item" :href="item.href">
            <span class="menu-leading">
              <span class="menu-icon"><el-icon :size="17"><component :is="item.icon" /></el-icon></span>
              <span>{{ item.label }}</span>
            </span>
            <span class="menu-arrow" aria-hidden="true">›</span>
          </a>
          <button v-else class="menu-item" type="button" @click="router.push(item.path)">
            <span class="menu-leading">
              <span class="menu-icon"><el-icon :size="17"><component :is="item.icon" /></el-icon></span>
              <span>{{ item.label }}</span>
            </span>
            <span class="menu-arrow" aria-hidden="true">›</span>
          </button>
        </template>
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
  Shop,
  ShoppingBag,
  Star,
  Ticket,
  Van,
} from '@element-plus/icons-vue'
import { getAddressList, getFavorites, getMyCoupons, getOrders, getUserInfo, logout } from '../api/index.js'
import { useCartStore } from '../store/cart.js'
import { useUserStore } from '../store/user.js'
import { getMerchantProfileEntry } from '../utils/merchantShop.js'
import { normalizeUserProfile } from '../utils/profile.js'
import { normalizeOrderList } from '../utils/order.js'
import { readPayloadList, unwrapData } from '../utils/response.js'

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
  email: '',
  gender: 0,
  birthday: '',
}

const user = ref({ ...fallbackUser })
const lastLoginTime = ref('')

const orderCounts = ref({ 0: 0, 1: 0, 2: 0, 3: 0 })
const assetCounts = ref({ coupons: 0, favorites: 0, addresses: 0 })
const recentOrders = ref([])

const orderItems = computed(() => [
  { label: '待付款', icon: Clock, status: '0', count: orderCounts.value[0] },
  { label: '待发货', icon: Van, status: '1', count: orderCounts.value[1] },
  { label: '待收货', icon: CircleCheck, status: '2', count: orderCounts.value[2] },
  { label: '待评价', icon: ChatDotRound, status: '3', count: orderCounts.value[3] },
])

const assetItems = computed(() => [
  { label: '优惠券', count: assetCounts.value.coupons, path: '/coupons' },
  { label: '我的收藏', count: assetCounts.value.favorites, path: '/favorites' },
  { label: '收货地址', count: assetCounts.value.addresses, path: '/address' },
])

const baseMenuItems = [
  { label: '我的订单', path: '/orders', icon: ShoppingBag },
  { label: '我的收藏', path: '/favorites', icon: Star },
  { label: '收货地址', path: '/address', icon: Location },
  { label: '优惠券', path: '/coupons', icon: Ticket },
  { label: '编辑资料', path: '/profile/edit', icon: Setting },
]

const menuItems = computed(() => {
  const entry = getMerchantProfileEntry(userStore.role)
  return entry ? [...baseMenuItems, { ...entry, icon: Shop }] : baseMenuItems
})

const ROLE_LABELS = { 0: '普通会员', 1: '商家', 2: '管理员' }
const roleLabel = computed(() => ROLE_LABELS[userStore.role] || '普通会员')

const GENDER_LABELS = { 1: '男', 2: '女' }

const avatarText = computed(() => (user.value.nickname || '用户').trim().slice(0, 1).toUpperCase())

const maskedAccount = computed(() => {
  const phone = String(user.value.phone || '')
  if (/^\d{11}$/.test(phone)) return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  return user.value.userId ? `用户ID：${user.value.userId}` : '欢迎使用京东商城'
})

const profileMetaText = computed(() => {
  const parts = []
  if (GENDER_LABELS[user.value.gender]) parts.push(GENDER_LABELS[user.value.gender])
  if (user.value.birthday) parts.push(`生日 ${user.value.birthday}`)
  if (user.value.email) parts.push(user.value.email)
  return parts.join(' · ')
})

const lastLoginText = computed(() => {
  const time = String(lastLoginTime.value || '').replace('T', ' ')
  return /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?/.test(time) ? time.slice(0, 16) : ''
})

function recentOrderName(order) {
  const firstName = order.items?.[0]?.name
  if (!firstName) return '点击查看订单详情'
  const extra = order.items.length - 1
  return extra > 0 ? `${firstName} 等${order.items.length}件商品` : firstName
}

async function loadUserInfo() {
  loading.value = true
  try {
    const response = await getUserInfo()
    user.value = { ...fallbackUser, ...normalizeUserProfile(response) }
    lastLoginTime.value = unwrapData(response)?.lastLoginTime || ''
    userStore.setUserInfo(user.value)
  } catch (error) {
    user.value = { ...fallbackUser, ...normalizeUserProfile(userStore.userInfo || fallbackUser) }
    ElMessage.error(error?.message || '用户信息加载失败，已显示占位信息')
  } finally {
    loading.value = false
  }
}

async function loadOrderStats() {
  const statuses = [0, 1, 2, 3]
  const [countResult, recentResult] = await Promise.allSettled([
    Promise.all(
      statuses.map((status) =>
        getOrders({ status, page: 1, size: 1 })
          .then((payload) => normalizeOrderList(payload).total)
          .catch(() => 0),
      ),
    ),
    getOrders({ page: 1, size: 2 }),
  ])

  if (countResult.status === 'fulfilled') {
    statuses.forEach((status, index) => {
      orderCounts.value[status] = countResult.value[index]
    })
  }
  if (recentResult.status === 'fulfilled') {
    recentOrders.value = normalizeOrderList(recentResult.value).list.slice(0, 2)
  }
}

async function loadAssetCounts() {
  const [coupons, favorites, addresses] = await Promise.allSettled([
    getMyCoupons({ status: 0 }),
    getFavorites(),
    getAddressList(),
  ])
  assetCounts.value = {
    coupons: coupons.status === 'fulfilled' ? readPayloadList(coupons.value).length : 0,
    favorites: favorites.status === 'fulfilled' ? readPayloadList(favorites.value).length : 0,
    addresses: addresses.status === 'fulfilled' ? readPayloadList(addresses.value).length : 0,
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

onMounted(async () => {
  await loadUserInfo()
  loadOrderStats()
  loadAssetCounts()
})
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
.skeleton-header { display: flex; align-items: center; gap: 20px; padding: 30px 26px; }
.skeleton-lines { display: flex; flex: 1; flex-direction: column; gap: 12px; }

.profile-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 180px;
  padding: 32px 30px;
  overflow: hidden;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #e02d2d 0%, #eb4545 56%, #f56c6c 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, .06), 0 14px 28px rgba(224, 45, 45, .14);
}

.profile-header::before,
.profile-header::after {
  position: absolute;
  content: '';
  border-radius: 50%;
  background: rgba(255, 255, 255, .12);
  pointer-events: none;
}
.profile-header::before { top: -70px; right: -40px; width: 220px; height: 220px; }
.profile-header::after { bottom: -90px; left: 24%; width: 180px; height: 180px; background: rgba(255, 255, 255, .08); }

.profile-identity { position: relative; display: flex; align-items: center; gap: 20px; }
.profile-avatar {
  flex: none;
  border: 3px solid rgba(255, 255, 255, .82);
  background: rgba(255, 255, 255, .22);
  font-size: 30px;
  font-weight: 700;
  box-shadow: 0 0 0 5px rgba(255, 255, 255, .16);
}
.profile-copy p, .profile-copy h1 { margin: 0; }
.profile-name-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.profile-copy h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px; }
.role-badge {
  padding: 3px 12px;
  border-radius: 999px;
  color: #7a4d00;
  background: linear-gradient(135deg, #ffe9b0, #f7c948);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
}
.profile-account { margin-top: 10px !important; font-size: 13px; opacity: .92; }
.profile-meta { margin-top: 6px !important; font-size: 12px; opacity: .82; }
.profile-login-time { position: absolute; right: 30px; bottom: 18px; margin: 0; font-size: 12px; opacity: .78; }

.asset-card, .order-card, .menu-card { margin-top: 16px; border: 0; border-radius: 16px; background: #fff; box-shadow: 0 2px 8px rgba(0, 0, 0, .06); }

.asset-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
.asset-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  transition: transform 160ms ease;
}
.asset-item:hover { transform: translateY(-2px); }
.asset-item:hover .asset-value { color: #e1251b; }
.asset-item:focus-visible { outline: 2px solid #e1251b; outline-offset: 3px; border-radius: 8px; }
.asset-value { font-size: 22px; font-weight: 700; color: #1f2329; transition: color 160ms ease; }
.asset-label { font-size: 12px; color: #8c9099; }

.section-heading { display: flex; align-items: center; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid #f4f5f7; }
.section-heading h2 { position: relative; margin: 0; padding-left: 12px; font-size: 17px; font-weight: 700; letter-spacing: 1px; }
.section-heading h2::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 4px;
  height: 15px;
  content: '';
  border-radius: 2px;
  background: #e1251b;
  transform: translateY(-50%);
}
.view-all, .order-item, .menu-item { border: 0; background: transparent; cursor: pointer; font: inherit; }
.view-all { color: #909399; font-size: 13px; letter-spacing: 1px; }
.view-all span, .menu-arrow { margin-left: 5px; color: #aeb4be; font-size: 23px; vertical-align: -2px; }
.order-grid { padding-top: 12px; }
.order-item { display: flex; flex-direction: column; align-items: center; gap: 9px; width: 100%; padding: 10px 0 8px; color: #333; font-size: 14px; letter-spacing: 1px; transition: transform 160ms ease; }
.order-item:hover { color: #e1251b; transform: translateY(-2px); }
.order-item:focus-visible, .menu-item:focus-visible, .view-all:focus-visible { outline: 2px solid #e1251b; outline-offset: 3px; border-radius: 6px; }
.order-badge { height: 27px; }
.order-icon { color: #666; }

.recent-orders { margin-top: 6px; border-top: 1px dashed #f0f0f0; }
.recent-order {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
  padding: 12px 4px;
  border: 0;
  border-bottom: 1px solid #f4f5f7;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: background-color 160ms ease;
}
.recent-order:last-child { border-bottom: 0; }
.recent-order:hover { background: #fafafa; }
.recent-order:focus-visible { outline: 2px solid #e1251b; outline-offset: -2px; border-radius: 8px; }
.recent-main { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.recent-name { overflow: hidden; color: #333; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.recent-no { color: #aeb4be; font-size: 12px; }
.recent-side { display: flex; flex: none; align-items: center; gap: 10px; }
.recent-amount { color: #1f2329; font-size: 15px; font-weight: 700; }

.order-empty { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 18px 0 8px; }
.order-empty p { margin: 0; color: #aeb4be; font-size: 13px; }

.menu-card { padding: 4px 16px; }
.menu-item { display: flex; box-sizing: border-box; align-items: center; justify-content: space-between; width: 100%; height: 58px; padding: 0; border-bottom: 1px solid #f0f0f0; color: #333; text-align: left; text-decoration: none; transition: background-color 160ms ease, color 160ms ease; }
.menu-item:last-child { border-bottom: 0; }
.menu-item:hover { background: #fafafa; color: #e1251b; }
.menu-leading { display: flex; align-items: center; gap: 12px; }
.menu-icon { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 50%; color: #e1251b; background: #fdecea; }
.menu-arrow { margin: 0; }
.logout-button { display: block; width: 100%; height: 48px; margin: 20px auto; border-radius: 8px; letter-spacing: 1px; }

@media (max-width: 600px) {
  .profile-page { padding-top: 0; }
  .profile-header { flex-direction: column; align-items: flex-start; gap: 16px; min-height: 180px; padding: 28px 20px; border-radius: 16px; }
  .profile-copy h1 { font-size: 22px; }
  .profile-login-time { position: static; }
}
</style>
