<template>
  <main class="detail-page">
    <button type="button" class="back-button" @click="router.push('/orders')"><el-icon><ArrowLeft /></el-icon> 返回我的订单</button>

    <div v-if="loading" class="detail-loading"><el-skeleton :rows="12" animated /></div>
    <el-result v-else-if="loadError" icon="error" title="订单详情加载失败" :sub-title="loadError">
      <template #extra><el-button type="primary" @click="loadOrder">重新加载</el-button></template>
    </el-result>

    <template v-else-if="order">
      <section class="status-card">
        <div :class="['status-copy', `is-${order.statusMeta.tone}`]">
          <span>订单状态</span><h1>{{ order.statusText }}</h1><p>{{ order.statusMeta.description }}</p>
        </div>
        <el-steps v-if="order.statusMeta.step" :active="order.statusMeta.step" finish-status="success" align-center class="order-steps">
          <el-step title="提交订单" /><el-step title="付款成功" /><el-step title="商品出库" /><el-step title="完成" />
        </el-steps>
        <div class="top-actions">
          <el-button v-for="action in detailActions" :key="action" :type="action === 'pay' || action === 'receive' ? 'danger' : ''" :plain="action !== 'pay' && action !== 'receive'" :loading="operating === action" @click="handleAction(action)">
            {{ actionLabel[action] }}
          </el-button>
        </div>
      </section>

      <section class="detail-grid">
        <article class="info-card delivery-card">
          <h2>收货信息</h2>
          <dl><dt>收货人</dt><dd>{{ order.receiverName || '—' }}</dd><dt>手机号码</dt><dd>{{ maskPhone(order.receiverPhone) }}</dd><dt>收货地址</dt><dd>{{ order.fullAddress || '—' }}</dd></dl>
        </article>
        <article class="info-card order-info-card">
          <h2>订单信息</h2>
          <dl><dt>订单编号</dt><dd>{{ order.orderNo }}</dd><dt>下单时间</dt><dd>{{ order.createTime || '—' }}</dd><dt v-if="order.payTime">付款时间</dt><dd v-if="order.payTime">{{ order.payTime }}</dd><dt v-if="order.remark">订单备注</dt><dd v-if="order.remark">{{ order.remark }}</dd></dl>
        </article>
        <article v-if="order.logisticsCompany || order.logisticsNo" class="info-card logistics-card">
          <h2>配送信息</h2>
          <dl><dt>物流公司</dt><dd>{{ order.logisticsCompany || '—' }}</dd><dt>物流单号</dt><dd>{{ order.logisticsNo || '—' }}</dd><dt v-if="order.deliveryTime">发货时间</dt><dd v-if="order.deliveryTime">{{ order.deliveryTime }}</dd></dl>
        </article>
      </section>

      <section class="goods-card">
        <header><h2>商品清单</h2><span>订单号：{{ order.orderNo }}</span></header>
        <div class="goods-table-head"><span>商品</span><span>单价</span><span>数量</span><span>小计</span><span>操作</span></div>
        <div v-if="!order.items.length" class="empty-goods">暂无商品明细</div>
        <article v-for="(item, index) in order.items" :key="item.id || index" class="goods-row">
          <button type="button" class="goods-product" :disabled="!item.productId" @click="item.productId && router.push(`/product/${item.productId}`)">
            <div class="goods-image"><img v-if="item.image" :src="item.image" :alt="item.name" /><el-icon v-else><Picture /></el-icon></div>
            <div><strong>{{ item.name }}</strong><span v-if="item.spec">{{ item.spec }}</span></div>
          </button>
          <span>¥{{ formatMoney(item.price) }}</span><span>×{{ item.quantity }}</span><strong class="subtotal">¥{{ formatMoney(item.subtotal) }}</strong>
          <el-button v-if="order.status === 3" link type="danger" @click="goReview(item)">评价</el-button><span v-else class="no-action">—</span>
        </article>

        <footer class="amount-summary">
          <div><span>商品总额</span><strong>¥{{ formatMoney(order.goodsAmount) }}</strong></div>
          <div><span>运费</span><strong>+ ¥{{ formatMoney(order.freightAmount) }}</strong></div>
          <div><span>优惠</span><strong>- ¥{{ formatMoney(order.discountAmount) }}</strong></div>
          <div class="payable"><span>实付款</span><strong>¥{{ formatMoney(order.payAmount) }}</strong></div>
        </footer>
      </section>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Picture } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { cancelOrder, deleteOrder, getOrderDetail, receiveOrder } from '../api/index.js'
