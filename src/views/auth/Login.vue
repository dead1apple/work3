<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../../store/cart.js'
import { useUserStore } from '../../store/user.js'
import { resolvePostLoginDestination } from '../../router/access.js'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const cartStore = useCartStore()
const formRef = ref()
const loading = ref(false)
const remember = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码不少于 6 位', trigger: 'blur' }],
}

const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  loading.value = true
  try {
    await userStore.login(form)
    cartStore.clearCart()
    ElMessage.success('登录成功')
    router.replace(resolvePostLoginDestination(route.query.redirect, userStore.role))
  } catch (error) {
    ElMessage.error(error.message || '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const qrDark = (index) => {
  const size = 11
  const x = index % size
  const y = Math.floor(index / size)
  const finder = (originX, originY) => {
    const dx = x - originX
    const dy = y - originY
    if (dx < 0 || dx > 6 || dy < 0 || dy > 6) return false
    return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
  }

  if (finder(0, 0) || finder(4, 0) || finder(0, 4)) return true
  return ((index * 17 + x * 7 + y * 11) % 9) < 4
}
</script>

<template>
  <main class="auth-page">
    <div class="auth-shell">
      <aside class="auth-intro">
        <RouterLink class="intro-brand" to="/home" aria-label="返回京东商城首页">
          <span class="brand-mark">JD</span>
          <span><strong>京东商城</strong><small>JD SELECT</small></span>
        </RouterLink>

        <div class="intro-copy">
          <p class="eyebrow">REAL GOODS · SIMPLE SERVICE</p>
          <h1>每一次登录，<br />都从发现好物开始。</h1>
          <p>精选品质商品，清晰的订单与配送体验。登录后继续你的购物旅程。</p>
          <ul class="intro-list">
            <li><span>01</span>购物车与收藏夹实时同步</li>
            <li><span>02</span>订单状态清晰可追踪</li>
            <li><span>03</span>京东配送，安心送达</li>
          </ul>
        </div>

        <div class="intro-footer"><span>SHOP WITH CONFIDENCE</span><span>京东商城</span></div>
      </aside>

      <section class="auth-workspace" aria-labelledby="login-title">
        <div class="workspace-heading">
          <p class="eyebrow">WELCOME BACK</p>
          <h2 id="login-title">登录账号</h2>
          <p>选择习惯的方式，快速进入商城。</p>
        </div>

        <div class="auth-grid">
          <section class="account-panel">
            <div class="panel-label"><span class="label-dot"></span><span>账号登录</span></div>
            <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
              <el-form-item label="用户名" prop="username">
                <el-input v-model="form.username" size="large" placeholder="请输入用户名" autocomplete="username" />
              </el-form-item>
              <el-form-item label="密码" prop="password">
                <el-input v-model="form.password" size="large" type="password" show-password placeholder="请输入密码" autocomplete="current-password" />
              </el-form-item>
              <div class="form-options">
                <label class="remember-option"><input v-model="remember" type="checkbox" /> <span>记住我</span></label>
                <a href="#" @click.prevent>忘记密码？</a>
              </div>
              <el-button class="submit-button" native-type="submit" type="danger" size="large" :loading="loading">登录</el-button>
            </el-form>
            <p class="register-text">还没有账号？ <RouterLink to="/register">立即注册</RouterLink></p>
          </section>

          <div class="login-divider" aria-hidden="true"><span>或</span></div>

          <aside class="qr-panel" aria-label="扫码登录占位">
            <div class="panel-label"><span class="label-dot"></span><span>扫码登录</span></div>
            <div class="qr-placeholder">
              <span v-for="cell in 121" :key="cell" :class="{ 'is-dark': qrDark(cell - 1) }"></span>
            </div>
            <strong>扫码登录</strong>
            <p>打开京东 App 扫码</p>
            <span class="qr-status">功能即将上线</span>
          </aside>
        </div>

        <p class="security-note"><span>✓</span> 安全加密传输，保护账号信息</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.auth-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 32px 20px;
  color: #20242b;
  background: #f5f6f8;
  font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
}

.auth-shell {
  display: grid;
  grid-template-columns: minmax(300px, .82fr) minmax(540px, 1.18fr);
  width: min(1080px, 100%);
  min-height: 640px;
  overflow: hidden;
  border: 1px solid #e6e8eb;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 44px rgba(32, 36, 43, .09);
}

.auth-intro {
  display: flex;
  min-height: 640px;
  flex-direction: column;
  padding: 34px 36px 28px;
  color: #fff;
  background: #25282e;
}

