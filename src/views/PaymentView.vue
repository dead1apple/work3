<template>
  <main class="cashier-page">
    <section class="cashier-shell" aria-labelledby="cashier-title">
      <header class="cashier-header">
        <div class="cashier-brand">
          <span class="jd-mark">JD</span>
          <div><h1 id="cashier-title">京东收银台</h1><p>安全、快捷地完成订单支付</p></div>
        </div>
        <ol class="payment-steps" aria-label="支付进度">
          <li class="done"><span>1</span>确认订单</li>
          <li :class="{ active: paymentStatus.state !== 'paid', done: paymentStatus.state === 'paid' }"><span>2</span>在线支付</li>
          <li :class="{ active: paymentStatus.state === 'paid' }"><span>3</span>支付完成</li>
        </ol>
      </header>

      <div v-if="checking" class="cashier-loading"><el-skeleton :rows="8" animated /></div>

      <section v-else-if="queryError" class="result-card error-result" aria-live="polite">
        <div class="result-icon">!</div>
        <h2>支付信息加载失败</h2>
        <p>{{ queryError }}</p>
        <div class="result-actions"><el-button type="danger" @click="reloadStatus">重新加载</el-button><el-button @click="router.push('/orders')">查看我的订单</el-button></div>
      </section>

      <section v-else-if="paymentStatus.state === 'paid'" class="result-card success-result" aria-live="polite">
        <el-icon class="success-icon"><CircleCheckFilled /></el-icon>
        <h2>{{ paymentStatus.title }}</h2>
        <p>{{ paymentStatus.description }}</p>
        <dl class="result-detail"><dt>订单编号</dt><dd>{{ orderNo }}</dd><template v-if="paymentStatus.paymentNo"><dt>支付单号</dt><dd>{{ paymentStatus.paymentNo }}</dd></template><template v-if="paidMethod"><dt>支付方式</dt><dd>{{ paidMethod.label }}</dd></template></dl>
        <div class="result-actions"><el-button type="danger" @click="router.push(`/orders/${orderNo}`)">查看订单详情</el-button><el-button @click="router.push('/home')">返回首页</el-button></div>
      </section>

      <section v-else-if="paymentStatus.state === 'processing'" class="result-card processing-result" aria-live="polite">
        <el-icon class="processing-icon"><Loading /></el-icon>
        <h2>{{ paymentStatus.title }}</h2>
        <p>{{ paymentStatus.description }}</p>
        <span class="polling-note">正在自动查询支付结果{{ pollingDots }}</span>
        <div class="result-actions"><el-button type="danger" plain :loading="refreshing" @click="refreshStatus(false)">立即查询</el-button><el-button @click="router.push('/orders')">稍后查看订单</el-button></div>
      </section>

      <template v-else>
        <section class="order-brief">
          <div><span>订单提交成功，请尽快付款</span><p>订单号：{{ orderNo }}</p></div>
          <div class="payable-amount"><span>应付金额</span><strong v-if="payableAmount !== null"><small>¥</small>{{ formatMoney(payableAmount) }}</strong><strong v-else class="amount-pending">以订单为准</strong></div>
        </section>

        <el-alert v-if="paymentStatus.state === 'failed'" class="payment-alert" type="error" :closable="false" show-icon :title="paymentStatus.title" :description="paymentStatus.description" />

        <section class="method-panel" aria-labelledby="method-title">
          <header><div><h2 id="method-title">选择支付方式</h2><p>请选择一种方式完成本次付款</p></div><span><el-icon><Lock /></el-icon> 支付环境安全</span></header>
          <div class="method-list" role="radiogroup" aria-label="选择支付方式">
            <button v-for="method in PAYMENT_METHODS" :key="method.value" type="button" role="radio" :aria-checked="payType === method.value" :class="['method-card', { selected: payType === method.value }]" @click="payType = method.value">
              <span :class="['method-logo', `method-${method.value}`]">{{ method.value === 3 ? '¥' : method.value === 1 ? '微' : '支' }}</span>
              <span class="method-copy"><strong>{{ method.label }}</strong><small>{{ method.description }}</small></span>
              <span class="radio-mark" aria-hidden="true"><i></i></span>
            </button>
          </div>

          <footer class="pay-bar">
            <div><span>支付方式</span><strong>{{ selectedMethod.label }}</strong></div>
            <div v-if="payableAmount !== null" class="bar-amount"><span>应付金额</span><strong>¥{{ formatMoney(payableAmount) }}</strong></div>
            <el-button class="pay-button" type="danger" size="large" :loading="paying" :disabled="!paymentStatus.canPay" @click="submitPayment">{{ paying ? '正在提交' : '确认支付' }}</el-button>
          </footer>
        </section>

        <p class="security-note"><el-icon><Lock /></el-icon> 本项目为模拟支付环境，不会产生真实资金交易</p>
      </template>
    </section>
  </main>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, Loading, Lock } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { confirmPayment, createPayment, getOrderDetail, getPaymentStatus } from '../api/index.js'
