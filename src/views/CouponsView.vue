<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { claimCoupon, getAvailableCoupons, getMyCoupons } from '../api/index.js'
import {
  buildCouponRouteQuery,
  getCouponValueText,
  normalizeCouponList,
  normalizeCouponRouteState,
  runActiveCouponRouteLoad,
  shouldReplaceCouponRoute,
} from '../utils/coupon.js'
import { createLatestRequestGuard } from '../utils/requestState.js'

const route = useRoute()
const router = useRouter()
const activeTab = ref(route.query.tab === 'mine' ? 'mine' : 'available')
const status = ref(['0', '1', '2'].includes(String(route.query.status)) ? String(route.query.status) : '')
const available = ref([])
const mine = ref([])
const availableLoading = ref(true)
const mineLoading = ref(true)
const availableError = ref(false)
const mineError = ref(false)
const claimingId = ref(null)
const claimedIds = ref(new Set())
const couponRequests = createLatestRequestGuard()

const statusOptions = [
  { label: '全部', value: '' },
  { label: '未使用', value: '0' },
  { label: '已使用', value: '1' },
  { label: '已过期', value: '2' },
]

const currentList = computed(() => activeTab.value === 'available' ? available.value : mine.value)
const currentLoading = computed(() => activeTab.value === 'available' ? availableLoading.value : mineLoading.value)
const currentError = computed(() => activeTab.value === 'available' ? availableError.value : mineError.value)

const formatAmount = (value) => {
  const amount = Number(value || 0)
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
}

const thresholdText = (coupon) => coupon.minAmount > 0 ? `满 ${formatAmount(coupon.minAmount)} 元可用` : '无门槛使用'
const periodText = (coupon) => coupon.startTime || coupon.endTime
  ? `${coupon.startTime || '领取后'} 至 ${coupon.endTime || '长期有效'}`
  : '有效期以使用规则为准'

const syncQuery = () => {
  const query = buildCouponRouteQuery(route.query, activeTab.value, status.value)
  if (shouldReplaceCouponRoute(route.query, query)) router.replace({ query })
}

const loadAvailable = async () => {
  const routeSnapshot = route.fullPath
  const request = couponRequests.start(routeSnapshot)
  availableLoading.value = true
  availableError.value = false
  available.value = []
  try {
    const nextList = normalizeCouponList(await getAvailableCoupons(), 'available').list
    request.commit(route.fullPath, () => {
      if (activeTab.value === 'available') available.value = nextList
    })
  } catch (error) {
    request.commit(route.fullPath, () => {
      if (activeTab.value !== 'available') return
      available.value = []
      availableError.value = true
      ElMessage.error(error?.message || '可领取优惠券加载失败')
    })
  } finally {
    request.finish(route.fullPath, () => { if (activeTab.value === 'available') availableLoading.value = false })
  }
}

const loadMine = async ({ silent = false } = {}) => {
  const routeSnapshot = route.fullPath
  const statusSnapshot = status.value
  const request = couponRequests.start(routeSnapshot)
  mineLoading.value = !silent
  mineError.value = false
  mine.value = []
  try {
    const params = statusSnapshot === '' ? undefined : { status: Number(statusSnapshot) }
    const [mineResult, templateResult] = await Promise.all([getMyCoupons(params), getAvailableCoupons()])
    const templates = normalizeCouponList(templateResult, 'available').list
    const nextList = normalizeCouponList(mineResult, 'mine', templates).list
    request.commit(route.fullPath, () => {
      if (activeTab.value === 'mine' && status.value === statusSnapshot) mine.value = nextList
    })
  } catch (error) {
    request.commit(route.fullPath, () => {
      if (activeTab.value !== 'mine' || status.value !== statusSnapshot) return
      mine.value = []
      mineError.value = true
      if (!silent) ElMessage.error(error?.message || '我的优惠券加载失败')
    })
  } finally {
    request.finish(route.fullPath, () => { if (activeTab.value === 'mine' && status.value === statusSnapshot) mineLoading.value = false })
  }
}

const switchTab = (tab) => {
  activeTab.value = tab
  syncQuery()
}

const changeStatus = (value) => {
  status.value = value
  syncQuery()
}

const claim = async (coupon) => {
  if (claimingId.value || claimedIds.value.has(coupon.templateId)) return
  claimingId.value = coupon.templateId
  try {
    await claimCoupon(coupon.templateId)
    claimedIds.value = new Set([...claimedIds.value, coupon.templateId])
    ElMessage.success('优惠券领取成功，可在“我的优惠券”中查看')
  } catch (error) {
    ElMessage.error(error?.message || '领取失败，请稍后重试')
  } finally {
    claimingId.value = null
  }
}

const retryCurrent = () => activeTab.value === 'available' ? loadAvailable() : loadMine()

