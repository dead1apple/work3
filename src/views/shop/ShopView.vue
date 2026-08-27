<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElAlert, ElButton, ElEmpty, ElMessage, ElSkeleton, ElTag } from 'element-plus'
import { EditPen, Refresh } from '@element-plus/icons-vue'
import { applyForCurrentShop, updateCurrentShop } from '../../api/shop'
import { useShopStore } from '../../store/shop'
import ShopFormFields from './ShopFormFields.vue'
import { buildShopApplicationPayload, buildShopUpdatePayload } from './shop-payload'

const shop = useShopStore()
const editing = ref(false)
const saving = ref(false)
const submitError = ref(null)
const form = reactive({ shopName: '', logo: '', description: '', licenseImage: '', location: '', address: '' })
const SHOP_STATUS = { 0: ['待审核', 'warning'], 1: ['营业中', 'success'], 2: ['已禁用', 'danger'], 3: ['已拒绝', 'danger'] }
const current = computed(() => shop.shop)
const currentStatus = computed(() => SHOP_STATUS[current.value?.status] || ['未知状态', 'info'])

function copyToForm(value) { Object.assign(form, { shopName: value?.shopName || '', logo: value?.logo || '', description: value?.description || '', licenseImage: value?.licenseImage || '', location: value?.location || '', address: value?.address || '' }) }
async function load() { try { await shop.refresh(); copyToForm(shop.shop) } catch {} }
function startEdit() { submitError.value = null; copyToForm(current.value); editing.value = true }
function cancelEdit() { submitError.value = null; copyToForm(current.value); editing.value = false }
async function save() {
  if (saving.value) return
  if (!form.shopName.trim()) { ElMessage.warning('请输入店铺名称'); return }
  saving.value = true; submitError.value = null
  try { await updateCurrentShop(buildShopUpdatePayload(current.value, form)); await shop.refresh(); copyToForm(shop.shop); editing.value = false; ElMessage.success('店铺资料已更新') } catch (error) { submitError.value = error } finally { saving.value = false }
}
async function apply() {
  if (saving.value) return
  if (!form.shopName.trim()) { ElMessage.warning('请输入店铺名称'); return }
  saving.value = true; submitError.value = null
  try { await applyForCurrentShop(buildShopApplicationPayload(form)); await shop.refresh(); copyToForm(shop.shop); ElMessage.success('店铺申请已提交') } catch (error) { submitError.value = error } finally { saving.value = false }
}
onMounted(load)
</script>

