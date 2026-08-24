<template>
  <section class="welcome-panel" aria-labelledby="admin-welcome-title">
    <p class="eyebrow">ADMIN WORKSPACE</p>
    <h1 id="admin-welcome-title">欢迎进入管理后台</h1>
    <p>管理后台基础环境已经就绪。店铺审核、商品审核等功能将在后续任务中逐步开放。</p>
    <RouterLink to="/home">前往商城首页</RouterLink>
  </section>
</template>

<style scoped>
.welcome-panel { max-width: 860px; padding: clamp(32px, 7vw, 72px); border: 1px solid #e5e7eb; border-radius: 16px; background: #fff; box-shadow: 0 14px 38px rgba(25,28,34,.06); }.eyebrow { margin: 0 0 12px; color: #d71920; font-size: 11px; font-weight: 800; letter-spacing: .16em; }h1 { margin: 0; color: #191c22; font-size: clamp(28px, 5vw, 42px); letter-spacing: -.05em; }.welcome-panel p:not(.eyebrow) { max-width: 580px; margin: 18px 0 30px; color: #717986; line-height: 1.8; }.welcome-panel a { color: #d71920; font-weight: 700; text-decoration: none; }.welcome-panel a:hover { text-decoration: underline; }.welcome-panel a:focus-visible { outline: 3px solid rgba(215,25,32,.22); outline-offset: 4px; }
</style>