import { formatMoney } from '../utils/commerce.js'
import { getOrderActions, normalizeOrderDetail } from '../utils/order.js'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(true)
const loadError = ref('')
const operating = ref('')
const actionLabel = { cancel: '取消订单', pay: '立即付款', receive: '确认收货', review: '评价订单', delete: '删除订单' }
const detailActions = computed(() => order.value ? getOrderActions(order.value.status).filter((item) => item !== 'detail') : [])

async function loadOrder() {
  loading.value = true
  loadError.value = ''
  try { order.value = normalizeOrderDetail(await getOrderDetail(route.params.orderNo)) }
  catch (error) { order.value = null; loadError.value = error?.message || '网络开小差了，请稍后重试' }
  finally { loading.value = false }
}

function maskPhone(phone) {
  const value = String(phone || '')
  return /^\d{11}$/.test(value) ? `${value.slice(0, 3)}****${value.slice(-4)}` : (value || '—')
}

function goReview(item) {
  router.push({ path: `/orders/${order.value.orderNo}/review`, query: item.orderItemId ? { orderItemId: item.orderItemId } : {} })
}

async function confirmOperation(message, title, confirmButtonText) {
  try {
    await ElMessageBox.confirm(message, title, { type: 'warning', confirmButtonText, cancelButtonText: '暂不操作', center: true })
    return true
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error('操作确认失败，请重试')
    return false
  }
}

async function runOperation(action, api, successMessage) {
  operating.value = action
  try { await api(order.value.orderNo); ElMessage.success(successMessage); await loadOrder() }
  catch (error) { ElMessage.error(error?.message || '订单操作失败，请稍后重试') }
  finally { operating.value = '' }
}

async function handleAction(action) {
  if (operating.value) return
  if (action === 'pay') return router.push(`/payment/${order.value.orderNo}`)
  if (action === 'review') return router.push(`/orders/${order.value.orderNo}/review`)
  if (action === 'cancel' && await confirmOperation('取消后订单将无法继续付款，确定取消吗？', '取消订单', '确定取消')) await runOperation(action, cancelOrder, '订单已取消')
  if (action === 'receive' && await confirmOperation('请确认已经收到商品。确认后订单将完成并可进行评价。', '确认收货', '确认已收货')) await runOperation(action, receiveOrder, '确认收货成功')
  if (action === 'delete' && await confirmOperation('删除后无法恢复，确定删除此订单记录吗？', '删除订单', '确定删除')) {
    operating.value = action
    try { await deleteOrder(order.value.orderNo); ElMessage.success('订单已删除'); await router.replace('/orders') }
    catch (error) { ElMessage.error(error?.message || '删除失败，请稍后重试'); operating.value = '' }
  }
}

onMounted(loadOrder)
</script>