<template>
  <section class="shop-view" aria-labelledby="shop-title">
    <header class="shop-heading"><div><p>SHOP MANAGEMENT</p><h1 id="shop-title">店铺管理</h1><span>资料归属、审核状态由服务端身份与规则决定</span></div><el-button :icon="Refresh" :loading="shop.status === 'loading'" @click="load">刷新</el-button></header>
    <div v-if="shop.status === 'loading'" class="shop-state" data-testid="shop-loading"><span>正在加载店铺资料</span><el-skeleton :rows="7" animated /></div>
    <div v-else-if="shop.status === 'error'" class="shop-state shop-state--error" data-testid="shop-error" role="alert"><h2>店铺资料加载失败</h2><p>{{ shop.error?.message || '请检查网络后重试。' }}</p><el-button data-testid="retry-shop" type="primary" @click="load">重新加载</el-button></div>
    <div v-else-if="shop.hasNoShop" class="shop-state" data-testid="shop-empty"><el-empty description="当前账号尚未关联店铺" /><p>可提交店铺入驻申请；提交后状态以服务端审核结果为准。</p><form class="shop-form" @submit.prevent="apply"><ShopFormFields :model-value="form" /><el-alert v-if="submitError" type="error" :title="submitError.message || '申请失败'" :closable="false" /><p v-if="submitError" class="submit-error" role="alert">{{ submitError.message || '申请失败' }}</p><el-button type="primary" :loading="saving" @click="apply">提交店铺申请</el-button></form></div>
    <template v-else-if="current">
      <section class="shop-card shop-overview"><div class="shop-logo"><img v-if="current.logo" :src="current.logo" :alt="current.shopName"><span v-else>{{ current.shopName.slice(0, 1) }}</span></div><div><span class="eyebrow">CURRENT SHOP</span><h2>{{ current.shopName }}</h2><p>{{ current.description || '暂无店铺简介' }}</p></div><div class="shop-status"><el-tag :type="currentStatus[1]">{{ currentStatus[0] }}</el-tag><span>综合评分 {{ current.rating ?? '—' }}</span></div></section>
      <section v-if="!editing" class="shop-card shop-details"><header><h2>店铺资料</h2><el-button data-testid="edit-shop" type="primary" plain :icon="EditPen" @click="startEdit">编辑资料</el-button></header><dl><div><dt>店铺地址</dt><dd>{{ current.address || '—' }}</dd></div><div><dt>坐标</dt><dd>{{ current.location || '—' }}</dd></div><div><dt>营业执照</dt><dd>{{ current.licenseImage ? '已上传' : '未上传' }}</dd></div><div><dt>创建时间</dt><dd>{{ current.createTime || '—' }}</dd></div><div><dt>更新时间</dt><dd>{{ current.updateTime || '—' }}</dd></div></dl></section>
      <form v-else class="shop-card shop-form" @submit.prevent="save"><header><h2>编辑店铺资料</h2><span>保存后重新从服务器刷新店铺上下文。</span></header><ShopFormFields :model-value="form" /><el-alert v-if="submitError" type="error" :title="submitError.message || '保存失败'" :closable="false" /><p v-if="submitError" class="submit-error" role="alert">{{ submitError.message || '保存失败' }}</p><footer><el-button @click="cancelEdit">取消</el-button><el-button data-testid="save-shop" type="primary" :loading="saving" :disabled="saving" @click="save">保存资料</el-button></footer></form>
    </template>
  </section>
</template>

<style scoped>
.shop-view { max-width: 1040px; margin: 0 auto; }.shop-heading,.shop-card>header,.shop-card footer { display:flex; align-items:center; justify-content:space-between; gap:var(--space-5); }.shop-heading p,.eyebrow { margin:0 0 var(--space-2); color:var(--color-accent); font-size:10px; font-weight:750; letter-spacing:.16em; }.shop-heading h1 { margin:0; font-size:clamp(30px,4vw,44px); letter-spacing:-.04em; }.shop-heading span,.shop-card header span { color:var(--color-muted); font-size:13px; }.shop-state,.shop-card { margin-top:var(--space-5); padding:clamp(22px,4vw,34px); border:1px solid var(--color-line); border-radius:var(--radius-large); background:var(--color-surface); box-shadow:var(--shadow-soft); }.shop-state { min-height:280px; }.shop-state--error { display:grid; align-content:center; justify-items:start; }.shop-overview { display:grid; grid-template-columns:76px 1fr auto; align-items:center; gap:var(--space-5); }.shop-logo { display:grid; width:76px;height:76px;place-items:center;overflow:hidden;border-radius:var(--radius-medium);background:var(--color-accent-soft);color:var(--color-accent-strong);font-size:28px;font-weight:750;}.shop-logo img{width:100%;height:100%;object-fit:cover}.shop-overview h2{margin:0;font-size:24px}.shop-overview p{margin:var(--space-2) 0 0;color:var(--color-muted)}.shop-status{display:grid;justify-items:end;gap:var(--space-2);color:var(--color-muted);font-size:13px}.shop-details h2,.shop-form h2{margin:0;font-size:20px}dl{display:grid;gap:var(--space-3);margin:var(--space-5) 0 0}dl div{display:grid;grid-template-columns:100px 1fr;gap:var(--space-4)}dt{color:var(--color-muted);font-size:12px}dd{margin:0;overflow-wrap:anywhere}.shop-form{display:grid;gap:var(--space-5)}.submit-error{margin:0;color:var(--el-color-danger);font-size:13px}.shop-form :deep(.form-fields){display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--space-5)}@media(max-width:760px){.shop-heading,.shop-card>header,.shop-card footer{align-items:stretch;flex-direction:column}.shop-overview{grid-template-columns:76px 1fr}.shop-status{grid-column:1/-1;justify-items:start}.shop-form :deep(.form-fields){grid-template-columns:1fr}}
</style>
