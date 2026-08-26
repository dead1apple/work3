<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElButton, ElEmpty, ElImage, ElSkeleton, ElTag } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { formatAmount, getOrderStatus } from './order-list'
import { useOrderDetail } from './useOrderDetail'

const route = useRoute()
const orderDetail = useOrderDetail(route.params.orderNo)

function reload() { void orderDetail.load().catch(() => {}) }
function time(value) { return value || '—' }
function payType(value) { return ({ 1: '微信支付', 2: '支付宝', 3: '余额支付' })[value] || '—' }

onMounted(reload)
</script>

<template>
  <section class="order-detail-view" aria-labelledby="order-detail-title">
    <header class="detail-heading">
      <div>
        <p>ORDER DETAIL</p>
        <h1 id="order-detail-title">订单详情</h1>
        <span>仅展示当前商家店铺订单</span>
      </div>
      <div class="detail-actions">
        <router-link :to="{ name: 'merchant-orders' }">返回订单管理</router-link>
        <el-button :icon="Refresh" :loading="orderDetail.loading.value" @click="reload">刷新</el-button>
      </div>
    </header>

    <div v-if="orderDetail.loading.value" class="detail-state" data-testid="order-detail-loading" aria-live="polite">
      <span>正在加载订单详情</span><el-skeleton :rows="8" animated />
    </div>
    <div v-else-if="orderDetail.error.value" class="detail-state detail-state--error" data-testid="order-detail-error" role="alert">
      <h2>订单详情加载失败</h2>
      <p>{{ orderDetail.error.value.message || '请检查网络后重试。' }}</p>
      <el-button data-testid="retry-order-detail" type="primary" @click="reload">重新加载</el-button>
    </div>
    <div v-else-if="!orderDetail.detail.value" class="detail-state"><el-empty description="未找到订单详情" /></div>
    <template v-else>
      <section class="detail-card order-summary">
        <div><span>订单号</span><strong>{{ orderDetail.detail.value.order.orderNo }}</strong></div>
        <div><span>订单状态</span><el-tag :type="getOrderStatus(orderDetail.detail.value.order.status).type">{{ getOrderStatus(orderDetail.detail.value.order.status).label }}</el-tag></div>
        <div><span>实付金额</span><strong class="amount">{{ formatAmount(orderDetail.detail.value.order.payAmount) }}</strong></div>
      </section>

      <section class="detail-card" aria-labelledby="order-items-title">
        <h2 id="order-items-title">商品明细</h2>
        <div class="item-list">
          <article v-for="item in orderDetail.detail.value.items" :key="item.id" class="order-item">
            <el-image v-if="item.skuImage" :src="item.skuImage" :alt="item.productName" fit="cover" /><div v-else class="item-image">暂无图片</div>
            <div><strong>{{ item.productName }}</strong><span>{{ item.skuName || '默认规格' }}</span></div>
            <span>{{ formatAmount(item.price) }} × {{ item.quantity }}</span><strong>{{ formatAmount(item.totalAmount) }}</strong>
          </article>
        </div>
      </section>

      <div class="detail-grid">
        <section class="detail-card"><h2>金额信息</h2><dl>
          <div><dt>商品合计</dt><dd>{{ formatAmount(orderDetail.detail.value.order.totalAmount) }}</dd></div>
          <div><dt>运费</dt><dd>{{ formatAmount(orderDetail.detail.value.order.freightAmount) }}</dd></div>
          <div><dt>优惠抵扣</dt><dd>-{{ formatAmount(orderDetail.detail.value.order.discountAmount) }}</dd></div>
          <div class="amount-line"><dt>实付金额</dt><dd>{{ formatAmount(orderDetail.detail.value.order.payAmount) }}</dd></div>
        </dl></section>
        <section class="detail-card"><h2>收货信息</h2><dl>
          <div><dt>收货人</dt><dd>{{ orderDetail.detail.value.order.receiverName || '—' }}</dd></div>
          <div><dt>联系电话</dt><dd>{{ orderDetail.detail.value.order.receiverPhone || '—' }}</dd></div>
          <div><dt>收货地址</dt><dd>{{ orderDetail.detail.value.order.receiverAddress || '—' }}</dd></div>
        </dl></section>
        <section class="detail-card"><h2>物流信息</h2><dl>
          <div><dt>物流公司</dt><dd>{{ orderDetail.detail.value.order.logisticsCompany || '—' }}</dd></div>
          <div><dt>物流单号</dt><dd>{{ orderDetail.detail.value.order.logisticsNo || '—' }}</dd></div>
          <div><dt>发货时间</dt><dd>{{ time(orderDetail.detail.value.order.deliveryTime) }}</dd></div>
        </dl></section>
        <section class="detail-card"><h2>时间与支付</h2><dl>
          <div><dt>下单时间</dt><dd>{{ time(orderDetail.detail.value.order.createTime) }}</dd></div>
          <div><dt>支付时间</dt><dd>{{ time(orderDetail.detail.value.order.payTime) }}</dd></div>
          <div><dt>支付方式</dt><dd>{{ payType(orderDetail.detail.value.payment?.payType || orderDetail.detail.value.order.payType) }}</dd></div>
          <div><dt>支付单号</dt><dd>{{ orderDetail.detail.value.payment?.paymentNo || '—' }}</dd></div>
          <div><dt>确认收货</dt><dd>{{ time(orderDetail.detail.value.order.receiveTime) }}</dd></div>
          <div><dt>取消时间</dt><dd>{{ time(orderDetail.detail.value.order.cancelTime) }}</dd></div>
        </dl></section>
      </div>
    </template>
  </section>
