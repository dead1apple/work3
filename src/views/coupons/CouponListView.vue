<script setup>
import { onMounted, reactive, ref } from 'vue'
import {
  ElButton, ElDatePicker, ElDialog, ElEmpty, ElForm, ElFormItem, ElInput, ElInputNumber, ElMessage,
  ElMessageBox, ElOption, ElPagination, ElSelect, ElSkeleton, ElTable, ElTableColumn,
  ElTag,
} from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import {
  createMerchantCoupon, getMerchantCoupon, getMerchantCouponStatistics, getMerchantCouponUsers,
  updateMerchantCoupon,
} from '../../api/coupon'
import {
  canEditCoupon, COUPON_STATUS_OPTIONS, COUPON_TYPE_OPTIONS, displayTime, formatCouponAmount,
  getCouponStatus, getCouponType,
} from './coupon-domain'
import { createCouponForm, toMerchantCouponPayload, validateCouponPayload } from './coupon-payload'
import { useCouponList } from './useCouponList'

const couponList = useCouponList()
const formOpen = ref(false)
const detailOpen = ref(false)
const saving = ref(false)
const detailLoading = ref(false)
const currentId = ref(null)
const couponForm = reactive(createCouponForm())
const detail = ref(null)
const statistics = ref(null)
const recipients = ref([])

function run(request) { void request().catch(() => {}) }
function reloadCoupons() { run(couponList.load) }
function submitSearch() { run(couponList.search) }
function changeStatus(nextStatus) { run(() => couponList.changeStatus(nextStatus)) }
function changePage(value) { run(() => couponList.changePage(value)) }
function changeSize(value) { run(() => couponList.changeSize(value)) }
function isUpdating(id) { return couponList.updatingCouponIds.value.has(id) }
function replaceForm(coupon) { Object.assign(couponForm, createCouponForm(coupon)) }

function openCreate() {
  currentId.value = null
  replaceForm()
  formOpen.value = true
}