<style scoped>
.detail-page { width: min(1180px, calc(100% - 32px)); min-height: calc(100vh - 140px); margin: 0 auto; padding: 20px 0 52px; color: #333; font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; }.back-button { display: inline-flex; align-items: center; gap: 5px; margin-bottom: 14px; padding: 8px 0; border: 0; color: #777; background: transparent; cursor: pointer; }.back-button:hover { color: #e1251b; }.detail-loading { padding: 30px; border: 1px solid #eee; background: #fff; }
.detail-page :deep(.el-result) { display: flex; align-items: center; flex-direction: column; text-align: center; }.detail-page :deep(.el-result__icon svg) { width: 64px; height: 64px; }.detail-page :deep(.el-button--primary) { --el-button-bg-color: #e1251b; --el-button-border-color: #e1251b; }
.status-card { position: relative; display: grid; grid-template-columns: 255px 1fr; min-height: 190px; border: 1px solid #e8e8e8; background: #fff; }.status-copy { display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 28px; border-right: 1px solid #eee; text-align: center; }.status-copy span { color: #999; font-size: 13px; }.status-copy h1 { margin: 12px 0 8px; color: #e1251b; font-size: 26px; }.status-copy p { margin: 0; color: #777; font-size: 13px; line-height: 1.7; }.status-copy.is-success h1 { color: #28a745; }.status-copy.is-info h1 { color: #777; }.order-steps { align-self: center; padding: 10px 42px 42px; }.top-actions { position: absolute; right: 28px; bottom: 21px; }.top-actions :deep(.el-button--danger:not(.is-plain)) { --el-button-bg-color: #e1251b; --el-button-border-color: #e1251b; }
.detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 16px; border: 1px solid #e8e8e8; background: #fff; }.info-card { min-height: 190px; padding: 22px 24px; border-right: 1px solid #eee; }.info-card:last-child { border-right: 0; }.info-card h2, .goods-card h2 { margin: 0 0 20px; font-size: 16px; font-weight: 600; }.info-card dl { display: grid; grid-template-columns: 70px 1fr; gap: 13px 10px; margin: 0; font-size: 13px; line-height: 1.6; }.info-card dt { color: #999; }.info-card dd { margin: 0; color: #555; overflow-wrap: anywhere; }
.goods-card { margin-top: 16px; border: 1px solid #e8e8e8; background: #fff; }.goods-card > header { display: flex; align-items: center; justify-content: space-between; min-height: 60px; padding: 0 22px; border-bottom: 1px solid #eee; }.goods-card > header h2 { margin: 0; }.goods-card > header span { color: #999; font-size: 12px; }.goods-table-head, .goods-row { display: grid; grid-template-columns: minmax(300px, 1fr) 110px 80px 120px 80px; align-items: center; gap: 12px; padding: 0 22px; }.goods-table-head { min-height: 42px; color: #888; background: #fafafa; font-size: 12px; text-align: center; }.goods-table-head span:first-child { text-align: left; }.goods-row { min-height: 112px; border-top: 1px solid #f0f0f0; color: #666; font-size: 13px; text-align: center; }.goods-product { display: grid; grid-template-columns: 74px 1fr; align-items: center; gap: 14px; min-width: 0; padding: 0; border: 0; color: #333; background: transparent; text-align: left; cursor: pointer; }.goods-product:disabled { cursor: default; }.goods-image { display: grid; place-items: center; width: 74px; height: 74px; overflow: hidden; border: 1px solid #eee; color: #bbb; background: #fafafa; font-size: 26px; }.goods-image img { width: 100%; height: 100%; object-fit: cover; }.goods-product > div:last-child { display: grid; gap: 9px; min-width: 0; }.goods-product strong { overflow: hidden; font-size: 13px; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }.goods-product span, .no-action { color: #999; font-size: 12px; }.subtotal { color: #333; }.empty-goods { padding: 45px; color: #999; text-align: center; }
.amount-summary { display: grid; justify-content: end; gap: 12px; padding: 22px; border-top: 1px solid #eee; background: #fafafa; }.amount-summary div { display: grid; grid-template-columns: 100px 120px; text-align: right; }.amount-summary span { color: #777; font-size: 13px; }.amount-summary strong { font-size: 14px; }.amount-summary .payable { align-items: baseline; margin-top: 5px; }.amount-summary .payable strong { color: #e1251b; font-size: 23px; }
@media (max-width: 850px) { .detail-page { width: min(100% - 20px, 760px); }.status-card { grid-template-columns: 1fr; }.status-copy { border-right: 0; border-bottom: 1px solid #eee; }.order-steps { width: 100%; padding: 34px 15px 68px; }.top-actions { right: 16px; bottom: 15px; }.detail-grid { grid-template-columns: 1fr; }.info-card { min-height: auto; border-right: 0; border-bottom: 1px solid #eee; }.goods-table-head { display: none; }.goods-row { grid-template-columns: 70px 1fr auto; gap: 8px; padding: 14px; text-align: right; }.goods-product { grid-column: 1 / -1; grid-template-columns: 64px 1fr; }.goods-image { width: 64px; height: 64px; }.goods-row > span:nth-of-type(1)::before { content: '单价 '; color: #999; }.goods-row > span:nth-of-type(2)::before { content: '数量 '; color: #999; }.goods-row .subtotal { grid-column: 3; }.no-action { display: none; } }
@media (max-width: 480px) { .order-steps { padding-right: 4px; padding-left: 4px; }.order-steps :deep(.el-step__title) { font-size: 11px; }.goods-card > header { align-items: flex-start; flex-direction: column; justify-content: center; gap: 5px; }.amount-summary { justify-content: stretch; }.amount-summary div { grid-template-columns: 1fr auto; } }
</style>
