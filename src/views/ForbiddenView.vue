<template>
  <main class="status-page">
    <div class="status-code">403</div>
    <p class="status-kicker">ACCESS RESTRICTED</p>
    <h1>当前账号没有商家权限</h1>
    <p>我们已结束本次商家端会话。请使用 role 为商家的账号重新登录，或返回用户商城。</p>
    <div class="status-actions">
      <RouterLink class="status-action status-action--primary" :to="{ name: 'login' }">
        重新登录
      </RouterLink>
      <a class="status-action" href="/">返回用户商城</a>
    </div>
  </main>
</template>

<style scoped>
.status-page {
  display: grid;
  min-height: 100vh;
  padding: var(--space-6);
  place-content: center;
  text-align: center;
  background: var(--color-canvas);
}

.status-code {
  color: #dbe3df;
  font-family: Georgia, serif;
  font-size: clamp(96px, 20vw, 220px);
  line-height: 0.8;
}

.status-kicker {
  margin: var(--space-8) 0 var(--space-3);
  color: var(--color-accent);
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.16em;
}

.status-page h1 {
  margin: 0;
  font-size: clamp(28px, 4vw, 42px);
  letter-spacing: -0.035em;
}

.status-page > p:not(.status-kicker) {
  max-width: 560px;
  margin: var(--space-4) auto 0;
  color: var(--color-muted);
  line-height: 1.75;
}

.status-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-8);
}

.status-action {
  padding: 11px 18px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-small);
  color: var(--color-ink);
  background: var(--color-surface);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

.status-action--primary {
  border-color: var(--color-accent);
  color: #fff;
  background: var(--color-accent);
}
</style>

