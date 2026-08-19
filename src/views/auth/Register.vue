<script setup>
import { computed, onUnmounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { register, sendCode } from '../../api/index.js'
import { createRegistrationCodeSender, normalizeMainlandMobile } from '../../utils/auth.js'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const codeSending = ref(false)
const codeCountdown = ref(0)
const form = reactive({ username: '', password: '', phone: '', code: '', nickname: '', email: '' })
const validatePhone = (_rule, value, callback) => {
  try {
    normalizeMainlandMobile(value)
    callback()
  } catch (error) {
    callback(new Error(error.message))
  }
}
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码不少于 6 位', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }, { validator: validatePhone, trigger: 'blur' }],
  code: [{ required: true, message: '请输入短信验证码', trigger: 'blur' }],
}
const codeButtonText = computed(() => (codeCountdown.value > 0 ? `${codeCountdown.value}s 后重试` : '获取验证码'))
const codeButtonDisabled = computed(() => codeSending.value || codeCountdown.value > 0)
const codeSender = createRegistrationCodeSender({
  sendCode,
  onStateChange: ({ sending, countdown }) => {
    codeSending.value = sending
    codeCountdown.value = countdown
  },
})

const sendRegistrationCode = async () => {
  if (codeButtonDisabled.value) return
  try {
    await codeSender.send(form.phone)
    ElMessage.success('验证码已发送，请查收短信')
  } catch (error) {
    ElMessage.error(error.message || '验证码发送失败，请稍后重试')
  }
}

onUnmounted(() => {
  codeSender.cleanup()
})

const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  loading.value = true
  try {
    await register({ ...form, phone: form.phone.trim() })
    ElMessage.success('注册成功，请登录')
    router.replace({ path: '/login', query: { registered: '1' } })
  } catch (error) {
    ElMessage.error(error.message || '注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card" aria-labelledby="register-title">
      <div class="auth-brand"><span class="brand-mark">JD</span><span>京东商城</span></div>
      <p class="eyebrow">JOIN THE CLUB</p>
      <h1 id="register-title">创建账号</h1>
      <p class="subtitle">注册一个账号，收藏商品并管理你的订单。</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
        <el-form-item label="用户名" prop="username"><el-input v-model="form.username" size="large" placeholder="设置用户名" autocomplete="username" /></el-form-item>
        <el-form-item label="密码" prop="password"><el-input v-model="form.password" size="large" type="password" show-password placeholder="设置登录密码" autocomplete="new-password" /></el-form-item>
        <div class="form-grid">
          <el-form-item label="手机号" prop="phone"><el-input v-model="form.phone" size="large" placeholder="手机号" autocomplete="tel" /></el-form-item>
          <el-form-item label="验证码" prop="code">
            <div class="code-field">
              <el-input v-model="form.code" size="large" placeholder="验证码" />
              <el-button type="danger" plain size="large" :loading="codeSending" :disabled="codeButtonDisabled" @click="sendRegistrationCode">{{ codeButtonText }}</el-button>
            </div>
          </el-form-item>
        </div>
        <div class="form-grid">
          <el-form-item label="昵称"><el-input v-model="form.nickname" size="large" placeholder="可选" /></el-form-item>
          <el-form-item label="邮箱"><el-input v-model="form.email" size="large" type="email" placeholder="可选" autocomplete="email" /></el-form-item>
        </div>
        <el-button class="submit-button" native-type="submit" type="danger" size="large" :loading="loading">注册</el-button>
      </el-form>

      <p class="switch-text">已有账号？<RouterLink to="/login">返回登录</RouterLink></p>
    </section>
  </main>
</template>

<style scoped>
.auth-page { display: grid; min-height: 100vh; place-items: center; padding: 32px 20px; background: radial-gradient(circle at 12% 8%, #fff1f0, transparent 32%), #f6f7f9; }
.auth-card { width: min(100%, 520px); padding: 40px; border: 1px solid #f0f1f3; border-radius: 24px; background: rgba(255,255,255,.96); box-shadow: 0 22px 70px rgba(61, 30, 28, .1); }
.auth-brand { display: flex; align-items: center; gap: 9px; color: #20242b; font-weight: 800; }
.brand-mark { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 10px; color: white; background: #e1251b; font-size: 12px; }
.eyebrow { margin: 36px 0 8px; color: #e1251b; font-size: 11px; font-weight: 800; letter-spacing: .16em; }
h1 { margin: 0; color: #17191d; font-size: 32px; letter-spacing: -.06em; }
.subtitle { margin: 10px 0 28px; color: #89919c; font-size: 14px; line-height: 1.6; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.code-field { display: grid; grid-template-columns: minmax(0, 1fr) 112px; gap: 10px; width: 100%; }
.code-field .el-button { padding: 0 12px; }
.submit-button { width: 100%; margin-top: 8px; border-radius: 10px; }
.switch-text { margin: 24px 0 0; color: #89919c; text-align: center; font-size: 14px; }
.switch-text a { color: #e1251b; font-weight: 700; }
@media (max-width: 560px) { .auth-card { padding: 28px 22px; border-radius: 18px; } .form-grid { grid-template-columns: 1fr; gap: 0; } .code-field { grid-template-columns: minmax(0, 1fr) 108px; } }
</style>
