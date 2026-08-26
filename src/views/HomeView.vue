<script setup>
import { computed } from 'vue'
import { CircleCheckFilled, Shop } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'
import { useSessionStore } from '../store/session'
import { useShopStore } from '../store/shop'

const session = useSessionStore()
const shopContext = useShopStore()

const shopStatusLabel = computed(() => {
  const labels = {
    0: '审核中',
    1: '营业中',
    2: '已停用',
    3: '审核未通过',
  }
  return labels[shopContext.shop?.status] || '状态未知'
})
</script>

<template>
  <section class="home-view" aria-labelledby="home-title">
    <div class="home-heading">
      <p class="home-kicker">WORKSPACE READY</p>
      <h1 id="home-title">商家后台首页</h1>
      <p>商家身份与当前店铺上下文已经就绪。经营业务将在后续阶段按需开放。</p>
    </div>

    <div class="context-grid">
      <article class="context-card" data-testid="identity-summary">
        <div class="context-card__icon" aria-hidden="true">
          <el-icon><CircleCheckFilled /></el-icon>
        </div>
        <div>
          <span>登录身份</span>
          <h2>{{ session.displayName }}</h2>
          <p>账号 {{ session.user?.username }} · 商家身份已通过可信用户接口核验</p>
        </div>
      </article>

      <article class="context-card" data-testid="shop-summary">
        <div class="context-card__icon context-card__icon--shop" aria-hidden="true">
          <el-icon><Shop /></el-icon>
        </div>
        <div v-if="shopContext.status === 'ready'">
          <span>当前店铺</span>
          <h2>{{ shopContext.shop.shopName }}</h2>
          <p>{{ shopStatusLabel }}<template v-if="shopContext.shop.address"> · {{ shopContext.shop.address }}</template></p>
        </div>
        <div v-else-if="shopContext.status === 'empty'">
          <span>当前店铺</span>
          <h2>尚未建立店铺</h2>
          <p>当前商家身份有效，但店铺接口返回为空。本阶段不提供申请或创建入口。</p>
        </div>
        <div v-else-if="shopContext.status === 'error'">
          <span>当前店铺</span>
          <h2>店铺信息加载失败</h2>
          <p>商家身份仍然有效，可稍后刷新页面重试。</p>
        </div>
        <div v-else>
          <span>当前店铺</span>
          <h2>正在加载店铺信息</h2>
          <p>正在从商家专属接口恢复当前店铺上下文。</p>
        </div>
      </article>
    </div>

    <div class="readiness-panel">
      <div class="readiness-panel__icon" aria-hidden="true">
        <el-icon><CircleCheckFilled /></el-icon>
      </div>
      <div>
        <span>当前状态</span>
        <h2>上下文基础已准备就绪</h2>
        <p>本阶段只读取当前店铺，不会请求商品、订单、优惠券或店铺写入接口。</p>
      </div>
    </div>

    <div class="next-stage-note">
      <span>当前阶段</span>
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
  margin-top: var(--space-6);
  padding: clamp(28px, 5vw, 56px);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-large);
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
}

.context-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-5);
  margin-top: 56px;
}

.context-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-4);
  min-height: 160px;
  padding: var(--space-6);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-medium);
  background: var(--color-surface);
}

.context-card__icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 13px;
  color: var(--color-accent);
  background: var(--color-accent-soft);
  font-size: 21px;
}

.context-card__icon--shop {
  color: #8a5b13;
  background: #fff3d9;
}

.context-card span {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.context-card h2 {
  margin: var(--space-2) 0 0;
  font-size: 21px;
}

.context-card p {
  margin: var(--space-3) 0 0;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.65;
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
  .context-grid {
    grid-template-columns: 1fr;
    margin-top: var(--space-8);
  }

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
