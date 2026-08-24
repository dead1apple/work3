<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <main class="forbidden-page">
    <section class="forbidden-card" aria-labelledby="forbidden-title">
      <span class="status-code" aria-hidden="true">403</span>
      <p class="eyebrow">ACCESS RESTRICTED</p>
      <h1 id="forbidden-title">无权访问该页面</h1>
      <p class="description">当前账号没有访问此页面所需的权限，你的登录状态不会受到影响。</p>
      <el-button type="danger" size="large" @click="router.replace('/home')">返回商城首页</el-button>
    </section>
  </main>
</template>

<style scoped>
.forbidden-page {
  --forbidden-accent: #e1251b;
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 32px 20px;
  color: #20242b;
  background: radial-gradient(circle at 18% 12%, #fff0ef 0, transparent 30%), #f5f6f8;
}
.forbidden-card { width: min(100%, 540px); padding: 56px 48px; border: 1px solid #eceef1; border-radius: 24px; background: #fff; box-shadow: 0 24px 70px rgba(39, 27, 26, .09); text-align: center; }
.status-code { display: block; color: var(--forbidden-accent); font-size: clamp(64px, 12vw, 96px); font-weight: 900; line-height: .9; letter-spacing: -.08em; }
.eyebrow { margin: 24px 0 8px; color: var(--forbidden-accent); font-size: 11px; font-weight: 800; letter-spacing: .16em; }
h1 { margin: 0; font-size: clamp(26px, 5vw, 36px); letter-spacing: -.04em; }
.description { max-width: 390px; margin: 16px auto 30px; color: #7d8590; font-size: 15px; line-height: 1.8; }
.forbidden-card :deep(.el-button) { min-width: 150px; border-radius: 10px; }
.forbidden-card :deep(.el-button:focus-visible) { outline: 3px solid rgba(225, 37, 27, .22); outline-offset: 3px; }
@media (max-width: 560px) { .forbidden-card { padding: 42px 24px; border-radius: 18px; } }
</style>
