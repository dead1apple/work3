<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElButton, ElDialog, ElEmpty, ElForm, ElFormItem, ElInput, ElMessage, ElOption, ElPagination, ElSelect, ElSkeleton, ElTable, ElTableColumn, ElTag } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { ORDER_STATUS_OPTIONS, formatAmount, getOrderStatus } from './order-list'
import { useOrderList } from './useOrderList'

const orderList = useOrderList()
const deliveryOpen = ref(false)
const delivery = reactive({ orderNo: '', logisticsCompany: '', logisticsNo: '' })
function run(request) { void request().catch(() => {}) }
function reloadOrders() { run(orderList.load) }
function submitSearch() { run(orderList.search) }
function changeStatus(nextStatus) { run(() => orderList.changeStatus(nextStatus)) }
function changePage(value) { run(() => orderList.changePage(value)) }
function changeSize(value) { run(() => orderList.changeSize(value)) }
function time(value) { return value || '—' }
function canDeliver(order) { return order.status === 1 }
function isDelivering(orderNo) { return orderList.deliveringOrderNos.value.has(orderNo) }
function openDelivery(order) {
  delivery.orderNo = order.orderNo
  delivery.logisticsCompany = ''
  delivery.logisticsNo = ''
  deliveryOpen.value = true
}
async function submitDelivery() {
  const logisticsCompany = delivery.logisticsCompany.trim()
  const logisticsNo = delivery.logisticsNo.trim()
  if (!logisticsCompany || !logisticsNo) {
    ElMessage.warning('请填写快递公司和快递单号')
    return
  }
  try {
    await orderList.deliver({ orderNo: delivery.orderNo, logisticsCompany, logisticsNo })
    deliveryOpen.value = false
    ElMessage.success('发货成功')
  } catch (error) {
    ElMessage.error(error.message || '发货失败，请稍后重试')
  }
}

onMounted(reloadOrders)
</script>

