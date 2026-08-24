<template>
  <section class="welcome-panel" aria-labelledby="merchant-welcome-title">
    <p class="eyebrow">MERCHANT WORKSPACE</p>
    <h1 id="merchant-welcome-title">欢迎进入商家中心</h1>
    <p>控制台基础环境已经就绪。商品、订单等功能将在后续任务中逐步开放。</p>
    <RouterLink to="/home">前往商城首页</RouterLink>
  </section>
</template>

<style scoped>
.welcome-panel { max-width: 860px; padding: clamp(32px, 7vw, 72px); border: 1px solid #e8eaed; border-radius: 18px; background: #fff; box-shadow: 0 14px 38px rgba(32,36,43,.06); }.eyebrow { margin: 0 0 12px; color: #e1251b; font-size: 11px; font-weight: 800; letter-spacing: .16em; }h1 { margin: 0; color: #20242b; font-size: clamp(28px, 5vw, 42px); letter-spacing: -.05em; }.welcome-panel p:not(.eyebrow) { max-width: 560px; margin: 18px 0 30px; color: #747d89; line-height: 1.8; }.welcome-panel a { color: #e1251b; font-weight: 700; text-decoration: none; }.welcome-panel a:hover { text-decoration: underline; }.welcome-panel a:focus-visible { outline: 3px solid rgba(225,37,27,.22); outline-offset: 4px; }
</style>
