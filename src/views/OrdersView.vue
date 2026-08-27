<template>
  <main class="orders-page">
    <header class="orders-heading">
      <div><p>ORDER CENTER</p><h1>我的订单</h1></div>
      <button type="button" class="continue-shopping" @click="router.push('/products')">继续购物</button>
    </header>

    <section class="orders-panel">
      <nav class="status-tabs" aria-label="订单状态筛选">
        <button v-for="tab in statusTabs" :key="tab.value" type="button" :class="['status-tab', { active: status === tab.value }]" @click="changeStatus(tab.value)">
          {{ tab.label }}
        </button>
      </nav>

      <div v-if="loading" class="loading-list"><el-skeleton v-for="index in 3" :key="index" :rows="4" animated /></div>
      <el-result v-else-if="loadError" icon="error" title="订单加载失败" :sub-title="loadError">
        <template #extra><el-button type="primary" @click="loadOrders">重新加载</el-button></template>
      </el-result>
      <el-empty v-else-if="!orders.length" description="这里还没有相关订单">
        <el-button type="primary" @click="router.push('/products')">去逛逛</el-button>
      </el-empty>

      <div v-else class="order-list">
        <article v-for="order in orders" :key="order.orderNo" class="order-card">
          <header class="order-card-head">
            <div class="order-identify"><span>{{ order.createTime || '下单时间暂未提供' }}</span><span>订单号：{{ order.orderNo }}</span></div>
            <strong :class="['status-text', `is-${order.statusMeta.tone}`]">{{ order.statusText }}</strong>
          </header>

          <div class="order-card-body">
            <div class="product-list">
              <button v-for="(item, index) in order.items.slice(0, 2)" :key="item.id || `${order.orderNo}-${index}`" type="button" class="product-row" @click="openDetail(order.orderNo)">
                <div class="product-image"><img v-if="item.image" :src="item.image" :alt="item.name" /><el-icon v-else><Picture /></el-icon></div>
                <div class="product-info"><strong>{{ item.name }}</strong><span v-if="item.spec">{{ item.spec }}</span></div>
                <span class="unit-price">¥{{ formatMoney(item.price) }}</span><span class="quantity">×{{ item.quantity }}</span>
              </button>
              <button v-if="!order.items.length" type="button" class="missing-products" @click="openDetail(order.orderNo)">商品信息请前往订单详情查看</button>
              <p v-if="order.items.length > 2" class="more-products">另有 {{ order.items.length - 2 }} 件商品</p>
            </div>
            <aside class="order-summary"><p>实付款</p><strong>¥{{ formatMoney(order.payAmount) }}</strong><span>含运费 ¥{{ formatMoney(order.freightAmount) }}</span></aside>
            <div class="order-actions">
              <el-button v-for="action in getOrderActions(order.status)" :key="action" :class="getOrderActionPresentation(action).className" :type="getOrderActionPresentation(action).type" :plain="getOrderActionPresentation(action).plain" :loading="operatingKey === `${order.orderNo}:${action}`" @click="handleAction(action, order)">
                {{ actionLabel[action] }}
              </el-button>
            </div>
          </div>
        </article>
      </div>

      <el-pagination v-if="!loading && !loadError && total > pageSize" class="orders-pagination" background layout="total, prev, pager, next" :current-page="page" :page-size="pageSize" :total="total" @current-change="changePage" />
    </section>
  </main>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
  import { cancelOrder, deleteOrder, getOrderDetail, getOrders, receiveOrder } from '../api/index.js'
import { formatMoney } from '../utils/commerce.js'
import { getOrderActionPresentation, getOrderActions, normalizeOrderList } from '../utils/order.js'

const route = useRoute()
const router = useRouter()
const pageSize = 10
const orders = ref([])
const total = ref(0)
const loading = ref(true)
const loadError = ref('')
const operatingKey = ref('')
const status = ref('')
const page = ref(1)
let requestSequence = 0
const statusTabs = [
  { label: '全部订单', value: '' }, { label: '待付款', value: '0' }, { label: '待发货', value: '1' },
  { label: '待收货', value: '2' }, { label: '已完成', value: '3' }, { label: '已取消', value: '4' }, { label: '已退款', value: '5' },
]
const actionLabel = { detail: '查看详情', cancel: '取消订单', pay: '立即付款', receive: '确认收货', review: '去评价', delete: '删除订单' }

function initFromRoute() {
  const routeStatus = String(route.query.status ?? '')
  status.value = statusTabs.some((tab) => tab.value === routeStatus) ? routeStatus : ''
  const routePage = Number(route.query.page)
  page.value = Number.isInteger(routePage) && routePage > 0 ? routePage : 1
}

function syncRoute() {
  const query = {}
  if (status.value !== '') query.status = status.value
  if (page.value > 1) query.page = String(page.value)
  return router.replace({ path: '/orders', query })
}

