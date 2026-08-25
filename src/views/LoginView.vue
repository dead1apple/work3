<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, User } from '@element-plus/icons-vue'
import { MerchantAccessError, useSessionStore } from '../store/session'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

const credentials = reactive({
  username: '',
  password: '',
})
const submitting = ref(false)
const errorMessage = ref('')

function safeRedirect(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/'
}

async function submit() {
  if (submitting.value) return

  errorMessage.value = ''
  submitting.value = true

  try {
    await session.signIn({ ...credentials })
    await router.replace(safeRedirect(route.query.redirect))
  } catch (error) {
    if (error instanceof MerchantAccessError) {
      await router.replace({ name: 'forbidden' })
      return
    }

    errorMessage.value = error?.message || '登录失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-intro" aria-labelledby="merchant-login-title">
      <a class="brand-lockup" href="/" aria-label="返回用户商城">
        <span class="brand-mark" aria-hidden="true">M</span>
        <span>MERCHANT DESK</span>
      </a>

      <div class="intro-copy">
        <p class="eyebrow">独立商家工作台</p>
        <h1 id="merchant-login-title">把经营所需，留在一个清晰的工作空间里。</h1>
        <p>登录后将通过服务端用户资料核验商家身份，确保只有已授权商家能够进入。</p>
      </div>

      <p class="intro-note">安全身份校验 · 独立会话管理 · 专注经营工作</p>
    </section>

    <section class="login-panel" aria-label="商家登录">
      <div class="login-card">
        <div class="login-card__heading">
          <p class="eyebrow">欢迎回来</p>
          <h2>登录商家后台</h2>
          <p>请使用已开通商家权限的账号。</p>
        </div>

        <el-form
          class="login-form"
          :model="credentials"
          label-position="top"
          :aria-busy="submitting"
          @submit.prevent="submit"
        >
          <el-form-item label="账号">
            <el-input
              v-model="credentials.username"
              :prefix-icon="User"
              autocomplete="username"
              placeholder="请输入商家账号"
              size="large"
              required
            />
          </el-form-item>

          <el-form-item label="密码">
            <el-input
              v-model="credentials.password"
              :prefix-icon="Lock"
              autocomplete="current-password"
              placeholder="请输入密码"
              size="large"
              type="password"
              show-password
              required
            />
          </el-form-item>

          <p v-if="errorMessage" class="login-error" role="alert">
            {{ errorMessage }}
          </p>

          <el-button
            class="login-submit"
            type="primary"
            size="large"
            native-type="submit"
            :loading="submitting"
          >
            {{ submitting ? '正在核验身份' : '进入商家后台' }}
          </el-button>
        </el-form>

        <a class="back-link" href="/">返回用户商城</a>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(420px, 0.92fr);
  min-height: 100vh;
  background: var(--color-surface);
}

.login-intro {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
  padding: clamp(32px, 6vw, 80px);
  overflow: hidden;
  color: #f5fbf9;
  background:
    radial-gradient(circle at 75% 25%, rgba(52, 183, 157, 0.2), transparent 28%),
    linear-gradient(145deg, #0d211e 0%, #143d36 100%);
}

.login-intro::after {
  position: absolute;
  right: -12vw;
  bottom: -20vw;
  width: 44vw;
  height: 44vw;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  content: "";
}

.brand-lockup {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--space-3);
  color: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-decoration: none;
}

.brand-mark {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 11px;
  color: #75e1cb;
  font-family: Georgia, serif;
  font-size: 22px;
}

.intro-copy {
  position: relative;
  z-index: 1;
  max-width: 650px;
}

.eyebrow {
  margin: 0 0 var(--space-4);
  color: #4ec6ae;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.intro-copy h1 {
  max-width: 620px;
  margin: 0;
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: clamp(42px, 5vw, 72px);
  font-weight: 500;
  line-height: 1.12;
  letter-spacing: -0.045em;
}

.intro-copy > p:last-child {
  max-width: 520px;
  margin: var(--space-6) 0 0;
  color: #bad0cb;
  font-size: 16px;
  line-height: 1.8;
}

.intro-note {
  position: relative;
  z-index: 1;
  margin: 0;
  color: #86a49e;
  font-size: 13px;
  letter-spacing: 0.08em;
}

.login-panel {
  display: grid;
  min-height: 100vh;
  padding: clamp(28px, 6vw, 96px);
  place-items: center;
  background: #f8f8f5;
}

.login-card {
  width: min(100%, 430px);
}

.login-card__heading h2 {
  margin: 0;
  color: var(--color-ink);
  font-size: clamp(30px, 3vw, 40px);
  letter-spacing: -0.035em;
}

.login-card__heading > p:last-child {
  margin: var(--space-3) 0 0;
  color: var(--color-muted);
}

.login-form {
  margin-top: var(--space-8);
}

.login-form :deep(.el-form-item__label) {
  color: #394542;
  font-weight: 650;
}

.login-form :deep(.el-input__wrapper) {
  min-height: 48px;
  border-radius: var(--radius-small);
  box-shadow: 0 0 0 1px var(--color-line) inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--color-accent) inset;
}

.login-error {
  margin: calc(var(--space-2) * -1) 0 var(--space-4);
  color: var(--color-danger);
  font-size: 14px;
  line-height: 1.5;
}

.login-submit {
  width: 100%;
  min-height: 48px;
  margin-top: var(--space-2);
  border-color: var(--color-accent);
  border-radius: var(--radius-small);
  background: var(--color-accent);
  font-weight: 700;
}

.login-submit:hover,
.login-submit:focus {
  border-color: var(--color-accent-strong);
  background: var(--color-accent-strong);
}

.back-link {
  display: inline-block;
  margin-top: var(--space-6);
  color: var(--color-muted);
  font-size: 14px;
  text-underline-offset: 4px;
}

@media (max-width: 860px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-intro {
    min-height: auto;
    padding: var(--space-8) var(--space-6) var(--space-10);
  }

  .intro-copy {
    margin-top: 72px;
  }

  .intro-copy h1 {
    font-size: clamp(36px, 10vw, 54px);
  }

  .intro-note {
    display: none;
  }

  .login-panel {
    min-height: auto;
    padding: 56px var(--space-6) 72px;
  }
}
</style>