.intro-brand { display: inline-flex; align-items: center; gap: 10px; width: fit-content; color: #fff; text-decoration: none; }
.brand-mark { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 10px; color: #fff; background: #e1251b; font: 900 12px Arial, sans-serif; letter-spacing: -1px; }
.intro-brand strong, .intro-brand small { display: block; }
.intro-brand strong { font-size: 16px; }
.intro-brand small { margin-top: 3px; color: #8e959f; font-size: 9px; letter-spacing: .18em; }

.intro-copy { margin-top: auto; margin-bottom: auto; padding: 42px 0 30px; }
.eyebrow { margin: 0 0 10px; color: #e1251b; font-size: 11px; font-weight: 800; letter-spacing: .18em; }
.auth-intro .eyebrow { color: #ff9a93; }
.intro-copy h1 { margin: 0; color: #fff; font-size: clamp(28px, 3vw, 38px); font-weight: 700; line-height: 1.28; letter-spacing: .01em; }
.intro-copy > p:not(.eyebrow) { max-width: 300px; margin: 19px 0 0; color: #b8bec7; font-size: 13px; line-height: 1.85; }
.intro-list { display: grid; gap: 13px; margin: 31px 0 0; padding: 0; color: #d5d9df; list-style: none; font-size: 12px; }
.intro-list li { display: flex; align-items: center; gap: 12px; }
.intro-list span { display: grid; width: 25px; height: 25px; place-items: center; border: 1px solid #555b65; border-radius: 50%; color: #ff9a93; font: 10px Arial, sans-serif; }
.intro-footer { display: flex; justify-content: space-between; gap: 14px; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, .1); color: #7d848f; font-size: 9px; letter-spacing: .13em; }

.auth-workspace { display: flex; flex-direction: column; padding: 65px 54px 30px; background: #fff; }
.workspace-heading h2 { margin: 0; color: #20242b; font-size: 29px; line-height: 1.25; }
.workspace-heading > p:last-child { margin: 10px 0 0; color: #8b95a5; font-size: 13px; }
.auth-grid { display: grid; grid-template-columns: minmax(250px, 1fr) 30px 165px; gap: 23px; align-items: center; margin-top: 39px; }
.account-panel { min-width: 0; }
.panel-label { display: flex; align-items: center; gap: 7px; margin-bottom: 19px; color: #4f5865; font-size: 12px; font-weight: 800; }
.label-dot { width: 7px; height: 7px; border-radius: 50%; background: #e1251b; }
.account-panel :deep(.el-form-item) { margin-bottom: 17px; }
.account-panel :deep(.el-form-item__label) { height: auto; margin-bottom: 7px; padding: 0; color: #5f6875; font-size: 12px; font-weight: 700; line-height: 1.2; }
.account-panel :deep(.el-input__wrapper) { min-height: 42px; border-radius: 5px; background: #fff; box-shadow: 0 0 0 1px #d9dde2 inset; }
.account-panel :deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px #aeb5be inset; }
.account-panel :deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px #e1251b inset, 0 0 0 3px rgba(225, 37, 27, .1); }
.account-panel :deep(.el-input__inner) { color: #20242b; font-size: 13px; }
.form-options { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 3px; color: #8b95a5; font-size: 11px; }
.remember-option { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.remember-option input { width: 13px; height: 13px; margin: 0; accent-color: #e1251b; }
.form-options a, .register-text a { color: #e1251b; font-weight: 700; text-decoration: none; }
.submit-button { width: 100%; height: 43px; margin-top: 20px; border-radius: 5px; font-size: 13px; font-weight: 800; }
.register-text { margin: 19px 0 0; color: #8b95a5; font-size: 12px; text-align: center; }

.login-divider { display: flex; align-items: center; justify-content: center; align-self: stretch; color: #b0b6bf; font-size: 11px; }
.login-divider::before, .login-divider::after { width: 1px; height: 68px; background: #eceef1; content: ''; }
.login-divider span { position: absolute; padding: 8px 0; background: #fff; }
.qr-panel { display: flex; min-width: 0; flex-direction: column; align-items: center; justify-content: center; }
.qr-panel .panel-label { align-self: stretch; }
.qr-placeholder { display: grid; width: 132px; height: 132px; grid-template-columns: repeat(11, 1fr); grid-template-rows: repeat(11, 1fr); gap: 2px; padding: 8px; border: 1px solid #dce0e5; background: #fff; }
.qr-placeholder span { display: block; background: #f4f5f7; }
.qr-placeholder span.is-dark { background: #25282e; }
.qr-panel strong { margin-top: 17px; color: #4f5865; font-size: 13px; }
.qr-panel p { margin: 7px 0 0; color: #8b95a5; font-size: 11px; text-align: center; }
.qr-status { margin-top: 14px; padding: 4px 8px; border: 1px solid #f2c7c3; border-radius: 3px; color: #e1251b; background: #fff4f3; font-size: 10px; }
.security-note { display: flex; align-items: center; justify-content: center; gap: 6px; margin: auto 0 0; padding-top: 26px; color: #9ca4af; font-size: 11px; }
.security-note span { color: #2d8a52; font-size: 13px; }

@media (max-width: 900px) {
  .auth-shell { grid-template-columns: minmax(250px, .75fr) minmax(0, 1.25fr); }
  .auth-intro { padding-right: 27px; padding-left: 27px; }
  .auth-workspace { padding-right: 33px; padding-left: 33px; }
  .auth-grid { grid-template-columns: minmax(220px, 1fr) 22px 140px; gap: 15px; }
  .qr-placeholder { width: 118px; height: 118px; }
}

@media (max-width: 700px) {
  .auth-page { display: block; padding: 14px; }
  .auth-shell { display: block; min-height: 0; }
  .auth-intro { min-height: 0; padding: 24px 23px 21px; }
  .intro-copy { margin: 0; padding: 38px 0 32px; }
  .intro-copy h1 { font-size: 28px; }
  .intro-copy > p:not(.eyebrow) { margin-top: 13px; }
  .intro-list { grid-template-columns: 1fr 1fr 1fr; gap: 7px; margin-top: 24px; font-size: 10px; }
  .intro-list li { align-items: flex-start; flex-direction: column; gap: 6px; }
  .intro-footer { font-size: 8px; }
  .auth-workspace { padding: 34px 23px 24px; }
  .auth-grid { grid-template-columns: 1fr; gap: 25px; margin-top: 30px; }
  .login-divider { flex-direction: row; gap: 12px; }
  .login-divider::before, .login-divider::after { width: auto; height: 1px; flex: 1; }
  .login-divider span { position: static; padding: 0; }
  .qr-panel { padding-top: 2px; }
  .qr-panel .panel-label { align-self: center; }
  .security-note { padding-top: 30px; }
}

@media (max-width: 400px) {
  .intro-list { display: none; }
  .intro-copy { padding-bottom: 24px; }
  .workspace-heading h2 { font-size: 26px; }
}
</style>