async function loadOrders() {
  const sequence = ++requestSequence
  const routeSnapshot = route.fullPath
  const statusSnapshot = status.value
  const pageSnapshot = page.value
  loading.value = true
  loadError.value = ''
  orders.value = []
  total.value = 0
  try {
    const params = { page: pageSnapshot, size: pageSize }
    if (statusSnapshot !== '') params.status = Number(statusSnapshot)
    const payload = await getOrders(params)
    const baseResult = normalizeOrderList(payload)
    const detailEntries = await Promise.all(baseResult.list.map(async (order) => {
      try {
        return [order.orderNo, await getOrderDetail(order.orderNo)]
      } catch {
        return [order.orderNo, null]
      }
    }))
    const result = normalizeOrderList(payload, new Map(detailEntries.filter(([, detail]) => detail)))
    if (sequence !== requestSequence || route.fullPath !== routeSnapshot || status.value !== statusSnapshot || page.value !== pageSnapshot) return
    orders.value = result.list
    total.value = result.total
  } catch (error) {
    if (sequence !== requestSequence || route.fullPath !== routeSnapshot || status.value !== statusSnapshot || page.value !== pageSnapshot) return
    orders.value = []
    total.value = 0
    loadError.value = error?.message || '网络开小差了，请稍后重试'
  } finally {
    if (sequence === requestSequence && route.fullPath === routeSnapshot && status.value === statusSnapshot && page.value === pageSnapshot) loading.value = false
  }
}

async function changeStatus(value) { status.value = value; page.value = 1; await syncRoute() }
async function changePage(value) { page.value = value; await syncRoute(); window.scrollTo({ top: 0, behavior: 'smooth' }) }
function openDetail(orderNo) { router.push(`/orders/${orderNo}`) }
async function confirmOperation(message, title, confirmButtonText) {
  try {
    await ElMessageBox.confirm(message, title, { type: 'warning', confirmButtonText, cancelButtonText: '暂不操作', center: true })
    return true
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error('操作确认失败，请重试')
    return false
  }
}

async function executeOperation(order, action, api, successMessage) {
  operatingKey.value = `${order.orderNo}:${action}`
  try { await api(order.orderNo); ElMessage.success(successMessage); await loadOrders() }
  catch (error) { ElMessage.error(error?.message || '订单操作失败，请稍后重试') }
  finally { operatingKey.value = '' }
}

async function handleAction(action, order) {
  if (operatingKey.value) return
  if (action === 'detail') return openDetail(order.orderNo)
  if (action === 'pay') return router.push(`/payment/${order.orderNo}`)
  if (action === 'review') return router.push(`/orders/${order.orderNo}/review`)
  if (action === 'cancel' && await confirmOperation('取消后订单将无法继续付款，确定取消吗？', '取消订单', '确定取消')) await executeOperation(order, action, cancelOrder, '订单已取消')
  if (action === 'receive' && await confirmOperation('请确认已经收到商品。确认后订单将完成并可进行评价。', '确认收货', '确认已收货')) await executeOperation(order, action, receiveOrder, '确认收货成功')
  if (action === 'delete' && await confirmOperation('删除后无法恢复，确定删除此订单记录吗？', '删除订单', '确定删除')) await executeOperation(order, action, deleteOrder, '订单已删除')
}

watch(
  () => [route.query.status, route.query.page],
  async () => { initFromRoute(); await loadOrders() },
  { immediate: true },
)
</script>