</template>

<style scoped>
.order-detail-view { max-width: 1120px; margin: 0 auto; }
.detail-heading, .detail-actions, .order-summary, .order-item { display: flex; align-items: center; }
.detail-heading { justify-content: space-between; gap: var(--space-5); }
.detail-heading p { margin: 0 0 var(--space-2); color: var(--color-accent); font-size: 10px; font-weight: 750; letter-spacing: .16em; }.detail-heading h1 { margin: 0; font-size: clamp(30px,4vw,44px); letter-spacing: -.04em; }.detail-heading span { color: var(--color-muted); font-size: 13px; }.detail-actions { gap: var(--space-4); }.detail-actions a { color: var(--color-accent-strong); font-weight: 650; text-decoration: none; }
.detail-state, .detail-card { margin-top: var(--space-5); padding: clamp(22px,4vw,34px); border: 1px solid var(--color-line); border-radius: var(--radius-large); background: var(--color-surface); box-shadow: var(--shadow-soft); }.detail-state { min-height: 260px; }.detail-state--error { display: grid; align-content: center; justify-items: start; }.detail-state h2, .detail-card h2 { margin: 0 0 var(--space-5); font-size: 20px; }
.order-summary { justify-content: space-between; gap: var(--space-5); }.order-summary div { display: grid; gap: var(--space-2); }.order-summary span, dt { color: var(--color-muted); font-size: 12px; }.amount, .amount-line dd { color: var(--color-accent-strong); font-size: 20px; }
.item-list { display: grid; }.order-item { display: grid; grid-template-columns: 64px minmax(180px,1fr) auto auto; gap: var(--space-4); padding: var(--space-4) 0; border-top: 1px solid var(--color-line); }.order-item:first-child { border-top: 0; padding-top: 0; }.order-item :deep(.el-image), .item-image { width: 64px; height: 64px; border-radius: var(--radius-small); background: var(--color-canvas); }.item-image { display: grid; place-items: center; color: var(--color-muted); font-size: 11px; }.order-item > div { display: grid; align-content: center; gap: var(--space-1); }.order-item > div span { color: var(--color-muted); font-size: 12px; }
.detail-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: var(--space-5); }.detail-grid .detail-card { margin-top: var(--space-5); } dl { display: grid; gap: var(--space-3); margin: 0; } dl div { display: grid; grid-template-columns: 90px 1fr; gap: var(--space-4); } dt,dd { margin: 0; } dd { overflow-wrap: anywhere; }
@media (max-width:760px) { .detail-heading,.detail-actions,.order-summary { align-items: stretch; flex-direction: column; }.detail-grid { grid-template-columns: 1fr; }.order-item { grid-template-columns: 52px 1fr; }.order-item > span,.order-item > strong { grid-column: 2; }.order-item :deep(.el-image),.item-image { width:52px;height:52px; } }
</style>
