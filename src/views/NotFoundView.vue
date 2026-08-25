<template>
  <main class="not-found-page">
    <span class="not-found-index">404</span>
    <h1>没有找到这个页面</h1>
    <p>地址可能已更改，或者当前商家端尚未提供该功能。</p>
    <div class="not-found-actions">
      <RouterLink :to="{ name: 'merchant-home' }">返回商家首页</RouterLink>
      <a href="/">返回用户商城</a>
    </div>
  </main>
</template>

<style scoped>
.not-found-page {
  display: grid;
  min-height: 100vh;
  padding: var(--space-6);
  place-content: center;
  color: #eef8f5;
  text-align: center;
  background: var(--color-sidebar);
}

.not-found-index {
  color: #69d4be;
  font-family: Georgia, serif;
  font-size: 18px;
  letter-spacing: 0.2em;
}

.not-found-page h1 {
  margin: var(--space-4) 0 0;
  font-size: clamp(34px, 6vw, 58px);
  letter-spacing: -0.04em;
}

.not-found-page p {
  margin: var(--space-4) 0 0;
  color: #a9bfba;
}

.not-found-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-5);
  margin-top: var(--space-8);
}

.not-found-actions a {
  color: #eef8f5;
  font-weight: 700;
  text-underline-offset: 5px;
}
</style>