<template>
  <section class="order-list-view" aria-labelledby="order-list-title">
    <header class="order-heading">
      <div><p>ORDER MANAGEMENT</p><h1 id="order-list-title">订单管理</h1><span>仅展示当前商家店铺订单</span></div>
      <el-button data-testid="reload-orders" :icon="Refresh" :loading="orderList.loading.value" @click="reloadOrders">刷新</el-button>
    </header>
    <form class="order-filters" aria-label="订单筛选" @submit.prevent="submitSearch">
      <label><span>订单状态</span><el-select v-model="orderList.status.value" aria-label="订单状态" @change="changeStatus"><el-option v-for="option in ORDER_STATUS_OPTIONS" :key="option.value" :label="option.label" :value="option.value" /></el-select></label>
      <el-button native-type="submit" type="primary">查询</el-button>
    </form>
    <div v-if="orderList.loading.value" class="order-state" data-testid="order-loading"><span>正在加载订单</span><el-skeleton :rows="5" animated /></div>
    <div v-else-if="orderList.error.value" class="order-state" data-testid="order-error" role="alert"><h2>订单列表加载失败</h2><p>请检查网络后重新加载。</p><el-button data-testid="retry-orders" type="primary" @click="reloadOrders">重新加载</el-button></div>
    <div v-else-if="orderList.items.value.length === 0" class="order-state" data-testid="order-empty"><el-empty description="当前筛选条件下暂无订单" /></div>
    <div v-else class="order-results"><div class="order-table-wrap"><el-table :data="orderList.items.value" row-key="id">
      <el-table-column label="订单号" prop="orderNo" min-width="220" />
      <el-table-column label="状态" width="104"><template #default="{ row }"><el-tag :type="getOrderStatus(row.status).type">{{ getOrderStatus(row.status).label }}</el-tag></template></el-table-column>
      <el-table-column label="实付金额" width="130"><template #default="{ row }"><strong>{{ formatAmount(row.payAmount) }}</strong></template></el-table-column>
      <el-table-column label="收货信息" min-width="290"><template #default="{ row }"><div class="receiver"><strong>{{ row.receiverName }} · {{ row.receiverPhone }}</strong><span>{{ row.receiverAddress }}</span></div></template></el-table-column>
      <el-table-column label="下单时间" width="180"><template #default="{ row }">{{ time(row.createTime) }}</template></el-table-column>
      <el-table-column label="支付时间" width="180"><template #default="{ row }">{{ time(row.payTime) }}</template></el-table-column>
      <el-table-column label="操作" width="148" fixed="right"><template #default="{ row }"><router-link class="detail-link" :data-testid="`order-detail-${row.id}`" :to="{ name: 'merchant-order-detail', params: { orderNo: row.orderNo } }">查看详情</router-link><el-button v-if="canDeliver(row)" :data-testid="`deliver-order-${row.id}`" link type="primary" :loading="isDelivering(row.orderNo)" :disabled="isDelivering(row.orderNo)" @click="openDelivery(row)">发货</el-button><span v-else>—</span></template></el-table-column>
    </el-table></div>
    <footer><span>共 {{ orderList.total.value }} 笔订单</span><el-pagination :current-page="orderList.page.value" :page-size="orderList.size.value" :page-sizes="[10, 20, 50]" :total="orderList.total.value" layout="sizes, prev, pager, next" background @current-change="changePage" @size-change="changeSize" /></footer></div>
  </section>
  <el-dialog v-model="deliveryOpen" title="订单发货" width="460px" :close-on-click-modal="false" :teleported="false">
    <el-form label-position="top">
      <el-form-item label="订单号"><el-input :model-value="delivery.orderNo" disabled /></el-form-item>
      <el-form-item label="快递公司" required><el-input v-model="delivery.logisticsCompany" data-testid="delivery-company" placeholder="例如：顺丰快递" /></el-form-item>
      <el-form-item label="快递单号" required><el-input v-model="delivery.logisticsNo" data-testid="delivery-number" placeholder="请输入快递单号" /></el-form-item>
    </el-form>
    <template #footer><el-button @click="deliveryOpen = false">取消</el-button><el-button data-testid="delivery-submit" type="primary" :loading="isDelivering(delivery.orderNo)" @click="submitDelivery">确认发货</el-button></template>
  </el-dialog>
</template>

<style scoped>
.order-list-view { max-width: 1320px; margin: 0 auto; }
.order-heading, .order-results footer { display: flex; align-items: center; justify-content: space-between; gap: var(--space-5); }
.order-heading p { margin: 0 0 var(--space-2); color: var(--color-accent); font-size: 10px; font-weight: 750; letter-spacing: .16em; }
.order-heading h1 { margin: 0; font-size: clamp(30px, 4vw, 44px); letter-spacing: -.04em; }
.order-heading span, .order-results footer > span { color: var(--color-muted); font-size: 13px; }
.order-filters { display: flex; align-items: end; gap: var(--space-4); margin-top: var(--space-8); padding: var(--space-5); border: 1px solid var(--color-line); border-radius: var(--radius-medium); background: var(--color-surface); }
.order-filters label { display: grid; width: 190px; gap: var(--space-2); color: var(--color-muted); font-size: 12px; font-weight: 650; }
.order-state, .order-results { margin-top: var(--space-5); padding: var(--space-5); border: 1px solid var(--color-line); border-radius: var(--radius-large); background: var(--color-surface); box-shadow: var(--shadow-soft); }
.order-state { min-height: 300px; } .order-state h2 { margin-top: 70px; } .order-table-wrap { overflow-x: auto; margin: calc(var(--space-5) * -1); margin-bottom: 0; }
.receiver { display: grid; gap: var(--space-1); } .receiver span { color: var(--color-muted); font-size: 12px; }
.order-results footer { padding-top: var(--space-5); }
.detail-link { margin-right: var(--space-3); color: var(--color-accent-strong); font-size: 14px; text-decoration: none; }
@media (max-width: 760px) { .order-heading, .order-results footer { align-items: stretch; flex-direction: column; } }
</style>