import { formatMoney } from '../utils/commerce.js'
import { normalizeOrderDetail } from '../utils/order.js'
import { extractPaymentNo, mergePaymentStatus, normalizePaymentStatus, PAYMENT_METHODS } from '../utils/payment.js'

const route = useRoute()
const router = useRouter()
const orderNo = computed(() => String(route.params.orderNo || ''))
const payableAmount = ref(null)
const checking = ref(true)
const refreshing = ref(false)
const paying = ref(false)
const queryError = ref('')
const payType = ref(1)
const pollRound = ref(0)
const paymentStatus = ref(normalizePaymentStatus(null))
let routeGeneration = 0
let statusSequence = 0
let lastAppliedStatusSequence = 0
let pollTimer = null

const selectedMethod = computed(() => PAYMENT_METHODS.find((method) => method.value === payType.value) || PAYMENT_METHODS[0])
const paidMethod = computed(() => PAYMENT_METHODS.find((method) => method.value === paymentStatus.value.payType))
const pollingDots = computed(() => '.'.repeat((pollRound.value % 3) + 1))

function isCurrentRoute(generation, order = orderNo.value) {
  return generation === routeGeneration && order === orderNo.value
}

function resetOrderState() {
  routeGeneration += 1
  statusSequence = 0
  lastAppliedStatusSequence = 0
  stopPolling()
  payableAmount.value = null
  checking.value = true
  refreshing.value = false
  paying.value = false
  queryError.value = ''
  payType.value = 1
  pollRound.value = 0
  paymentStatus.value = normalizePaymentStatus(null)
}

function stopPolling() {
  if (pollTimer) window.clearInterval(pollTimer)
  pollTimer = null
}

function startPolling(generation = routeGeneration, order = orderNo.value) {
  stopPolling()
  pollRound.value = 0
  pollTimer = window.setInterval(async () => {
    if (!isCurrentRoute(generation, order)) {
      stopPolling()
      return
    }
    pollRound.value += 1
    await refreshStatus(true, generation, order)
    if (pollRound.value >= 12 || paymentStatus.value.state !== 'processing') stopPolling()
  }, 2500)
}

function commitStatus(result, sequence = null) {
  if (sequence !== null) {
    if (sequence <= lastAppliedStatusSequence) return paymentStatus.value
    lastAppliedStatusSequence = sequence
  }
  paymentStatus.value = mergePaymentStatus(paymentStatus.value, result)
  if (result.payType && PAYMENT_METHODS.some((method) => method.value === result.payType)) payType.value = result.payType
  if (paymentStatus.value.state !== 'processing') stopPolling()
  return paymentStatus.value
}

async function fetchStatus(generation = routeGeneration, order = orderNo.value) {
  const sequence = ++statusSequence
  const result = normalizePaymentStatus(await getPaymentStatus(order))
  if (!isCurrentRoute(generation, order)) return null
  return commitStatus(result, sequence)
}

async function fetchPayableAmount(generation = routeGeneration, order = orderNo.value) {
  try {
    const detail = normalizeOrderDetail(await getOrderDetail(order))
    if (!isCurrentRoute(generation, order)) return
    payableAmount.value = Number.isFinite(detail.payAmount) ? detail.payAmount : null
  } catch {
    if (isCurrentRoute(generation, order)) payableAmount.value = null
  }
}

async function loadStatus(generation = routeGeneration, order = orderNo.value) {
  checking.value = true
  queryError.value = ''
  fetchPayableAmount(generation, order)
  try {
    const result = await fetchStatus(generation, order)
    if (!isCurrentRoute(generation, order) || !result) return
    if (result.state === 'processing') startPolling(generation, order)
  } catch (error) {
    if (isCurrentRoute(generation, order)) queryError.value = error?.message || '暂时无法查询支付状态，请稍后重试'
  } finally {
    if (isCurrentRoute(generation, order)) checking.value = false
  }
}

function reloadStatus() {
  loadStatus(routeGeneration, orderNo.value)
}

async function refreshStatus(silent = false, generation = routeGeneration, order = orderNo.value) {
  if (refreshing.value) return
  refreshing.value = true
  try {
    const result = await fetchStatus(generation, order)
    if (!isCurrentRoute(generation, order) || !result) return
    if (!silent && result.state === 'processing') ElMessage.info('支付结果仍在确认中')
  } catch (error) {
    if (!silent && isCurrentRoute(generation, order)) ElMessage.error(error?.message || '支付状态查询失败，请稍后重试')
  } finally {
    if (isCurrentRoute(generation, order)) refreshing.value = false
  }
}