async function openEdit(coupon) {
  if (!canEditCoupon(coupon)) return
  detailLoading.value = true
  try {
    const result = await getMerchantCoupon(coupon.id)
    currentId.value = coupon.id
    replaceForm(result)
    formOpen.value = true
  } catch (error) {
    ElMessage.error(error.message || '优惠券详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

async function submitCoupon() {
  if (saving.value) return
  const payload = toMerchantCouponPayload(couponForm)
  const validationMessage = validateCouponPayload(payload)
  if (validationMessage) {
    ElMessage.warning(validationMessage)
    return
  }
  saving.value = true
  try {
    if (currentId.value === null) await createMerchantCoupon(payload)
    else await updateMerchantCoupon(currentId.value, payload)
    formOpen.value = false
    await couponList.load()
    ElMessage.success(currentId.value === null ? '优惠券已创建' : '优惠券已更新')
  } catch (error) {
    ElMessage.error(error.message || '优惠券保存失败')
  } finally {
    saving.value = false
  }
}

async function toggleStatus(coupon) {
  if (![0, 1].includes(coupon.status) || isUpdating(coupon.id)) return
  const nextStatus = coupon.status === 1 ? 0 : 1
  const action = nextStatus === 1 ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(`确认${action}“${coupon.name}”吗？`, `${action}优惠券`, {
      type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await couponList.updateStatus(coupon.id, nextStatus)
    ElMessage.success(`${action}成功`)
  } catch (error) {
    ElMessage.error(error.message || `${action}失败`)
  }
}

async function openDetail(coupon) {
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null
  statistics.value = null
  recipients.value = []
  try {
    const [couponDetail, couponStatistics, couponUsers] = await Promise.all([
      getMerchantCoupon(coupon.id), getMerchantCouponStatistics(coupon.id), getMerchantCouponUsers(coupon.id),
    ])
    detail.value = couponDetail
    statistics.value = couponStatistics
    recipients.value = Array.isArray(couponUsers) ? couponUsers : []
  } catch (error) {
    ElMessage.error(error.message || '优惠券数据加载失败')
  } finally {
    detailLoading.value = false
  }
}

onMounted(reloadCoupons)
</script>

<template>
  <section class="coupon-list-view" aria-labelledby="coupon-list-title">
    <header class="coupon-heading">
      <div><p>COUPON MANAGEMENT</p><h1 id="coupon-list-title">优惠券管理</h1><span>仅展示并操作当前商家店铺的优惠券</span></div>
      <div class="coupon-heading-actions"><el-button data-testid="create-coupon" type="primary" :icon="Plus" @click="openCreate">创建优惠券</el-button><el-button data-testid="reload-coupons" :icon="Refresh" :loading="couponList.loading.value" @click="reloadCoupons">刷新</el-button></div>
    </header>

    <form class="coupon-filters" aria-label="优惠券筛选" @submit.prevent="submitSearch">
      <label><span>优惠券名称</span><el-input v-model="couponList.keyword.value" aria-label="优惠券名称关键字" clearable placeholder="输入名称关键字" /></label>
      <label><span>优惠券状态</span><el-select v-model="couponList.status.value" aria-label="优惠券状态" @change="changeStatus"><el-option v-for="option in COUPON_STATUS_OPTIONS" :key="option.value" :label="option.label" :value="option.value" /></el-select></label>
      <el-button native-type="submit" type="primary" :icon="Search">查询</el-button>
    </form>

    <div v-if="couponList.loading.value" class="coupon-state" data-testid="coupon-loading"><span>正在加载优惠券</span><el-skeleton :rows="5" animated /></div>
    <div v-else-if="couponList.error.value" class="coupon-state" data-testid="coupon-error" role="alert"><h2>优惠券列表加载失败</h2><p>请检查网络后重新加载。</p><el-button data-testid="retry-coupons" type="primary" @click="reloadCoupons">重新加载</el-button></div>
    <div v-else-if="couponList.items.value.length === 0" class="coupon-state" data-testid="coupon-empty"><el-empty description="当前筛选条件下暂无优惠券" /></div>
    <div v-else class="coupon-results"><div class="coupon-table-wrap"><el-table :data="couponList.items.value" row-key="id">
      <el-table-column label="优惠券" min-width="210"><template #default="{ row }"><div class="coupon-title"><strong>{{ row.name }}</strong><small>ID {{ row.id }}</small></div></template></el-table-column>
      <el-table-column label="类型" width="110"><template #default="{ row }">{{ getCouponType(row.type) }}</template></el-table-column>
      <el-table-column label="优惠值 / 门槛" min-width="154"><template #default="{ row }"><strong>{{ formatCouponAmount(row.amount) }}</strong><small>满 {{ formatCouponAmount(row.minAmount) }} 可用</small></template></el-table-column>
      <el-table-column label="发放 / 领取 / 使用" min-width="150"><template #default="{ row }">{{ row.totalCount }} / {{ row.issuedCount }} / {{ row.usedCount }}</template></el-table-column>
      <el-table-column label="有效期" min-width="190"><template #default="{ row }"><div class="coupon-time"><span>{{ displayTime(row.startTime) }}</span><span>至 {{ displayTime(row.endTime) }}</span></div></template></el-table-column>
      <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="getCouponStatus(row.status).type">{{ getCouponStatus(row.status).label }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="210" fixed="right"><template #default="{ row }"><el-button link type="primary" :loading="detailLoading" @click="openDetail(row)">数据</el-button><el-button v-if="canEditCoupon(row)" link type="primary" :loading="detailLoading" @click="openEdit(row)">编辑</el-button><el-button v-if="[0, 1].includes(row.status)" :data-testid="`coupon-status-${row.id}`" link :type="row.status === 1 ? 'danger' : 'success'" :loading="isUpdating(row.id)" :disabled="isUpdating(row.id)" @click="toggleStatus(row)">{{ row.status === 1 ? '停用' : '启用' }}</el-button><span v-else>—</span></template></el-table-column>
    </el-table></div><footer><span>共 {{ couponList.total.value }} 张优惠券</span><el-pagination :current-page="couponList.page.value" :page-size="couponList.size.value" :page-sizes="[10, 20, 50]" :total="couponList.total.value" layout="sizes, prev, pager, next" background @current-change="changePage" @size-change="changeSize" /></footer></div>
  </section>

  <el-dialog v-model="formOpen" :title="currentId === null ? '创建优惠券' : '编辑优惠券'" width="720px" :close-on-click-modal="false" :teleported="false">
    <el-form label-position="top" class="coupon-form">
      <el-form-item label="优惠券名称" required><el-input v-model="couponForm.name" maxlength="100" show-word-limit /></el-form-item>
      <div class="form-grid"><el-form-item label="类型" required><el-select v-model="couponForm.type"><el-option v-for="option in COUPON_TYPE_OPTIONS" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item><el-form-item label="优惠值" required><el-input-number v-model="couponForm.amount" :min="0.01" :precision="2" controls-position="right" /></el-form-item><el-form-item label="使用门槛" required><el-input-number v-model="couponForm.minAmount" :min="0" :precision="2" controls-position="right" /></el-form-item><el-form-item label="发放数量" required><el-input-number v-model="couponForm.totalCount" :min="1" :precision="0" controls-position="right" /></el-form-item></div>
      <div class="form-grid"><el-form-item label="开始时间" required><el-date-picker v-model="couponForm.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择开始时间" /></el-form-item><el-form-item label="结束时间" required><el-date-picker v-model="couponForm.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择结束时间" /></el-form-item></div>
      <div class="form-grid"><el-form-item label="每人限领数量"><el-input-number v-model="couponForm.perUserLimit" :min="1" :precision="0" controls-position="right" /></el-form-item><el-form-item label="最高优惠值"><el-input-number v-model="couponForm.maxDiscountAmount" :min="0.01" :precision="2" controls-position="right" /></el-form-item><el-form-item label="初始状态" required><el-select v-model="couponForm.status"><el-option v-for="option in COUPON_STATUS_OPTIONS.slice(1)" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item></div>
      <p class="optional-time-hint">可选时间字段按后端 DTO 保留：领取开始/结束、使用开始/结束。</p>
      <div class="form-grid"><el-form-item label="领取开始时间"><el-date-picker v-model="couponForm.receiveStartTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择领取开始时间" /></el-form-item><el-form-item label="领取结束时间"><el-date-picker v-model="couponForm.receiveEndTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择领取结束时间" /></el-form-item><el-form-item label="使用开始时间"><el-date-picker v-model="couponForm.useStartTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择使用开始时间" /></el-form-item><el-form-item label="使用结束时间"><el-date-picker v-model="couponForm.useEndTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择使用结束时间" /></el-form-item></div>
    </el-form>
    <template #footer><el-button :disabled="saving" @click="formOpen = false">取消</el-button><el-button data-testid="save-coupon" type="primary" :loading="saving" :disabled="saving" @click="submitCoupon">保存</el-button></template>
  </el-dialog>

  <el-dialog v-model="detailOpen" title="优惠券数据" width="720px" :teleported="false"><div v-if="detailLoading" class="detail-loading"><el-skeleton :rows="6" animated /></div><template v-else-if="detail"><dl class="coupon-detail"><div><dt>优惠券</dt><dd>{{ detail.name }}</dd></div><div><dt>类型</dt><dd>{{ getCouponType(detail.type) }}</dd></div><div><dt>有效期</dt><dd>{{ displayTime(detail.startTime) }} 至 {{ displayTime(detail.endTime) }}</dd></div><div><dt>领取 / 使用</dt><dd>{{ detail.issuedCount }} / {{ detail.usedCount }}</dd></div></dl><p v-if="statistics?.operations" class="optional-time-hint">统计操作记录：{{ statistics.operations }}</p><h3>领取与核销明细</h3><el-table :data="recipients" max-height="280"><el-table-column prop="username" label="用户" /><el-table-column prop="receiveTime" label="领取时间" /><el-table-column prop="effectiveEndTime" label="有效截止" /><el-table-column prop="userStatus" label="用户券状态" /></el-table><el-empty v-if="recipients.length === 0" description="暂无领取或核销记录" /></template></el-dialog>
</template>

<style scoped>
.coupon-list-view { max-width: 1320px; margin: 0 auto; }
.coupon-heading, .coupon-results footer { display: flex; align-items: center; justify-content: space-between; gap: var(--space-5); }
.coupon-heading p { margin: 0 0 var(--space-2); color: var(--color-accent); font-size: 10px; font-weight: 750; letter-spacing: .16em; }.coupon-heading h1 { margin: 0; font-size: clamp(30px, 4vw, 44px); letter-spacing: -.04em; }.coupon-heading span, .coupon-results footer > span, .optional-time-hint { color: var(--color-muted); font-size: 13px; }.coupon-heading-actions { display: flex; gap: var(--space-3); }
.coupon-filters { display: grid; grid-template-columns: minmax(240px, 1fr) 190px auto; align-items: end; gap: var(--space-4); margin-top: var(--space-8); padding: var(--space-5); border: 1px solid var(--color-line); border-radius: var(--radius-medium); background: var(--color-surface); }.coupon-filters label { display: grid; gap: var(--space-2); color: var(--color-muted); font-size: 12px; font-weight: 650; }
.coupon-state, .coupon-results { margin-top: var(--space-5); padding: var(--space-5); border: 1px solid var(--color-line); border-radius: var(--radius-large); background: var(--color-surface); box-shadow: var(--shadow-soft); }.coupon-state { min-height: 280px; }.coupon-table-wrap { overflow-x: auto; margin: calc(var(--space-5) * -1); margin-bottom: 0; }.coupon-results footer { padding-top: var(--space-5); }.coupon-title, .coupon-time { display: grid; gap: var(--space-1); }.coupon-title small, .coupon-time { color: var(--color-muted); font-size: 12px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 var(--space-4); }.coupon-form :deep(.el-input-number), .coupon-form :deep(.el-select), .coupon-form :deep(.el-date-editor) { width: 100%; }.coupon-detail { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4); }.coupon-detail div { padding: var(--space-3); border-radius: var(--radius-small); background: var(--color-canvas); }.coupon-detail dt { color: var(--color-muted); font-size: 12px; }.coupon-detail dd { margin: var(--space-1) 0 0; font-weight: 650; }.detail-loading { min-height: 200px; }
@media (max-width: 760px) { .coupon-heading, .coupon-results footer { align-items: stretch; flex-direction: column; }.coupon-heading-actions { align-items: stretch; }.coupon-filters, .form-grid, .coupon-detail { grid-template-columns: 1fr; } }
</style>
