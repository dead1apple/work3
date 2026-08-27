<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { applyForShop, getMyShop } from '../../api/merchant.js'
import { useUserStore } from '../../store/user.js'
import {
  createMerchantShopFlow,
  getMerchantShopView,
  MERCHANT_PORTAL_HREF,
  validateShopApplication,
} from '../../utils/merchantShop.js'

const userStore = useUserStore()
const formRef = ref()
const refreshingUser = ref(false)
const flow = reactive(createMerchantShopFlow({ getShop: getMyShop, applyShop: applyForShop }))
const form = reactive({
  shopName: '',
  logo: '',
  description: '',
  licenseImage: '',
  location: '',
  address: '',
})

const statusView = computed(() => getMerchantShopView(flow.shop, userStore.role))
const initializing = computed(() => flow.shop === undefined && !flow.loadError && !flow.submittedUnconfirmed)

const fieldValidator = (field) => (_rule, value, callback) => {
  const error = validateShopApplication({ ...form, [field]: value })[field]
  if (error) callback(new Error(error))
  else callback()
}

const rules = {
  shopName: [{ validator: fieldValidator('shopName'), trigger: 'blur' }],
  logo: [{ validator: fieldValidator('logo'), trigger: 'blur' }],
  licenseImage: [{ validator: fieldValidator('licenseImage'), trigger: 'blur' }],
}

const loadShop = async () => {
  await flow.load()
}

const submitApplication = async () => {
  if (flow.submitting) return
  if (!(await formRef.value?.validate().catch(() => false))) return

  const confirmed = await flow.submit(form)
  if (flow.submissionError) {
    ElMessage.error(flow.submissionError.message || '店铺申请提交失败')
  } else if (flow.submittedUnconfirmed) {
    ElMessage.warning('申请已提交，但暂未取得店铺状态，请刷新后重试')
  } else if (confirmed) {
    ElMessage.success('店铺申请已提交，状态已同步')
  }
}

const refreshSubmittedStatus = async () => {
  const confirmed = await flow.refreshSubmittedStatus()
  if (confirmed) ElMessage.success('店铺状态已更新')
  else if (flow.confirmationError) ElMessage.error(flow.confirmationError.message || '店铺状态读取失败')
  else ElMessage.warning('暂未取得店铺状态，请稍后重试')
}

const refreshAccountRole = async () => {
  refreshingUser.value = true
  try {
    await userStore.refreshUserInfo()
    if (userStore.role === 1) {
      window.location.assign(MERCHANT_PORTAL_HREF)
      return
    }
    ElMessage.warning('账号角色尚未同步，请重新登录或联系平台管理员')
  } catch (error) {
    ElMessage.error(error?.message || '账号状态刷新失败')
  } finally {
    refreshingUser.value = false
  }
}

onMounted(loadShop)
</script>