async function submitPayment() {
  if (paying.value || !paymentStatus.value.canPay) return
  const generation = routeGeneration
  const order = orderNo.value
  paying.value = true
  queryError.value = ''
  let paymentNo = ''
  let paymentMayExist = false
  try {
    const created = await createPayment({ orderNo: order, payType: Number(payType.value) })
    if (!isCurrentRoute(generation, order)) return
    paymentNo = extractPaymentNo(created)
    if (!paymentNo) throw new Error('支付单创建成功，但未返回支付单号')
    paymentMayExist = true
    commitStatus(normalizePaymentStatus({ payment: { paymentNo, payType: payType.value, status: 0 } }))
    await confirmPayment({ paymentNo })
    if (!isCurrentRoute(generation, order)) return
    ElMessage.info('支付已提交，正在确认结果')
  } catch (error) {
    if (!isCurrentRoute(generation, order)) return
    if (paymentMayExist || paymentNo) {
      commitStatus(normalizePaymentStatus({ payment: { paymentNo, payType: payType.value, status: 0 } }))
      startPolling(generation, order)
      ElMessage.warning(error?.message || '支付请求已提交，结果暂时无法确认，页面将继续自动查询')
    } else {
      paymentStatus.value = normalizePaymentStatus({ payment: { payType: payType.value, status: 2, statusName: '支付失败' } })
      ElMessage.error(error?.message || '支付未完成，请稍后重试')
    }
    paying.value = false
    return
  }

  try {
    const result = await fetchStatus(generation, order)
    if (!isCurrentRoute(generation, order) || !result) return
    if (result.state === 'paid') ElMessage.success('支付成功')
    else if (result.state === 'processing') startPolling(generation, order)
  } catch {
    if (isCurrentRoute(generation, order)) {
      commitStatus(normalizePaymentStatus({ payment: { paymentNo, payType: payType.value, status: 0 } }))
      startPolling(generation, order)
      ElMessage.warning('支付已提交，结果查询暂时失败，页面将继续自动查询')
    }
  } finally {
    if (isCurrentRoute(generation, order)) paying.value = false
  }
}

watch(orderNo, (nextOrderNo) => {
  resetOrderState()
  if (!nextOrderNo) {
    checking.value = false
    queryError.value = '缺少订单编号，请返回订单列表后重试'
    return
  }
  loadStatus(routeGeneration, nextOrderNo)
}, { immediate: true })
onUnmounted(stopPolling)
</script>