<style scoped>
.orders-page { width: min(1180px, calc(100% - 32px)); min-height: calc(100vh - 140px); margin: 0 auto; padding: 28px 0 52px; color: #333; font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; }
.orders-heading { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 18px; }.orders-heading p { margin: 0 0 5px; color: #e1251b; font-size: 11px; font-weight: 700; letter-spacing: .16em; }.orders-heading h1 { margin: 0; font-size: 26px; font-weight: 600; }.continue-shopping { padding: 8px 0; border: 0; color: #666; background: transparent; cursor: pointer; }.continue-shopping:hover { color: #e1251b; }
.orders-panel { min-height: 520px; border: 1px solid #eee; background: #fff; }.status-tabs { display: flex; align-items: center; gap: 2px; overflow-x: auto; padding: 0 22px; border-bottom: 1px solid #eee; scrollbar-width: none; }.status-tab { position: relative; flex: none; min-width: 86px; height: 54px; padding: 0 15px; border: 0; color: #666; background: transparent; font: inherit; cursor: pointer; }.status-tab::after { position: absolute; right: 15px; bottom: -1px; left: 15px; height: 2px; background: transparent; content: ''; }.status-tab:hover, .status-tab.active { color: #e1251b; font-weight: 600; }.status-tab.active::after { background: #e1251b; }
.orders-panel :deep(.el-result) { display: flex; align-items: center; flex-direction: column; padding: 64px 20px; text-align: center; }.orders-panel :deep(.el-result__icon svg) { width: 64px; height: 64px; }.orders-panel :deep(.el-button--primary) { --el-button-bg-color: #e1251b; --el-button-border-color: #e1251b; --el-button-hover-bg-color: #c81623; --el-button-hover-border-color: #c81623; }
.loading-list { display: grid; gap: 20px; padding: 28px; }.order-list { padding: 20px 22px 6px; background: #f7f7f7; }.order-card { margin: 0 0 16px; border: 1px solid #e7e7e7; background: #fff; transition: border-color 150ms ease, box-shadow 150ms ease; }.order-card:hover { border-color: #d4d4d4; box-shadow: 0 4px 16px rgba(0, 0, 0, .05); }.order-card-head { display: flex; align-items: center; justify-content: space-between; min-height: 43px; padding: 0 18px; border-bottom: 1px solid #eee; color: #777; background: #fafafa; font-size: 13px; }.order-identify { display: flex; flex-wrap: wrap; gap: 22px; }.status-text { font-size: 14px; font-weight: 600; }.status-text.is-warning, .status-text.is-primary { color: #e1251b; }.status-text.is-success { color: #28a745; }.status-text.is-info { color: #888; }
.order-card-body { display: grid; grid-template-columns: minmax(0, 1fr) 155px 138px; min-height: 116px; }.product-list { min-width: 0; padding: 10px 18px; border-right: 1px solid #eee; }.product-row { display: grid; grid-template-columns: 64px minmax(120px, 1fr) 90px 45px; align-items: center; gap: 12px; width: 100%; min-height: 82px; padding: 8px 0; border: 0; color: #333; background: transparent; text-align: left; cursor: pointer; }.product-row + .product-row { border-top: 1px solid #f1f1f1; }.product-image { display: grid; place-items: center; width: 64px; height: 64px; overflow: hidden; border: 1px solid #eee; color: #bbb; background: #fafafa; font-size: 25px; }.product-image img { width: 100%; height: 100%; object-fit: cover; }.product-info { display: grid; gap: 8px; min-width: 0; }.product-info strong { overflow: hidden; font-size: 13px; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }.product-info span, .quantity { color: #999; font-size: 12px; }.unit-price { color: #555; font-size: 13px; text-align: right; }.quantity { text-align: center; }.missing-products { margin: 28px 0; border: 0; color: #888; background: transparent; cursor: pointer; }.more-products { margin: 4px 0 5px 76px; color: #999; font-size: 12px; }
.order-summary { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 5px; padding: 16px; border-right: 1px solid #eee; text-align: center; }.order-summary p, .order-summary span { margin: 0; color: #999; font-size: 12px; }.order-summary strong { color: #333; font-size: 17px; }.order-actions { display: flex; align-content: center; justify-content: center; flex-direction: column; gap: 8px; padding: 14px 18px; }.order-actions :deep(.el-button) { width: 100%; margin: 0; }.order-actions :deep(.el-button--danger:not(.is-plain)) { --el-button-bg-color: #e1251b; --el-button-border-color: #e1251b; }.order-actions :deep(.pay-order-action), .order-actions :deep(.pay-order-action:hover), .order-actions :deep(.pay-order-action:focus-visible), .order-actions :deep(.pay-order-action:active), .order-actions :deep(.pay-order-action > span) { --el-button-text-color: #fff; --el-button-hover-text-color: #fff; --el-button-active-text-color: #fff; color: #fff; }.orders-pagination { justify-content: flex-end; padding: 24px 22px; }
@media (max-width: 800px) { .orders-page { width: min(100% - 20px, 700px); padding-top: 16px; }.status-tabs { padding: 0 8px; }.status-tab { min-width: 76px; padding: 0 10px; }.order-list { padding: 12px 10px 1px; }.order-card-head { align-items: flex-start; gap: 8px; padding: 11px 13px; }.order-identify { flex-direction: column; gap: 4px; }.order-card-body { grid-template-columns: 1fr 118px; }.product-list { grid-column: 1 / -1; border-right: 0; border-bottom: 1px solid #eee; }.product-row { grid-template-columns: 56px minmax(100px, 1fr) 60px 32px; gap: 8px; }.product-image { width: 56px; height: 56px; }.order-summary, .order-actions { min-height: 106px; } }
@media (max-width: 480px) { .orders-heading { padding: 0 4px; }.orders-heading h1 { font-size: 23px; }.product-row { grid-template-columns: 54px 1fr auto; }.product-image { grid-row: 1 / 3; }.unit-price { grid-column: 2; text-align: left; }.quantity { grid-column: 3; grid-row: 1 / 3; }.order-card-body { grid-template-columns: 1fr; }.order-summary { border-right: 0; border-bottom: 1px solid #eee; }.order-actions { display: grid; grid-template-columns: repeat(2, 1fr); min-height: auto; }.orders-pagination { justify-content: center; padding: 18px 4px; } }
</style>