<template>
  <main class="merchant-apply-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">MERCHANT ONBOARDING</p>
        <h1>商家入驻与店铺状态</h1>
        <p class="heading-copy">提交真实店铺资料，或查看当前申请的服务端状态。</p>
      </div>
      <RouterLink to="/profile">返回个人中心</RouterLink>
    </header>

    <el-skeleton v-if="flow.loading || initializing" :rows="7" animated class="state-panel" />

    <section v-else-if="flow.loadError" class="state-panel error-panel" aria-labelledby="load-error-title">
      <span class="state-mark" aria-hidden="true">!</span>
      <p class="state-label">读取失败</p>
      <h2 id="load-error-title">无法取得店铺状态</h2>
      <p>{{ flow.loadError.message || '网络开小差了，请稍后重新加载。' }}</p>
      <el-button type="danger" :loading="flow.loading" @click="loadShop">重新加载</el-button>
    </section>

    <section v-else-if="flow.submittedUnconfirmed" class="state-panel warning-panel" aria-labelledby="confirmation-title">
      <span class="state-mark" aria-hidden="true">…</span>
      <p class="state-label">等待状态同步</p>
      <h2 id="confirmation-title">申请已提交，但暂未取得店铺状态</h2>
      <p v-if="flow.confirmationError">{{ flow.confirmationError.message || '状态读取失败，请稍后重试。' }}</p>
      <p v-else>服务端暂未返回店铺记录。为避免重复申请，本页面不会再次显示提交表单。</p>
      <el-button type="danger" :loading="flow.confirmationLoading" @click="refreshSubmittedStatus">刷新店铺状态</el-button>
    </section>

    <section v-else-if="flow.shop === null" class="application-shell" aria-labelledby="application-title">
      <aside class="application-intro">
        <p class="state-label">首次入驻</p>
        <h2 id="application-title">申请成为商家</h2>
        <p>请填写店铺的基础资料。平台审核结果将以服务端店铺状态为准。</p>
        <ul>
          <li>Logo 与营业执照仅支持图片 URL</li>
          <li>本页面不会上传本地文件</li>
          <li>提交后不可在本任务中编辑或重新申请</li>
        </ul>
      </aside>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="application-form" @submit.prevent="submitApplication">
        <el-form-item label="店铺名称" prop="shopName" required>
          <el-input v-model="form.shopName" size="large" placeholder="请输入店铺名称" autocomplete="organization" />
        </el-form-item>
        <el-form-item label="店铺 Logo URL" prop="logo">
          <el-input v-model="form.logo" size="large" placeholder="https://example.com/logo.png" autocomplete="url" />
        </el-form-item>
        <el-form-item label="店铺简介">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="简要介绍店铺经营内容" />
        </el-form-item>
        <el-form-item label="营业执照图片 URL" prop="licenseImage">
          <el-input v-model="form.licenseImage" size="large" placeholder="https://example.com/license.png" autocomplete="url" />
        </el-form-item>
        <div class="form-grid">
          <el-form-item label="店铺位置">
            <el-input v-model="form.location" size="large" placeholder="例如：上海市浦东新区" />
          </el-form-item>
          <el-form-item label="店铺详细地址">
            <el-input v-model="form.address" size="large" placeholder="请输入详细地址" autocomplete="street-address" />
          </el-form-item>
        </div>
        <p class="form-note">提交即代表这些资料将发送给平台审核。请确认 URL 可被平台正常访问。</p>
        <el-button class="submit-button" native-type="submit" type="danger" size="large" :loading="flow.submitting">提交入驻申请</el-button>
      </el-form>
    </section>

    <section v-else class="state-panel shop-state" :class="`is-${statusView.kind}`" aria-labelledby="shop-status-title">
      <span class="state-mark" aria-hidden="true">{{ statusView.kind === 'active' ? '✓' : '•' }}</span>
      <p class="state-label">{{ flow.shop?.shopName || '当前店铺' }}</p>
      <h2 id="shop-status-title">{{ statusView.title }}</h2>
      <p>{{ statusView.description }}</p>
      <div class="state-actions">
        <a v-if="statusView.canEnterMerchant" class="merchant-portal-link" :href="MERCHANT_PORTAL_HREF">进入商家中心</a>
        <el-button v-if="statusView.canRefreshUser" type="danger" :loading="refreshingUser" @click="refreshAccountRole">刷新账号状态</el-button>
        <el-button plain @click="loadShop">重新读取店铺状态</el-button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.merchant-apply-page { --merchant-red: #e1251b; --merchant-ink: #20242b; --merchant-muted: #78818d; padding: 4px 0 36px; color: var(--merchant-ink); }
.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 24px; padding: 26px 30px; border: 1px solid #eceef1; border-radius: 18px; background: linear-gradient(120deg, #fff 55%, #fff2f1); }.eyebrow,.state-label { margin: 0 0 8px; color: var(--merchant-red); font-size: 11px; font-weight: 800; letter-spacing: .15em; }.page-heading h1 { margin: 0; font-size: clamp(27px, 4vw, 38px); letter-spacing: -.05em; }.heading-copy { margin: 12px 0 0; color: var(--merchant-muted); }.page-heading a { color: var(--merchant-red); font-size: 14px; font-weight: 700; text-decoration: none; white-space: nowrap; }.page-heading a:hover { text-decoration: underline; }.page-heading a:focus-visible { outline: 3px solid rgba(225,37,27,.2); outline-offset: 4px; }
.state-panel,.application-shell { min-height: 430px; border: 1px solid #e9ebee; border-radius: 18px; background: #fff; box-shadow: 0 16px 44px rgba(32,36,43,.06); }.state-panel { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; text-align: center; }.state-mark { display: grid; width: 68px; height: 68px; place-items: center; margin-bottom: 22px; border-radius: 50%; color: var(--merchant-red); background: #fff0ef; font-size: 30px; font-weight: 900; }.state-panel h2 { margin: 0; font-size: clamp(24px, 4vw, 34px); }.state-panel>p:not(.state-label) { max-width: 560px; margin: 15px 0 26px; color: var(--merchant-muted); line-height: 1.8; }.state-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }.warning-panel .state-mark { color: #b86800; background: #fff7e8; }.error-panel .state-mark,.is-disabled .state-mark,.is-rejected .state-mark,.is-unknown .state-mark { color: #8b4a46; background: #f7eeee; }.is-active .state-mark { color: #15803d; background: #edf9f1; }
.application-shell { display: grid; grid-template-columns: minmax(240px, .72fr) minmax(0, 1.28fr); overflow: hidden; }.application-intro { padding: 48px 38px; color: #fff; background: #25282e; }.application-intro .state-label { color: #ff8d87; }.application-intro h2 { margin: 0; font-size: 30px; }.application-intro>p:not(.state-label) { margin: 18px 0 28px; color: #c7cbd2; line-height: 1.8; }.application-intro ul { margin: 0; padding-left: 20px; color: #aeb4bd; font-size: 13px; line-height: 2; }.application-form { padding: 42px; }.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }.form-note { margin: 4px 0 20px; color: #929aa5; font-size: 12px; line-height: 1.7; }.submit-button { width: 100%; border-radius: 10px; }.application-form :deep(.el-input__wrapper),.application-form :deep(.el-textarea__inner) { border-radius: 9px; }.application-form :deep(.el-input__wrapper.is-focus),.application-form :deep(.el-textarea__inner:focus) { box-shadow: 0 0 0 1px var(--merchant-red) inset; }
.merchant-portal-link { display: inline-flex; align-items: center; justify-content: center; height: 32px; padding: 0 15px; border: 1px solid var(--merchant-red); border-radius: 4px; color: #fff; background: var(--merchant-red); font-size: 14px; line-height: 1; text-decoration: none; }.merchant-portal-link:hover { background: #c51f17; }.merchant-portal-link:focus-visible { outline: 3px solid rgba(225,37,27,.24); outline-offset: 3px; }
@media (max-width: 760px) { .page-heading { align-items: flex-start; flex-direction: column; padding: 22px; }.application-shell { grid-template-columns: 1fr; }.application-intro,.application-form { padding: 30px 24px; }.form-grid { grid-template-columns: 1fr; gap: 0; }.state-panel { min-height: 380px; padding: 36px 22px; } }
</style>