<style scoped>
.cashier-page{min-height:calc(100vh - 136px);padding:24px 16px 56px;color:#333;background:#f5f5f5;font-family:'PingFang SC','Microsoft YaHei',Arial,sans-serif}.cashier-shell{width:min(1100px,100%);margin:0 auto}.cashier-header{display:flex;min-height:104px;align-items:center;justify-content:space-between;padding:0 30px;border-bottom:2px solid #e1251b;background:#fff}.cashier-brand{display:flex;align-items:center;gap:14px}.jd-mark{display:grid;width:46px;height:46px;place-items:center;border-radius:10px;color:#fff;background:#e1251b;font-family:Arial;font-size:17px;font-weight:800}.cashier-brand h1{margin:0;font-size:22px;font-weight:600}.cashier-brand p{margin:6px 0 0;color:#999;font-size:12px}.payment-steps{display:flex;margin:0;padding:0;list-style:none}.payment-steps li{display:flex;position:relative;align-items:center;gap:7px;margin-left:38px;color:#aaa;font-size:12px}.payment-steps li:not(:last-child)::after{position:absolute;top:50%;left:calc(100% + 10px);width:18px;border-top:1px solid #ddd;content:''}.payment-steps li>span{display:grid;width:25px;height:25px;place-items:center;border:1px solid #ccc;border-radius:50%;font-family:Arial}.payment-steps li.active{color:#e1251b}.payment-steps li.active>span{border-color:#e1251b;color:#fff;background:#e1251b}.payment-steps li.done{color:#5d9d36}.payment-steps li.done>span{border-color:#5d9d36;color:#fff;background:#5d9d36}.cashier-loading{min-height:520px;padding:48px;background:#fff}.order-brief{display:flex;min-height:118px;align-items:center;justify-content:space-between;margin-top:16px;padding:22px 30px;border:1px solid #eee;background:#fff}.order-brief>div:first-child>span{font-size:16px;font-weight:600}.order-brief p{margin:10px 0 0;color:#888;font-size:12px}.payable-amount{text-align:right}.payable-amount>span{display:block;color:#888;font-size:12px}.payable-amount strong{display:block;margin-top:7px;color:#e1251b;font-family:Arial;font-size:30px}.payable-amount small{margin-right:3px;font-size:16px}.payable-amount .amount-pending{color:#666;font-family:inherit;font-size:17px}.payment-alert{margin-top:14px}.method-panel{margin-top:14px;border:1px solid #eee;background:#fff}.method-panel>header{display:flex;min-height:76px;align-items:center;justify-content:space-between;padding:0 28px;border-bottom:1px solid #eee}.method-panel h2{margin:0;font-size:17px;font-weight:600}.method-panel header p{margin:7px 0 0;color:#999;font-size:12px}.method-panel header>span{display:flex;align-items:center;gap:5px;color:#69a44a;font-size:12px}.method-list{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:28px}.method-card{display:grid;grid-template-columns:48px 1fr 22px;min-height:92px;align-items:center;gap:13px;padding:16px;border:1px solid #ddd;color:#333;background:#fff;text-align:left;font:inherit;cursor:pointer;transition:border-color .15s,box-shadow .15s}.method-card:hover{border-color:#e98b85}.method-card.selected{border:2px solid #e1251b;padding:15px;box-shadow:0 5px 16px rgba(225,37,27,.08)}.method-logo{display:grid;width:46px;height:46px;place-items:center;border-radius:10px;color:#fff;font-size:20px;font-weight:700}.method-1{background:#20b663}.method-2{background:#1677ff}.method-3{background:#e1251b}.method-copy{display:grid;gap:7px}.method-copy strong{font-size:15px;font-weight:600}.method-copy small{color:#999;font-size:11px}.radio-mark{display:grid;width:19px;height:19px;place-items:center;border:1px solid #bbb;border-radius:50%}.radio-mark i{width:9px;height:9px;border-radius:50%;background:transparent}.method-card.selected .radio-mark{border-color:#e1251b}.method-card.selected .radio-mark i{background:#e1251b}.pay-bar{display:flex;min-height:92px;align-items:center;justify-content:flex-end;gap:34px;padding:18px 28px;border-top:1px solid #eee;background:#fafafa}.pay-bar>div{display:grid;gap:5px;text-align:right}.pay-bar span{color:#999;font-size:11px}.pay-bar strong{font-size:14px}.bar-amount strong{color:#e1251b;font-family:Arial;font-size:22px}.pay-button{width:156px;height:46px;border-radius:2px;font-size:15px;font-weight:600}.security-note{display:flex;align-items:center;justify-content:center;gap:6px;margin:18px 0 0;color:#999;font-size:11px}.result-card{display:flex;min-height:520px;align-items:center;justify-content:center;flex-direction:column;margin-top:16px;padding:48px 20px;border:1px solid #eee;background:#fff;text-align:center}.result-card h2{margin:18px 0 9px;font-size:24px;font-weight:600}.result-card>p{max-width:500px;margin:0;color:#888;font-size:13px;line-height:1.7}.success-icon{color:#52a733;font-size:72px}.processing-icon{color:#e1251b;font-size:62px;animation:payment-spin 1.1s linear infinite}.result-icon{display:grid;width:68px;height:68px;place-items:center;border-radius:50%;color:#e1251b;background:#fff1f0;font-size:34px;font-weight:700}.result-detail{display:grid;grid-template-columns:auto minmax(160px,auto);gap:12px 18px;margin:28px 0 0;padding:20px 30px;background:#fafafa;font-size:12px;text-align:left}.result-detail dt{color:#999}.result-detail dd{margin:0;color:#555;overflow-wrap:anywhere}.result-actions{display:flex;gap:12px;margin-top:28px}.polling-note{margin-top:16px;color:#e1251b;font-size:12px}@keyframes payment-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.processing-icon{animation:none}}
@media(max-width:760px){.cashier-page{padding:10px 8px 34px}.cashier-header{min-height:82px;padding:0 16px}.jd-mark{width:40px;height:40px}.cashier-brand h1{font-size:19px}.cashier-brand p,.payment-steps{display:none}.order-brief{align-items:flex-start;gap:18px;padding:20px 16px}.method-panel>header{padding:0 16px}.method-panel header>span{display:none}.method-list{grid-template-columns:1fr;padding:16px}.method-card{min-height:82px}.pay-bar{align-items:stretch;flex-direction:column;gap:14px;padding:16px}.pay-bar>div{grid-template-columns:1fr auto;text-align:left}.pay-button{width:100%}.result-card{min-height:470px;margin-top:10px}.result-detail{width:100%;grid-template-columns:76px 1fr;padding:18px}.result-actions{width:100%;flex-direction:column}.result-actions .el-button{width:100%;margin:0}}
</style>