watch(
  () => [route.query.tab, route.query.status],
  () => {
    const next = normalizeCouponRouteState(route.query)
    activeTab.value = next.tab
    status.value = next.status
    runActiveCouponRouteLoad({
      routeState: next,
      loadAvailable,
      loadMine: () => loadMine(),
    })
  },
  { immediate: true },
)
</script>

<template>
  <main class="coupon-page">
    <section class="coupon-panel" aria-labelledby="coupon-title">
      <header class="page-header">
        <div>
          <p>京东会员专享</p>
          <h1 id="coupon-title">优惠券</h1>
        </div>
        <div class="header-mark" aria-hidden="true"><b>先领券</b><span>再购物</span></div>
      </header>

      <nav class="coupon-tabs" aria-label="优惠券分类">
        <button type="button" :class="{ active: activeTab === 'available' }" :aria-current="activeTab === 'available' ? 'page' : undefined" @click="switchTab('available')">优惠券中心</button>
        <button type="button" :class="{ active: activeTab === 'mine' }" :aria-current="activeTab === 'mine' ? 'page' : undefined" @click="switchTab('mine')">我的优惠券</button>
      </nav>

      <div v-if="activeTab === 'mine'" class="status-filter" aria-label="按状态筛选我的优惠券">
        <button v-for="item in statusOptions" :key="item.value" type="button" :class="{ active: status === item.value }" @click="changeStatus(item.value)">{{ item.label }}</button>
      </div>

      <div v-if="currentLoading" class="coupon-grid skeleton-grid" aria-label="优惠券正在加载">
        <div v-for="index in 6" :key="index" class="coupon-skeleton"><el-skeleton :rows="3" animated /></div>
      </div>

      <div v-else-if="currentError" class="state-area">
        <span class="state-icon error-icon" aria-hidden="true">!</span>
        <h2>优惠券加载失败</h2>
        <p>网络开小差了，请稍后重新加载</p>
        <el-button type="danger" @click="retryCurrent">重新加载</el-button>
      </div>

      <div v-else-if="!currentList.length" class="state-area">
        <span class="state-icon" aria-hidden="true">券</span>
        <h2>{{ activeTab === 'available' ? '暂无可领取优惠券' : '这里还没有优惠券' }}</h2>
        <p>{{ activeTab === 'available' ? '新的优惠活动正在路上，稍后再来看看' : '前往优惠券中心领取，下单时可以抵扣金额' }}</p>
        <el-button v-if="activeTab === 'mine'" type="danger" @click="switchTab('available')">去领券</el-button>
      </div>

      <div v-else class="coupon-grid">
        <article v-for="coupon in currentList" :key="coupon.id" class="coupon-ticket" :class="{ disabled: activeTab === 'mine' && coupon.status !== 0 }">
          <div class="ticket-value">
            <strong>{{ getCouponValueText(coupon) }}</strong>
            <span>{{ thresholdText(coupon) }}</span>
          </div>
          <div class="ticket-detail">
            <div class="ticket-heading">
              <span class="coupon-type">{{ coupon.shopName }}</span>
              <span v-if="activeTab === 'mine'" class="status-label" :class="`status-${coupon.status}`">{{ coupon.statusText }}</span>
            </div>
            <h2>{{ coupon.name }}</h2>
            <p>{{ periodText(coupon) }}</p>
            <button
              v-if="activeTab === 'available'"
              class="claim-button"
              type="button"
              :disabled="claimingId === coupon.templateId || claimedIds.has(coupon.templateId)"
              @click="claim(coupon)"
            >
              <span v-if="claimingId === coupon.templateId">领取中...</span>
              <span v-else-if="claimedIds.has(coupon.templateId)">已领取</span>
              <span v-else>立即领取</span>
            </button>
            <button v-else-if="coupon.status === 0" class="use-button" type="button" @click="router.push('/products')">立即使用</button>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.coupon-page{min-height:calc(100vh - 136px);padding:24px 16px 48px;color:#333;background:#f5f5f5;font-family:'PingFang SC','Microsoft YaHei',Arial,sans-serif}.coupon-panel{width:min(1180px,100%);min-height:620px;margin:0 auto;padding:0 30px 42px;border:1px solid #eee;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.04)}.page-header{display:flex;align-items:center;justify-content:space-between;min-height:112px}.page-header p{margin:0 0 7px;color:#999;font-size:12px}.page-header h1{margin:0;color:#222;font-size:24px;font-weight:600}.header-mark{display:flex;align-items:baseline;gap:9px;color:#e1251b}.header-mark b{font-size:23px}.header-mark span{color:#777;font-size:14px}.coupon-tabs{display:flex;height:52px;border-bottom:2px solid #eee}.coupon-tabs button{position:relative;min-width:138px;padding:0 22px;border:0;color:#666;background:transparent;font:inherit;font-size:15px;cursor:pointer}.coupon-tabs button::after{position:absolute;right:50%;bottom:-2px;left:50%;height:2px;background:#e1251b;content:'';transition:right 180ms ease,left 180ms ease}.coupon-tabs button.active{color:#e1251b;font-weight:600}.coupon-tabs button.active::after{right:18px;left:18px}.coupon-tabs button:focus-visible,.status-filter button:focus-visible,.claim-button:focus-visible,.use-button:focus-visible{outline:2px solid #e1251b;outline-offset:2px}.status-filter{display:flex;gap:8px;padding:22px 0 5px}.status-filter button{min-width:76px;padding:7px 14px;border:1px solid #ddd;border-radius:2px;color:#666;background:#fff;font:inherit;font-size:13px;cursor:pointer}.status-filter button.active{border-color:#e1251b;color:#e1251b;background:#fff5f4}.coupon-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:24px}.coupon-ticket{position:relative;display:grid;grid-template-columns:168px minmax(0,1fr);min-height:158px;overflow:hidden;border:1px solid #f0d2cf;background:#fff}.coupon-ticket::before,.coupon-ticket::after{position:absolute;left:156px;width:20px;height:20px;border:1px solid #f0d2cf;border-radius:50%;background:#fff;content:'';z-index:2}.coupon-ticket::before{top:-11px}.coupon-ticket::after{bottom:-11px}.ticket-value{display:flex;position:relative;flex-direction:column;align-items:center;justify-content:center;padding:20px 10px;color:#fff;background:linear-gradient(135deg,#e1251b,#f45147);text-align:center}.ticket-value::after{position:absolute;top:10px;right:-1px;bottom:10px;border-right:1px dashed rgba(255,255,255,.7);content:''}.ticket-value strong{font-family:Arial,sans-serif;font-size:42px;line-height:1}.ticket-value small{margin-right:2px;font-size:18px}.ticket-value span{margin-top:10px;font-size:12px}.ticket-detail{position:relative;min-width:0;padding:20px 20px 18px}.ticket-heading{display:flex;align-items:center;justify-content:space-between;gap:8px}.coupon-type{display:inline-block;max-width:150px;overflow:hidden;color:#e1251b;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.status-label{padding:3px 7px;border-radius:2px;font-size:11px}.status-0{color:#e1251b;background:#fff0ef}.status-1,.status-2{color:#888;background:#f1f1f1}.ticket-detail h2{margin:13px 0 8px;overflow:hidden;color:#333;font-size:16px;font-weight:600;text-overflow:ellipsis;white-space:nowrap}.ticket-detail p{margin:0;padding-right:88px;color:#999;font-size:11px}.claim-button,.use-button{position:absolute;right:18px;bottom:16px;min-width:76px;padding:7px 12px;border:1px solid #e1251b;border-radius:2px;color:#e1251b;background:#fff;font:inherit;font-size:12px;cursor:pointer}.claim-button:hover,.use-button:hover{color:#fff;background:#e1251b}.claim-button:disabled{border-color:#ccc;color:#aaa;background:#f5f5f5;cursor:not-allowed}.coupon-ticket.disabled{border-color:#e5e5e5;filter:grayscale(.45)}.coupon-ticket.disabled .ticket-value{background:#aaa}.coupon-ticket.disabled::before,.coupon-ticket.disabled::after{border-color:#e5e5e5}.skeleton-grid{margin-top:24px}.coupon-skeleton{min-height:158px;padding:28px;border:1px solid #eee}.state-area{display:flex;min-height:390px;flex-direction:column;align-items:center;justify-content:center;text-align:center}.state-icon{display:grid;width:68px;height:68px;place-items:center;border-radius:50%;color:#e1251b;background:#fff1f0;font-size:24px;font-weight:700}.error-icon{font-family:Arial,sans-serif;font-size:31px}.state-area h2{margin:18px 0 8px;font-size:18px}.state-area p{margin:0 0 22px;color:#999;font-size:13px}.state-area .el-button{min-width:110px;border-radius:2px}
@media(max-width:850px){.coupon-grid{grid-template-columns:1fr}.coupon-ticket{grid-template-columns:156px minmax(0,1fr)}.coupon-ticket::before,.coupon-ticket::after{left:144px}}
@media(max-width:560px){.coupon-page{padding:10px 8px 28px}.coupon-panel{padding:0 12px 28px}.page-header{min-height:88px}.header-mark{display:none}.coupon-tabs button{min-width:0;flex:1;padding:0 8px}.status-filter{overflow-x:auto;padding-top:16px}.status-filter button{min-width:68px}.coupon-grid{gap:12px;margin-top:16px}.coupon-ticket{grid-template-columns:118px minmax(0,1fr);min-height:144px}.coupon-ticket::before,.coupon-ticket::after{left:106px}.ticket-value strong{font-size:32px}.ticket-value small{font-size:15px}.ticket-value span{font-size:10px}.ticket-detail{padding:16px 12px}.ticket-detail h2{margin-top:11px;font-size:14px}.ticket-detail p{padding-right:0;line-height:1.5}.claim-button,.use-button{right:12px;bottom:12px}.coupon-type{max-width:105px}}
</style>
