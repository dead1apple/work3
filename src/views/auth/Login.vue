<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { login } from '../../api/index.js'
import { useCartStore } from '../../store/cart.js'
import { useUserStore } from '../../store/user.js'
import { getAuthToken, resolveRedirect } from '../../utils/auth.js'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const cartStore = useCartStore()
const formRef = ref()
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码不少于 6 位', trigger: 'blur' }],
}

const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  loading.value = true
  try {
    const result = await login(form)
    const token = getAuthToken(result)
    if (!token) throw new Error('登录响应中没有 Token')
    const data = result?.data || result
    cartStore.clearCart()
    userStore.setSession(token, data?.user || data?.userInfo || null)
    ElMessage.success('登录成功')
    router.replace(resolveRedirect(route.query.redirect))
  } catch (error) {
    ElMessage.error(error.message || '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card" aria-labelledby="login-title">
      <div class="auth-brand"><span class="brand-mark">JD</span><span>京东商城</span></div>
      <p class="eyebrow">WELCOME BACK</p>
      <h1 id="login-title">登录账号</h1>
      <p class="subtitle">登录后继续探索你的购物清单与订单。</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" size="large" placeholder="请输入用户名" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" size="large" type="password" show-password placeholder="请输入密码" autocomplete="current-password" />
        </el-form-item>
        <el-button class="submit-button" native-type="submit" type="danger" size="large" :loading="loading">登录</el-button>
      </el-form>

      <p class="switch-text">还没有账号？<RouterLink to="/register">立即注册</RouterLink></p>
    </section>
  </main>
</template>

<style scoped>
.auth-page { display: grid; min-height: 100vh; place-items: center; padding: 32px 20px; background: radial-gradient(circle at 12% 8%, #fff1f0, transparent 32%), #f6f7f9; }
.auth-card { width: min(100%, 420px); padding: 40px; border: 1px solid #f0f1f3; border-radius: 24px; background: rgba(255,255,255,.96); box-shadow: 0 22px 70px rgba(61, 30, 28, .1); }
.auth-brand { display: flex; align-items: center; gap: 9px; color: #20242b; font-weight: 800; }
.brand-mark { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 10px; color: white; background: #e1251b; font-size: 12px; }
.eyebrow { margin: 36px 0 8px; color: #e1251b; font-size: 11px; font-weight: 800; letter-spacing: .16em; }
h1 { margin: 0; color: #17191d; font-size: 32px; letter-spacing: -.06em; }
.subtitle { margin: 10px 0 28px; color: #89919c; font-size: 14px; line-height: 1.6; }
.submit-button { width: 100%; margin-top: 8px; border-radius: 10px; }
.switch-text { margin: 24px 0 0; color: #89919c; text-align: center; font-size: 14px; }
.switch-text a { color: #e1251b; font-weight: 700; }
@media (max-width: 480px) { .auth-card { padding: 28px 22px; border-radius: 18px; } }
</style>
