<script setup>
import { CircleCheckFilled } from '@element-plus/icons-vue'
</script>

<template>
  <section class="home-view" aria-labelledby="home-title">
    <div class="home-heading">
      <p class="home-kicker">WORKSPACE READY</p>
      <h1 id="home-title">商家后台首页</h1>
      <p>基础工程与身份校验已经接入。经营业务将在后续阶段按需开放。</p>
    </div>

    <div class="readiness-panel">
      <div class="readiness-panel__icon" aria-hidden="true">
        <el-icon><CircleCheckFilled /></el-icon>
      </div>
      <div>
        <span>当前状态</span>
        <h2>工作台已准备就绪</h2>
        <p>本阶段仅提供安全登录、商家身份核验与基础导航，不会请求商品、订单或优惠券接口。</p>
      </div>
    </div>

    <div class="next-stage-note">
      <span>第一阶段</span>
      <p>首页是当前唯一经营入口。后续模块将在业务需求确认后逐步加入导航。</p>
    </div>
  </section>
</template>

<style scoped>
.home-view {
  max-width: 1120px;
  margin: 0 auto;
}

.home-heading {
  max-width: 720px;
}

.home-kicker {
  margin: 0 0 var(--space-3);
  color: var(--color-accent);
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.16em;
}

.home-heading h1 {
  margin: 0;
  font-size: clamp(32px, 4vw, 48px);
  letter-spacing: -0.045em;
}

.home-heading > p:last-child {
  margin: var(--space-4) 0 0;
  color: var(--color-muted);
  font-size: 16px;
  line-height: 1.75;
}

.readiness-panel {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-6);
  margin-top: 56px;
  padding: clamp(28px, 5vw, 56px);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-large);
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
}

.readiness-panel__icon {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border-radius: 16px;
  color: var(--color-accent);
  background: var(--color-accent-soft);
  font-size: 26px;
}

.readiness-panel span,
.next-stage-note span {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.readiness-panel h2 {
  margin: var(--space-2) 0 0;
  font-size: clamp(24px, 3vw, 34px);
}

.readiness-panel p {
  max-width: 680px;
  margin: var(--space-3) 0 0;
  color: var(--color-muted);
  line-height: 1.75;
}

.next-stage-note {
  display: flex;
  align-items: baseline;
  gap: var(--space-5);
  margin-top: var(--space-6);
  padding: var(--space-5) 0;
  border-top: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
}

.next-stage-note p {
  margin: 0;
  color: #465653;
  line-height: 1.65;
}

@media (max-width: 620px) {
  .readiness-panel {
    grid-template-columns: 1fr;
    margin-top: var(--space-8);
  }

  .next-stage-note {
    display: block;
  }

  .next-stage-note p {
    margin-top: var(--space-2);
  }
}
</style>

