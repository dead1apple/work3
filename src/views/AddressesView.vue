<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { addAddress, deleteAddress, getAddressList, setDefaultAddress, updateAddress } from '../api/index.js'
import { normalizeAddressList } from '../utils/commerce.js'
import { runAddressSaveWorkflow } from '../utils/address.js'
import { getCities, getDistricts, getProvinces } from '../utils/regions.js'

const addressForm = ref()
const loading = ref(true); const saving = ref(false); const dialogVisible = ref(false); const editingId = ref(null)
const loadError = ref('')
const writingKey = ref('')
const addresses = ref([]); const provinces = getProvinces()
let requestSequence = 0
const emptyForm = () => ({ receiverName: '', receiverPhone: '', province: '', city: '', district: '', detailAddress: '', isDefault: 0 })
const form = ref(emptyForm())
const dialogTitle = computed(() => editingId.value ? '编辑收货地址' : '新增收货地址')
const cityOptions = computed(() => getCities(form.value.province))
const districtOptions = computed(() => getDistricts(form.value.province, form.value.city))
const rules = {
  receiverName: [{ required: true, message: '请填写收货人姓名', trigger: 'blur' }],
  receiverPhone: [{ required: true, message: '请填写手机号码', trigger: 'blur' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的 11 位手机号码', trigger: 'blur' }],
  province: [{ required: true, message: '请选择省级行政区', trigger: 'change' }],
  city: [{ required: true, message: '请选择城市', trigger: 'change' }],
  district: [{ required: true, message: '请选择区或县', trigger: 'change' }],
  detailAddress: [{ required: true, message: '请填写街道、门牌号等详细地址', trigger: 'blur' }],
}
async function loadAddresses() {
  const sequence = ++requestSequence
  loading.value = true
  loadError.value = ''
  addresses.value = []
  try {
    const nextAddresses = normalizeAddressList(await getAddressList())
    if (sequence !== requestSequence) return
    addresses.value = nextAddresses
  } catch (error) {
    if (sequence !== requestSequence) return
    loadError.value = error?.message || '收货地址加载失败，请稍后重试'
    ElMessage.error(loadError.value)
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}
async function openDialog(item) { editingId.value = item?.id || null; form.value = item ? { ...emptyForm(), ...item, isDefault: item.isDefault ? 1 : 0 } : emptyForm(); dialogVisible.value = true; await nextTick(); addressForm.value?.clearValidate() }
function onProvinceChange() { form.value.city = ''; form.value.district = ''; addressForm.value?.clearValidate(['city', 'district']) }
function onCityChange() { form.value.district = ''; addressForm.value?.clearValidate('district') }
async function saveAddress() {
  await runAddressSaveWorkflow({
    isSaving: () => saving.value,
    setSaving: (value) => { saving.value = value },
    validate: () => addressForm.value?.validate(),
    getForm: () => form.value,
    getEditingId: () => editingId.value,
    addAddress,
    updateAddress,
    onSuccess: (mode) => ElMessage.success(mode === 'update' ? '收货地址已更新' : '收货地址已添加'),
    closeDialog: () => { dialogVisible.value = false },
    reload: loadAddresses,
    onError: (error) => ElMessage.error(error?.message || '保存失败，请稍后重试'),
  })
}
async function makeDefault(item) {
  if (item.isDefault || writingKey.value) return
  writingKey.value = `default:${item.id}`
  try { await setDefaultAddress(item.id); ElMessage.success('已设为默认收货地址'); await loadAddresses() }
  catch (error) { ElMessage.error(error?.message || '设置默认地址失败') }
  finally { writingKey.value = '' }
}
async function removeAddress(item) {
  if (writingKey.value) return
  writingKey.value = `delete:${item.id}`
  try {
    await ElMessageBox.confirm(`确认删除「${item.receiverName}」的收货地址吗？`, '删除收货地址', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning', center: true })
    await deleteAddress(item.id)
    ElMessage.success('收货地址已删除')
    await loadAddresses()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(error?.message || '删除失败，请稍后重试')
  } finally { writingKey.value = '' }
}
onMounted(loadAddresses)
</script>

<template>
  <section class="address-page"><div class="address-shell">
    <header class="address-head"><div><h1>收货地址</h1><p>请准确填写收货信息，便于商品配送</p></div><el-button class="add-address" type="primary" @click="openDialog()">新增收货地址</el-button></header>
    <el-skeleton v-if="loading" :rows="7" animated class="address-skeleton" />
    <el-result v-else-if="loadError" icon="error" title="地址加载失败" :sub-title="loadError"><template #extra><el-button type="primary" @click="loadAddresses">重新加载</el-button></template></el-result>
    <el-empty v-else-if="!addresses.length" description="暂未添加收货地址"><el-button type="primary" @click="openDialog()">添加收货地址</el-button></el-empty>
    <div v-else class="address-grid">
      <article v-for="item in addresses" :key="item.id" class="address-item" :class="{ 'is-default': item.isDefault }"><div class="address-topline"><div class="recipient"><strong>{{ item.receiverName }}</strong><span>{{ item.receiverPhone }}</span></div><el-tag v-if="item.isDefault" class="default-tag" effect="dark">默认地址</el-tag></div><p class="address-region">{{ [item.province, item.city, item.district].filter(Boolean).join(' ') }}</p><p class="address-detail">{{ item.detailAddress }}</p><footer class="address-actions"><el-button link :disabled="Boolean(writingKey)" @click="openDialog(item)">编辑</el-button><el-button link :disabled="item.isDefault || Boolean(writingKey)" :loading="writingKey === `default:${item.id}`" @click="makeDefault(item)">设为默认</el-button><el-button link type="danger" :disabled="Boolean(writingKey)" :loading="writingKey === `delete:${item.id}`" @click="removeAddress(item)">删除</el-button></footer></article>
      <button class="address-item add-tile" type="button" @click="openDialog()"><b>＋</b><span>新增收货地址</span></button>
    </div>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="min(920px, calc(100vw - 32px))" align-center append-to-body destroy-on-close class="jd-address-dialog" modal-class="address-dialog-overlay">
      <div class="dialog-body"><p class="dialog-tip">请填写真实有效的收货信息，带 <b>*</b> 的项目为必填项。</p>
      <el-form ref="addressForm" :model="form" :rules="rules" label-width="96px" class="address-form">
        <el-form-item label="收货人" prop="receiverName"><el-input v-model.trim="form.receiverName" maxlength="20" placeholder="请输入收货人姓名" /></el-form-item>
        <el-form-item label="手机号码" prop="receiverPhone"><el-input v-model.trim="form.receiverPhone" maxlength="11" placeholder="请输入 11 位手机号码" /></el-form-item>
        <div class="region-row">
          <el-form-item label="所在地区" prop="province"><el-select v-model="form.province" placeholder="请选择省级行政区" filterable @change="onProvinceChange"><el-option v-for="item in provinces" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
          <el-form-item v-if="form.province" label="城市" prop="city"><el-select v-model="form.city" placeholder="请选择城市" filterable @change="onCityChange"><el-option v-for="item in cityOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
          <el-form-item v-if="form.city" label="区 / 县" prop="district"><el-select v-model="form.district" placeholder="请选择区 / 县" filterable><el-option v-for="item in districtOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
        </div>
        <el-form-item label="详细地址" prop="detailAddress"><el-input v-model.trim="form.detailAddress" type="textarea" :rows="3" maxlength="80" show-word-limit placeholder="请输入街道、门牌号、楼栋、单元等详细信息" /></el-form-item>
        <el-form-item label=""><el-checkbox v-model="form.isDefault" :true-value="1" :false-value="0">设为默认收货地址</el-checkbox></el-form-item>
      </el-form></div>
      <template #footer><div class="dialog-actions"><el-button size="large" :disabled="saving" @click="dialogVisible = false">取消</el-button><el-button type="primary" size="large" :loading="saving" @click="saveAddress">保存地址</el-button></div></template>
    </el-dialog>
  </div></section>
</template>

<style scoped>
.address-page{min-height:620px;padding:26px 0 48px;font-family:Arial,'Microsoft YaHei',sans-serif;background:#f5f5f5}.address-shell{width:1000px;max-width:calc(100% - 32px);min-height:490px;margin:0 auto;padding:0 30px 36px;background:#fff}.address-head{display:flex;align-items:center;justify-content:space-between;min-height:82px;border-bottom:2px solid #e1251b}.address-head h1{margin:0 0 7px;color:#333;font-size:18px;font-weight:500}.address-head p{margin:0;color:#999;font-size:12px}.add-address{height:32px;padding:0 16px;border-radius:0;font-size:13px}.address-skeleton{margin:24px 0}.address-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:24px}.address-item{position:relative;min-height:176px;padding:18px 20px;border:1px solid #ddd;border-radius:0;background:#fff;transition:border-color .15s}.address-item:hover{border-color:#e1251b}.address-item.is-default{border-color:#e1251b;box-shadow:inset 0 2px #e1251b}.address-topline,.recipient,.address-actions{display:flex;align-items:center}.address-topline{justify-content:space-between;gap:12px}.recipient{gap:12px}.recipient strong{color:#333;font-size:16px}.recipient span{color:#666;font-size:13px}.default-tag{--el-tag-bg-color:#e1251b;--el-tag-border-color:#e1251b;border-radius:0}.address-region{margin:25px 0 7px;color:#333;font-size:13px}.address-detail{margin:0;color:#666;font-size:13px;line-height:1.6}.address-actions{justify-content:flex-end;gap:5px;margin-top:20px}.address-actions .el-button{font-size:12px}.add-tile{display:flex;align-items:center;justify-content:center;gap:10px;border-style:dashed;color:#666;cursor:pointer}.add-tile:hover{color:#e1251b;background:#fffafa}.add-tile b{font-size:22px;font-weight:400}.dialog-body{width:720px;max-width:100%;padding:8px 0 20px 12px;color:#333}.dialog-tip{margin:0 0 22px;color:#777;font-size:13px}.dialog-tip b{color:#e1251b}.address-form{width:660px;max-width:100%}.address-form :deep(.el-form-item){margin-bottom:20px}.address-form :deep(.el-form-item__label){color:#555;font-size:14px;line-height:32px}.address-form :deep(.el-form-item__label:before){color:#e1251b}.address-form :deep(.el-input__wrapper),.address-form :deep(.el-textarea__inner){border-radius:0;background:#fff;box-shadow:0 0 0 1px #bbb inset}.address-form :deep(.el-input__wrapper.is-focus),.address-form :deep(.el-textarea__inner:focus){box-shadow:0 0 0 1px #e1251b inset}.address-form :deep(.el-input__inner),.address-form :deep(.el-textarea__inner),.address-form :deep(.el-checkbox__label){color:#333}.region-row :deep(.el-select){width:100%}.dialog-actions{display:flex;justify-content:flex-start;padding-left:108px;gap:10px}.dialog-actions .el-button{min-width:108px;border-radius:0}
:global(.address-dialog-overlay){background:rgba(0,0,0,.46)!important}.address-dialog-overlay :global(.el-overlay-dialog){display:flex;align-items:center;justify-content:center;padding:24px}.address-dialog-overlay :global(.jd-address-dialog.el-dialog){position:relative;min-height:520px;margin:0 auto!important;border:1px solid #b7b7b7;border-radius:0!important;background:#fff!important;color:#333!important;opacity:1!important;box-shadow:0 8px 28px rgba(0,0,0,.28)}.address-dialog-overlay :global(.jd-address-dialog .el-dialog__header){position:relative;display:flex;align-items:center;min-height:46px;margin:0;padding:0 52px 0 20px;border-bottom:1px solid #ccc;background:#f7f7f7}.address-dialog-overlay :global(.jd-address-dialog .el-dialog__title){color:#333!important;font-size:17px;font-weight:500;line-height:46px}.address-dialog-overlay :global(.jd-address-dialog .el-dialog__headerbtn){position:absolute;top:7px;right:10px;width:32px;height:32px;border:1px solid transparent}.address-dialog-overlay :global(.jd-address-dialog .el-dialog__headerbtn:hover){border-color:#ccc;background:#fff}.address-dialog-overlay :global(.jd-address-dialog .el-dialog__close){color:#555!important;font-size:20px}.address-dialog-overlay :global(.jd-address-dialog .el-dialog__body){padding:28px 30px 10px;background:#fff!important;color:#333!important}.address-dialog-overlay :global(.jd-address-dialog .el-dialog__footer){padding:0 30px 28px;background:#fff!important}
@media(max-width:680px){.address-page{padding-top:0}.address-shell{max-width:100%;padding:0 18px 28px}.address-head{min-height:74px}.address-grid{grid-template-columns:1fr}.dialog-body{padding-left:0}.dialog-actions{justify-content:flex-end;padding-left:0}.address-dialog-overlay :global(.el-overlay-dialog){align-items:flex-start;padding:12px}.address-dialog-overlay :global(.jd-address-dialog.el-dialog){min-height:0}.address-dialog-overlay :global(.jd-address-dialog .el-dialog__body){padding:20px}.address-form :deep(.el-form-item__label){width:auto!important;text-align:left}.address-form :deep(.el-form-item){display:block}.address-form :deep(.el-form-item__content){margin-left:0!important}}
:global(.address-dialog-overlay .el-overlay-dialog){display:flex;align-items:center;justify-content:center;padding:24px}
:global(.address-dialog-overlay .jd-address-dialog.el-dialog){position:relative;min-height:520px;margin:0 auto!important;border:1px solid #b7b7b7;border-radius:0!important;background:#fff!important;color:#333!important;opacity:1!important;box-shadow:0 8px 28px rgba(0,0,0,.28)}
:global(.address-dialog-overlay .jd-address-dialog .el-dialog__header){position:relative;display:flex;align-items:center;min-height:46px;margin:0;padding:0 52px 0 20px;border-bottom:1px solid #ccc;background:#f7f7f7}
:global(.address-dialog-overlay .jd-address-dialog .el-dialog__title){color:#333!important;font-size:17px;font-weight:500;line-height:46px}
:global(.address-dialog-overlay .jd-address-dialog .el-dialog__headerbtn){position:absolute;top:7px;right:10px;width:32px;height:32px;border:1px solid transparent}
:global(.address-dialog-overlay .jd-address-dialog .el-dialog__headerbtn:hover){border-color:#ccc;background:#fff}
:global(.address-dialog-overlay .jd-address-dialog .el-dialog__close){color:#555!important;font-size:20px}
:global(.address-dialog-overlay .jd-address-dialog .el-dialog__body){padding:28px 30px 10px;background:#fff!important;color:#333!important}
:global(.address-dialog-overlay .jd-address-dialog .el-dialog__footer){padding:0 30px 28px;background:#fff!important}
</style>
